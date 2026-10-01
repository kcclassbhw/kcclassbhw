# 22. DOCUMENTATION & OPERATOR GUIDE

## 1. Quick Start Setup Guide (Local Development)

### Prerequisites
- Node.js >= 22.0.0
- pnpm >= 10.0.0
- A PostgreSQL database (local or Neon/Supabase)

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Configure Environment Variables
1. **API Server:**
   ```bash
   # Windows
   copy apps\api-server\.env.example apps\api-server\.env
   # Mac/Linux
   cp apps/api-server/.env.example apps/api-server/.env
   ```
   Open `apps/api-server/.env` and supply:
   - `DATABASE_URL=postgresql://user:password@localhost:5432/kcclassbhw`
   - `JWT_SECRET=super-secret-random-key-at-least-32-chars-long`

2. **Frontend:**
   ```bash
   # Windows
   copy apps\learn\.env.example apps\learn\.env
   # Mac/Linux
   cp apps/learn/.env.example apps/learn/.env
   ```

### Step 3: Run Database Migrations
```bash
pnpm --filter @workspace/db run push
```

### Step 4: Start Dev Servers
```bash
# Terminal 1 — Start Express backend (runs on port 5000)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Start Vite frontend (runs on port 3000 / 5173)
pnpm --filter @workspace/learn run dev
```

---

## 2. Administrator Manual
1. **Initial Admin Creation:**
   - On a fresh database, visit `/sign-up` and register your account.
   - The first user automatically becomes the system `admin`.
2. **Managing Lessons & YouTube IDs:**
   - Navigate to `/admin/lessons`.
   - Select the target course.
   - To link a video, paste the 11-character YouTube video ID (found at the end of the YouTube URL, e.g. `https://youtube.com/watch?v=V57Z09P_XkM` → ID is `V57Z09P_XkM`).
   - Check `isPremium` if the video is restricted to paid subscribers.
3. **Granting Student Subscriptions:**
   - Open `/admin`.
   - Locate the student in the user directory or search by email. Note the User ID (`usr_...`).
   - Click "Grant Subscription", enter the User ID, select 3, 6, or 12 months, and click "Grant".
4. **Publishing Announcements:**
   - Open `/admin/announcements`.
   - Enter headline, body, and priority level. Published notices display immediately across student dashboards.

---

## 3. Developer Reference
- **Check Types Across All Packages:** `pnpm run typecheck`
- **Build Frontend App:** `pnpm --filter @workspace/learn run build`
- **Build Backend Bundle:** `pnpm --filter @workspace/api-server run build`
