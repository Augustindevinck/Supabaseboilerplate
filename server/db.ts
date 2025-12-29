import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// We use DATABASE_URL if provided, otherwise we might just warn or export null
// For this boilerplate, we assume the user might provide it later.
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || "postgres://user:password@localhost:5432/db",
  max: 10
});

// We wrap in a try-catch or just export. 
// If DATABASE_URL is invalid/missing, backend might crash on query, which is fine for now as we use Client mainly.
export const db = drizzle(pool, { schema });
