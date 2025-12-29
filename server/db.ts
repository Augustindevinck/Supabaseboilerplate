import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Helper to validate connection string format
function validateDatabaseUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  
  try {
    const parsed = new URL(url);
    // Basic check for common issue: @ in password not encoded
    // Standard URL parser might misinterpret it, but we can't easily detect that 
    // without knowing the intended user/pass. 
    // However, we can at least ensure it parses successfully.
    return url;
  } catch (e) {
    console.warn("WARNING: Invalid DATABASE_URL format detected. If your password contains special characters like '@', ensure they are URL-encoded (e.g. replace '@' with '%40').");
    return url; // Return it anyway, let pg try
  }
}

const connectionString = validateDatabaseUrl(process.env.DATABASE_URL) || "postgres://user:password@localhost:5432/db";

export const pool = new Pool({ 
  connectionString,
  max: 10
});

export const db = drizzle(pool, { schema });
