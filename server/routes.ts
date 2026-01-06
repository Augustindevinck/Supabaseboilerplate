import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";

import { validateRequest } from "./lib/validate";
import { updateProfileSchema } from "@shared/schema";
import { logger } from "./lib/logger";
import { createClient } from "@supabase/supabase-js";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.profiles.get.path, async (req, res) => {
    try {
      const profile = await storage.getProfile(req.params.id);
      if (!profile) {
        logger.warn({ id: req.params.id }, "Profile not found");
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error: any) {
      logger.error({ err: error, id: req.params.id }, "Error fetching profile");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.profiles.update.path, validateRequest(updateProfileSchema), async (req, res) => {
    try {
      const updated = await storage.updateProfile(req.params.id, req.body);
      logger.info({ id: req.params.id }, "Profile updated successfully");
      res.json(updated);
    } catch (error: any) {
      logger.error({ err: error, id: req.params.id }, "Error updating profile");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.health.path, (req, res) => {
    res.json({ status: "ok" });
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
