# Deployment Guide — KC Class BHW

Deploy the API server on **Render** and the frontend on **Vercel**, with the database on **Neon** (free PostgreSQL cloud). All three are free-tier friendly.

---

## Architecture Overview

```
[Browser]
    │
    ├─── https://your-app.vercel.app  ──► Vercel (React frontend)
    │                                        │
    └─── API calls ──────────────────────► Render (Express API)
                                             │
                                             └── Neon PostgreSQL (database)
```

| Service | What runs there | Free tier |
|---|---|---|
| **Neon** | PostgreSQL database | ✅ 0.5 GB storage |
| **Render** | Express API server | ✅ 512 MB RAM, sleeps after 15 min inactivity |
| **Vercel** | React + Vite frontend | ✅ Unlimited static hosting |

---

## Before You Start — Get Production Clerk Keys

Your local `.env` uses development Clerk keys (`pk_test_...`). Production deployments need **live keys**.

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) → open your app
2. In the left sidebar, click **API Keys**
3. At the top, switch the toggle from **Development** to **Production**

   > Clerk will ask you to set up DNS records only if you use a custom domain. For `.vercel.app` and `.onrender.com` domains, skip that — just copy the keys.

4. Copy both:
   - **Publishable key** — starts with `pk_live_...`
   - **Secret key** — starts with `sk_live_...`

Keep these ready — you'll paste them into Render and Vercel in the steps below.

---

## Part 1 — Database on Neon

> Skip this part if you already have a Neon database from local setup. Just use that same connection string for production.

### 1.1 — Create a Neon project

1. Go to [neon.tech](https://neon.tech) → **Sign Up** (free, no credit card)
2. Click **New Project** → give it a name (e.g. `kc-class`) → **Create Project**
3. On the project dashboard, click **Connect** → copy the **Connection String**

   It looks like:
   ```
   postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

4. Save this string — you'll need it for both Render and the schema push below.

### 1.2 — Push the database schema to Neon

Run this once from your Windows machine terminal to create all the tables:

```powershell
# Set the production DATABASE_URL temporarily and push
$env:DATABASE_URL="postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
pnpm --filter @workspace/db run push
```

When prompted to confirm table creation, type `y` and press Enter.

> You only need to do this once. Neon keeps the data.

---

## Part 2 — API Server on Render

### 2.1 — Create a Render account

Go to [render.com](https://render.com) → **Get Started** → sign up with GitHub (easiest — it connects to your repo automatically).

### 2.2 — Create a Web Service

1. On the Render dashboard, click **New +** → **Web Service**
2. Connect your GitHub account if prompted → select the **KC-Class** repository
3. Click **Connect**

### 2.3 — Configure the Web Service

Fill in these fields exactly:

| Field | Value |
|---|---|
| **Name** | `kc-class-api` (or anything you want) |
| **Region** | Singapore (closest to Nepal) |
| **Branch** | `main` |
| **Root Directory** | *(leave blank)* |
| **Runtime** | **Node** |
| **Build Command** | `pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server run build` |
| **Start Command** | `node --enable-source-maps ./artifacts/api-server/dist/index.mjs` |
| **Instance Type** | **Free** |

> If Render does not detect pnpm automatically, scroll down to **Advanced** → add an environment variable `PNPM_VERSION` = `10.11.0`

### 2.4 — Add environment variables on Render

Scroll down to **Environment Variables** and add each one:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | *(your Neon connection string from Part 1)* |
| `CLERK_PUBLISHABLE_KEY` | `pk_live_...` *(your production publishable key)* |
| `CLERK_SECRET_KEY` | `sk_live_...` *(your production secret key)* |
| `CORS_ORIGIN` | *(leave blank for now — fill this in after Vercel deployment in Part 3.5)* |

**eSewa (only if you have a merchant account):**

| Key | Value |
|---|---|
| `ESEWA_PRODUCT_CODE` | *(your eSewa merchant code)* |
| `ESEWA_SECRET_KEY` | *(your eSewa secret key)* |
| `ESEWA_MONTHLY_PRICE` | `299` *(or your price in NPR)* |
| `ESEWA_YEARLY_PRICE` | `2399` *(or your price in NPR)* |
| `ESEWA_ENV` | `production` |

> Without eSewa keys, the app still works — the payments section returns a graceful error explaining eSewa is not configured.

### 2.5 — Deploy

Click **Create Web Service**. Render will:
1. Clone your repo
2. Run `pnpm install`
3. Build the server
4. Start it

The build takes about 2–3 minutes. Watch the **Logs** tab. When you see:

```
Server listening  port: 10000
```

your API is live. Copy the Render URL — it looks like:
```
https://kc-class-api.onrender.com
```

---

## Part 3 — Frontend on Vercel

### 3.1 — Create a Vercel account

Go to [vercel.com](https://vercel.com) → **Sign Up** → use GitHub (connects to your repo automatically).

### 3.2 — Import the project

1. On the Vercel dashboard, click **Add New...** → **Project**
2. Find and select the **KC-Class** repository → click **Import**

### 3.3 — Configure the project

Vercel will try to auto-detect the framework. Override everything manually:

| Field | Value |
|---|---|
| **Framework Preset** | **Vite** |
| **Root Directory** | `.` *(repo root — do NOT change this)* |
| **Build Command** | `pnpm install --frozen-lockfile && pnpm --filter @workspace/learn run build` |
| **Output Directory** | `artifacts/learn/dist/public` |
| **Install Command** | *(leave blank — the build command handles it)* |

> If Vercel shows a warning that it overrides the install command, click **Override** and leave Install Command blank.

### 3.4 — Add environment variables on Vercel

Click **Environment Variables** and add each one:

| Key | Value |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_...` *(your production publishable key)* |
| `VITE_API_URL` | `https://kc-class-api.onrender.com` *(your Render URL from Part 2.5)* |
| `BASE_PATH` | `/` |

> Do NOT add `VITE_CLERK_PROXY_URL` — it is not needed for this setup.

### 3.5 — Deploy

Click **Deploy**. The build takes 1–2 minutes. When done, Vercel gives you a URL like:
```
https://kc-class.vercel.app
```

### 3.6 — Go back to Render and add CORS

Now that you have your Vercel URL, go back to Render:

1. Open your Web Service → **Environment** tab
2. Add this variable:

   | Key | Value |
   |---|---|
   | `CORS_ORIGIN` | `https://kc-class.vercel.app` *(your exact Vercel URL)* |

3. Click **Save Changes** — Render will redeploy automatically (1–2 minutes).

---

## Part 4 — Verify Everything Works

Open your Vercel URL in the browser and check each of these:

| Test | What to do | Expected result |
|---|---|---|
| **Page loads** | Visit `https://your-app.vercel.app` | Landing page appears, no white screen |
| **Courses load** | Click **Courses** in the navbar | Course cards appear |
| **Sign up** | Click **Start Learning Free** | Clerk sign-up form opens |
| **Sign in** | Sign in with the account you just created | Redirected to dashboard |
| **Pricing page** | Click **Pricing** | NPR prices are shown |
| **Admin login** | Sign in with your admin account | Admin link appears in navbar |

---

## Part 5 — Make Yourself an Admin

After your first login on the live site, you need to grant yourself admin access:

1. Open the Neon dashboard → your project → **SQL Editor**
2. Run this query (replace the email):

   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
   ```

3. Sign out and sign back in on your site. The **Admin** link will appear in the navbar.

---

## Common Problems

### Frontend loads but API calls fail (network error)

- Open the browser DevTools → **Network** tab → look at the failing request URL
- It should go to `https://kc-class-api.onrender.com/api/...`
- If it's going to `localhost:8080`, the `VITE_API_URL` variable on Vercel is missing or wrong — go to Vercel → Project Settings → Environment Variables, fix it, then **Redeploy**

### Sign-in page shows a Clerk error

- Make sure `VITE_CLERK_PUBLISHABLE_KEY` on Vercel matches `CLERK_PUBLISHABLE_KEY` on Render — both must be the same `pk_live_...` value
- Make sure both are **production** keys (`pk_live_`, `sk_live_`), not dev keys (`pk_test_`)

### API returns `403 Forbidden` for all requests

- The `CORS_ORIGIN` on Render doesn't match your Vercel URL exactly
- Check for a trailing slash — `https://kc-class.vercel.app` (no slash) vs `https://kc-class.vercel.app/` (with slash) — they are different. Use without trailing slash.

### Render app is slow on first request

This is normal on Render's free tier — the server sleeps after 15 minutes of inactivity and takes ~30 seconds to wake up on the next request. Paid tiers stay always-on.

### `relation "users" does not exist` in Render logs

The database schema was not pushed. Run the schema push from your machine with the production connection string (see Part 1.2).

### eSewa payment fails in production

- Confirm `ESEWA_ENV=production` is set on Render
- Confirm `ESEWA_PRODUCT_CODE` matches exactly what eSewa issued to your merchant account
- Test with eSewa's own sandbox first: remove `ESEWA_ENV` (or set it to `sandbox`) and use eSewa test credentials

---

## Redeploying After Code Changes

Whenever you push new code to GitHub:

| Service | What happens |
|---|---|
| **Render** | Automatically rebuilds and redeploys (takes ~3 minutes) |
| **Vercel** | Automatically rebuilds and redeploys (takes ~1 minute) |

You don't need to do anything manually — both services watch your `main` branch.

If you change the database schema (`lib/db/src/schema/`), re-run the schema push command from Part 1.2 after the code change is deployed.

---

## Environment Variables Quick Reference

### Render (API Server)

```
NODE_ENV=production
DATABASE_URL=postgresql://...neon.tech/...?sslmode=require
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CORS_ORIGIN=https://your-app.vercel.app
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
