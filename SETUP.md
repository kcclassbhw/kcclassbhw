# KC Class BHW — Local Development Setup (Windows 11)

**Tested on:** Windows 11 · VSCode · Node 22 · pnpm 10+ · Git  
**Time to complete:** ~20 minutes on first run

> **Before starting:** Read **[REQUIREMENTS.md](./REQUIREMENTS.md)** to make sure you have all accounts (Clerk, Neon) and tools set up first.

---

## What You Will Have When Done

| Service | URL | What it does |
|---|---|---|
| Frontend (React + Vite) | http://localhost:3000 | The full KC Class BHW website |
| API Server (Express) | http://localhost:8080 | Backend — courses, auth, payments, progress |

---

## Prerequisites

Open **Windows Terminal** or **PowerShell** and verify each tool:

### Check Node.js
```powershell
node --version
```
Must print `v22.x.x` or higher. If not installed: https://nodejs.org → download **LTS**.

### Check pnpm
```powershell
pnpm --version
```
Must print `9.x.x` or higher (10.x and 11.x also work). If not installed:
```powershell
npm install -g pnpm
```
Then **close and reopen** your terminal so the new command is on the PATH.

### Check Git
```powershell
git --version
```
Any version is fine. If not installed: https://git-scm.com/downloads/win

---

## Step 1 — Clone the Repository

In Windows Terminal, navigate to wherever you keep projects (e.g. `C:\projects`) and run:

```powershell
git clone https://github.com/BugBasherX/KC-Class.git
cd KC-Class
```

Open the folder in VSCode:
```powershell
code .
```

When VSCode opens, a notification will appear: **"Do you want to install the recommended extensions?"** — click **Install All**. This adds Tailwind autocomplete, Prettier, ESLint, GitLens, and SQLTools.

---

## Step 2 — Install Dependencies

In the VSCode integrated terminal (`Ctrl+`` ` ``), run:

```powershell
pnpm install
```

This installs all packages for the frontend, API server, database layer, and shared libraries in one command. Expect 1–3 minutes on first run. You will see a progress bar followed by `Done in X.Xs`.

> **If you see `Error: Use pnpm instead of npm/yarn`:** you ran `npm install` or `yarn install`. Run `pnpm install` instead.

> **If pnpm is not recognized:** close VSCode completely, reopen it, and try again. If still missing, run `npm install -g pnpm` in PowerShell and reopen.

---

## Step 3 — Create Environment Files

The project needs two `.env` files — one for the frontend, one for the API server. These are never committed to Git.

### In File Explorer (easiest)
1. Navigate to the project folder
2. Open `artifacts\learn\` — right-click `.env.example` → **Copy** → **Paste** in the same folder → rename the copy to `.env`
3. Open `artifacts\api-server\` — right-click `.env.example` → **Copy** → **Paste** → rename to `.env`

### In PowerShell
```powershell
copy artifacts\learn\.env.example       artifacts\learn\.env
copy artifacts\api-server\.env.example  artifacts\api-server\.env
```

You should now have:
```
artifacts\
  learn\
    .env          ← frontend config (you just created this)
    .env.example  ← template (leave it as-is)
  api-server\
    .env          ← server config (you just created this)
    .env.example  ← template (leave it as-is)
```

---

## Step 4 — Set Up a Database

The API server needs a PostgreSQL database. Pick one option.

---

### Option A — Neon (free cloud, no install needed — recommended for beginners)

1. Go to https://neon.tech → **Sign Up** (free, no credit card)
2. Click **New Project** → name it anything → **Create Project**
3. On the dashboard, click **Connect** → copy the **connection string**:
   ```
   postgresql://username:password@ep-something.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Open `artifacts\api-server\.env` in VSCode and replace the `DATABASE_URL` line:
   ```env
   DATABASE_URL=postgresql://username:password@ep-something.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

---

### Option B — Local PostgreSQL

1. Download from https://www.postgresql.org/download/windows/ → run the installer (keep all defaults)
2. Set a password for the `postgres` user during install — **write it down**
3. After install finishes, verify PostgreSQL is running:
   - Press `Win+R`, type `services.msc`, press Enter
   - Find `postgresql-x64-XX` in the list — it should say **Running**
   - If it says Stopped: right-click → **Start**
4. Open **SQL Shell (psql)** from the Start menu, log in as `postgres`, and create the database:
   ```sql
   CREATE DATABASE learnhub;
   \q
   ```
5. Open `artifacts\api-server\.env` and set:
   ```env
   DATABASE_URL=postgresql://postgres:YOURPASSWORD@localhost:5432/learnhub
   ```

---

## Step 5 — Get Clerk Auth Keys

Clerk handles user sign-in and sign-up. You need a free Clerk account.

1. Go to https://dashboard.clerk.com → **Sign up** (free)
2. Click **Create application** → give it a name (e.g. `KC Class BHW`) → **Create**
3. On the left sidebar, click **API Keys**
4. Copy both keys:
   - **Publishable key** — starts with `pk_test_...`
   - **Secret key** — starts with `sk_test_...`

### Add to `artifacts\learn\.env`

Open the file in VSCode. It should look like this when filled in:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
VITE_API_URL=http://localhost:8080
PORT=3000
BASE_PATH=/
```

> **Do not add `VITE_CLERK_PROXY_URL` here.** That setting is only for custom production domains — adding it for local development will crash the app with a "Failed to load Clerk JS" error.

### Add to `artifacts\api-server\.env`

```env
PORT=8080
NODE_ENV=development
DATABASE_URL=postgresql://...your connection string from Step 4...
CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
```

> The `pk_test_...` publishable key must be the **same value** in both files.

---

## Step 6 — Push the Database Schema

This creates all the tables in your database (users, courses, lessons, resources, subscriptions, progress, downloads).

In the VSCode terminal:
```powershell
pnpm --filter @workspace/db run push
```

Expected output — you will be prompted to confirm, type `y` and press Enter:
```
[✓] Changes applied
```

> **If you see `DATABASE_URL is not set`:**
> `artifacts\api-server\.env` is missing or the `DATABASE_URL=` line is empty. Go back to Step 5.

> **If you see `ECONNREFUSED 127.0.0.1:5432`:**
> Local PostgreSQL is not running. Open Services (`Win+R` → `services.msc`) → find `postgresql-x64-XX` → right-click → Start. Or switch to Neon (Step 4 Option A).

---

## Step 7 — Start the Servers

You need **two servers running at the same time** — the API server and the frontend. You have two ways.

### Option A — VSCode Task (one click, recommended)

1. Press `Ctrl+Shift+P`
2. Type `Tasks: Run Task` → press Enter
3. Select **Start Both (Full Stack)**

VSCode opens two dedicated terminals side by side automatically.

### Option B — Two PowerShell terminals manually

**Terminal 1 — API Server:**
```powershell
pnpm --filter @workspace/api-server run dev
```
Wait until you see:
```
{"level":30,"msg":"Server listening","port":8080}
```

**Terminal 2 — Frontend** (click `+` to open a new terminal):
```powershell
pnpm --filter @workspace/learn run dev
```
Wait until you see:
```
  ➜  Local:   http://localhost:3000/
```

---

## Step 8 — Open the App

Go to **http://localhost:3000** in your browser (Chrome or Edge).

You should see the KC Class BHW landing page. Click **Sign Up** to create your first account.

---

## Step 9 — Make Yourself Admin

After signing up on the site, you need to promote your account to admin so you can manage courses and content.

### Using SQLTools in VSCode (recommended)

1. In VSCode, press `Ctrl+Shift+P` → **SQLTools: New Connection**
2. Choose **PostgreSQL**
3. Fill in your connection details (host, port, database, user, password from Step 4)
4. Click **Test Connection** → then **Save**
5. Open the connection → run this to find your user:
   ```sql
   SELECT clerk_id, email, role FROM users;
   ```
6. Copy your `clerk_id`, then promote yourself:
   ```sql
   UPDATE users SET role = 'admin' WHERE clerk_id = 'user_PASTE_YOUR_ID_HERE';
   ```

### Using Neon SQL Editor (if you used Neon)

1. Open your Neon project → **SQL Editor** tab
2. Run:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
   ```

### Using psql (local PostgreSQL)

```powershell
psql -U postgres -d learnhub -c "UPDATE users SET role = 'admin' WHERE email = 'your@email.com';"
```

After updating, **refresh the page** in your browser. The **Admin** link appears in the navigation bar.

---

## Step 10 — Add Your First Course and Lessons

Go to http://localhost:3000/admin/courses and click **New Course**.

Fill in:
- **Title** — e.g. `B.Ed English Grammar Complete`
- **Description** — what students will learn
- **Category** — Grammar, Pedagogy, Phonetics, or Literature
- **Thumbnail URL** — any direct image URL (e.g. a Google Images direct link)
- Toggle **Published** on → click **Create Course**

### Add lessons

Click **Manage Lessons** on your course → **Add Lesson**:

- **Title** — lesson name
- **YouTube Video ID** — from your YouTube URL  
  e.g. `https://www.youtube.com/watch?v=dQw4w9WgXcQ` → the ID is `dQw4w9WgXcQ`
- **Duration (minutes)** and **Sort Order** (1 = first lesson)
- Toggle **Free Preview** on for 1–2 lessons so students can try before subscribing
- Toggle **Published** on → **Create Lesson**

> **Tip for premium lessons:** Publish the video as **Unlisted** on YouTube. Unlisted videos don't appear in YouTube search or on your channel page — only your website has the link.

---

## Daily Workflow

Every time you want to work on the project after first setup:

```powershell
# Option A — one click
Ctrl+Shift+P → Tasks: Run Task → Start Both (Full Stack)

# Option B — two terminals
pnpm --filter @workspace/api-server run dev   # Terminal 1
pnpm --filter @workspace/learn run dev         # Terminal 2
```

Then open **http://localhost:3000**.

- Frontend file changes → browser reloads automatically
- API server file changes → server rebuilds and restarts (~3 seconds)

---

## All Commands Reference

| Command | What it does |
|---|---|
| `pnpm install` | Install all dependencies (once after cloning) |
| `pnpm --filter @workspace/api-server run dev` | Start API server on port 8080 |
| `pnpm --filter @workspace/learn run dev` | Start frontend on port 3000 |
| `pnpm --filter @workspace/db run push` | Apply DB schema to your database |
| `pnpm run typecheck` | TypeScript check across all packages |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API hooks (only after editing `openapi.yaml`) |

---

## Project Structure

```
KC-Class\
├── artifacts\
│   ├── api-server\          Express API server (port 8080)
│   │   ├── src\routes\      API route handlers
│   │   ├── .env             Your local server config  ← YOU CREATE THIS
│   │   └── .env.example     Template to copy from
│   └── learn\               React frontend (Vite, port 3000)
│       ├── src\pages\       All page components
│       ├── src\components\  Shared UI components
│       ├── .env             Your local frontend config  ← YOU CREATE THIS
│       └── .env.example     Template to copy from
├── lib\
│   ├── db\                  PostgreSQL schema (Drizzle ORM)
│   ├── api-spec\            OpenAPI spec — source of truth for the API
│   ├── api-zod\             Auto-generated Zod validation schemas
│   └── api-client-react\    Auto-generated React Query hooks
├── scripts\                 Utility scripts
├── SETUP.md                 This file
├── LAUNCH_GUIDE.md          How to go live with eSewa payments
└── README.md                Full technical reference
```

---

## Troubleshooting

### `pnpm install` gives "ERROR: Please use pnpm"
You ran `npm install`. Run `pnpm install` instead.

### `pnpm` is not recognized as a command
Close VSCode completely and reopen it. If still missing, run `npm install -g pnpm` in PowerShell, then close and reopen.

### Blank white page or nothing loads at localhost:3000
1. Open DevTools in your browser: press `F12` → **Console** tab
2. If you see **`Missing VITE_CLERK_PUBLISHABLE_KEY`**: `artifacts\learn\.env` is missing or still has `pk_test_REPLACE_ME`. Go to Step 5.
3. If you see a network error: make sure the API server is running (Terminal 1 shows `Server listening port: 8080`)

### `Error: PORT environment variable is required`
`artifacts\api-server\.env` does not exist or is missing `PORT=8080`. Create it from `.env.example` (Step 3).

### `Error: DATABASE_URL is not set`
`artifacts\api-server\.env` is missing or the `DATABASE_URL=` line is empty or still has the placeholder. Fill it in (Step 4 and 5).

### `ECONNREFUSED 127.0.0.1:5432`
Local PostgreSQL is not running.
- Press `Win+R` → `services.msc` → find `postgresql-x64-XX` → right-click → **Start**
- Or switch to Neon (free cloud, Step 4 Option A) — no local install needed

### Schema push fails with `relation already exists`
The tables already exist from a previous run — this is fine. If you want a clean start:
```powershell
# Neon: use the SQL Editor on the Neon dashboard
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# Local PostgreSQL
psql -U postgres -c "DROP DATABASE learnhub;"
psql -U postgres -c "CREATE DATABASE learnhub;"
pnpm --filter @workspace/db run push
```

### Courses not loading / API errors in the browser console
1. Confirm Terminal 1 shows `Server listening  port: 8080`
2. Confirm `VITE_API_URL=http://localhost:8080` is in `artifacts\learn\.env`
3. Restart the API server terminal

### `Failed to load Clerk JS` error in the browser console
Your `artifacts\learn\.env` has a `VITE_CLERK_PROXY_URL=http://localhost:8080/...` line. This setting is only for custom production domains and will crash the app when using development keys.

**Fix:** Open `artifacts\learn\.env` and delete the `VITE_CLERK_PROXY_URL=...` line entirely, then hard-refresh the browser (`Ctrl+Shift+R`).

### Sign-in does not work / Clerk errors
- Confirm `VITE_CLERK_PUBLISHABLE_KEY` in `artifacts\learn\.env` matches `CLERK_PUBLISHABLE_KEY` in `artifacts\api-server\.env` — same value, same `pk_test_...` string
- Confirm you have an internet connection (Clerk needs it even in dev mode)

### TypeScript errors in VSCode editor but `pnpm run typecheck` passes
The editor is using the wrong TypeScript version.
- Press `Ctrl+Shift+P` → **TypeScript: Select TypeScript Version** → **Use Workspace Version**

### `Cannot find module '@workspace/db'` or similar
Run `pnpm install` again — a symlink may have been lost.

### VSCode task "Start Both (Full Stack)" doesn't appear
Close VSCode and reopen the project folder. The tasks come from `.vscode\tasks.json` which is included in the repo.

---

## VSCode Extensions

When the project opens, VSCode suggests all recommended extensions automatically. Click **Install All** when prompted.

| Extension | What it does |
|---|---|
| Prettier | Formats code on save |
| ESLint | Highlights code quality issues as you type |
| Tailwind CSS IntelliSense | Autocomplete for Tailwind class names |
| TypeScript (Nightly) | Better TypeScript language server |
| GitLens | Inline Git blame and file history |
| SQLTools + PostgreSQL Driver | Query your database from inside VSCode |
| Path IntelliSense | Autocomplete for file paths |

---

## Ready to Go Live?

See **LAUNCH_GUIDE.md** for publishing to the internet, connecting your eSewa merchant account for real NPR payments, and setting up a custom domain.
