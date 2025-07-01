import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  duration: integer("duration").notNull(), // in minutes
  sessionType: text("session_type").notNull(), // 'focus', 'break', 'deep', 'long'
  bricksEarned: integer("bricks_earned").notNull().default(0),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  gridData: jsonb("grid_data").notNull(), // 8x8 grid storing building placements
  resources: jsonb("resources").notNull(), // {bricks: number, coins: number}
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  totalSessions: integer("total_sessions").notNull().default(0),
  totalFocusTime: integer("total_focus_time").notNull().default(0), // in minutes
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  totalBricks: integer("total_bricks").notNull().default(0),
  totalCoins: integer("total_coins").notNull().default(0),
  lastSessionDate: timestamp("last_session_date"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  completedAt: true,
});

export const insertCitySchema = createInsertSchema(cities).omit({
  id: true,
  updatedAt: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertCity = z.infer<typeof insertCitySchema>;
export type City = typeof cities.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type UserStats = typeof userStats.$inferSelect;

// Building types for the city
export const BuildingType = z.enum(['house', 'shop', 'office', 'park', 'landmark']);
export type BuildingType = z.infer<typeof BuildingType>;

export const BuildingSchema = z.object({
  type: BuildingType,
  cost: z.number(),
  unlockRequirement: z.number(), // sessions required to unlock
});

export const GridCellSchema = z.object({
  buildingType: BuildingType.nullable(),
  placedAt: z.string().optional(), // ISO timestamp
});

export type GridCell = z.infer<typeof GridCellSchema>;
export type Building = z.infer<typeof BuildingSchema>;
