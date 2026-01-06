import { profiles, type Profile, type InsertProfile, type UpdateProfileRequest } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getProfile(id: string): Promise<Profile | undefined>;
  updateProfile(id: string, profile: UpdateProfileRequest): Promise<Profile>;
  createProfile(profile: InsertProfile): Promise<Profile>;
}

export class DatabaseStorage implements IStorage {
  async getProfile(id: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
    return profile;
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const [newProfile] = await db.insert(profiles).values(profile).returning();
    return newProfile;
  }

  async updateProfile(id: string, profile: UpdateProfileRequest): Promise<Profile> {
    const [updatedProfile] = await db
      .update(profiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(profiles.id, id))
      .returning();
    
    if (!updatedProfile) {
      throw new Error("Profile not found");
    }
    return updatedProfile;
  }
}

export const storage = new DatabaseStorage();
