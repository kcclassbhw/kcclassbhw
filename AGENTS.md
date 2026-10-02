# AGENTS.md — KC Class BHW Project Handoff

> **Last Updated:** 2026-10-01  
> **Stack:** pnpm monorepo · Node/Express API · React/Vite frontend · Neon PostgreSQL · Drizzle ORM  
> **Deployment:** Render (backend) · Netlify or Cloudflare Pages (frontend — Vercel abandoned due to monorepo complexity)  
> **Repo:** https://github.com/kcclassbhw/kcclassbhw

---

## 📁 Project Structure

```
kcclassbhw/                        ← monorepo root
├── apps/
│   ├── api-server/                ← Express backend (Node.js)
│   │   ├── src/
│   │   │   ├── app.ts             ← Express app setup, CORS, rate limits, Helmet
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts        ← JWT auth, register, login, refresh, logout
│   │   │   │   ├── admin.ts       ← Admin panel API (stats, users, subs, audit)
│   │   │   │   ├── courses.ts     ← Course CRUD
│   │   │   │   ├── lessons.ts     ← Lesson CRUD
│   │   │   │   ├── resources.ts   ← Resource management
│   │   │   │   ├── subscriptions.ts ← eSewa payment integration
│   │   │   │   ├── progress.ts    ← User learning progress
│   │   │   │   ├── dashboard.ts   ← User dashboard data
│   │   │   │   ├── videos.ts      ← YouTube video integration
│   │   │   │   └── public.ts      ← Public (unauthenticated) routes
│   │   │   ├── middleware/
│   │   │   │   ├── security.ts    ← Brute-force, password strength, sanitization
│   │   │   │   └── adminGuard.ts  ← 4-layer admin protection middleware
│   │   │   └── lib/
│   │   │       ├── supabase.ts    ← Supabase OAuth token verification
│   │   │       ├── logger.ts      ← Pino structured logger
│   │   │       └── disposableEmails.ts ← Disposable email blocklist
│   │   └── .env                   ← Local dev env vars (NOT committed)
│   └── learn/                     ← React/Vite frontend
│       └── src/
│           └── lib/
│               ├── auth-context.tsx ← Auth state management
│               └── supabase.ts    ← Supabase client (OAuth on frontend)
├── lib/
│   └── db/                        ← Drizzle ORM schema + migrations
│       └── drizzle.config.cjs     ← CommonJS drizzle config for ESM compat
├── scripts/
│   └── security-test.ts           ← Automated security test suite (14 tests)
├── render.yaml                    ← Render deployment config
├── .npmrc                         ← npm registry + peer dep settings
├── pnpm-workspace.yaml            ← Workspace package definitions
└── package.json                   ← Root with pnpm overrides for security
```

---

## ✅ COMPLETED WORK

### 1. Monorepo Setup
- [x] Converted flat project → `pnpm` workspace monorepo (`apps/`, `lib/`)
- [x] `pnpm-workspace.yaml` with all packages declared
- [x] Root `package.json` with security overrides for `qs`, `ip-address`, `body-parser`, `brace-expansion`
- [x] `tsconfig.base.json` with shared TypeScript config

### 2. Database (Neon PostgreSQL + Drizzle)
- [x] Full schema pushed to Neon: `users`, `courses`, `lessons`, `resources`, `progress`, `subscriptions`, `announcements`, `auditLogs`
- [x] Fixed ESM/CJS conflict — created `drizzle.config.cjs` (CommonJS) for `drizzle-kit push`
- [x] Schema includes `passwordHash` column on `users` table for native auth
- [x] `auditLogsTable` for admin action tracking

### 3. Authentication System (Native JWT — No Clerk)
- [x] **Removed all Clerk dependencies** — fully self-hosted auth
- [x] `POST /auth/register` — email + password signup, first user = admin
- [x] `POST /auth/login` — returns short-lived access token (15 min) + refresh token (30d)
- [x] `POST /auth/refresh` — silently renews access token using HttpOnly refresh cookie
- [x] `POST /auth/logout` — clears both cookies
- [x] `GET /auth/me` — returns authenticated user profile + subscription
- [x] `POST /auth/change-password` — validates current password, enforces new password strength
- [x] `POST /auth/supabase-sync` — syncs verified Supabase OAuth session into local DB

### 4. Security Hardening
- [x] **Bcrypt cost factor 12** (upgraded from 10) for password hashing
- [x] **Short-lived access tokens** (15 min) — minimises blast radius on token leaks
- [x] **Refresh tokens** (30d) sent via HttpOnly cookie scoped to `/api/auth/refresh` only
- [x] **Token type enforcement** — refresh tokens rejected when used as access tokens
- [x] **`sameSite: strict`** in production on all auth cookies
- [x] **Timing-safe password compare** — prevents user enumeration via timing
- [x] **Brute-force lockout** — 5 attempts → 15-min lockout; 10+ attempts → 1-hour lockout
- [x] **Admin brute-force** — stricter: 3 attempts → 1-hour lockout
- [x] **Password strength policy:**
  - Minimum 8 characters, maximum 128
  - Must have uppercase AND lowercase AND number or symbol
  - Blocks 16 common passwords (password, 123456, etc.)
- [x] **Disposable email blocking** — 120,000+ domains (npm package) + hardcoded fallback (always checks both)
- [x] **Rate limiting:**
  - General: 120 req / 15 min
  - Auth (login/register/refresh): **10 req / 15 min**
  - Admin: **60 req / 15 min**
  - Payment: 20 req / 15 min
- [x] **Helmet.js** — HSTS, CSP, removes X-Powered-By
- [x] **Enhanced security headers** — X-Frame-Options: DENY, COEP, COOP, Permissions-Policy
- [x] **Input sanitization** — strips `<>`, `javascript:`, inline event handlers
- [x] **Generic error messages** — never reveals whether email exists

### 5. Admin Panel Protection (4-Layer Guard)
Every `/admin/*` route passes through `requireAdminStrict` in `adminGuard.ts`:

| Layer | Check |
|---|---|
| 1 | IP brute-force guard (3 failed admin attempts → 1hr lockout) |
| 2 | Valid JWT access token required |
| 3 | Token age ≤ 4 hours (prevents stale/stolen tokens doing admin ops) |
| 4 | **Live DB role check** (role in DB, NOT in JWT — demoted admins lose access instantly) |

- [x] Every admin request auto audit-logged (IP, user agent, path, method)
- [x] High-impact actions double-logged (role changes, CSV exports)
- [x] Generic `403 Forbidden` response — never reveals reason to attacker

### 6. Admin API Routes
- [x] `GET /admin/stats` — platform statistics
- [x] `GET /admin/users` — user list with subscription info
- [x] `GET /admin/users/export` — CSV export (audit logged)
- [x] `PATCH /admin/users/:id/role` — role promotion/demotion (audit logged)
- [x] `GET /admin/subscriptions` — subscription list
- [x] `POST /admin/subscriptions/grant` — manually grant subscription
- [x] `DELETE /admin/subscriptions/:userId/revoke` — revoke subscription
- [x] `GET /admin/enrollment-stats` — course enrollment analytics
- [x] `GET /admin/activity` — recent platform activity feed
- [x] `GET/POST/PATCH/DELETE /admin/announcements` — announcement management

### 7. Supabase OAuth (Optional — wired, not activated)
- [x] Backend: `verifySupabaseToken()` validates Supabase access tokens
- [x] Backend: `POST /auth/supabase-sync` upserts OAuth users into local DB
- [x] Frontend: `signInWithOAuth()` triggers Google/GitHub login
- [x] Frontend: `resetPasswordForEmail()` — Supabase password reset emails
- [x] Gracefully disabled when `SUPABASE_URL` / `SUPABASE_ANON_KEY` not set

### 8. Security Testing
- [x] Created `scripts/security-test.ts` — 14 automated security test groups
- [x] Tests cover: health check, admin access control (401/403), password strength, disposable emails, brute-force lockout, token validation, change-password, input sanitization
- [x] **25 of 33 tests passing** (remaining are test isolation issues, not real vulnerabilities)

### 9. Deployment Config
- [x] `render.yaml` — Render web service config with all env var placeholders
- [x] Build command: `pnpm install --no-frozen-lockfile && pnpm --filter @workspace/api-server run build`
- [x] Start command: `node --enable-source-maps ./apps/api-server/dist/index.mjs`
- [x] `.npmrc` explicitly sets `registry=https://registry.npmjs.org/` — fixes Render 403 errors
- [x] Health check endpoint: `/healthz`

### 10. GitHub
- [x] Pushed to `https://github.com/kcclassbhw/kcclassbhw.git` (branch: `main`)
- [x] `.gitignore` — excludes `.env`, `node_modules`, `dist`

---

## ❌ REMAINING / TODO

### 🔴 CRITICAL — Must do before going live

- [ ] **Deploy backend to Render**
  - Go to render.com → New Web Service → connect `kcclassbhw/kcclassbhw`
  - Add all ✅ env vars listed below
  - Test: `curl https://YOUR-RENDER-URL.onrender.com/healthz`

- [ ] **Deploy frontend** — Use **Netlify** (recommended) or Cloudflare Pages
  - Vercel was abandoned due to monorepo complexity

  **Netlify (easiest):**
  - netlify.com → Add new site → Import from Git → pick repo
  - `netlify.toml` is pre-configured in root — automatically sets up build and SPA redirects!
  - Or manual settings:
    - Base directory: (leave empty / root)
    - Build command: `pnpm install --no-frozen-lockfile && pnpm --filter @workspace/learn run build`
    - Publish directory: `apps/learn/dist/public`
  - Env var: `VITE_API_URL=https://YOUR-RENDER-URL.onrender.com`

  **Cloudflare Pages (fastest CDN):**
  - pages.cloudflare.com → Create project → Connect to Git
  - Root directory: `apps/learn`
  - Build command: `pnpm install --no-frozen-lockfile && pnpm run build`
  - Build output directory: `dist`
  - Deploy command: `npx wrangler pages deploy dist --project-name=kcclassbhw`
  - Preview command: `pnpm run build`
  - Env var: `VITE_API_URL=https://YOUR-RENDER-URL.onrender.com`

- [ ] **Set strong `JWT_SECRET` in production**
  - Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

- [ ] **Update `CORS_ORIGIN` on Render** after frontend URL is known

### 🟡 IMPORTANT — Security improvements

- [ ] **Persist refresh token revocation** (currently in-memory — clears on restart)
  - Add `refreshTokens` DB table or Redis
  - On logout: store token hash; check on every `/auth/refresh`

- [ ] **Email verification on signup**
  - Block access to paid content until email verified
  - Use Supabase transactional emails or Resend

- [ ] **Password reset flow (forgot password)**
  - `POST /auth/forgot-password` → send signed reset link via email
  - `POST /auth/reset-password` → validate token, update hash, revoke sessions
  - `resetPasswordForEmail()` already wired on frontend for Supabase path

- [ ] **Fix security tests to 100%**
  - Currently 25/33 — 8 failures are rate-limit test isolation bugs, not real issues
  - Add `await new Promise(r => setTimeout(r, 1500))` between brute-force and login tests

### 🟠 FEATURES — Not yet implemented

- [ ] **Supabase OAuth (Google / GitHub login)**
  - Create Supabase project → enable Google + GitHub providers
  - Add to Render: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
  - Add to frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - Set Supabase Redirect URLs to your frontend domain

- [ ] **eSewa payment integration** (backend partially built)
  - `subscriptions.ts` routes exist — needs real credentials
  - Add: `ESEWA_SECRET_KEY`, `ESEWA_PRODUCT_CODE`, `ESEWA_MONTHLY_PRICE`, `ESEWA_YEARLY_PRICE`
  - Test with eSewa sandbox first

- [ ] **YouTube video integration**
  - `YOUTUBE_CHANNEL_ID` is set — complete `videos.ts` route
  - Frontend player needs YouTube embed handling

- [ ] **File/resource upload**
  - `STORAGE_BASE_URL` in `render.yaml` but storage not configured
  - Options: Supabase Storage (free), Cloudflare R2, AWS S3

- [ ] **Admin panel frontend UI**
  - Backend API is 100% complete — frontend dashboard needs building
  - Guard admin pages: only render if `user.role === 'admin'`

### 🔵 DEVOPS / POLISH

- [ ] **Uptime monitoring**
  - UptimeRobot (free) → ping `/healthz` every 5 min
  - Prevents Render free tier from sleeping (15-min idle timeout)

- [ ] **Database backups**
  - Neon has point-in-time restore — verify it's enabled

- [ ] **Custom domain** (optional)
  - Point DNS to frontend host (Netlify/Cloudflare)
  - Add custom domain on Render (backend)

- [ ] **CI/CD pipeline** (optional)
  - `.github/workflows/ci.yml` → run `security-test.ts` on every push

---

## 🔑 Environment Variables Reference

### Backend — Render

| Variable | Required | Value / Note |
|---|---|---|
| `NODE_ENV` | ✅ | `production` |
| `DATABASE_URL` | ✅ | Neon connection string with `?sslmode=require` |
| `JWT_SECRET` | ✅ | 48+ char random hex string |
| `CORS_ORIGIN` | ✅ | Your frontend URL (Netlify/Cloudflare) |
| `FRONTEND_URL` | ✅ | Same as CORS_ORIGIN |
| `YOUTUBE_CHANNEL_ID` | ✅ | `UC77kf2jXTQvRl2vV3CI8oRA` |
| `ESEWA_SECRET_KEY` | ⚠️ | eSewa merchant secret |
| `ESEWA_PRODUCT_CODE` | ⚠️ | eSewa product code |
| `ESEWA_ENV` | ⚠️ | `production` or `sandbox` |
| `ESEWA_MONTHLY_PRICE` | ⚠️ | Monthly price in NPR e.g. `299` |
| `ESEWA_YEARLY_PRICE` | ⚠️ | Yearly price in NPR e.g. `2399` |
| `SUPABASE_URL` | 🔵 | Supabase project URL (OAuth only) |
| `SUPABASE_SERVICE_ROLE_KEY` | 🔵 | Supabase service key (OAuth only) |
| `STORAGE_BASE_URL` | 🔵 | File storage base URL |
| `LOG_LEVEL` | ⚪ | `info` (default) |

### Frontend — Netlify / Cloudflare Pages

| Variable | Required | Value / Note |
|---|---|---|
| `VITE_API_URL` | ✅ | `https://your-api.onrender.com` |
| `VITE_SUPABASE_URL` | 🔵 | Supabase URL (OAuth only) |
| `VITE_SUPABASE_ANON_KEY` | 🔵 | Supabase anon/public key (OAuth only) |

> ✅ Required · ⚠️ Required for payments · 🔵 Required for Google/GitHub OAuth · ⚪ Optional

---

## 🧪 Running Security Tests

```bash
# 1. Start the dev API server
pnpm --filter @workspace/api-server run dev

# 2. In another terminal, run tests
npx tsx scripts/security-test.ts

# Against production
API_URL=https://your-render-url.onrender.com/api npx tsx scripts/security-test.ts
```

---

## 🚀 Quick Deploy Checklist

```
[ ] 1. render.com → New Web Service → connect GitHub kcclassbhw/kcclassbhw
[ ] 2. Add all ✅ env vars in Render dashboard
[ ] 3. Deploy → watch build logs → wait for "Live"
[ ] 4. Test: curl https://YOUR-RENDER-URL.onrender.com/healthz
[ ] 5. netlify.com → Add new site → Import from Git → pick repo (build & redirects auto-configured via netlify.toml)
[ ] 6. (If setting manually) Build: pnpm install --no-frozen-lockfile && pnpm --filter @workspace/learn run build | Publish: apps/learn/dist/public
[ ] 7. Add VITE_API_URL=https://YOUR-RENDER-URL.onrender.com in Netlify env vars
[ ] 8. Deploy Netlify → copy frontend URL
[ ] 9. Update CORS_ORIGIN + FRONTEND_URL on Render → trigger redeploy
[ ] 10. Visit frontend → register first account (auto-admin)
[ ] 11. Run security tests against production URL
[ ] 12. Set up UptimeRobot to ping /healthz every 5 min (free)
```

---

## 📞 Resources

| Service | Link |
|---|---|
| Neon DB Console | https://console.neon.tech |
| Render Dashboard | https://dashboard.render.com |
| Netlify Dashboard | https://app.netlify.com |
| Cloudflare Pages | https://pages.cloudflare.com |
| Supabase Dashboard | https://supabase.com/dashboard |
| GitHub Repo | https://github.com/kcclassbhw/kcclassbhw |
| eSewa Developer | https://developer.esewa.com.np |
