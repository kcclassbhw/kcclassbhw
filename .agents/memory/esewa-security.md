---
name: eSewa payment security
description: Security measures applied to the eSewa payment flow
---

## Rule
Always validate plan and amount server-side on payment verify. Use `FRONTEND_URL` env var for redirect URLs, never `req.headers.origin`.

**Why:** Without server-side plan validation, a user could pay for monthly and claim a yearly subscription by manipulating the request body. Without `FRONTEND_URL`, a spoofed `Origin` header could redirect post-payment to an attacker's site.

## Applied fixes (`artifacts/api-server/src/routes/subscriptions.ts`)
1. `validatedPlan` — only `"monthly"` or `"yearly"` accepted; any other value returns 400
2. Amount cross-check — `total_amount` in eSewa payload must match `expectedAmount` for the plan; mismatch returns 400
3. `FRONTEND_URL` env var — `success_url` and `failure_url` built from this, not from `Origin` header
4. Plan used consistently — `validatedPlan` used in DB write (not `plan` from request body)

## Sandbox vs production
- No `ESEWA_SECRET_KEY` + `ESEWA_ENV=production` → API returns 503 with friendly message
- Sandbox credentials in docs: ID `9806800001`, MPIN `1122`, Password `Nepal@123`
