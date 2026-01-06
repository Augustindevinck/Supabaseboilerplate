import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

import { logger } from "./lib/logger";

const { Pool } = pg;

// We prioritize DATABASE_URL if provided, but we don't strictly require it 
// since most operations are done via the Supabase Client.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  logger.warn("DATABASE_URL not found, using fallback. Database operations might fail.");
}

export const pool = new Pool({ 
  connectionString: connectionString || "postgres://user:password@localhost:5432/db",
  max: 10
});

export const db = drizzle(pool, { schema });
