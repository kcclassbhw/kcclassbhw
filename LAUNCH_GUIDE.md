# KC Class BHW — Launch Guide

Go from a working deployment to a live platform accepting real student subscriptions.

**Prerequisites:** Complete `DEPLOY.md` first — your API is live on Render and your frontend is live on Vercel before starting here.

---

## Launch Checklist

Work through the steps below in order. Tick each one as you complete it.

- [ ] Step 1 — Promote yourself to admin on the live database
- [ ] Step 2 — Test a full payment end-to-end in sandbox mode
- [ ] Step 3 — Enable real eSewa payments (when ready)
- [ ] Step 4 — Add your real course content
- [ ] Step 5 — Connect a custom domain (optional)
- [ ] Step 6 — Tell your students

---

## Step 1 — Promote Yourself to Admin

After your first sign-up on the live site, you need to grant yourself admin access manually. This is a one-time operation.

### Option A — Run SQL directly on Neon (recommended)

1. Go to https://neon.tech → open your project → click **SQL Editor** in the left sidebar
2. Run this query (replace with your email):
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
   ```
3. Click **Run** — you should see `UPDATE 1`
4. Sign out and sign back in on your live Vercel site
5. The **Admin** link appears in the navigation bar

### Option B — Once you have one admin, promote others via the UI

Go to your live site → `/admin` → **Users** tab → find the user → change their role to **Admin**.

---

## Step 2 — Test a Full Payment in Sandbox Mode

Before accepting real money, run a complete payment test using eSewa's sandbox (test) environment. No eSewa account is needed — sandbox mode is always on by default.

1. Open your live Vercel site in a **private/incognito** browser window
2. Click **Get Started** → create a new test account (use a throwaway email)
3. Go to `/pricing` → click **Pay Monthly** or **Pay Yearly**
4. You are redirected to eSewa's sandbox at `rc-epay.esewa.com.np`
5. Log in with eSewa's test credentials:
   - **eSewa ID:** `9806800001` (also works: `9806800002` to `9806800005`)
   - **MPIN:** `1122`
   - **Password:** `Nepal@123`
6. Confirm the payment on the eSewa page
7. You are redirected back to `/payment/verify` on your site
8. The page shows "Payment successful" and redirects to `/dashboard`
9. The student's dashboard now shows **Active Subscription**
10. Open a premium lesson — it plays without restriction
11. Go to `/resources` — all downloads are accessible

If all 11 steps complete without errors, your payment flow is working correctly and you are ready for real payments.

---

## Step 3 — Enable Real eSewa Payments

> **Skip this step until you are ready to accept real NPR payments from students.** Sandbox mode is fully functional for testing.

### 3.1 — Get your eSewa merchant account

Apply at https://esewa.com.np/epay/merchant. Fill in your business details and wait for eSewa to approve your application. You will receive:

- A **Merchant Code** (also called Product Code) — e.g. `KCCLASS001`
- A **Secret Key** — a long string used to sign payment requests

### 3.2 — Add secrets to Render

1. Go to your Render Web Service → **Environment** tab
2. Add or update these variables:

   | Key | Value |
   |---|---|
   | `ESEWA_PRODUCT_CODE` | Your eSewa merchant code |
   | `ESEWA_SECRET_KEY` | Your eSewa secret key |
   | `ESEWA_MONTHLY_PRICE` | `299` (or your chosen NPR amount) |
   | `ESEWA_YEARLY_PRICE` | `2399` (or your chosen NPR amount) |
   | `ESEWA_ENV` | `production` |

3. Click **Save Changes** — Render redeploys automatically (1–2 minutes)

### 3.3 — Verify with one real payment

Make one real payment yourself:
1. Open your live site in an incognito window
2. Sign up with a real account and pay
3. Confirm the subscription appears in `/admin` → Subscriptions with the correct plan and expiry date

If that works, real payments are live.

---

## Step 4 — Add Your Real Course Content

> The database comes pre-seeded with 4 demo courses and 12 demo lessons. Delete or keep them as you prefer.

### Create a course

1. Go to your live site → `/admin/courses` (you must be signed in as admin)
2. Click **New Course**
3. Fill in:
   - **Title** — e.g. `B.Ed English Grammar — Complete`
   - **Description** — what students will learn in this course
   - **Category** — Grammar, Pedagogy, Phonetics, or Literature
   - **Thumbnail URL** — paste a direct image URL for the course cover photo (a YouTube thumbnail URL works well)
   - **Published** — toggle on to make it visible in the catalog
4. Click **Create Course**

### Add lessons to a course

1. From `/admin/courses`, click **Manage Lessons** on the course you just created
2. Click **Add Lesson** for each lesson:

   | Field | What to enter |
   |---|---|
   | Title | Lesson name shown in the list |
   | Description | Notes shown below the video player to students |
   | YouTube Video ID | The ID from your video URL (see below) |
   | Duration (minutes) | Shown in the lesson list |
   | Sort Order | `1` for first lesson, `2` for second, etc. |
   | Free Preview | Toggle ON for 1–2 lessons per course so students can preview before subscribing |
   | Published | Toggle ON to make the lesson visible |

3. Click **Create Lesson**

#### How to get your YouTube Video ID

Your video URL looks like:
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

The ID is everything after `?v=` — in this example: `dQw4w9WgXcQ`

> **Premium lessons:** Set the YouTube video to **Unlisted** before copying the ID. Unlisted videos do not appear in YouTube search or on your public channel page — only your website provides the link.

### Add downloadable resources (PDF notes, grammar charts)

1. Go to `/admin` → Resources section
2. Click **Add Resource**
3. Fill in:
   - **Title** — e.g. `B.Ed Grammar Charts — Full Set`
   - **Category** — e.g. `PDF Notes`, `Grammar Chart`
   - **File Type** — `pdf`, `zip`, or `video`
   - **Download URL** — direct link to the file (hosted on Google Drive, Dropbox, etc.)

Resources are subscriber-only — only students with an active eSewa subscription can download them.

---

## Step 5 — Connect a Custom Domain (Optional)

If you own a domain like `kcclassbhw.com`:

### Frontend (Vercel)

1. Go to your Vercel project → **Settings** → **Domains**
2. Click **Add Domain** → enter your domain (e.g. `kcclassbhw.com`)
3. Vercel shows you DNS records to add — typically:
   - An **A record** pointing to `76.76.21.21`
   - A **CNAME** for `www` pointing to `cname.vercel-dns.com`
4. Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.) and add those records
5. Wait 15–60 minutes for DNS propagation
6. Your site is live at `kcclassbhw.com`

### API server (Render)

1. Go to your Render Web Service → **Settings** → **Custom Domains**
2. Add `api.kcclassbhw.com` (or similar)
3. Follow Render's DNS instructions

### After adding custom domains — update two env vars on Render

Go to your Render Web Service → **Environment** → update:

| Key | New value |
|---|---|
| `CORS_ORIGIN` | `https://kcclassbhw.com` |
| `FRONTEND_URL` | `https://kcclassbhw.com` |

Click **Save Changes** → Render redeploys.

---

## Step 6 — Tell Your Students

Share these details with your students:

**Your website:** `https://your-app.vercel.app` (or your custom domain)

**What is free:**
- Browse all courses and see lesson lists
- Watch 1–2 free preview lessons per course
- Browse the Videos page (latest YouTube uploads)

**What requires a subscription:**
- All full lessons (premium)
- PDF notes and the resource vault
- Lesson progress tracking

**How to subscribe:**
- Go to `/pricing` → choose monthly (NPR 299) or yearly (NPR 2,399)
- Students need an eSewa account — most Nepali students already have one
- eSewa is available as a mobile app on Android and iOS

**Tip:** Set up 1–2 free preview lessons per course so students can try the content before subscribing.

---

## Ongoing — Adding New Content

### New YouTube video → Videos page

Nothing to do. The `/videos` page reads your YouTube channel's RSS feed and shows new uploads automatically within 10 minutes of publishing.

### New YouTube video → Premium lesson in a course

1. Upload the video to YouTube → set visibility to **Unlisted**
2. Go to your live site → `/admin/courses` → **Manage Lessons** on the relevant course
3. Click **Add Lesson** → paste the YouTube video ID → fill in title, duration, sort order
4. Toggle **Published** on → click **Create Lesson**

Students with active subscriptions can watch immediately.

---

## Redeploying After Code Changes

Whenever you push new code to the `main` branch on GitHub:

| Service | What happens automatically |
|---|---|
| Render | Rebuilds and redeploys the API server (~3 minutes) |
| Vercel | Rebuilds and redeploys the frontend (~1 minute) |

You do not need to do anything manually.

**Exception:** If you change the database schema (`lib/db/src/schema/`), run the schema push after the code is deployed:

```powershell
# Set the production DATABASE_URL and push
$env:DATABASE_URL="postgresql://...your neon connection string..."
pnpm --filter @workspace/db run push
```

---

## Troubleshooting Live Issues

| Symptom | Where to look | Fix |
|---|---|---|
| Blank page or JS error | Vercel → your project → **Functions** or browser DevTools | Check `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_API_URL` are set in Vercel environment |
| API calls failing (network error) | Browser DevTools → Network tab | Confirm `VITE_API_URL` points to your Render URL; confirm Render is running |
| Sign-in page crashes | Vercel environment variables | `VITE_CLERK_PUBLISHABLE_KEY` must be a `pk_live_...` key (not `pk_test_`) in production |
| "Database connection failed" | Render environment variables | Check `DATABASE_URL` is set and the Neon connection string is correct |
| eSewa payment fails | Render environment variables | Check `ESEWA_PRODUCT_CODE`, `ESEWA_SECRET_KEY`, `ESEWA_ENV=production`, `FRONTEND_URL` |
| Payment redirects to wrong URL | Render environment variables | Set `FRONTEND_URL=https://your-app.vercel.app` (no trailing slash) |
| Students can't sign in | Clerk dashboard | Confirm your Clerk application is set to **Production** mode |
| `/admin` shows "Access denied" | Neon SQL Editor | Run `UPDATE users SET role = 'admin' WHERE email = 'your@email.com';` |
| Videos page empty | Wait 10 minutes | RSS feed refreshes automatically every 10 minutes |
| Render is slow on first request | Expected on free tier | Server sleeps after 15 min inactivity; first request wakes it (~30 sec) |

---

## Quick Admin Links

| URL | What it does |
|---|---|
| `/admin` | Platform stats, user list, subscription list |
| `/admin/courses` | Create, edit, publish, delete courses |
| `/admin/courses/:id/lessons` | Add and manage lessons in a course |
| `/pricing` | What students see when subscribing |
| `/videos` | Auto-synced YouTube channel page |
| `/dashboard` | What a signed-in student sees |
| `/resources` | The resource vault (subscriber-only) |
| `/settings` | Profile and subscription management |
