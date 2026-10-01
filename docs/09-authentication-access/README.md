# 09. AUTHENTICATION & ACCESS

## 1. Authentication Architecture
The platform features a **hybrid enterprise-grade authentication system** supporting both **Supabase Auth** (email/password, Google OAuth, self-service password reset) and a **native fallback JWT engine** (`bcryptjs` + `jsonwebtoken`). 

This architecture guarantees:
1. **Zero External Lock-in:** The system runs completely self-contained out-of-the-box even without third-party services.
2. **Modern Social & Password Recovery:** When Supabase environment variables are provided, students can sign in with Google or reset passwords with instant magic links.
3. **Seamless Backend Profile Sync:** All authenticated Supabase users are verified on the backend via `/api/auth/supabase-sync` and synchronized into the PostgreSQL database, preserving course progress, subscriptions, and roles.

```
                  ┌─────────────────────────────────────┐
                  │          Client (Browser)           │
                  │  React 19 + Unified AuthContext     │
                  └───────────────┬─────────────────────┘
                                  │
          ┌───────────────────────┴────────────────────────┐
          │ (If Supabase Configured)                       │ (Native Fallback)
          ▼                                                ▼
┌──────────────────┐                            ┌──────────────────────┐
│  Supabase Auth   │                            │  Express API Server  │
│  - Email/Pass    │                            │  - /api/auth/login   │
│  - Google OAuth  │                            │  - /api/auth/register│
│  - Reset Password│                            │  - Timing-safe bcrypt│
└─────────┬────────┘                            └──────────┬───────────┘
          │ Access Token (JWT)                             │
          ▼                                                │
┌────────────────────────────────────────────────────────┐ │
│  POST /api/auth/supabase-sync                          │ │
│  - Backend verifies token via Supabase Auth API        │ │
│  - Upserts user profile in Postgres (users table)      │ │
│  - Generates secure HttpOnly SameSite=Lax cookie       │ │
└────────────────────────┬───────────────────────────────┘ │
                         │                                 │
                         ▼                                 ▼
         ┌─────────────────────────────────────────────────────────┐
         │             PostgreSQL (Neon / Supabase)                │
         │      users, subscriptions, enrollments, roles           │
         └─────────────────────────────────────────────────────────┘
```

## 2. Supabase Integration
- **Client Configuration:** `apps/learn/src/lib/supabase.ts` initializes `@supabase/supabase-js` using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **Backend Verification:** `apps/api-server/src/lib/supabase.ts` verifies tokens using `supabaseServer.auth.getUser(token)`.
- **OAuth Support:** Google and GitHub OAuth available via `signInWithOAuth("google")`.
- **Password Recovery:**
  - Request link: `/forgot-password` (invokes `supabase.auth.resetPasswordForEmail`).
  - Update password: `/reset-password` (invokes `supabase.auth.updateUser`).

## 3. Native Registration & Password Policy
1. Client submits email, password, and name.
2. Backend validation checks:
   - **Password Complexity:** Minimum 8 characters, at least one letter, and at least one number/symbol.
   - **Disposable Email Protection:** Rejects domains on the disposable email blacklist.
   - **Input Sanitization:** Strips HTML/script injection from name and profile fields.
   - **Duplicate Email Prevention:** Unique check on `users.email`.
3. Password Hashing:
   - Salted and hashed using `bcrypt.genSalt(10)`.
4. First Admin Rule:
   - If the database has 0 registered users, the first user receives `role = "admin"`. All others receive `"user"`.

## 4. Login & Brute-Force Defense
1. Constant-time comparison (`timingSafeCompare`): Executes a dummy bcrypt compare when user does not exist, eliminating timing attacks that could reveal registered emails.
2. Brute-Force Throttling:
   - Tracks failed attempts per client IP and per email account.
   - 5 failed attempts in 15 minutes triggers an automatic 15-minute lockout with HTTP 429.
   - Cleared on successful credential validation.

## 5. Session & Cookie Security
- **Cookie Name:** `auth_token`
- **Flags:**
  - `httpOnly: true`: Inaccessible to client JavaScript (prevents XSS token theft).
  - `secure: true` in production (enforces TLS transmission).
  - `sameSite: "lax"`: Protects against cross-site request forgery (CSRF).
  - `maxAge: 30 days`: Seamless persistence for students.

## 6. Role-Based Access Control (RBAC)
- **`user`**: Public courses, free YouTube lessons, premium lessons (if active subscription).
- **`admin`**: Full access to course creation, lesson video management, subscription approvals, announcements, and user CSV exports.
