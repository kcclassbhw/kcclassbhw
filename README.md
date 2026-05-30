# KC Class BHW

A subscription-based B.Ed English learning platform. Students browse free course previews, then pay a monthly or yearly subscription via eSewa (Nepal's leading digital wallet) to unlock all lessons, PDF notes, grammar charts, and downloadable resources.

---

## Documentation

**[DOCS.md](./DOCS.md)** — The complete guide: requirements, local setup (Windows 11), deployment to Render + Vercel + Neon, going live with eSewa payments, and troubleshooting. Start there.

---

## What the Platform Does

- Students browse the full course catalog without signing in
- Free "preview" lessons are watchable without a subscription
- Students subscribe via eSewa (monthly NPR 299 or yearly NPR 2,399)
- After payment, all premium lessons and the resource vault unlock
- Lesson progress is tracked per student
- The Videos page auto-syncs with the YouTube channel — no manual updates
- Admin dashboard for full course, lesson, resource, user, and subscription management

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22+, TypeScript 5.9 |
| Frontend | React 19, Vite 7, Tailwind CSS v4, shadcn/ui, wouter |
| Backend | Express 5 |
| Database | PostgreSQL 15+ with Drizzle ORM |
| Auth | Clerk (sign-up, sign-in, Google login) |
| Payments | eSewa v2 (HMAC-signed form POST + status API verification) |
| Webhook sync | Svix (Clerk user events → database) |
| Validation | Zod v4, drizzle-zod |
| API spec | OpenAPI 3.1 → Orval → React Query hooks + Zod schemas |
| Monorepo | pnpm workspaces |
| Build | esbuild (API), Vite (frontend) |
| Security | Helmet, CORS, Clerk JWT verification |
| Logging | Pino |

---

## Project Structure

```
KC-Class/
├── artifacts/
│   ├── learn/                        # React frontend (Vite)
│   │   ├── vercel.json               # Vercel SPA routing (all paths → index.html)
│   │   └── src/
│   │       ├── pages/                # Page components
│   │       │   ├── home.tsx          # Landing page
│   │       │   ├── courses.tsx       # Course catalog
│   │       │   ├── course-detail.tsx # Single course + lesson list
│   │       │   ├── lesson.tsx        # Lesson video player
│   │       │   ├── videos.tsx        # YouTube channel auto-sync
│   │       │   ├── pricing.tsx       # eSewa subscription plans
│   │       │   ├── payment-verify.tsx# Post-payment verification
│   │       │   ├── dashboard.tsx     # Student dashboard
│   │       │   ├── resources.tsx     # Resource vault (subscriber-only)
│   │       │   ├── settings.tsx      # Profile + subscription management
│   │       │   ├── admin.tsx         # Admin overview
│   │       │   ├── admin-courses.tsx # Course CRUD
│   │       │   └── admin-lessons.tsx # Lesson CRUD
│   │       └── components/           # Shared UI components
│   └── api-server/                   # Express API server
│       └── src/
│           ├── routes/
│           │   ├── auth.ts           # Auth middleware (requireAuth, requireAdmin, ensureUser)
│           │   ├── courses.ts        # Course CRUD
│           │   ├── lessons.ts        # Lesson CRUD + subscription gate
│           │   ├── resources.ts      # Resource vault
│           │   ├── subscriptions.ts  # eSewa checkout + verify
│           │   ├── progress.ts       # Lesson completion tracking
│           │   ├── dashboard.ts      # Dashboard summary
│           │   ├── admin.ts          # Admin stats + user management + /users/me
│           │   ├── videos.ts         # YouTube RSS feed (YOUTUBE_CHANNEL_ID env var)
│           │   └── webhooks.ts       # Clerk webhook handler (user sync)
│           ├── middlewares/
│           │   └── clerkProxyMiddleware.ts
│           ├── lib/logger.ts
│           └── app.ts                # Express setup, Helmet, CORS, error handler
├── lib/
│   ├── api-spec/openapi.yaml         # Source-of-truth OpenAPI spec
│   ├── api-zod/src/generated/        # Zod schemas (auto-generated — do not edit)
│   ├── api-client-react/src/generated/ # React Query hooks (auto-generated — do not edit)
│   └── db/src/schema/               # Drizzle ORM schema (users, courses, lessons, etc.)
├── scripts/                          # Utility scripts
├── .vscode/                          # VSCode tasks, extensions, settings
├── DOCS.md                           # Complete guide: setup, deploy, go live
└── README.md                         # This file — technical reference
```

---

## User Roles & Access Control

| Level | Who | Access |
|---|---|---|
| **Public** | Anyone | Course catalog, course details, free preview lessons, pricing, videos |
| **Authenticated** | Signed-in users | Everything above + dashboard, progress tracking |
| **Subscriber** | Active eSewa subscription | Everything above + all premium lessons, resource vault, downloads |
| **Admin** | `role = admin` in database | Everything above + full CRUD, user management, subscription management |

---

## eSewa Payment Flow

```
Student clicks "Pay with eSewa" on /pricing
        ↓
POST /api/subscriptions/checkout  { plan: "monthly" | "yearly" }
        ↓
Server generates HMAC-SHA256 signed payment data
        ↓
Frontend auto-submits a hidden form POST to eSewa's payment page
        ↓
Student logs into eSewa and confirms the payment
        ↓
eSewa redirects to /payment/verify?plan=monthly&data=<base64>
        ↓
Frontend POSTs to /api/subscriptions/verify
        ↓
Server validates plan, verifies amount matches plan price
        ↓
Server calls eSewa's status API to independently confirm the transaction
        ↓
Server creates/updates subscription row (status = active)
        ↓
Student lands on /dashboard with full access
```

**Sandbox testing (no eSewa account needed):**
- Test credentials: eSewa ID `9806800001`, MPIN `1122`, Password `Nepal@123`
- Uses eSewa's sandbox at `rc-epay.esewa.com.np`
- Sandbox is always active unless `ESEWA_ENV=production` is set

---

## Clerk → Database Sync

User data flows from Clerk to the database via two mechanisms:

| Mechanism | When it runs | What it does |
|---|---|---|
| **Clerk Webhook** (`POST /api/webhooks/clerk`) | Instantly on `user.created`, `user.updated`, `user.deleted` events | Upserts full user profile (email, name, avatar) into the `users` table |
| **`ensureUser` middleware** | On first authenticated API request | Fallback — fetches from Clerk API and creates the DB row if the webhook hasn't fired yet |

Setup required for webhooks: see `DOCS.md → Part 4, Part E`.

---

## API Reference

All endpoints are prefixed with `/api`. Full OpenAPI spec: `lib/api-spec/openapi.yaml`.

### Public endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/healthz` | Health check — returns `{ status: "ok" }` |
| `GET` | `/videos` | Latest YouTube channel videos (cached 10 min) |
| `GET` | `/courses` | Published courses. Supports `?search=` and `?category=` |
| `GET` | `/courses/:id` | Single course with lesson list |
| `GET` | `/courses/:courseId/lessons` | Published lessons for a course |
| `GET` | `/courses/:courseId/lessons/:id` | Lesson detail — free lessons open, premium requires subscription |

### Authenticated (any signed-in user)

| Method | Path | Description |
|---|---|---|
| `GET` | `/users/me` | Own profile + subscription info |
| `PATCH` | `/users/me` | Update own name and bio |
| `GET` | `/subscriptions/me` | Own subscription status and plan |
| `POST` | `/subscriptions/checkout` | Generate eSewa payment form data. Body: `{ plan: "monthly" \| "yearly" }` |
| `POST` | `/subscriptions/verify` | Verify eSewa payment and activate subscription |
| `GET` | `/progress` | Own lesson completion status |
| `POST` | `/progress/:lessonId` | Mark lesson complete/incomplete. Body: `{ completed: true \| false }` |
| `GET` | `/dashboard/summary` | Stats: courses, lessons, subscription status |
| `GET` | `/dashboard/continue-watching` | Recently accessed lessons |
| `GET` | `/dashboard/download-history` | Download history |

### Subscriber-only

| Method | Path | Description |
|---|---|---|
| `GET` | `/resources` | List all downloadable resources |
| `GET` | `/resources/:id` | Get resource with download URL |
| `POST` | `/resources/:id/download` | Log a download |

### Admin-only

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/stats` | Platform stats (users, subscriptions, revenue) |
| `GET` | `/admin/users` | All users with subscription status |
| `GET` | `/admin/subscriptions` | All subscriptions with user info |
| `PATCH` | `/admin/users/:clerkId/role` | Change user role (`user` or `admin`) |
| `POST` | `/courses` | Create a course |
| `PATCH` | `/courses/:id` | Update a course |
| `DELETE` | `/courses/:id` | Delete a course |
| `POST` | `/courses/:courseId/lessons` | Add a lesson |
| `PATCH` | `/courses/:courseId/lessons/:id` | Update a lesson |
| `DELETE` | `/courses/:courseId/lessons/:id` | Delete a lesson |
| `POST` | `/resources` | Add a resource |
| `PATCH` | `/resources/:id` | Update a resource |
| `DELETE` | `/resources/:id` | Delete a resource |

### Webhooks (Clerk → DB sync)

| Method | Path | Description |
|---|---|---|
| `POST` | `/webhooks/clerk` | Receives Clerk user events. Verified with Svix signature. |

---

## Database Schema

All tables are in `lib/db/src/schema/`. Managed with Drizzle ORM.

| Table | Purpose |
|---|---|
| `users` | Synced from Clerk. Stores email, name, avatar, role. |
| `courses` | Course catalog with category, thumbnail, published status. |
| `lessons` | Lessons inside courses. YouTube video ID, free/premium flag, sort order. |
| `resources` | Downloadable files (PDF notes, grammar charts). Subscriber-only. |
| `subscriptions` | eSewa subscription per user: status, plan, expiry date. |
| `progress` | Per-user lesson completion and last-accessed timestamps. |
| `downloads` | Log of every resource download per user. |

### Push schema to database

```powershell
pnpm --filter @workspace/db run push
```

> Run this once after cloning (local dev) and after any schema changes.

---

## Key Development Commands

```powershell
# Install all dependencies
pnpm install

# Start the API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Start the frontend (port 3000)
pnpm --filter @workspace/learn run dev

# Full TypeScript check across all packages
pnpm run typecheck

# Push database schema changes
pnpm --filter @workspace/db run push

# Regenerate API hooks after editing openapi.yaml
pnpm --filter @workspace/api-spec run codegen
```

> **Never run `pnpm dev` at the workspace root** — there is no root dev script by design.

---

## Architecture Decisions

**Contract-first API:** `lib/api-spec/openapi.yaml` is the single source of truth. Zod schemas and React Query hooks are generated from it with Orval. Never hand-write API types.

**Clerk auth proxy (production):** Clerk requests are proxied through the Express server (`/api/__clerk`) in production, but this proxy is disabled for development instances (dev keys). Do not set `VITE_CLERK_PROXY_URL` in local development.

**Clerk webhook sync:** User data is pushed to the database by Clerk webhooks (`user.created`, `user.updated`, `user.deleted`). The `ensureUser` middleware is a fallback for cases where the webhook has not fired yet.

**eSewa redirect-based payments:** No webhook from eSewa — the payment result arrives as a base64-encoded query parameter when eSewa redirects the user back. The server calls eSewa's status API independently to verify every transaction before activating a subscription.

**Payment security:** The server validates that the `total_amount` in the eSewa payload matches the expected price for the requested plan, preventing a user from paying for a monthly plan and claiming a yearly subscription.

**HTTP security headers:** Helmet is applied to every API response, setting CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and removing `X-Powered-By`.

**Subscription expiry:** eSewa does not support automatic recurring billing. Subscriptions are one-time payments valid for 1 month or 1 year. The server auto-marks subscriptions inactive on the next `/api/subscriptions/me` call after `currentPeriodEnd` passes.
#   k c c l a s s b h w  
 