import { api } from "@shared/routes";
import { users, type User, type InsertUser } from "@shared/schema";

export interface IStorage {
  // We can add methods here if backend needs to access DB
  // For now, it's mostly client-side Supabase
  getUser(id: string): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    // This would use db.select()...
    return undefined;
  }
}

export const storage = new DatabaseStorage();
