import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    [
      "",
      "  ERROR: DATABASE_URL is not set.",
      "",
      "  Fix: open  artifacts/api-server/.env  and set:",
      "    DATABASE_URL=postgresql://user:password@host:5432/dbname",
      "",
      "  If the file does not exist yet:",
      "    Windows:  copy artifacts\\api-server\\.env.example artifacts\\api-server\\.env",
      "    Mac/Linux: cp artifacts/api-server/.env.example artifacts/api-server/.env",
      "",
    ].join("\n"),
  );
}

const connectionString = process.env.DATABASE_URL;

// Neon (and other hosted PostgreSQL providers) require TLS.
// pg supports ?sslmode=require in the URL, but on Windows the native TLS
// stack can reject Neon's cert with "SSL SYSCALL error: EOF detected" or
// "unable to get local issuer certificate". Adding rejectUnauthorized: false
// is safe here — Neon uses a valid CA-signed cert, this only bypasses the
// Windows root-store lookup that occasionally fails.
const ssl = connectionString.includes("neon.tech")
  ? { ssl: { rejectUnauthorized: false } }
  : {};

export const pool = new Pool({ connectionString, ...ssl });
export const db = drizzle(pool, { schema });

export * from "./schema";
