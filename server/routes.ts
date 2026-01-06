import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";

import { validateRequest } from "./lib/validate";
import { updateProfileSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.profiles.get.path, async (req, res) => {
    try {
      const profile = await storage.getProfile(req.params.id);
      if (!profile) return res.status(404).json({ message: "Profile not found" });
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch(api.profiles.update.path, validateRequest(updateProfileSchema), async (req, res) => {
    try {
      const updated = await storage.updateProfile(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get(api.health.path, (req, res) => {
    res.json({ status: "ok" });
  });

  return httpServer;
}
