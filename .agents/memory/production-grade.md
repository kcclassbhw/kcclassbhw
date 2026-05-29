---
name: Production grade checklist
description: All production-grade features applied to the KC Class BHW stack
---

## Applied changes

### Rate limiting (`artifacts/api-server/src/app.ts`)
- General: 120 req / 15 min per IP on all `/api` routes (skips `/healthz`)
- Strict: 20 req / 15 min on `/api/subscriptions/checkout` and `/api/subscriptions/verify`
- Package: `express-rate-limit` in api-server dependencies

### Trust proxy (`artifacts/api-server/src/app.ts`)
- `app.set("trust proxy", 1)` — required for accurate `req.ip` behind Render's load balancer

### Graceful shutdown (`artifacts/api-server/src/index.ts`)
- Handles SIGTERM and SIGINT (Render sends SIGTERM on redeploy/scale)
- Closes HTTP server, then closes pg pool, then exits 0
- 15-second safety valve forces exit if drain takes too long

### HTTP security headers (`artifacts/api-server/src/app.ts`)
- Helmet with `crossOriginResourcePolicy: cross-origin` (needed for Clerk)
- Removes X-Powered-By, adds HSTS, CSP, X-Content-Type-Options, etc.

### SPA routing (`vercel.json`, `netlify.toml`)
- `vercel.json`: rewrites all `/*` → `/index.html`
- `netlify.toml`: same via `[[redirects]]`; also sets Node 22 + pnpm 10

### Clerk webhook sync (`artifacts/api-server/src/routes/webhooks.ts`)
- POST `/api/webhooks/clerk` — svix signature verification
- Handles `user.created`, `user.updated`, `user.deleted`
- Raw body parsing wired in `app.ts` before `express.json()`

### Payment security (`artifacts/api-server/src/routes/subscriptions.ts`)
- Plan validated as `monthly` or `yearly` — any other value rejected
- Amount cross-checked against plan price before DB write
- `FRONTEND_URL` env var used for redirect URLs (not spoofable `Origin` header)

### Dead dependency removed
- `stripe` removed from `@workspace/api-server` — project uses eSewa, not Stripe

**Why:** All needed for Render + Vercel production deployment with real payments.
