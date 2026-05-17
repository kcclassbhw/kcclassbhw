# Deployment Guide — KC Class BHW

Deploy the Express API on **Render**, the React frontend on **Vercel** or **Netlify**, and the database on **Neon**. All services have free tiers.

---

## Architecture Overview

```
[Browser]
    │
    ├── https://your-app.vercel.app   ──► Vercel  ┐
    │   OR                                         ├─ React frontend (your choice)
    ├── https://your-site.netlify.app ──► Netlify  ┘
    │
    └── API calls ──────────────────────────────► Render (Express API)
                                                    │
                                                    └── Neon PostgreSQL (database)
```

| Service | What runs there | Free tier |
|---|---|---|
| **Neon** | PostgreSQL database | 0.5 GB storage |
| **Render** | Express API server | 512 MB RAM — sleeps after 15 min inactivity |
| **Vercel** | React + Vite frontend | Unlimited static hosting |
| **Netlify** | React + Vite frontend (alternative to Vercel) | 100 GB bandwidth/month |
| **Clerk** | User authentication | 10,000 monthly active users |

---

## Deployment Order

Follow the parts in this order — each one depends on the previous:

```
Part 0 — Clerk production keys
    ↓
Part 1 — Neon database (create + push schema)
    ↓
Part 2 — Render API server (needs DATABASE_URL + Clerk keys)
    ↓
Part 3 — Frontend: Vercel OR Netlify (needs Render URL + Clerk keys)
    ↓
Part 4 — Back to Render: add CORS_ORIGIN + Clerk webhook
    ↓
Part 5 — Verify + make yourself admin
```

---

## Part 0 — Get Production Clerk Keys

Your local `.env` uses development Clerk keys (`pk_test_...`). Production needs **live keys**.

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) → open your app
2. Click **API Keys** in the left sidebar
3. At the top of the page, switch the toggle from **Development** to **Production**

   > Clerk may ask you to set up DNS records — this is only required if you use a custom domain. For `.vercel.app`, `.netlify.app`, and `.onrender.com` domains, skip DNS and just copy the keys.

4. Copy and save both keys:
   - **Publishable key** — starts with `pk_live_...`
   - **Secret key** — starts with `sk_live_...`

---

## Part 1 — Database on Neon

> **Skip to Part 2** if you already set up Neon during local development. Use that same connection string for production.

### 1.1 — Create a Neon project

1. Go to [neon.tech](https://neon.tech) → **Sign Up** (free, no credit card needed)
2. Click **New Project** → name it `kc-class` → pick region **Singapore** (closest to Nepal) → **Create Project**
3. On the project dashboard, click **Connect** → copy the **Connection String**:
   ```
   postgresql://username:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Save this — it is your `DATABASE_URL`

### 1.2 — Push the database schema

Run this once from your local machine to create all tables on Neon:

```powershell
$env:DATABASE_URL="postgresql://username:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
pnpm --filter @workspace/db run push
```

When prompted, type `y` and press Enter to confirm table creation.

> You only need to do this once. Run it again only if you change the database schema.

---

## Part 2 — API Server on Render

### 2.1 — Create a Render account

Go to [render.com](https://render.com) → **Get Started** → sign up with GitHub (easiest — it connects to your repo automatically).

### 2.2 — Create a Web Service

1. On the Render dashboard, click **New +** → **Web Service**
2. Connect your GitHub account if prompted → select the **KC-Class** repository → click **Connect**

### 2.3 — Configure the Web Service

Fill in these fields exactly:

| Field | Value |
|---|---|
| **Name** | `kc-class-api` (or anything you want) |
| **Region** | Singapore (closest to Nepal) |
| **Branch** | `main` |
| **Root Directory** | *(leave blank)* |
| **Runtime** | Node |
| **Build Command** | `pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server run build` |
| **Start Command** | `node --enable-source-maps ./artifacts/api-server/dist/index.mjs` |
| **Instance Type** | Free |

> If Render does not detect pnpm automatically, click **Advanced** → add an environment variable: `PNPM_VERSION` = `10`

### 2.4 — Add environment variables on Render

Scroll down to **Environment Variables** and add each one:

**Required:**

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | *(your Neon connection string from Part 1)* |
| `CLERK_PUBLISHABLE_KEY` | `pk_live_...` *(from Part 0)* |
| `CLERK_SECRET_KEY` | `sk_live_...` *(from Part 0)* |
| `CORS_ORIGIN` | *(leave blank for now — you will add this after deploying your frontend)* |

**eSewa payments** *(only if you have a merchant account — the app works in sandbox mode without these)*:

| Key | Value |
|---|---|
| `FRONTEND_URL` | *(your Vercel or Netlify URL — fill in after deploying the frontend)* |
| `ESEWA_PRODUCT_CODE` | *(your eSewa merchant code)* |
| `ESEWA_SECRET_KEY` | *(your eSewa secret key)* |
| `ESEWA_MONTHLY_PRICE` | `299` *(NPR — or your price)* |
| `ESEWA_YEARLY_PRICE` | `2399` *(NPR — or your price)* |
| `ESEWA_ENV` | `production` |

### 2.5 — Deploy the API

Click **Create Web Service**. Render will clone your repo, run the build command, and start the server. The build takes 2–3 minutes.

Watch the **Logs** tab. When you see:
```
Server listening  port: 10000
```
your API is live. Copy the URL — it looks like:
```
https://kc-class-api.onrender.com
```

---

## Part 3 — Frontend

Choose **Vercel** or **Netlify**. Both are free and work identically. Pick one — you do not need both.

---

### Option A — Frontend on Vercel

#### 3A.1 — Create a Vercel account

Go to [vercel.com](https://vercel.com) → **Sign Up** → use GitHub.

#### 3A.2 — Import the project

1. On the Vercel dashboard, click **Add New...** → **Project**
2. Find and select the **KC-Class** repository → click **Import**

#### 3A.3 — Configure the build

Vercel may auto-detect settings incorrectly — override everything manually:

| Field | Value |
|---|---|
| **Framework Preset** | Vite |
| **Root Directory** | `.` *(repo root — do not change)* |
| **Build Command** | `pnpm install --frozen-lockfile && pnpm --filter @workspace/learn run build` |
| **Output Directory** | `artifacts/learn/dist/public` |
| **Install Command** | *(leave blank — the build command handles install)* |

> If Vercel shows "Override install command?" — click **Override** and leave it blank.

#### 3A.4 — Add environment variables on Vercel

Click **Environment Variables** and add:

| Key | Value |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_...` *(from Part 0)* |
| `VITE_API_URL` | `https://kc-class-api.onrender.com` *(your Render URL from Part 2.5)* |
| `BASE_PATH` | `/` |

> Do NOT add `VITE_CLERK_PROXY_URL` — it is not needed and will crash local dev if added to `.env`.

#### 3A.5 — Deploy

Click **Deploy**. The build takes 1–2 minutes. When done, Vercel gives you a URL like:
```
https://kc-class.vercel.app
```

**Continue to Part 4** with this URL.

---

### Option B — Frontend on Netlify

The repository already includes a `netlify.toml` file at the root — Netlify reads it automatically and no manual build configuration is needed.

#### 3B.1 — Create a Netlify account

Go to [netlify.com](https://netlify.com) → **Sign Up** → use GitHub.

#### 3B.2 — Import the project

1. On the Netlify dashboard, click **Add new site** → **Import an existing project**
2. Click **Deploy with GitHub** → authorize GitHub → select the **KC-Class** repository

#### 3B.3 — Confirm build settings

Netlify reads `netlify.toml` automatically. Verify it shows these values (do not change them):

| Field | Value |
|---|---|
| **Branch to deploy** | `main` |
| **Build command** | `pnpm install --frozen-lockfile && pnpm --filter @workspace/learn run build` |
| **Publish directory** | `artifacts/learn/dist/public` |

#### 3B.4 — Add environment variables on Netlify

Before clicking Deploy, click **Show advanced** → **New variable** and add each one:

| Key | Value |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_...` *(from Part 0)* |
| `VITE_API_URL` | `https://kc-class-api.onrender.com` *(your Render URL from Part 2.5)* |
| `BASE_PATH` | `/` |

> If you miss this step, go to **Site configuration** → **Environment variables** after the first deploy, add the variables, and click **Trigger deploy** → **Deploy site** to rebuild.

#### 3B.5 — Deploy

Click **Deploy site**. The build takes 1–2 minutes. When done, Netlify gives you a URL like:
```
https://kc-class-abc123.netlify.app
```

You can rename this under **Site configuration** → **Site details** → **Change site name**.

**Continue to Part 4** with this URL.

---

## Part 4 — Back on Render: CORS and Clerk Webhooks

Now that your frontend is deployed, go back to Render and complete two remaining steps.

### 4.1 — Add CORS origin

1. Go to your Render Web Service → **Environment** tab
2. Set:

   | Key | Value |
   |---|---|
   | `CORS_ORIGIN` | `https://kc-class.vercel.app` *(or your Netlify URL — no trailing slash)* |
   | `FRONTEND_URL` | same URL as above |

3. Click **Save Changes** — Render redeploys automatically (~2 minutes)

### 4.2 — Set up Clerk webhooks (instant user sync to Neon)

This makes Clerk push user data to your database the moment someone signs up, updates their profile, or deletes their account. Without this, sync still works but only on the user's first API call.

**In the Clerk dashboard:**

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) → your app → **Webhooks** in the left sidebar
2. Click **Add Endpoint**
3. Fill in:
   - **Endpoint URL**: `https://kc-class-api.onrender.com/api/webhooks/clerk`
   - **Events**: tick `user.created`, `user.updated`, `user.deleted`
4. Click **Create**
5. Click **Signing Secret** to reveal it — copy the value starting with `whsec_`

**Back on Render:**

6. Go to your Web Service → **Environment** tab → add:

   | Key | Value |
   |---|---|
   | `CLERK_WEBHOOK_SECRET` | `whsec_...` *(the signing secret you just copied)* |

7. Click **Save Changes** — Render redeploys

**Test it:** In Clerk → Webhooks → your endpoint → **Send test event** → `user.created` → **Send**. You should see `200 OK`.

---

## Part 5 — Verify and Make Yourself Admin

### 5.1 — Verify the deployment

Open your Vercel or Netlify URL and run through this checklist:

| Check | What to do | Expected result |
|---|---|---|
| Page loads | Visit your frontend URL | Landing page appears, no blank screen |
| Courses load | Click **Courses** in the navbar | Course cards appear |
| Sign up | Click **Get Started** | Clerk sign-up form opens |
| Sign in | Sign in with the account you just created | Redirected to dashboard |
| Pricing page | Click **Pricing** in the navbar | NPR prices and eSewa button shown |

### 5.2 — Make yourself an admin

1. Open the Neon dashboard → your project → **SQL Editor**
2. Run:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
   ```
3. Sign out and sign back in on your live site — the **Admin** link appears in the navbar

---

## Common Problems

| Symptom | Cause | Fix |
|---|---|---|
| Blank page / white screen | Missing env vars on Vercel or Netlify | Check `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_API_URL` are set, then redeploy |
| Page loads but refreshing a URL gives 404 | Missing SPA redirect rule | Vercel handles this automatically. For Netlify, confirm `netlify.toml` is present in the repo root. |
| API calls fail (network error) | Wrong or missing `VITE_API_URL` | Must be your full Render URL — e.g. `https://kc-class-api.onrender.com` (no trailing slash) |
| Sign-in page shows Clerk error | Wrong Clerk keys | `VITE_CLERK_PUBLISHABLE_KEY` must be `pk_live_...` (not `pk_test_`) in production |
| API returns `403 Forbidden` | CORS mismatch | `CORS_ORIGIN` on Render must exactly match your frontend URL (no trailing slash) |
| `relation "users" does not exist` in Render logs | Schema not pushed | Re-run `pnpm --filter @workspace/db run push` with the production `DATABASE_URL` |
| First request is slow (~30 sec) | Render free tier sleeps | Normal behavior — upgrade to Render's paid tier ($7/month) for always-on |
| eSewa payment redirects to wrong URL | `FRONTEND_URL` missing or wrong on Render | Set `FRONTEND_URL` to your exact Vercel or Netlify URL |
| Webhook test returns 404 | Render not fully deployed yet | Wait for Render to finish redeploying, then retry |
| Netlify build fails — pnpm not found | Netlify pnpm version detection issue | Add env var `PNPM_VERSION=10` in Netlify → Site configuration → Environment variables |

---

## Redeploying After Code Changes

Push to the `main` branch on GitHub — both Render and Vercel/Netlify redeploy automatically.

| Service | Rebuild time |
|---|---|
| Render | ~3 minutes |
| Vercel | ~1 minute |
| Netlify | ~1–2 minutes |

**After a schema change** (`lib/db/src/schema/`), re-run the push command from Part 1.2 once the new code is deployed on Render.

---

## Environment Variables Quick Reference

### Render (API Server)

```
NODE_ENV=production
DATABASE_URL=postgresql://...neon.tech/...?sslmode=require
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
CORS_ORIGIN=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
ESEWA_PRODUCT_CODE=your_merchant_code
ESEWA_SECRET_KEY=your_esewa_secret
ESEWA_MONTHLY_PRICE=299
ESEWA_YEARLY_PRICE=2399
ESEWA_ENV=production
```

### Vercel (Frontend)

```
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_API_URL=https://your-api.onrender.com
BASE_PATH=/
```

### Netlify (Frontend — alternative to Vercel)

```
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_API_URL=https://your-api.onrender.com
BASE_PATH=/
```

> Netlify also needs the `netlify.toml` file in the repo root (already included).
