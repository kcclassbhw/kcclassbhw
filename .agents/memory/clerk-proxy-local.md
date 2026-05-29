---
name: Clerk proxy local dev
description: When and why VITE_CLERK_PROXY_URL must NOT be set in local development
---

## Rule
Never set `VITE_CLERK_PROXY_URL` in local development. Only set it in production with `pk_live_` keys on a custom domain.

**Why:** Clerk's proxy (`/api/__clerk`) only activates in production (`NODE_ENV=production`) with a secret key. Setting `VITE_CLERK_PROXY_URL` with `pk_test_` keys causes "Failed to load Clerk JS" because the dev Clerk instance does not support proxy mode.

**How to apply:** `artifacts/learn/.env.example` has this line commented out with an explicit warning. `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts` returns a passthrough when `NODE_ENV !== "production"`.

## Deployment behavior
- Development (local): proxy is a no-op. `clerkMiddleware` falls back to `CLERK_PUBLISHABLE_KEY` env var.
- Production (Render + Vercel): Vercel frontend talks to Clerk directly. No proxy needed for `.vercel.app` or `.onrender.com` domains. Proxy is only needed for custom domains with CNAME.
