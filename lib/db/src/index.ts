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

// Neon requires TLS. In production (Render/Linux) the system root-store validates
// Neon's CA-signed cert correctly — use strict verification.
// In development (Windows) the native TLS stack sometimes rejects the cert with
// "SSL SYSCALL error: EOF detected" or "unable to get local issuer certificate",
// so we relax verification only there.
const ssl = connectionString.includes("neon.tech")
  ? { ssl: { rejectUnauthorized: process.env.NODE_ENV === "production" } }
  : {};

export const pool = new Pool({ connectionString, ...ssl });
export const db = drizzle(pool, { schema });

export * from "./schema";
