import type { Express, Request } from "express";
import type { Server } from "http";
import { api } from "@shared/routes";

import { validateRequest } from "./lib/validate";
import { logger } from "./lib/logger";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

type AdminGuardResult =
  | { ok: true; adminId: string }
  | { ok: false; status: number; message: string };

type AdminSessionPayload = {
  id: string;
  device: string;
  ipAddress: string | null;
  status: "active" | "expired";
  createdAt: string | null;
  expiresAt: string | null;
};

type AdminProviderPayload = {
  id: string;
  provider: string;
  status: "connected";
  connectedAt: string | null;
  lastSignInAt: string | null;
};

const uuidSchema = z.string().uuid();

function getBearerToken(req: Request): string | null {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice(7).trim();
  return token || null;
}

function parseDate(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString();
}

function detectBrowser(userAgent: string): string {
  if (userAgent.includes("edg")) return "Edge";
  if (userAgent.includes("opr") || userAgent.includes("opera")) return "Opera";
  if (userAgent.includes("chrome")) return "Chrome";
  if (userAgent.includes("safari") && !userAgent.includes("chrome")) return "Safari";
  if (userAgent.includes("firefox")) return "Firefox";
  return "Navigateur";
}

function detectOs(userAgent: string): string {
  if (userAgent.includes("mac os") || userAgent.includes("macintosh")) return "macOS";
  if (userAgent.includes("windows")) return "Windows";
  if (userAgent.includes("android")) return "Android";
  if (userAgent.includes("iphone") || userAgent.includes("ipad") || userAgent.includes("ios")) return "iOS";
  if (userAgent.includes("linux")) return "Linux";
  return "OS inconnu";
}

function formatDeviceLabel(userAgentRaw: unknown): string {
  if (typeof userAgentRaw !== "string" || !userAgentRaw.trim()) {
    return "Session inconnue";
  }

  const userAgent = userAgentRaw.toLowerCase();
  const browser = detectBrowser(userAgent);
  const os = detectOs(userAgent);

  return `${browser} sur ${os}`;
}

function mapSessionRow(row: Record<string, unknown>): AdminSessionPayload {
  const createdAt = parseDate(row.created_at);
  const expiresAt = parseDate(row.not_after ?? row.expires_at);
  const now = Date.now();
  const isExpired = expiresAt ? new Date(expiresAt).getTime() <= now : false;

  return {
    id: String(row.id ?? ""),
    device: formatDeviceLabel(row.user_agent),
    ipAddress: typeof row.ip === "string" ? row.ip : null,
    status: isExpired ? "expired" : "active",
    createdAt,
    expiresAt,
  };
}

function mapProviders(user: {
  email?: string;
  app_metadata?: { providers?: string[] };
  identities?: Array<{
    id?: string;
    provider?: string;
    created_at?: string;
    last_sign_in_at?: string;
  }>;
} | null): AdminProviderPayload[] {
  const providers = new Map<string, AdminProviderPayload>();

  for (const identity of user?.identities ?? []) {
    if (!identity.provider) continue;

    const key = identity.provider.toLowerCase();
    providers.set(key, {
      id: identity.id ?? `${key}-${identity.created_at ?? "unknown"}`,
      provider: key,
      status: "connected",
      connectedAt: parseDate(identity.created_at),
      lastSignInAt: parseDate(identity.last_sign_in_at),
    });
  }

  for (const provider of user?.app_metadata?.providers ?? []) {
    const key = provider.toLowerCase();

    if (!providers.has(key)) {
      providers.set(key, {
        id: `provider-${key}`,
        provider: key,
        status: "connected",
        connectedAt: null,
        lastSignInAt: null,
      });
    }
  }

  if (user?.email && !providers.has("email")) {
    providers.set("email", {
      id: "provider-email",
      provider: "email",
      status: "connected",
      connectedAt: null,
      lastSignInAt: null,
    });
  }

  return Array.from(providers.values());
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    has_accepted_terms: z.boolean().optional(),
  });

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missingEnvVars: string[] = [];

  if (!supabaseUrl) missingEnvVars.push("VITE_SUPABASE_URL (or SUPABASE_URL)");
  if (!serviceRoleKey) missingEnvVars.push("SUPABASE_SERVICE_ROLE_KEY");

  if (missingEnvVars.length > 0) {
    logger.error(
      { missingEnvVars },
      "Supabase admin client is not configured. Check Replit Secrets / .env",
    );
  }

  const supabaseAdmin =
    supabaseUrl && serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        })
      : null;

  const requireAdmin = async (req: Request): Promise<AdminGuardResult> => {
    if (!supabaseAdmin) {
      return { ok: false, status: 500, message: "Supabase auth is not configured" };
    }

    const token = getBearerToken(req);

    if (!token) {
      return { ok: false, status: 401, message: "Missing authorization token" };
    }

    const { data: requesterData, error: requesterError } = await supabaseAdmin.auth.getUser(token);

    if (requesterError || !requesterData.user) {
      return { ok: false, status: 401, message: "Invalid authorization token" };
    }

    const { data: requesterProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", requesterData.user.id)
      .maybeSingle();

    if (profileError) {
      logger.error({ err: profileError }, "Failed to verify admin role");
      return { ok: false, status: 500, message: "Unable to verify permissions" };
    }

    if (!requesterProfile || requesterProfile.role !== "admin") {
      return { ok: false, status: 403, message: "Admin access required" };
    }

    return { ok: true, adminId: requesterData.user.id };
  };

  app.get(api.health.path, (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/auth/register", validateRequest(registerSchema), async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ message: "Supabase auth is not configured" });
      }

      const { email, password, has_accepted_terms } = req.body as z.infer<typeof registerSchema>;

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          has_accepted_terms: has_accepted_terms ?? true,
        },
      });

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      return res.status(201).json({
        user: data.user,
      });
    } catch (error: any) {
      logger.error({ err: error }, "Register endpoint error");
      return res.status(500).json({ message: error.message ?? "Registration failed" });
    }
  });

  app.get("/api/admin/users/:id/details", async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ message: "Supabase auth is not configured" });
      }

      const adminCheck = await requireAdmin(req);
      if (!adminCheck.ok) {
        return res.status(adminCheck.status).json({ message: adminCheck.message });
      }

      const userId = req.params.id;
      const parsedUserId = uuidSchema.safeParse(userId);

      if (!parsedUserId.success) {
        return res.status(400).json({ message: "Invalid user id" });
      }

      const [profileResult, authUserResult, sessionsResult] = await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("id,email,full_name,avatar_url,role,created_at,last_active_at")
          .eq("id", userId)
          .maybeSingle(),
        supabaseAdmin.auth.admin.getUserById(userId),
        supabaseAdmin.rpc("admin_list_user_sessions", { p_user_id: userId }),
      ]);

      if (profileResult.error) {
        logger.error({ err: profileResult.error, userId }, "Failed to fetch profile details");
        return res.status(500).json({ message: "Failed to fetch user profile" });
      }

      if (!profileResult.data) {
        return res.status(404).json({ message: "User profile not found" });
      }

      if (authUserResult.error) {
        logger.error({ err: authUserResult.error, userId }, "Failed to fetch auth user details");
      }

      let sessionsUnavailable = false;
      let sessions: AdminSessionPayload[] = [];

      if (sessionsResult.error) {
        sessionsUnavailable = true;
        logger.warn({ err: sessionsResult.error, userId }, "Failed to fetch auth sessions");
      } else {
        sessions = (sessionsResult.data ?? []).map((row: unknown) => mapSessionRow(row as Record<string, unknown>));
      }

      const authUser = authUserResult.data.user;

      return res.json({
        profile: {
          id: profileResult.data.id,
          email: profileResult.data.email ?? authUser?.email ?? null,
          fullName:
            profileResult.data.full_name ??
            (typeof authUser?.user_metadata?.full_name === "string" ? authUser.user_metadata.full_name : null),
          avatarUrl: profileResult.data.avatar_url ?? null,
          role: profileResult.data.role,
          createdAt: profileResult.data.created_at,
          lastActiveAt: profileResult.data.last_active_at,
          lastSignInAt: authUser?.last_sign_in_at ?? null,
        },
        sessions,
        sessionsUnavailable,
        providers: mapProviders(authUser),
      });
    } catch (error: any) {
      logger.error({ err: error }, "Admin user details endpoint error");
      return res.status(500).json({ message: error.message ?? "Failed to fetch user details" });
    }
  });

  app.delete("/api/admin/users/:id/sessions/:sessionId", async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ message: "Supabase auth is not configured" });
      }

      const adminCheck = await requireAdmin(req);
      if (!adminCheck.ok) {
        return res.status(adminCheck.status).json({ message: adminCheck.message });
      }

      const userId = req.params.id;
      const sessionId = req.params.sessionId;

      if (!uuidSchema.safeParse(userId).success || !uuidSchema.safeParse(sessionId).success) {
        return res.status(400).json({ message: "Invalid identifier" });
      }

      const { error } = await supabaseAdmin.rpc("admin_revoke_user_session", {
        p_user_id: userId,
        p_session_id: sessionId,
      });

      if (error) {
        logger.error({ err: error, userId, sessionId }, "Failed to revoke session");
        return res.status(500).json({ message: "Failed to revoke session" });
      }

      return res.status(204).send();
    } catch (error: any) {
      logger.error({ err: error }, "Revoke session endpoint error");
      return res.status(500).json({ message: error.message ?? "Failed to revoke session" });
    }
  });

  app.post("/api/admin/users/:id/sessions/revoke-all", async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ message: "Supabase auth is not configured" });
      }

      const adminCheck = await requireAdmin(req);
      if (!adminCheck.ok) {
        return res.status(adminCheck.status).json({ message: adminCheck.message });
      }

      const userId = req.params.id;
      if (!uuidSchema.safeParse(userId).success) {
        return res.status(400).json({ message: "Invalid user id" });
      }

      const { data: revokedCountResult, error } = await supabaseAdmin.rpc("admin_revoke_all_user_sessions", {
        p_user_id: userId,
      });

      if (error) {
        logger.error({ err: error, userId }, "Failed to revoke all sessions");
        return res.status(500).json({ message: "Failed to revoke all sessions" });
      }

      const revokedCount = typeof revokedCountResult === "number" ? revokedCountResult : 0;
      return res.json({ revokedCount });
    } catch (error: any) {
      logger.error({ err: error }, "Revoke all sessions endpoint error");
      return res.status(500).json({ message: error.message ?? "Failed to revoke all sessions" });
    }
  });

  app.get("/api/debug/profiles", async (_req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ message: "Supabase credentials not configured" });
      }

      const { data, error } = await supabaseAdmin.from("profiles").select("*");

      if (error) {
        logger.error({ err: error }, "Error fetching profiles");
        return res.status(500).json({ message: error.message });
      }

      res.json(data);
    } catch (error: any) {
      logger.error({ err: error }, "Debug endpoint error");
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/debug/auth-users", async (_req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ message: "Supabase credentials not configured" });
      }

      const { data, error } = await supabaseAdmin.auth.admin.listUsers();

      if (error) {
        logger.error({ err: error }, "Error fetching auth users");
        return res.status(500).json({ message: error.message });
      }

      const users = data.users.map((u) => ({
        id: u.id,
        email: u.email,
        provider: u.app_metadata?.provider,
        created_at: u.created_at,
        user_metadata: u.user_metadata,
      }));

      res.json(users);
    } catch (error: any) {
      logger.error({ err: error }, "Debug auth-users endpoint error");
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
