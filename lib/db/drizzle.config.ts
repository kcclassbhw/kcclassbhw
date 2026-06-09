import path from "path";
import { fileURLToPath } from "url";
import { readFileSync, existsSync } from "fs";
import { defineConfig } from "drizzle-kit";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load DATABASE_URL from the api-server .env when present (local dev convenience).
// Silently skipped if missing; DATABASE_URL must then be set in the environment.
const envPath = path.resolve(__dirname, "../../artifacts/api-server/.env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = val;
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    [
      "",
      "  ERROR: DATABASE_URL is not set.",
      "",
      "  Make sure artifacts/api-server/.env exists and contains:",
      "    DATABASE_URL=postgresql://user:password@host:5432/dbname",
      "",
    ].join("\n"),
  );
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
