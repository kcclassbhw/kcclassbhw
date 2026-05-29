# KC Class BHW — Complete Documentation

**KC Class BHW** is a subscription-based B.Ed English learning platform for Nepal. YouTube creators sell premium courses, lessons, PDF notes, and downloadable resources to students via monthly or yearly eSewa subscriptions.

This document covers everything from first setup to going live with real payments. Work through the sections in order.

---

## Table of Contents

1. [What You're Building](#1-what-youre-building)
2. [Before You Start — Tools and Accounts](#2-before-you-start--tools-and-accounts)
3. [Local Development (Windows 11)](#3-local-development-windows-11)
4. [Deploy to Production](#4-deploy-to-production)
5. [Go Live — Payments, Admin, Content](#5-go-live--payments-admin-content)
6. [Daily Workflow](#6-daily-workflow)
7. [Reference](#7-reference)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. What You're Building

### How it works for students

| Page | Who can access |
|---|---|
| Landing page, course catalog, pricing | Everyone (no account needed) |
| 1–2 free preview lessons per course | Everyone |
| All full lessons | Signed-in students with an active subscription |
| PDF notes and resource vault | Subscribers only |
| Progress tracking, dashboard | Signed-in students |

### How it works for you (the admin)

- Students sign up with Clerk (Google login or email/password)
- They subscribe by paying via eSewa (Nepal's leading digital wallet)
- You manage courses, lessons, and resources at `/admin`
- New YouTube videos appear on the `/videos` page automatically

### Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 7 + Tailwind CSS v4 + shadcn/ui |
| Routing | wouter |
| Backend | Express 5 + Node.js 22 |
| Database | PostgreSQL 15 via Neon (cloud-hosted) |
| ORM | Drizzle ORM |
| Authentication | Clerk |
| Payments | eSewa v2 |
| Language | TypeScript 5.9 |
| Monorepo | pnpm workspaces |

### Project structure

```
KC-Class/
├── artifacts/
│   ├── api-server/          Express API server (port 8080)
│   │   ├── src/routes/      Route handlers (courses, subscriptions, etc.)
│   │   ├── .env             Your local server config  ← YOU CREATE THIS
│   │   └── .env.example     Template to copy from
│   └── learn/               React frontend (Vite, port 3000)
│       ├── src/pages/       All page components
│       ├── src/components/  Shared UI components
│       ├── .env             Your local frontend config  ← YOU CREATE THIS
│       └── .env.example     Template to copy from
├── lib/
│   ├── db/                  PostgreSQL schema (Drizzle ORM)
│   ├── api-spec/            OpenAPI spec — source of truth for the API
│   ├── api-zod/             Auto-generated Zod validation schemas
│   └── api-client-react/    Auto-generated React Query hooks
├── scripts/                 Utility scripts
├── vercel.json              Vercel SPA routing config
├── netlify.toml             Netlify build config
└── DOCS.md                  This file
```

---

## 2. Before You Start — Tools and Accounts

### 2.1 Tools to install on your machine

| Tool | Minimum version | How to check | Install |
|---|---|---|---|
| **Node.js** | 22.x LTS | `node --version` | https://nodejs.org → download LTS |
| **pnpm** | 10.x | `pnpm --version` | `npm install -g pnpm` |
| **Git** | Any | `git --version` | https://git-scm.com/downloads |
| **VSCode** | Any | — | https://code.visualstudio.com |

After installing pnpm, **close and reopen** your terminal so it is on the PATH.

When you open the project in VSCode, it will offer to install recommended extensions — click **Install All**. This adds Tailwind autocomplete, Prettier, ESLint, SQLTools, and GitLens.

### 2.2 Accounts to create (all free)

#### GitHub
Host the code. Render and Vercel connect to GitHub to deploy automatically.
- https://github.com → **Sign up** → fork or push the KC-Class repo to your account

#### Clerk — User authentication
Handles sign-up, sign-in, and social login. No sessions or passwords to manage.

1. Go to https://dashboard.clerk.com → **Sign up**
2. **Create application** → name it `KC Class BHW` → **Create**
3. Click **API Keys** in the sidebar
4. Copy and save both keys — you will need them later:
   - **Publishable key** — starts with `pk_test_...`
   - **Secret key** — starts with `sk_test_...`

> **Development vs production keys:** Use `pk_test_` / `sk_test_` for local development. Before deploying to production, switch to `pk_live_` / `sk_live_` by toggling **Development → Production** at the top of the API Keys page in the Clerk dashboard.

#### Neon — PostgreSQL database
Cloud PostgreSQL — no local database to install.

1. Go to https://neon.tech → **Sign up** (free, no credit card)
2. Click **New Project** → name it `kc-class` → region: **Singapore** (closest to Nepal) → **Create**
3. Click **Connect** → copy the **Connection String**:
   ```
   postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Save this string — it is your `DATABASE_URL`

> **One database for everything:** Use the same Neon connection string for both local development and production. You do not need two separate databases.

#### Render — API server hosting
Runs the Express backend in the cloud.
- https://render.com → **Get Started** → sign up with GitHub
- No further setup needed now — you configure a service during deployment (Part 4)

> **Free tier note:** The free plan sleeps after 15 minutes of inactivity. The first request after sleep takes ~30 seconds. For always-on service, upgrade to the paid plan ($7/month).

#### Vercel — Frontend hosting (or Netlify, your choice)
Hosts the React frontend. Builds and deploys automatically on every git push.
- https://vercel.com → **Sign Up** → sign up with GitHub
- No further setup needed now

**Alternative:** If you prefer Netlify, use https://netlify.com instead. The repo includes `netlify.toml` so no manual build config is needed. You only need one of Vercel or Netlify — not both.

#### eSewa merchant account — for live payments only
Not needed for local development. The platform runs in eSewa sandbox (test) mode by default.

When you are ready to accept real NPR payments:
- Apply at https://esewa.com.np/epay/merchant
- eSewa will give you a **Merchant Code** and a **Secret Key**

---

## 3. Local Development (Windows 11)

**Time to complete:** 20–30 minutes on first setup.

### Step 1 — Clone the repository

Open PowerShell or Windows Terminal:

```powershell
git clone https://github.com/YOUR-USERNAME/KC-Class.git
cd KC-Class
code .
```

When VSCode opens, click **Install All** when prompted to install recommended extensions.

### Step 2 — Install dependencies

In the VSCode integrated terminal (`Ctrl+` `` ` ``):

```powershell
pnpm install
```

This installs all packages for the frontend, API server, database layer, and shared libraries in one command. Expect 1–3 minutes on first run.

### Step 3 — Create environment files

Copy both template files:

```powershell
copy artifacts\learn\.env.example       artifacts\learn\.env
copy artifacts\api-server\.env.example  artifacts\api-server\.env
```

Or in File Explorer: right-click each `.env.example` → Copy → Paste in the same folder → rename to `.env`.

> **Important:** Both files still have placeholder values. Steps 4 and 5 walk you through filling them in. Do not start the servers until all placeholders are replaced.

### Step 4 — Fill in the frontend env file

Open `artifacts\learn\.env` in VSCode and fill it in:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_PASTE_YOUR_KEY_HERE
VITE_API_URL=http://localhost:8080
PORT=3000
BASE_PATH=/
```

- `VITE_CLERK_PUBLISHABLE_KEY` — the **Publishable key** you copied from the Clerk dashboard (step 2.2)
- `VITE_API_URL` — leave as `http://localhost:8080` for local dev
- `PORT` — leave as `3000`
- `BASE_PATH` — leave as `/`

> **Do not add `VITE_CLERK_PROXY_URL`** in local development. This setting only works with production Clerk keys on a custom domain. Adding it with development keys crashes the app with "Failed to load Clerk JS".

### Step 5 — Fill in the API server env file

Open `artifacts\api-server\.env` in VSCode and fill it in:

```env
PORT=8080
NODE_ENV=development
DATABASE_URL=postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
CLERK_PUBLISHABLE_KEY=pk_test_PASTE_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_PASTE_YOUR_SECRET_KEY_HERE
```

- `DATABASE_URL` — the Neon connection string you copied in section 2.2
- `CLERK_PUBLISHABLE_KEY` — **same value** as in the frontend `.env`
- `CLERK_SECRET_KEY` — the **Secret key** from the Clerk dashboard

The remaining variables (`CORS_ORIGIN`, `FRONTEND_URL`, `ESEWA_*`, `CLERK_WEBHOOK_SECRET`) are only needed for production and can be left out of your local `.env`.

### Step 6 — Create the database tables

Run this once to create all tables (users, courses, lessons, subscriptions, progress, resources, downloads):

```powershell
pnpm --filter @workspace/db run push
```

Drizzle reads your `DATABASE_URL` from `artifacts\api-server\.env`, connects to Neon, and creates the tables.

**Expected output:**
```
[✓] Pulling schema from database...
[✓] Changes applied
```

If Drizzle asks `? Do you want to apply the changes? › (y/N)` — type `y` and press Enter.

If the interactive prompt hangs, use the force variant instead:
```powershell
pnpm --filter @workspace/db run push-force
```

The database comes pre-seeded with 4 demo courses, 12 demo lessons, and 6 demo resources.

### Step 7 — Start the servers

You need two servers running simultaneously — the API and the frontend.

**Option A — One click (recommended):**
- Press `Ctrl+Shift+P` → `Tasks: Run Task` → **Start Both (Full Stack)**

**Option B — Two terminals:**

Terminal 1 — API server:
```powershell
pnpm --filter @workspace/api-server run dev
```
Wait for: `"msg":"Server listening","port":8080`

Terminal 2 (click `+` to open a new terminal) — Frontend:
```powershell
pnpm --filter @workspace/learn run dev
```
Wait for: `➜  Local:   http://localhost:3000/`

### Step 8 — Open the app

Go to http://localhost:3000 in Chrome or Edge.

You should see the KC Class BHW landing page. Click **Sign Up** to create your first account using Clerk.

### Step 9 — Make yourself admin

After creating your account on the site, promote it to admin:

**Using the Neon SQL Editor (simplest):**
1. Go to https://neon.tech → open your project → **SQL Editor**
2. Run:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
   ```
3. Refresh the page in your browser — the **Admin** link appears in the nav bar

**Using VSCode SQLTools:**
1. `Ctrl+Shift+P` → **SQLTools: New Connection** → PostgreSQL
2. Enter your Neon connection details → **Test Connection** → **Save**
3. Run:
   ```sql
   SELECT clerk_id, email, role FROM users;
   -- Find your row, copy the clerk_id, then:
   UPDATE users SET role = 'admin' WHERE clerk_id = 'user_PASTE_YOUR_ID_HERE';
   ```

### Step 10 — Add your first course

Go to http://localhost:3000/admin/courses → **New Course**:

- **Title** — e.g. `B.Ed English Grammar — Complete`
- **Description** — what students will learn
- **Category** — Grammar, Pedagogy, Phonetics, or Literature
- **Thumbnail URL** — any direct image URL
- **Published** — toggle on to make it visible

Then click **Manage Lessons** → **Add Lesson**:

| Field | What to enter |
|---|---|
| Title | Lesson name |
| YouTube Video ID | From `https://youtube.com/watch?v=`**`dQw4w9WgXcQ`** — the part after `?v=` |
| Duration (minutes) | Shown in the lesson list |
| Sort Order | 1 = first lesson, 2 = second, etc. |
| Free Preview | Toggle on for 1–2 lessons so students can try before subscribing |
| Published | Toggle on to make the lesson visible |

> **For premium lessons:** Set the YouTube video to **Unlisted** before copying the ID. Unlisted videos don't appear in YouTube search or on your channel — only your website has the link.

---

## 4. Deploy to Production

**Deploy in this order — each step depends on the previous one:**

```
Part A — Switch Clerk to production keys
    ↓
Part B — Push database schema to Neon
    ↓
Part C — Deploy API server on Render
    ↓
Part D — Deploy frontend on Vercel (or Netlify)
    ↓
Part E — Finish Render config (CORS + Clerk webhook)
    ↓
Part F — Verify everything works
```

### Part A — Get production Clerk keys

1. Go to https://dashboard.clerk.com → open your app
2. Click **API Keys** → at the top, switch the toggle from **Development** to **Production**
3. Copy and save:
   - **Publishable key** — now starts with `pk_live_...`
   - **Secret key** — now starts with `sk_live_...`
4. In the Clerk sidebar, click **Webhooks** → **Add Endpoint**:
   - URL: `https://YOUR-RENDER-URL.onrender.com/api/webhooks/clerk`
   - Events: check `user.created`, `user.updated`, `user.deleted`
   - Click **Create** → copy the **Signing Secret** (`whsec_...`) — you will need this in Part C

> **Note:** You do not know the Render URL yet — you can come back and add the webhook endpoint after Part C if you prefer.

### Part B — Confirm the database schema is pushed

If you already ran `pnpm --filter @workspace/db run push` during local setup (Step 6), the tables exist in Neon and you can skip this.

If not, run it now (replace the URL with your real Neon connection string):

```powershell
$env:DATABASE_URL="postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
pnpm --filter @workspace/db run push
```

### Part C — Deploy API server on Render

#### Create the Web Service

1. Go to https://render.com → **New +** → **Web Service**
2. Connect GitHub → select the **KC-Class** repository → **Connect**

#### Configure the service

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

#### Add environment variables

Click **Environment** (or **Advanced**) and add every variable in this table:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Your Neon connection string |
| `CLERK_PUBLISHABLE_KEY` | `pk_live_...` (production key from Part A) |
| `CLERK_SECRET_KEY` | `sk_live_...` (production key from Part A) |
| `CLERK_WEBHOOK_SECRET` | `whsec_...` (from Part A — add after webhook is created) |
| `CORS_ORIGIN` | *(leave blank for now — you'll add this after Part D)* |
| `FRONTEND_URL` | *(leave blank for now — you'll add this after Part D)* |
| `ESEWA_MONTHLY_PRICE` | `299` |
| `ESEWA_YEARLY_PRICE` | `2399` |

> `ESEWA_PRODUCT_CODE`, `ESEWA_SECRET_KEY`, and `ESEWA_ENV` are only needed when you enable real eSewa payments. Leave them out now — the platform defaults to sandbox (test) mode.

Click **Create Web Service**. The first build takes 3–5 minutes. When done, you will see:

```
Your service is live at: https://kc-class-api.onrender.com
```

Copy this URL — you need it in Part D.

**Verify it is running:**
```
https://kc-class-api.onrender.com/api/healthz
```
Should return: `{"status":"ok"}`

### Part D — Deploy frontend on Vercel

#### Option 1 — Vercel (recommended)

1. Go to https://vercel.com → **Add New Project** → **Import Git Repository** → select **KC-Class**
2. Configure:

| Field | Value |
|---|---|
| **Framework Preset** | Vite |
| **Root Directory** | `artifacts/learn` |
| **Build Command** | `pnpm run build` |
| **Output Directory** | `dist/public` |
| **Install Command** | `cd ../.. && pnpm install --frozen-lockfile` |

3. Click **Environment Variables** and add:

| Variable | Value |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_...` (production key from Part A) |
| `VITE_API_URL` | `https://kc-class-api.onrender.com` (your Render URL from Part C) |
| `BASE_PATH` | `/` |

4. Click **Deploy**. Build takes 1–2 minutes.
5. Your frontend is live at: `https://kc-class.vercel.app` (or similar)

> SPA routing works automatically — the repo includes `vercel.json` that redirects all paths to `index.html` so refreshing on `/courses` or any deep link works correctly.

#### Option 2 — Netlify

1. Go to https://netlify.com → **Add new site** → **Import an existing project** → GitHub → select **KC-Class**
2. Configure:

| Field | Value |
|---|---|
| **Base directory** | `artifacts/learn` |
| **Build command** | `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @workspace/learn run build` |
| **Publish directory** | `dist/public` |

3. Click **Environment variables** and add the same three variables as Vercel above
4. Click **Deploy site**

Copy your live frontend URL (`https://kc-class.netlify.app` or similar).

### Part E — Finish Render config

Now that you have the frontend URL, go back to your Render Web Service → **Environment** → add:

| Variable | Value |
|---|---|
| `CORS_ORIGIN` | `https://kc-class.vercel.app` *(your actual frontend URL)* |
| `FRONTEND_URL` | `https://kc-class.vercel.app` *(your actual frontend URL, no trailing slash)* |

Click **Save Changes** — Render redeploys automatically.

**If you didn't add the Clerk webhook yet:**
1. Go to the Clerk dashboard → **Webhooks** → **Add Endpoint**
2. URL: `https://kc-class-api.onrender.com/api/webhooks/clerk`
3. Events: `user.created`, `user.updated`, `user.deleted`
4. Copy the signing secret → add `CLERK_WEBHOOK_SECRET=whsec_...` to Render environment → **Save Changes**

### Part F — Verify the deployment

1. Open your frontend URL in a **private/incognito** browser window
2. The landing page and course catalog load without errors
3. Click **Sign Up** → create an account → you are redirected to the dashboard
4. Check the Render logs (`Logs` tab on Render) — you should see the `user.created` webhook firing
5. Go to `/pricing` → click **Pay Monthly**
6. You are redirected to eSewa sandbox at `rc-epay.esewa.com.np`
7. Log in with eSewa test credentials:
   - **eSewa ID:** `9806800001`
   - **MPIN:** `1122`
   - **Password:** `Nepal@123`
8. Complete the payment → you are redirected back to your site → dashboard shows **Active Subscription**
9. Open a premium lesson — it plays without restriction
10. Go to `/resources` — all downloads are accessible

If all 10 steps work, your deployment is complete.

---

## 5. Go Live — Payments, Admin, Content

### 5.1 Promote yourself to admin on the live site

Sign up on your live Vercel site first, then:

1. Go to https://neon.tech → your project → **SQL Editor**
2. Run:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
   ```
3. Sign out and sign back in on your Vercel site
4. The **Admin** link appears in the navigation bar

Once you are admin, you can promote other users from the admin panel: `/admin` → **Users** → change their role.

### 5.2 Enable real eSewa payments

> **Skip this until you are ready to accept real money.** Sandbox mode is fully functional.

After your eSewa merchant account is approved (see section 2.2):

1. Go to your Render Web Service → **Environment** → add:

| Variable | Value |
|---|---|
| `ESEWA_PRODUCT_CODE` | Your eSewa merchant code |
| `ESEWA_SECRET_KEY` | Your eSewa HMAC secret key |
| `ESEWA_MONTHLY_PRICE` | `299` (or your chosen NPR amount) |
| `ESEWA_YEARLY_PRICE` | `2399` (or your chosen NPR amount) |
| `ESEWA_ENV` | `production` |

2. Click **Save Changes** — Render redeploys (~2 minutes)
3. Make one real payment yourself to confirm it works end-to-end

### 5.3 Add your real course content

The database comes pre-seeded with 4 demo courses, 12 demo lessons, and 6 demo resources. Delete or keep them as you prefer.

**To add a course:** Go to your live site → `/admin/courses` → **New Course**

**To add lessons:** `/admin/courses` → **Manage Lessons** on the course → **Add Lesson**

For premium lessons, set your YouTube video to **Unlisted** before copying the ID. Unlisted videos don't appear in YouTube search — only your site provides the link.

**To add PDF notes and resources:** `/admin` → Resources → **Add Resource** — paste a direct download URL (Google Drive, Dropbox, etc.). Resources are subscriber-only automatically.

### 5.4 Connect a custom domain (optional)

If you own a domain like `kcclassbhw.com`:

**Frontend on Vercel:**
1. Vercel project → **Settings** → **Domains** → **Add Domain** → enter `kcclassbhw.com`
2. Add the DNS records Vercel shows you (an A record + a CNAME) at your domain registrar
3. Wait 15–60 minutes for DNS propagation

**API on Render:**
1. Render Web Service → **Settings** → **Custom Domains** → add `api.kcclassbhw.com`
2. Follow Render's DNS instructions

**After adding custom domains, update two env vars on Render:**

| Variable | New value |
|---|---|
| `CORS_ORIGIN` | `https://kcclassbhw.com` |
| `FRONTEND_URL` | `https://kcclassbhw.com` |

Click **Save Changes** → Render redeploys.

### 5.5 Tell your students

**What is free (no account needed):**
- Browse all courses and see lesson lists
- Watch 1–2 free preview lessons per course

**What requires a subscription:**
- All full lessons (premium)
- PDF notes and the resource vault
- Progress tracking and dashboard

**Subscription prices:** NPR 299/month or NPR 2,399/year

**How to subscribe:** Students need an eSewa account — most Nepali students already have one. The eSewa mobile app is available on Android and iOS.

**Tip:** Make 1–2 lessons per course free previews so students can try the content before subscribing.

---

## 6. Daily Workflow

### Starting the servers every day

```powershell
# Option A — one click in VSCode
Ctrl+Shift+P → Tasks: Run Task → Start Both (Full Stack)

# Option B — two terminals
pnpm --filter @workspace/api-server run dev   # Terminal 1: starts API on port 8080
pnpm --filter @workspace/learn run dev         # Terminal 2: starts frontend on port 3000
```

Then open http://localhost:3000.

- Frontend file changes → browser reloads automatically (hot module replacement)
- API server file changes → server rebuilds and restarts (~3 seconds)

### Adding new videos to existing courses

1. Upload the video to YouTube → set visibility to **Unlisted**
2. Copy the video ID from the URL
3. Go to your live site → `/admin/courses` → **Manage Lessons** on the course → **Add Lesson**
4. Paste the video ID, fill in title, duration, sort order, toggle **Published** on → **Create Lesson**

Students with active subscriptions can watch immediately.

### Deploying code changes

Push to the `main` branch on GitHub:

| Service | What happens automatically |
|---|---|
| Render | Rebuilds and redeploys the API (~3 minutes) |
| Vercel/Netlify | Rebuilds and redeploys the frontend (~1 minute) |

No manual steps needed.

**Exception:** If you change the database schema (`lib/db/src/schema/`), run the schema push after the code deploys:

```powershell
$env:DATABASE_URL="postgresql://...your neon connection string..."
pnpm --filter @workspace/db run push
```

---

## 7. Reference

### All commands

| Command | What it does |
|---|---|
| `pnpm install` | Install all dependencies (run once after cloning) |
| `pnpm --filter @workspace/api-server run dev` | Start API server on port 8080 (development) |
| `pnpm --filter @workspace/learn run dev` | Start frontend on port 3000 (development) |
| `pnpm --filter @workspace/db run push` | Apply database schema to your database |
| `pnpm --filter @workspace/db run push-force` | Same as push but skips interactive Y/N prompt |
| `pnpm run typecheck` | TypeScript check across all packages |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API hooks (only needed after editing `openapi.yaml`) |

### All environment variables

#### API server — `artifacts/api-server/.env`

| Variable | Required for | Default | Description |
|---|---|---|---|
| `PORT` | Always | — | `8080` locally; Render sets this automatically |
| `NODE_ENV` | Always | — | `development` locally, `production` on Render |
| `DATABASE_URL` | Always | — | PostgreSQL connection string from Neon |
| `CLERK_PUBLISHABLE_KEY` | Always | — | `pk_test_...` locally, `pk_live_...` on Render |
| `CLERK_SECRET_KEY` | Always | — | `sk_test_...` locally, `sk_live_...` on Render |
| `CLERK_WEBHOOK_SECRET` | Production | — | `whsec_...` — enables instant user sync on sign-up |
| `CORS_ORIGIN` | Production | All origins | Your Vercel/Netlify URL — locks down CORS in production |
| `FRONTEND_URL` | Production | `http://localhost:3000` | Your Vercel/Netlify URL — used for eSewa payment redirects |
| `ESEWA_PRODUCT_CODE` | Live payments | `EPAYTEST` | Your eSewa merchant code |
| `ESEWA_SECRET_KEY` | Live payments | eSewa test key | Your eSewa HMAC secret key |
| `ESEWA_MONTHLY_PRICE` | Optional | `299` | Monthly subscription price in NPR |
| `ESEWA_YEARLY_PRICE` | Optional | `2399` | Yearly subscription price in NPR |
| `ESEWA_ENV` | Live payments | — | Set to `production` to enable real eSewa payments |

#### Frontend — `artifacts/learn/.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Always | Same value as `CLERK_PUBLISHABLE_KEY` on the API server |
| `VITE_API_URL` | Always | `http://localhost:8080` locally; your Render URL in production |
| `PORT` | Always | `3000` locally; ignored by Vercel/Netlify in production |
| `BASE_PATH` | Always | Always `/` |

### Admin panel URLs

| URL | What it does |
|---|---|
| `/admin` | Platform stats, user list, subscription list |
| `/admin/courses` | Create, edit, publish, delete courses |
| `/admin/courses/:id/lessons` | Add and manage lessons |
| `/pricing` | What students see when subscribing |
| `/dashboard` | What a signed-in student sees |
| `/resources` | Resource vault (subscriber-only) |
| `/videos` | Auto-synced YouTube channel page |
| `/settings` | Profile and subscription management |

---

## 8. Troubleshooting

### Local development problems

**`pnpm` is not recognized as a command**
Close VSCode completely and reopen it. If still missing, run `npm install -g pnpm` in PowerShell, then reopen.

**Blank white page or nothing loads at localhost:3000**
Open browser DevTools (`F12`) → **Console** tab:
- "Missing VITE_CLERK_PUBLISHABLE_KEY" → `artifacts\learn\.env` is missing or the key is still a placeholder. Check Step 4.
- Network error → make sure the API server is running (Terminal 1 shows `Server listening port: 8080`)

**`Error: PORT environment variable is required`**
`artifacts\api-server\.env` does not exist or is missing `PORT=8080`. Create it from `.env.example` (Step 3).

**`Error: DATABASE_URL is not set`**
`artifacts\api-server\.env` is missing or `DATABASE_URL` is still `REPLACE_WITH_YOUR_CONNECTION_STRING`. Fill it in with your Neon connection string (Step 5).

**`ECONNREFUSED 127.0.0.1:5432`**
You entered a local PostgreSQL URL but PostgreSQL is not running locally. Switch to your Neon connection string instead — much simpler, no local database needed.

**`SSL SYSCALL error: EOF detected` or `unable to get local issuer certificate`**
This is a Windows SSL issue. Make sure your Neon connection string ends with `?sslmode=require` — the app handles the rest automatically. Do not remove the `sslmode=require` part.

**`Failed to load Clerk JS` in the browser console**
You have `VITE_CLERK_PROXY_URL=...` in `artifacts\learn\.env`. Delete that entire line. This setting only works with production keys on a custom domain — never in local development.

**Sign-in does not work**
Confirm `VITE_CLERK_PUBLISHABLE_KEY` in `artifacts\learn\.env` is the same value as `CLERK_PUBLISHABLE_KEY` in `artifacts\api-server\.env`. Both must be the same `pk_test_...` string.

**`Cannot find module '@workspace/db'`**
Run `pnpm install` again — a symlink may have been lost.

**TypeScript errors in the VSCode editor but `pnpm run typecheck` passes**
`Ctrl+Shift+P` → **TypeScript: Select TypeScript Version** → **Use Workspace Version**.

**Drizzle `push` prints nothing and hangs**
It is waiting for a Y/N prompt that your terminal is not showing. Type `y` then Enter, or use `push-force` to skip it:
```powershell
pnpm --filter @workspace/db run push-force
```

---

### Production / deployment problems

**Render build fails**
Check that the Build Command is exactly:
```
pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server run build
```
And Start Command is:
```
node --enable-source-maps ./artifacts/api-server/dist/index.mjs
```

**API healthcheck returns 502 or connection refused**
Render is still starting up (takes 1–2 minutes after the build). Wait and try again.

**Sign-in page crashes on the live Vercel site**
`VITE_CLERK_PUBLISHABLE_KEY` on Vercel must be a `pk_live_...` key (not `pk_test_`). Production Clerk requires live keys.

**Courses or lessons do not load — API calls fail**
Check that `VITE_API_URL` on Vercel matches your exact Render URL (no trailing slash, with `https://`).

**eSewa payment fails or redirects to the wrong place**
Check these on Render:
- `FRONTEND_URL` is set to your Vercel URL with no trailing slash
- `ESEWA_PRODUCT_CODE` and `ESEWA_SECRET_KEY` are correct (when live payments are enabled)
- `ESEWA_ENV=production` is set (when live payments are enabled)

**Users are not appearing in the database after sign-up**
The Clerk webhook is not configured or the secret is wrong. Check `CLERK_WEBHOOK_SECRET` on Render matches the `whsec_...` secret from the Clerk webhook settings.

**`/admin` shows "Access denied"**
Run this in the Neon SQL Editor:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```
Sign out and back in.

**Render is slow on the first request**
This is expected on the free plan — the server sleeps after 15 minutes of inactivity. The first request after sleep takes ~30 seconds. Upgrade to the paid plan ($7/month) for always-on.

**Videos page is empty**
The `/videos` page reads your YouTube channel's RSS feed. Make sure your YouTube channel ID is configured, and wait up to 10 minutes for the feed to sync after publishing a new video.

---

