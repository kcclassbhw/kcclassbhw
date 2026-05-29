# KC Class BHW — Setup & Deployment Guide

A subscription-based B.Ed English learning platform. Students pay via eSewa (monthly NPR 299 / yearly NPR 2,399) to access all lessons, PDF notes, and downloadable resources.

---

## ⚡ Quick Start (Local — 5 Steps)

```powershell
# 1. Install all dependencies (one time only)
pnpm install

# 2. Create your .env files
copy artifacts\learn\.env.example       artifacts\learn\.env
copy artifacts\api-server\.env.example  artifacts\api-server\.env
# → Open both files and fill in the keys (see Section 2 below)

# 3. Push the database tables to Neon
pnpm --filter @workspace/db run push

# 4. Start both servers
# VSCode: Ctrl+Shift+P → "Tasks: Run Task" → "Start Both (Full Stack)"
# Or two terminals:
pnpm --filter @workspace/api-server run dev   # Terminal 1 — API on port 8080
pnpm --filter @workspace/learn run dev         # Terminal 2 — App on port 3000

# 5. Open in browser
start http://localhost:3000
```

---

## Table of Contents

1. [What You Need](#1-what-you-need)
2. [Local Setup](#2-local-setup)
3. [Test Locally — What to Verify](#3-test-locally--what-to-verify)
4. [Deploy to Production](#4-deploy-to-production)
5. [After Deployment](#5-after-deployment)
6. [Daily Operations](#6-daily-operations)
7. [Environment Variable Reference](#7-environment-variable-reference)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. What You Need

### On your machine

| Tool | Version | Check | Install |
|---|---|---|---|
| **Node.js** | 22 LTS | `node --version` | https://nodejs.org → LTS |
| **pnpm** | 10+ | `pnpm --version` | `npm install -g pnpm` |
| **Git** | Any | `git --version` | https://git-scm.com |
| **VSCode** | Any | — | https://code.visualstudio.com |

After installing pnpm, **close and reopen your terminal** so it is on the PATH.

### Accounts to create (all free)

| Service | Purpose | Sign up |
|---|---|---|
| **Clerk** | User authentication (sign-up, login, Google) | https://dashboard.clerk.com |
| **Neon** | Cloud PostgreSQL database | https://neon.tech |
| **Render** | Hosts the API server | https://render.com |
| **Vercel** | Hosts the React frontend | https://vercel.com |

eSewa merchant account is only needed for real payments — sandbox works without it.

### Keys you need before starting

**From Clerk** (`dashboard.clerk.com` → API Keys):
- Publishable key — starts with `pk_test_...`
- Secret key — starts with `sk_test_...`

**From Neon** (`neon.tech` → your project → Connect):
- Connection string — looks like `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`

---

## 2. Local Setup

### Step 1 — Clone the repository

```powershell
git clone https://github.com/YOUR-USERNAME/KC-Class.git
cd KC-Class
code .
```

When VSCode opens, click **Install All** when prompted to install recommended extensions (Tailwind, Prettier, SQLTools, etc.).

### Step 2 — Install dependencies

```powershell
pnpm install
```

Installs everything in one command (~1–3 minutes on first run).

### Step 3 — Create the environment files

```powershell
copy artifacts\learn\.env.example       artifacts\learn\.env
copy artifacts\api-server\.env.example  artifacts\api-server\.env
```

### Step 4 — Fill in `artifacts\learn\.env`

Open the file and replace the placeholders:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_PASTE_YOUR_KEY_HERE
VITE_API_URL=http://localhost:8080
PORT=3000
BASE_PATH=/
```

> **Do NOT add `VITE_CLERK_PROXY_URL`** — this crashes the app in local dev.

### Step 5 — Fill in `artifacts\api-server\.env`

Open the file and replace the placeholders:

```env
PORT=8080
NODE_ENV=development
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
CLERK_PUBLISHABLE_KEY=pk_test_PASTE_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_PASTE_YOUR_SECRET_HERE
```

Both `.env` files must have the **same** `pk_test_...` publishable key.

> Everything else (`CORS_ORIGIN`, `FRONTEND_URL`, `ESEWA_*`, `CLERK_WEBHOOK_SECRET`) is for production only — leave it commented out in local dev.

### Step 6 — Push the database schema

Creates all tables (users, courses, lessons, subscriptions, progress, resources, downloads):

```powershell
pnpm --filter @workspace/db run push
```

If it hangs waiting for confirmation, type `y` and press Enter. Or use the no-prompt variant:

```powershell
pnpm --filter @workspace/db run push-force
```

The database comes pre-seeded with 4 demo courses, 12 demo lessons, and 6 demo resources.

### Step 7 — Start the servers

**Option A — One click (recommended):**
- `Ctrl+Shift+P` → **Tasks: Run Task** → **Start Both (Full Stack)**

**Option B — Two terminals:**

```powershell
# Terminal 1 — wait for: "Server listening" on port 8080
pnpm --filter @workspace/api-server run dev

# Terminal 2 — wait for: "Local: http://localhost:3000/"
pnpm --filter @workspace/learn run dev
```

### Step 8 — Make yourself admin

After signing up on the site, promote your account to admin via the Neon SQL Editor:

1. Go to https://neon.tech → your project → **SQL Editor**
2. Run:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

3. Refresh the page — the **Admin** link appears in the navigation bar.

---

## 3. Test Locally — What to Verify

Work through this list before deploying. Each item confirms a different part of the platform.

### ✅ Basic app

- [ ] http://localhost:3000 loads the landing page
- [ ] http://localhost:3000/courses shows the 4 demo courses
- [ ] Clicking a course opens the course detail page with lessons listed
- [ ] A free preview lesson plays (YouTube embed loads)

### ✅ Authentication

- [ ] **Sign Up** creates an account (Clerk modal opens)
- [ ] After signing up, you are redirected to `/dashboard`
- [ ] **Sign Out** works (header shows Sign In again)
- [ ] **Sign In** with the same account works

### ✅ API server

- [ ] http://localhost:8080/api/healthz returns `{"status":"ok"}`
- [ ] After signing in, http://localhost:3000/dashboard shows your stats

### ✅ Admin panel

- [ ] `/admin` is accessible after promoting yourself to admin (Step 8)
- [ ] `/admin/courses` shows the demo courses
- [ ] **New Course** → fill in the form → course appears in the list
- [ ] **Manage Lessons** → **Add Lesson** → add a YouTube video ID → lesson appears

### ✅ Subscription flow (sandbox eSewa)

- [ ] `/pricing` shows the two subscription plans
- [ ] **Pay Monthly** redirects to eSewa sandbox (`rc-epay.esewa.com.np`)
- [ ] Log in with test credentials: ID `9806800001`, MPIN `1122`, Password `Nepal@123`
- [ ] Complete payment → redirected back → `/dashboard` shows **Active Subscription**
- [ ] A premium lesson now plays without restriction
- [ ] `/resources` is accessible and shows downloadable files

### ✅ Videos page

- [ ] `/videos` loads and shows YouTube videos from the channel

Once all boxes are ticked, you are ready to deploy.

---

## 4. Deploy to Production

**Deploy in this exact order:**

```
A → Get production Clerk keys
B → Deploy API on Render
C → Deploy frontend on Vercel
D → Connect Render and Vercel
E → Set up Clerk webhook
F → Verify
```

### Part A — Switch Clerk to production keys

1. https://dashboard.clerk.com → your app → **API Keys**
2. Toggle **Development → Production** at the top of the page
3. Copy and save your new keys:
   - Publishable key — now starts with `pk_live_...`
   - Secret key — now starts with `sk_live_...`

> You will add the Clerk webhook after Part B when you have the Render URL.

### Part B — Deploy API server on Render

1. https://render.com → **New +** → **Web Service**
2. Connect GitHub → select your **KC-Class** repository → **Connect**

#### Service settings

| Field | Value |
|---|---|
| **Name** | `kc-class-api` |
| **Region** | Singapore |
| **Branch** | `main` |
| **Root Directory** | *(leave blank)* |
| **Runtime** | Node |
| **Build Command** | `pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server run build` |
| **Start Command** | `node --enable-source-maps ./artifacts/api-server/dist/index.mjs` |
| **Instance Type** | Free |

#### Environment variables to add now

Click **Environment** → add these:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PNPM_VERSION` | `10.26.1` |
| `DATABASE_URL` | Your Neon connection string |
| `CLERK_PUBLISHABLE_KEY` | `pk_live_...` from Part A |
| `CLERK_SECRET_KEY` | `sk_live_...` from Part A |
| `ESEWA_MONTHLY_PRICE` | `299` |
| `ESEWA_YEARLY_PRICE` | `2399` |
| `YOUTUBE_CHANNEL_ID` | Your YouTube channel ID (starts with `UC...`) |

> Leave `CORS_ORIGIN`, `FRONTEND_URL`, and `CLERK_WEBHOOK_SECRET` blank for now — you'll add them after Part C.

Click **Create Web Service**. First build takes 3–5 minutes.

**Confirm it's working:**
```
https://YOUR-RENDER-URL.onrender.com/api/healthz
```
Must return `{"status":"ok"}` before continuing.

Copy your Render URL (e.g. `https://kc-class-api.onrender.com`) — you need it in Part C.

### Part C — Deploy frontend on Vercel

1. https://vercel.com → **Add New Project** → **Import Git Repository** → select **KC-Class**
2. Configure:

| Field | Value |
|---|---|
| **Framework Preset** | Vite |
| **Root Directory** | `artifacts/learn` |
| **Build Command** | `pnpm run build` |
| **Output Directory** | `dist/public` |
| **Install Command** | `cd ../.. && pnpm install --frozen-lockfile` |

3. Click **Environment Variables** → add:

| Variable | Value |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_...` from Part A |
| `VITE_API_URL` | Your Render URL from Part B (e.g. `https://kc-class-api.onrender.com`) |
| `BASE_PATH` | `/` |

4. Click **Deploy**. Build takes 1–2 minutes.
5. Your frontend URL is shown after deploy (e.g. `https://kc-class.vercel.app`)

Copy your Vercel URL — you need it in Part D.

> SPA routing is handled automatically — `artifacts/learn/vercel.json` tells Vercel to redirect all paths to `index.html`, so refreshing on `/courses` or deep-linking works.

### Part D — Connect Render and Vercel

Go back to your **Render Web Service** → **Environment** → add:

| Variable | Value |
|---|---|
| `CORS_ORIGIN` | Your Vercel URL (e.g. `https://kc-class.vercel.app`) |
| `FRONTEND_URL` | Same Vercel URL, **no trailing slash** |

Click **Save Changes** — Render redeploys automatically.

### Part E — Set up the Clerk webhook

This syncs new sign-ups to your database instantly.

1. https://dashboard.clerk.com → **Webhooks** → **Add Endpoint**
2. Set:
   - **URL:** `https://YOUR-RENDER-URL.onrender.com/api/webhooks/clerk`
   - **Events:** check `user.created`, `user.updated`, `user.deleted`
3. Click **Create Endpoint** → copy the **Signing Secret** (`whsec_...`)
4. Go to Render → **Environment** → add:

| Variable | Value |
|---|---|
| `CLERK_WEBHOOK_SECRET` | `whsec_...` from above |

5. Click **Save Changes**.

### Part F — Verify the deployment

Open your **Vercel URL** in a **private / incognito** browser window and go through this checklist:

- [ ] Landing page loads with no console errors (`F12` → Console)
- [ ] Course catalog loads
- [ ] **Sign Up** works — you land on `/dashboard`
- [ ] Check Render logs (`Logs` tab) — you should see `user.created` webhook fired
- [ ] `/pricing` shows the subscription plans
- [ ] **Pay Monthly** redirects to eSewa sandbox — test with credentials: ID `9806800001`, MPIN `1122`, Password `Nepal@123`
- [ ] After payment → back on your Vercel site → **Active Subscription** shows on dashboard
- [ ] A premium lesson plays
- [ ] `/resources` is accessible

If all boxes are ticked, your deployment is complete.

---

## 5. After Deployment

### 5.1 Promote yourself to admin on the live site

Sign up on the Vercel site first, then:

```sql
-- Run in Neon SQL Editor (neon.tech → your project → SQL Editor)
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

Sign out and back in — the Admin link appears.

### 5.2 Enable real eSewa payments

> Skip until your eSewa merchant account is approved. Sandbox mode is fully functional.

Once approved, add these to Render → Environment:

| Variable | Value |
|---|---|
| `ESEWA_PRODUCT_CODE` | Your eSewa merchant code |
| `ESEWA_SECRET_KEY` | Your eSewa HMAC secret key |
| `ESEWA_MONTHLY_PRICE` | `299` (or your chosen NPR amount) |
| `ESEWA_YEARLY_PRICE` | `2399` (or your chosen NPR amount) |
| `ESEWA_ENV` | `production` |

Click **Save Changes**. Make one real test payment to confirm.

### 5.3 Add your actual course content

The demo seed data (4 courses, 12 lessons, 6 resources) can be deleted or left as-is.

**Add a course:** Vercel site → `/admin/courses` → **New Course**

**Add lessons to a course:** `/admin/courses` → **Manage Lessons** → **Add Lesson**

| Field | What to enter |
|---|---|
| Title | Lesson name |
| YouTube Video ID | From `https://youtube.com/watch?v=`**`THIS_PART`** |
| Duration | In minutes |
| Sort Order | 1 = first lesson |
| Free Preview | Toggle on for 1–2 lessons per course |
| Published | Toggle on to make it visible |

> **For premium lessons:** Set the YouTube video to **Unlisted** before copying the ID. Unlisted videos do not appear in YouTube search.

**Add resources:** `/admin` → Resources → **Add Resource** — paste a direct download URL (Google Drive, Dropbox, etc.).

### 5.4 Connect a custom domain (optional)

**Frontend on Vercel:**
1. Vercel project → **Settings** → **Domains** → **Add** → enter `kcclassbhw.com`
2. Add the DNS records Vercel shows you at your domain registrar

**API on Render:**
1. Render → **Settings** → **Custom Domains** → add `api.kcclassbhw.com`
2. Follow Render's DNS instructions

**After adding custom domains, update on Render:**

| Variable | New value |
|---|---|
| `CORS_ORIGIN` | `https://kcclassbhw.com` |
| `FRONTEND_URL` | `https://kcclassbhw.com` |

---

## 6. Daily Operations

### Start the servers each day

```powershell
# Option A — one click
Ctrl+Shift+P → Tasks: Run Task → Start Both (Full Stack)

# Option B — two terminals
pnpm --filter @workspace/api-server run dev   # API server on port 8080
pnpm --filter @workspace/learn run dev         # Frontend on port 3000
```

Open http://localhost:3000.

### Deploy code changes

Push to `main` on GitHub — both Render and Vercel rebuild automatically.

| Service | What rebuilds | Time |
|---|---|---|
| Render | API server | ~3 min |
| Vercel | Frontend | ~1 min |

> **If you changed the database schema** (`lib/db/src/schema/`), run the push after the new code is deployed:
> ```powershell
> $env:DATABASE_URL="postgresql://...your neon string..."
> pnpm --filter @workspace/db run push
> ```

---

## 7. Environment Variable Reference

### API server — `artifacts/api-server/.env`

| Variable | Local dev | Production (Render) | Default |
|---|---|---|---|
| `PORT` | `8080` | Set by Render automatically | — |
| `NODE_ENV` | `development` | `production` | — |
| `DATABASE_URL` | Your Neon string | Your Neon string | — |
| `CLERK_PUBLISHABLE_KEY` | `pk_test_...` | `pk_live_...` | — |
| `CLERK_SECRET_KEY` | `sk_test_...` | `sk_live_...` | — |
| `CLERK_WEBHOOK_SECRET` | *(omit)* | `whsec_...` from Clerk webhook | — |
| `CORS_ORIGIN` | *(omit — all origins allowed)* | `https://your-app.vercel.app` | All origins |
| `FRONTEND_URL` | *(omit)* | `https://your-app.vercel.app` | `http://localhost:3000` |
| `YOUTUBE_CHANNEL_ID` | *(omit — uses default)* | Your channel ID (`UC...`) | KC Class BHW channel |
| `ESEWA_MONTHLY_PRICE` | *(omit)* | `299` | `299` |
| `ESEWA_YEARLY_PRICE` | *(omit)* | `2399` | `2399` |
| `ESEWA_PRODUCT_CODE` | *(omit — sandbox)* | Your eSewa merchant code | `EPAYTEST` |
| `ESEWA_SECRET_KEY` | *(omit — sandbox)* | Your eSewa HMAC key | eSewa test key |
| `ESEWA_ENV` | *(omit)* | `production` (when live) | sandbox |
| `PNPM_VERSION` | *(not needed)* | `10.26.1` | — |

### Frontend — `artifacts/learn/.env`

| Variable | Local dev | Production (Vercel) |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | `pk_live_...` |
| `VITE_API_URL` | `http://localhost:8080` | `https://your-api.onrender.com` |
| `PORT` | `3000` | *(not used — Vercel handles this)* |
| `BASE_PATH` | `/` | `/` |

---

## 8. Troubleshooting

### Local development

**`pnpm` is not recognized**
Close VSCode completely and reopen it. If still missing: `npm install -g pnpm` in PowerShell, then reopen.

**Blank white page at localhost:3000**
Open `F12` → Console:
- "Missing VITE_CLERK_PUBLISHABLE_KEY" → `artifacts\learn\.env` is missing or still has a placeholder
- Network error (red API calls) → API server isn't running yet; wait for `Server listening on port 8080`

**`Error: DATABASE_URL is not set`**
`artifacts\api-server\.env` doesn't exist or `DATABASE_URL` is still `REPLACE_WITH_YOUR_CONNECTION_STRING`.

**`SSL SYSCALL error` or `unable to get local issuer certificate`**
Windows SSL issue with Neon. Make sure your connection string ends with `?sslmode=require`. The app handles the rest automatically.

**`Failed to load Clerk JS` in browser console**
You have `VITE_CLERK_PROXY_URL=...` in `artifacts\learn\.env`. Delete that entire line — it only works with production keys on a custom domain.

**Sign-in doesn't work**
The `VITE_CLERK_PUBLISHABLE_KEY` in `artifacts\learn\.env` and `CLERK_PUBLISHABLE_KEY` in `artifacts\api-server\.env` must be **exactly the same** `pk_test_...` value.

**Drizzle push hangs**
It is waiting for a Y/N prompt. Type `y` + Enter. Or use:
```powershell
pnpm --filter @workspace/db run push-force
```

**TypeScript errors in VSCode but `pnpm run typecheck` passes**
`Ctrl+Shift+P` → **TypeScript: Select TypeScript Version** → **Use Workspace Version**.

**`Cannot find module '@workspace/db'`**
Run `pnpm install` again — a symlink may have been lost.

**`/admin` shows "Access denied"**
You haven't promoted your account yet. Run in Neon SQL Editor:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

---

### Production / deployment

**Render build fails with "pnpm: command not found"**
Add `PNPM_VERSION=10.26.1` to Render environment variables.

**Render build fails with any other error**
Check the Build Command is exactly:
```
pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server run build
```
And Start Command:
```
node --enable-source-maps ./artifacts/api-server/dist/index.mjs
```

**`/api/healthz` returns 502 or times out**
Render is still cold-starting (~30 seconds on free plan). Wait and retry.

**Sign-in page crashes on Vercel**
`VITE_CLERK_PUBLISHABLE_KEY` on Vercel must be a `pk_live_...` key (not `pk_test_`). Switch Clerk to Production mode first.

**Courses don't load — API calls fail (404 or CORS error)**
- Check `VITE_API_URL` on Vercel matches your exact Render URL with `https://` and no trailing slash
- Check `CORS_ORIGIN` on Render matches your exact Vercel URL

**eSewa payment redirects to the wrong place**
Check `FRONTEND_URL` on Render — it must be your Vercel URL with no trailing slash.

**New sign-ups don't appear in the database**
The Clerk webhook is not set up or the secret is wrong. Check:
1. The webhook URL in Clerk matches your Render URL exactly
2. `CLERK_WEBHOOK_SECRET` on Render matches the `whsec_...` from Clerk

**Videos page is empty**
Set `YOUTUBE_CHANNEL_ID` on Render to your channel ID (starts with `UC...`). Without it, the app uses the default KC Class BHW channel.

**Render is slow on the first request (~30 seconds)**
Expected on the free plan — the server sleeps after 15 minutes of inactivity. Upgrade to the $7/month paid plan for always-on.

---

## Project Structure (for reference)

```
KC-Class/
├── artifacts/
│   ├── api-server/          Express API server
│   │   ├── src/routes/      Route handlers
│   │   ├── .env             Your local config  ← YOU CREATE THIS
│   │   └── .env.example     Template
│   └── learn/               React frontend
│       ├── src/pages/       All pages
│       ├── src/components/  Shared UI
│       ├── vercel.json      SPA routing (all paths → index.html)
│       ├── .env             Your local config  ← YOU CREATE THIS
│       └── .env.example     Template
├── lib/
│   ├── db/src/schema/       Database tables (Drizzle ORM)
│   ├── api-spec/            OpenAPI spec (source of truth for API)
│   ├── api-zod/             Auto-generated Zod schemas — do not edit
│   └── api-client-react/    Auto-generated React Query hooks — do not edit
├── .vscode/tasks.json       VSCode tasks (Start Both, Push DB, Typecheck)
└── DOCS.md                  This file
```

### Useful commands

| Command | What it does |
|---|---|
| `pnpm install` | Install all dependencies |
| `pnpm --filter @workspace/api-server run dev` | Start API server (port 8080) |
| `pnpm --filter @workspace/learn run dev` | Start frontend (port 3000) |
| `pnpm --filter @workspace/db run push` | Apply schema to database |
| `pnpm --filter @workspace/db run push-force` | Same — skips Y/N prompt |
| `pnpm run typecheck` | Full TypeScript check |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API hooks (after editing `openapi.yaml`) |

### Admin URLs

| URL | Purpose |
|---|---|
| `/admin` | Stats, users, subscriptions |
| `/admin/courses` | Course management |
| `/admin/courses/:id/lessons` | Lesson management |
| `/pricing` | Subscription plans (what students see) |
| `/dashboard` | Student dashboard |
| `/resources` | Resource vault |
| `/videos` | YouTube channel auto-sync |
