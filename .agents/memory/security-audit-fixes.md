---
name: Security audit fixes
description: Summary of adversarial audit findings and what was fixed vs what needs manual action for KC Class BHW
---

## All fixes applied (TypeScript clean ✅)

### CRIT
- **CRIT-01** `GET /courses/:courseId/lessons` strips `videoUrl`/`youtubeVideoId` from premium lessons for non-subscribers. Uses `getAuth(req)` + subscription lookup.
- **CRIT-02** `POST /progress/:lessonId` gates on active subscription for non-free lessons before writing.
- **CRIT-03** `UpdateUserRoleBody.role` is `zod.enum(["user","admin"])` in both `lib/api-zod/src/generated/api.ts` and `lib/api-spec/openapi.yaml`.
- **CRIT-04** `POST /subscriptions/ipn` endpoint added — handles eSewa server-to-server IPN; handles both base64-encoded and raw field formats; always responds 200 to prevent eSewa retries.

### HIGH
- **HIGH-03** `sanitizeLessonInput()` in `lessons.ts` validates `youtubeVideoId` (11-char `/^[a-zA-Z0-9_-]{11}$/`), `videoUrl`, `thumbnailUrl` (https:// only). Applied to POST + PATCH lesson routes.
- **HIGH-07** Admin CSV export + role-change write to `audit_logs` table (fire-and-forget `.catch(()=>{})`).

### MED
- **MED-05** Dynamic sitemap at `GET /api/public/sitemap.xml` — queries published courses, emits XML with `<lastmod>`, `<priority>`, `<changefreq>`.
- **MED-06** `lessons.ts` schema: `courseId` now has `.references(() => coursesTable.id, { onDelete: "cascade" })`.
- **MED-08** `.github/workflows/ci.yml` — installs, typechecks, builds, checks OpenAPI drift.

### LOW
- **LOW-01** Skip-to-main-content link in `layout.tsx`; `<main id="main-content">`.
- **LOW-02** `loading="lazy"` on YouTube iframes in `lesson.tsx` and `videos.tsx`.
- **LOW-04** JSON-LD `Course` schema injected in `course-detail.tsx` via `<script type="application/ld+json">` with `<\/` XSS escape.
- **LOW-07** `lib/db/src/schema/audit-logs.ts` created; exported from schema index; migration `0002_security_fixes.sql` written.

## Pending manual steps (prod)
1. **Run migration** `lib/db/migrations/0002_security_fixes.sql` against the production Neon DB. Adds FK constraint and `audit_logs` table.
   - If orphaned lessons exist, delete them first: `DELETE FROM lessons WHERE course_id NOT IN (SELECT id FROM courses);`
2. **Register eSewa IPN URL** in eSewa Merchant Dashboard → Integration Settings → IPN URL: `https://<api-render-url>/api/subscriptions/ipn`
3. **Update robots.txt** Sitemap directive to `https://<api-render-url>/api/public/sitemap.xml` once API URL is known.

**Why:** These require access to external systems (Neon prod DB, eSewa dashboard) that can't be done from code alone.
