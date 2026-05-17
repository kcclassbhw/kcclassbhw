# KC Class BHW — Requirements

Everything you need before setting up or deploying the platform. Work through this list top to bottom before opening `SETUP.md` or `DEPLOY.md`.

---

## 1. Developer Tools (Install on Your Machine)

| Tool | Minimum Version | How to check | Install link |
|---|---|---|---|
| **Node.js** | 22.x LTS | `node --version` | https://nodejs.org → download LTS |
| **pnpm** | 10.x | `pnpm --version` | `npm install -g pnpm` |
| **Git** | Any | `git --version` | https://git-scm.com/downloads |
| **VSCode** | Any | — | https://code.visualstudio.com |

### VSCode extensions (auto-suggested on project open)

The project includes `.vscode/extensions.json` — VSCode will offer to install all of these when you open the folder. Click **Install All**.

| Extension | Why it's needed |
|---|---|
| Prettier | Formats code on save |
| ESLint | Highlights code issues as you type |
| Tailwind CSS IntelliSense | Autocomplete for Tailwind class names |
| TypeScript (Nightly) | Better TypeScript language server |
| GitLens | Inline Git blame and file history |
| SQLTools + PostgreSQL Driver | Run SQL queries from inside VSCode |
| Path IntelliSense | Autocomplete for file paths |

---

## 2. External Accounts (Sign Up for Free)

You need accounts on these services. All have generous free tiers.

### 2.1 GitHub

**What for:** Hosting the code repository. Both Render and Vercel connect to GitHub to deploy automatically.

1. Go to https://github.com → **Sign up**
2. Fork or push the `KC-Class` repo to your account

---

### 2.2 Clerk (Authentication)

**What for:** User sign-up, sign-in, social login (Google). Clerk handles all auth — no sessions or passwords to manage.

1. Go to https://dashboard.clerk.com → **Sign up** (free)
2. Click **Create application** → name it `KC Class BHW` → **Create**
3. In the left sidebar, click **API Keys**
4. Copy and save these — you will need them in Setup Step 5:
   - **Publishable key** — starts with `pk_test_...` (development) or `pk_live_...` (production)
   - **Secret key** — starts with `sk_test_...` (development) or `sk_live_...` (production)

> **Development vs production keys:** Use `pk_test_` / `sk_test_` for local development. Switch to `pk_live_` / `sk_live_` when deploying to production (Render + Vercel). You switch in the Clerk dashboard by toggling **Development ↔ Production** at the top of the API Keys page.

---

### 2.3 Neon (PostgreSQL Database)

**What for:** The cloud PostgreSQL database that stores all courses, users, subscriptions, and progress.

1. Go to https://neon.tech → **Sign up** (free, no credit card)
2. Click **New Project** → name it `kc-class` → region: **Singapore** (closest to Nepal) → **Create**
3. On the dashboard, click **Connect** → copy the **connection string**:
   ```
   postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Save this string — it is your `DATABASE_URL`

> **One database or two?** For simplicity, use one Neon database for both local dev and production. Your local `.env` and Render environment both get the same `DATABASE_URL`. If you prefer strict separation, create a second Neon project for production.

---

### 2.4 Render (API Server Hosting)

**What for:** Hosting the Express API server in production. Render runs the Node.js backend and keeps it always reachable.

1. Go to https://render.com → **Get Started** → sign up with GitHub
2. No further setup needed now — you configure a Web Service during deployment (see `DEPLOY.md`)

> **Free tier note:** Render's free Web Service sleeps after 15 minutes of inactivity. The first request after sleep takes ~30 seconds. For always-on, upgrade to the paid tier ($7/month).

---

### 2.5 Vercel (Frontend Hosting)

**What for:** Hosting the React frontend. Vercel builds and deploys the Vite app automatically on every `git push`.

1. Go to https://vercel.com → **Sign Up** → sign up with GitHub
2. No further setup needed now — you import the project during deployment (see `DEPLOY.md`)

---

### 2.6 eSewa Merchant Account (For Live Payments Only)

**What for:** Accepting real NPR payments from students. Not needed for local development or testing — the app runs in eSewa sandbox mode by default.

> **Skip this until you are ready to accept real payments.** Sandbox mode works fully without an eSewa merchant account.

When ready:
1. Apply at https://esewa.com.np/epay/merchant
2. Fill in your business details
3. eSewa will issue you:
   - A **Merchant Code** (also called Product Code)
   - A **Secret Key**

---

## 3. Environment Variables Reference

These are all the environment variables used by the project. You set them in `.env` files locally and on Render/Vercel in production.

### API Server (`artifacts/api-server/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | Yes | — | Port the server listens on. Use `8080` locally. Render sets this automatically. |
| `NODE_ENV` | Yes | — | `development` locally, `production` on Render |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string from Neon |
| `CLERK_PUBLISHABLE_KEY` | Yes | — | Clerk publishable key (`pk_test_...` or `pk_live_...`) |
| `CLERK_SECRET_KEY` | Yes | — | Clerk secret key (`sk_test_...` or `sk_live_...`) |
| `CLERK_WEBHOOK_SECRET` | Production | — | Clerk webhook signing secret (`whsec_...`). Enables instant user sync when someone signs up. |
| `CORS_ORIGIN` | Production | All origins | Comma-separated list of allowed frontend origins. Set to your Vercel URL. |
| `FRONTEND_URL` | Production | `http://localhost:3000` | Your Vercel URL. Used for eSewa payment redirect URLs. |
| `ESEWA_PRODUCT_CODE` | Live payments | `EPAYTEST` | Your eSewa merchant code. Leave unset to use sandbox. |
| `ESEWA_SECRET_KEY` | Live payments | eSewa test key | Your eSewa HMAC secret key. Leave unset to use sandbox. |
| `ESEWA_MONTHLY_PRICE` | Optional | `299` | Monthly subscription price in NPR. |
| `ESEWA_YEARLY_PRICE` | Optional | `2399` | Yearly subscription price in NPR. |
| `ESEWA_ENV` | Live payments | — | Set to `production` to enable live eSewa. Leave unset for sandbox. |

### Frontend (`artifacts/learn/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | — | Same value as `CLERK_PUBLISHABLE_KEY` on the API server |
| `VITE_API_URL` | Yes | — | Full URL of the API server. `http://localhost:8080` locally, your Render URL in production. |
| `PORT` | Yes | — | Port for the Vite dev server. Use `3000` locally. |
| `BASE_PATH` | Yes | `/` | URL base path. Always `/`. |

> **Do not set `VITE_CLERK_PROXY_URL`** in local development. It is only for custom production domain setups and will crash the app when used with `pk_test_` keys.

---

## 4. Tech Stack Summary

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 22+ |
| Language | TypeScript | 5.9 |
| Frontend | React | 19 |
| UI framework | Vite | 7 |
| Styling | Tailwind CSS | v4 |
| Component library | shadcn/ui | — |
| Routing | wouter | 3 |
| Backend | Express | 5 |
| Database | PostgreSQL | 15+ |
| ORM | Drizzle ORM | — |
| Auth | Clerk | — |
| Payments | eSewa | v2 API |
| Webhook verification | Svix | — |
| Validation | Zod | v4 |
| API spec | OpenAPI | 3.1 |
| API codegen | Orval | — |
| Monorepo | pnpm workspaces | — |
| API build | esbuild | — |
| HTTP security | Helmet | — |
| Logging | Pino | — |

---

## 5. Quick Navigation

| Document | What it covers |
|---|---|
| **REQUIREMENTS.md** ← you are here | Everything needed before starting |
| **SETUP.md** | Step-by-step local development setup (Windows 11) |
| **DEPLOY.md** | Step-by-step deployment to Render + Vercel |
| **LAUNCH_GUIDE.md** | Post-deploy: admin setup, eSewa live payments, adding content |
| **README.md** | Project overview, architecture, API reference, database schema |
