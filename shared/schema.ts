import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We will map this to a 'profiles' table in Supabase
// This usually extends the auth.users table via a trigger, or is managed manually.
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // Matches auth.users id
  email: text("email"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profiles);

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type UpdateProfileRequest = z.infer<typeof insertProfileSchema.partial()>;
