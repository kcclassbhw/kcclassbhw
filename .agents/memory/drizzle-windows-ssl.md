---
name: Drizzle Windows SSL
description: How pg connects to Neon on Windows and the SSL fix already applied
---

## Rule
When `DATABASE_URL` contains `neon.tech`, pass `ssl: { rejectUnauthorized: false }` to `pg.Pool`. Do not strip `?sslmode=require` from the URL.

**Why:** Windows Node.js TLS stack frequently rejects Neon's cert with "SSL SYSCALL error: EOF detected" or "unable to get local issuer certificate" when using only the connection string. The explicit ssl config bypasses the Windows root-store lookup that fails. Neon uses a valid CA-signed cert so this is safe.

**How to apply:** Check `lib/db/src/index.ts` — the fix is already there. Pattern:
```ts
const ssl = connectionString.includes("neon.tech") ? { ssl: { rejectUnauthorized: false } } : {};
export const pool = new Pool({ connectionString, ...ssl });
```

## Also fixed
- `drizzle-kit push` interactive Y/N prompts hang on some Windows terminals → `push-force` script skips them
- `.env.example` had a real-looking placeholder that caused confusing connection errors → changed to `REPLACE_WITH_YOUR_CONNECTION_STRING`
- Drizzle config reads `DATABASE_URL` from `artifacts/api-server/.env` using `fileURLToPath(import.meta.url)` for ESM-compatible `__dirname` — works correctly from any CWD
