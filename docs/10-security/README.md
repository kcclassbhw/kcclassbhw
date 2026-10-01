# 10. SECURITY

## 1. Security Requirements Overview
KC Class BHW enforces defensive, defense-in-depth security principles across all monorepo layers to protect student data, intellectual property, and system availability.

## 2. Threat Modeling & Mitigation (STRIDE)
| Threat Category | Potential Attack Vector | Applied Mitigation |
|---|---|---|
| **Spoofing Identity** | Fake admin claim, credential brute force | Supabase Auth + JWT signed with HMAC-SHA256, bcrypt password hashing, sliding lockout after 5 failed attempts. |
| **Tampering with Data** | SQL injection in lesson or user search | Drizzle ORM parametrized SQL queries; strict Zod input parsing. |
| **Repudiation** | Denying subscription grants or modifications | Structured Pino logging records admin actions with timestamp and user ID. |
| **Information Disclosure** | Scraping premium video URLs without paying | `lessons.ts` route physically strips `videoUrl` and `youtubeVideoId` for non-subscribers. |
| **Denial of Service (DoS)** | Overwhelming YouTube feed or auth routes | `express-rate-limit` + 10-minute in-memory caching of RSS feeds. |
| **Elevation of Privilege** | Normal user calling `/api/admin/*` | `requireAdmin` middleware checks `req.user.role === 'admin'`. |

## 3. Best Security Implementations Added

### 1. Timing-Attack Defense (`timingSafeCompare`)
- In standard authentication, looking up non-existent emails immediately returns `401`, allowing attackers to measure response times to enumerate registered accounts.
- We implemented constant-time comparison: when a user is not found, a dummy bcrypt comparison is executed against a pre-computed hash, guaranteeing consistent response time regardless of user existence.

### 2. Brute-Force & Credential Stuffing Defense
- Implemented dual-key sliding-window rate tracking in `apps/api-server/src/middleware/security.ts`.
- Tracks failed login attempts by **IP address** and by **email account**.
- Reaching **5 failed attempts within 15 minutes** triggers an immediate **15-minute lockout** returning HTTP 429 ("Too many failed attempts. Please wait 15 minutes.").
- Successful logins immediately clear the attempt counter.

### 3. Password Complexity Policy
- Minimum 8 characters.
- Requires at least one alphabetical letter and at least one digit or special character.
- Prevents trivial passwords (`123456`, `password`).

### 4. Hardened HTTP Security Headers
Every API response includes:
- `X-Content-Type-Options: nosniff` (prevents MIME type sniffing).
- `X-Frame-Options: SAMEORIGIN` (prevents clickjacking attacks).
- `X-XSS-Protection: 1; mode=block` (browser XSS filtering).
- `Referrer-Policy: strict-origin-when-cross-origin` (prevents referrer leakage).
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()` (disables unused device APIs).

### 5. Content Security Policy (CSP)
Configured in `apps/api-server/src/app.ts`:
```typescript
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        frameSrc: ["'self'", "https://www.youtube.com", "https://youtube.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      },
    },
  })
);
```

## 4. Cross-Origin Resource Sharing (CORS)
- Strict origin whitelist (allowing only designated frontend domains and local dev servers).
- `credentials: true` enabled to permit secure HTTP-only cookies while rejecting wildcard `*` origins.

## 5. Input Validation & Sanitization
- Every request payload is validated against strict Zod schemas before touching business logic or the database.
- YouTube Video IDs are validated with `/^[a-zA-Z0-9_-]{11}$/` to prevent injection of malicious script tags into `<iframe>` embeds.
- Disposable email check blocks throwaway bot accounts.

## 6. Secret Management
- Zero hardcoded API keys or database credentials in version control.
- Secrets (`DATABASE_URL`, `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `YOUTUBE_CHANNEL_ID`) injected as environment variables.
- Server preflight checks halt startup immediately if critical configuration is missing.

## 7. Security Logging & Auditing
- Every HTTP request logged with method, route, status code, response time, and sanitized client IP.
- Error logs capture stack traces without leaking database passwords or authorization tokens.

## 8. Incident Response Plan
1. **Detection:** Alerts triggered via uptime monitor or high 5xx error spikes in Pino logs.
2. **Containment:** Rate limiter adjusted or affected server instance isolated.
3. **Eradication & Recovery:** Rollback bad commit or revoke compromised secrets.
4. **Post-Mortem:** Document root cause and deploy automated regression tests.
