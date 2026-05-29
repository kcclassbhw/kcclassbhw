# Security & Policy

This document describes the security architecture, controls, and responsible disclosure policy for **KC Class BHW** — a subscription-based B.Ed English learning platform.

---

## Table of Contents

1. [Reporting a Vulnerability](#1-reporting-a-vulnerability)
2. [Supported Versions](#2-supported-versions)
3. [Authentication & Identity](#3-authentication--identity)
4. [Authorization & Access Control](#4-authorization--access-control)
5. [Payment Security](#5-payment-security)
6. [Transport Security](#6-transport-security)
7. [HTTP Hardening](#7-http-hardening)
8. [Rate Limiting](#8-rate-limiting)
9. [Dependency Security](#9-dependency-security)
10. [Secrets & Environment Variables](#10-secrets--environment-variables)
11. [Logging & Monitoring](#11-logging--monitoring)
12. [Data Handling](#12-data-handling)
13. [Known Accepted Risks](#13-known-accepted-risks)

---

## 1. Reporting a Vulnerability

If you discover a security vulnerability, please **do not open a public GitHub issue**. Contact the maintainer privately:

- **Email:** _(maintainer email — fill in before publishing)_
- **Subject line:** `[SECURITY] KC Class BHW — <brief description>`

Include:
- A description of the vulnerability and its potential impact
- Steps to reproduce (screenshots, curl commands, or a minimal proof of concept)
- Any suggested fix, if you have one

**Response commitment:**
- Acknowledgement within **3 business days**
- Assessment and triage within **7 business days**
- Fix timeline communicated once the issue is confirmed

We will credit researchers who report valid issues (with their permission) once a fix is released.

---

## 2. Supported Versions

Only the latest deployed version on the production domain is actively maintained and receives security fixes. No backport policy exists at this time — fixes are released as new deployments.

---

## 3. Authentication & Identity

Authentication is handled entirely by **Clerk** (Replit-managed tenant). The platform does not implement its own password system.

| Mechanism | Detail |
|---|---|
| Provider | Clerk (OAuth + email/password, configurable per-tenant) |
| Session tokens | Short-lived JWTs issued and verified by Clerk |
| Token verification | `@clerk/express` `clerkMiddleware` validates every request before routes run |
| Frontend calls | All Clerk API calls are proxied through the Express API server (`/clerk` path). The frontend never calls Clerk's FAPI directly |
| User sync | `ensureUser` middleware runs on every authenticated request: creates a DB row on first visit (via Clerk's API), kept in sync by Clerk webhooks thereafter |
| Webhook verification | Clerk webhooks at `/api/webhooks/clerk` use `express.raw()` + Svix signature verification before any payload is processed |

Session secrets (`SESSION_SECRET`) are stored as environment variables and never committed to source control.

---

## 4. Authorization & Access Control

Three tiers of access are enforced server-side on every request. Client-side route guards are a UX convenience only — they are not the security boundary.

| Middleware | What it checks | Applied to |
|---|---|---|
| `requireAuth` | Valid Clerk session (any authenticated user) | Lesson progress, dashboard |
| `requireActiveSubscription` | Authenticated + `subscriptions.status = 'active'` row in DB | Resource vault, PDF downloads |
| `requireAdmin` | Authenticated + `users.role = 'admin'` row in DB | Course/lesson CRUD, admin dashboard, user management |

**Role assignment:** Admin role is stored in the `users` table and can only be set by an existing admin via `PATCH /api/admin/users/:clerkId/role`. It is never self-assignable.

**Subscription check:** The middleware queries the `subscriptions` table directly — it does not rely on any client-supplied claim.

---

## 5. Payment Security

Payments are processed through **eSewa** (Nepal's leading digital wallet).

| Control | Implementation |
|---|---|
| Checkout signature | Every checkout form POST is signed with HMAC-SHA256 using `ESEWA_SECRET_KEY`. The signature covers `total_amount`, `transaction_uuid`, and `product_code` |
| Payment verification | After a user returns from eSewa, the server calls eSewa's Status Check API directly to verify `transaction_uuid` and `status`. User-supplied return parameters are never trusted alone |
| No webhooks | eSewa does not use server-side webhooks; verification is done by the server calling eSewa's API — there is no signature verification gap |
| Sandbox mode | When `ESEWA_ENV=sandbox` (or no env vars set), eSewa's test environment (`EPAYTEST`) is used. No real money changes hands |
| Rate limiting | Checkout and verify endpoints are limited to **20 requests per 15 minutes per IP** (see Section 8) |
| Secret storage | `ESEWA_SECRET_KEY` is stored as an environment variable. It is never logged, echoed in responses, or committed to source control |

---

## 6. Transport Security

| Context | Configuration |
|---|---|
| Production API (Render) | HTTPS enforced by Render's load balancer. All HTTP traffic is redirected to HTTPS |
| Frontend (Vercel) | HTTPS enforced by Vercel. HTTP is automatically redirected |
| Database (Neon) | TLS required. In production (`NODE_ENV=production`), `rejectUnauthorized: true` — full certificate chain verification against trusted CAs |
| Development | `rejectUnauthorized: false` for Neon connections only. This relaxes Windows root-store validation that sometimes fails; the connection is still TLS-encrypted |
| Proxy trust | `app.set("trust proxy", 1)` — trusts the first proxy hop (Render's load balancer) so `req.ip` reflects the real client IP for rate limiting and logging |

---

## 7. HTTP Hardening

**Helmet** (`helmet` npm package) is applied globally and sets the following headers on every response:

| Header | Effect |
|---|---|
| `Strict-Transport-Security` | Instructs browsers to only connect over HTTPS (HSTS) |
| `X-Content-Type-Options: nosniff` | Prevents MIME-type sniffing |
| `X-Frame-Options: SAMEORIGIN` | Blocks clickjacking via iframes |
| `Content-Security-Policy` | Restricts which sources can load scripts, styles, and media |
| `X-Powered-By` | Removed — does not advertise the framework |

**CORS** is configured via the `CORS_ORIGIN` environment variable:
- **Production:** only the configured frontend domain(s) are allowed (`CORS_ORIGIN=https://your-frontend.vercel.app`)
- **Development:** open (`*`) to simplify local testing
- Credentials (`cookies`, `Authorization` headers) are enabled

---

## 8. Rate Limiting

Applied per IP address using `express-rate-limit`. Standard rate-limit headers (`RateLimit-*`) are returned on every response.

| Scope | Limit | Applies to |
|---|---|---|
| General API | 120 requests / 15 min | All `/api/*` routes (except `/api/healthz`) |
| Payment endpoints | 20 requests / 15 min | `/api/subscriptions/checkout`, `/api/subscriptions/verify` |

Exceeding a limit returns HTTP `429 Too Many Requests` with a JSON error message.

---

## 9. Dependency Security

Dependencies are audited on each scan cycle using OSV-Scanner (covers GitHub Security Advisories, OSV, NVD). Build-only packages (PostCSS, Vite, Picomatch, YAML parser) are excluded from production risk assessment.

**Active security overrides** in `pnpm-workspace.yaml`:

| Package | Override | Vulnerability addressed |
|---|---|---|
| `path-to-regexp` | `>=8.4.0` | ReDoS via sequential optional groups in Express routing (GHSA-j3q9-mxjg-w52f, GHSA-27v5-c462-wpq7) |
| `fast-uri` | `>=3.1.2` | Path traversal via percent-encoded dot segments + host confusion via encoded authority delimiters (GHSA-q3j6-qgpj-74h6, GHSA-v39h-62p7-jpjc) |
| `qs` | `>=6.15.2` | DoS via stringify crash on null/undefined entries (GHSA-q8mj-m7cp-5q26) |
| `esbuild` | `0.27.3` | Pinned safe version (drizzle-kit transitive dep) |

**Policy:**
- High/critical runtime vulnerabilities are patched within 7 days of discovery
- Build-tool-only vulnerabilities are tracked but do not block deployment
- `pnpm install` is run in CI to apply all overrides before each deployment

---

## 10. Secrets & Environment Variables

No secrets are committed to source control. All secrets are provisioned as environment variables on the deployment platform.

| Variable | Where set | Purpose |
|---|---|---|
| `DATABASE_URL` | Render (API), local `.env` | PostgreSQL connection string |
| `SESSION_SECRET` | Render (API), local `.env` | Express session signing |
| `ESEWA_SECRET_KEY` | Render (API) | eSewa HMAC payment signing |
| `ESEWA_PRODUCT_CODE` | Render (API) | eSewa merchant product code |
| `CORS_ORIGIN` | Render (API) | Allowed frontend origin(s) |
| `CLERK_SECRET_KEY` | Render (API) | Clerk backend key (auto-provisioned by Replit) |
| `CLERK_PUBLISHABLE_KEY` | Render (API), Vercel | Clerk frontend key (auto-provisioned by Replit) |
| `CLERK_WEBHOOK_SECRET` | Render (API) | Svix signature for Clerk webhooks |

**Rules:**
- `.env` files are listed in `.gitignore` and must never be committed
- Secrets are never logged, never included in error responses, and never exposed in client-side bundles
- Secret rotation: after any suspected exposure, rotate immediately in the deployment dashboard and redeploy

---

## 11. Logging & Monitoring

Structured JSON logging via **Pino** (`pino-http`). Log entries include:

- Request ID, HTTP method, URL path (query strings are stripped before logging)
- Response status code
- Timing information

**What is never logged:**
- Request bodies (which may contain passwords or payment data)
- Authorization headers or tokens
- Database query parameters containing user data

Error responses from the global error handler (`500` range) log the full error server-side but return only a generic `"Internal server error"` message to the client — internal details are never leaked.

---

## 12. Data Handling

| Data type | Storage | Notes |
|---|---|---|
| User identities | Clerk (primary) + `users` table (mirror) | Name, email, avatar — synced from Clerk |
| Passwords | Clerk only | Never stored or processed by this application |
| Payment records | `subscriptions` table | Stores eSewa `transactionId`, plan, status, dates. No card numbers or wallet credentials |
| Lesson progress | `progress` table | Stores `watchedSeconds` and `completed` per user per lesson |
| Download tracking | `downloads` table | Records which resources a subscriber has downloaded |

The platform does not collect or store:
- Payment card numbers or wallet PINs (handled entirely by eSewa's hosted flow)
- Device fingerprints or behavioral tracking data
- Third-party advertising identifiers

---

## 13. Known Accepted Risks

The following findings were evaluated and accepted — they are not exploitable in this application's usage pattern:

| Finding | Reason accepted |
|---|---|
| `js-cookie` prototype hijack (GHSA-qjx8-664m-686j) | Clerk manages all cookie writes internally. This application never calls `Cookies.set()` with user-controlled attributes |
| `lodash` template code injection (GHSA-r5fr-rjxr-66jc) | `_.template()` is never called anywhere in this codebase. Lodash is a transitive build dep only |
| `picomatch`, `brace-expansion`, `postcss`, `yaml` CVEs | These packages are build-tool-only (Vite, Tailwind, drizzle-kit) and are not included in the production server bundle |
| `videos.ts` RegExp false positive (Semgrep) | `RegExp()` is called with hardcoded XML tag name strings (`yt:videoId`, `title`, etc.) from the YouTube RSS schema — they are not user-controlled input |

---

_Last reviewed: May 2026. Update this document whenever new controls are added or accepted risks change._
