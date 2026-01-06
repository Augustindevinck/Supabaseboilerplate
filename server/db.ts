import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// We prioritize DATABASE_URL if provided, but we don't strictly require it 
// since most operations are done via the Supabase Client.
const connectionString = process.env.DATABASE_URL || "postgres://user:password@localhost:5432/db";

export const pool = new Pool({ 
  connectionString,
  max: 10
});

export const db = drizzle(pool, { schema });
