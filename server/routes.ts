import type { Express } from "express";
import type { Server } from "http";
import { api } from "@shared/routes";

import { validateRequest } from "./lib/validate";
import { updateProfileSchema } from "@shared/schema";
import { logger } from "./lib/logger";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    has_accepted_terms: z.boolean().optional(),
  });

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  app.get(api.health.path, (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/auth/register", validateRequest(registerSchema), async (req, res) => {
    try {
      if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({ message: "Supabase auth is not configured" });
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
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

  // Debug endpoint to check all profiles (admin only, uses service role)
  app.get("/api/debug/profiles", async (req, res) => {
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({ message: "Supabase credentials not configured" });
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
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

  // Debug endpoint to check auth.users vs profiles
  app.get("/api/debug/auth-users", async (req, res) => {
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({ message: "Supabase credentials not configured" });
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      
      if (error) {
        logger.error({ err: error }, "Error fetching auth users");
        return res.status(500).json({ message: error.message });
      }
      
      // Return simplified user info
      const users = data.users.map(u => ({
        id: u.id,
        email: u.email,
        provider: u.app_metadata?.provider,
        created_at: u.created_at,
        user_metadata: u.user_metadata
      }));
      
      res.json(users);
    } catch (error: any) {
      logger.error({ err: error }, "Debug auth-users endpoint error");
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
