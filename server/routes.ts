import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";

import { validateRequest } from "./lib/validate";
import { updateProfileSchema } from "@shared/schema";
import { logger } from "./lib/logger";

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

  return httpServer;
}
