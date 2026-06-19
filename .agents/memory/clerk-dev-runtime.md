---
name: Clerk dev runtime fixes
description: Two runtime crash patterns when CLERK_SECRET_KEY is absent in dev; both must be fixed together.
---

## Problem 1 — clerkMiddleware crash (API server)
`clerkMiddleware()` from `@clerk/express` throws synchronously on startup if `CLERK_SECRET_KEY` is absent.
If registered unconditionally in `app.use()`, it crashes ALL routes including public ones.

**Fix:** Wrap in `if (process.env.CLERK_SECRET_KEY)` in `app.ts`. Move `/healthz` BEFORE this conditional block.

## Problem 2 — getAuth() throws when middleware not registered (API server)
Even after fixing Problem 1, any call to `getAuth(req)` (including in public routes via `ensureUser`) throws:
"clerkMiddleware should be registered before using getAuth".

**Fix:** `safeGetAuth(req)` helper in `routes/auth.ts` wraps `getAuth` in try/catch returning null.
Export and use everywhere instead of `getAuth` directly (auth.ts, lessons.ts).

```typescript
export function safeGetAuth(req: any) {
  try { return getAuth(req); } catch { return null; }
}
```

## Problem 3 — Clerk JS fails to load (frontend)
`VITE_CLERK_PROXY_URL` is set by the Replit Clerk integration to the Replit dev domain.
Clerk prepends `clerk.` to the proxy hostname when loading its JS bundle.
`clerk.<replit-dev-domain>` is not a valid subdomain Replit routes — Clerk JS never loads.

**Fix in App.tsx:** Gate proxy URL on `import.meta.env.PROD` (false in Vite dev server, always).
```typescript
const clerkProxyUrl = import.meta.env.PROD
  ? (import.meta.env.VITE_CLERK_PROXY_URL as string | undefined)
  : undefined;
```
Do NOT gate on `pk_live_` prefix — Replit's managed Clerk issues pk_live_ keys even in dev.

**Why:** `import.meta.env.PROD` is baked in at build time by Vite — false for dev server, true for production builds. This is the correct and stable signal for "am I running in the production bundle?"
