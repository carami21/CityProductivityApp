import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSessionSchema, insertCitySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // For demo purposes, we'll use a mock user ID
  // In a real app, this would come from authentication
  const DEMO_USER_ID = 1;

  // Create demo user if not exists
  let demoUser = await storage.getUser(DEMO_USER_ID);
  if (!demoUser) {
    demoUser = await storage.createUser({
      username: "demo",
      password: "demo"
    });
  }

  // Complete a session
  app.post("/api/sessions", async (req, res) => {
    try {
      const sessionData = insertSessionSchema.parse({
        ...req.body,
        userId: DEMO_USER_ID,
      });

      const session = await storage.createSession(sessionData);
      
      // Update user stats
      const stats = await storage.getUserStats(DEMO_USER_ID);
      if (stats) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const lastSessionDate = stats.lastSessionDate ? new Date(stats.lastSessionDate) : null;
        const isConsecutiveDay = lastSessionDate && 
          Math.abs(today.getTime() - lastSessionDate.getTime()) <= 24 * 60 * 60 * 1000;
        
        await storage.updateUserStats(DEMO_USER_ID, {
          totalSessions: stats.totalSessions + 1,
          totalFocusTime: stats.totalFocusTime + sessionData.duration,
          currentStreak: isConsecutiveDay ? stats.currentStreak + 1 : 1,
          longestStreak: Math.max(stats.longestStreak, isConsecutiveDay ? stats.currentStreak + 1 : 1),
          totalBricks: stats.totalBricks + (sessionData.bricksEarned || 0),
          lastSessionDate: new Date(),
        });
      }

      // Update city resources
      const city = await storage.getUserCity(DEMO_USER_ID);
      if (city) {
        const resources = city.resources as { bricks: number; coins: number };
        await storage.updateCity(DEMO_USER_ID, {
          resources: {
            bricks: resources.bricks + (sessionData.bricksEarned || 0),
            coins: resources.coins,
          },
        });
      }

      res.json(session);
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(400).json({ message: "Invalid session data" });
    }
  });

  // Get user sessions
  app.get("/api/sessions", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const sessions = await storage.getUserSessions(DEMO_USER_ID, limit);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  // Get today's sessions
  app.get("/api/sessions/today", async (req, res) => {
    try {
      const sessions = await storage.getTodaysSessions(DEMO_USER_ID);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching today's sessions:", error);
      res.status(500).json({ message: "Failed to fetch today's sessions" });
    }
  });

  // Get user city
  app.get("/api/city", async (req, res) => {
    try {
      const city = await storage.getUserCity(DEMO_USER_ID);
      if (!city) {
        return res.status(404).json({ message: "City not found" });
      }
      res.json(city);
    } catch (error) {
      console.error("Error fetching city:", error);
      res.status(500).json({ message: "Failed to fetch city" });
    }
  });

  // Update city
  app.patch("/api/city", async (req, res) => {
    try {
      const updateData = z.object({
        gridData: z.array(z.array(z.any())).optional(),
        resources: z.object({
          bricks: z.number(),
          coins: z.number(),
        }).optional(),
      }).parse(req.body);

      const city = await storage.updateCity(DEMO_USER_ID, updateData);
      res.json(city);
    } catch (error) {
      console.error("Error updating city:", error);
      res.status(400).json({ message: "Invalid city data" });
    }
  });

  // Get user stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getUserStats(DEMO_USER_ID);
      if (!stats) {
        return res.status(404).json({ message: "Stats not found" });
      }
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
