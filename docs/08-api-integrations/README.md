# 08. API & INTEGRATIONS

## 1. API Requirements
- RESTful HTTP API built with Express 5.
- Standard JSON request/response formats.
- Clear HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `429 Too Many Requests`, `500 Server Error`, `502 Bad Gateway`).
- Cookie-based authentication (`auth_token`) with optional `Authorization: Bearer <token>` fallback.

## 2. API Endpoints Specification

### Authentication Endpoints (`/api/auth`)
- `POST /api/auth/register` — Register a new account.
  - Body: `{ email: string, password: string, name: string }`
  - Response: `{ user: UserResponse, token: string }` + `Set-Cookie: auth_token`
- `POST /api/auth/login` — Sign in with email and password.
  - Body: `{ email: string, password: string }`
  - Response: `{ user: UserResponse, token: string }` + `Set-Cookie: auth_token`
- `POST /api/auth/logout` — Invalidate user session and clear `auth_token` cookie.
- `GET /api/auth/me` — Retrieve current authenticated user profile.
  - Auth required: Yes (Cookie or Bearer).
- `PATCH /api/auth/profile` — Update name or bio.
- `POST /api/auth/change-password` — Update user account password.

### Courses Endpoints (`/api/courses`)
- `GET /api/courses` — List all published courses with lesson counts.
- `GET /api/courses/:id` — Retrieve course details and module lesson syllabus.
- `POST /api/courses` — (Admin only) Create a new course.
- `PATCH /api/courses/:id` — (Admin only) Update course metadata.
- `DELETE /api/courses/:id` — (Admin only) Delete course.

### Lessons Endpoints (`/api/lessons`)
- `GET /api/lessons/:id` — Retrieve lesson details.
  - **Security behavior:** If the lesson is marked `isPremium: true` and the requesting client is not a subscriber or admin, `videoUrl` and `youtubeVideoId` are stripped (`null`), returning only the title and description with an unlock prompt.
- `POST /api/lessons` — (Admin only) Create a lesson. Validates 11-char YouTube ID.
- `PATCH /api/lessons/:id` — (Admin only) Update a lesson.
- `DELETE /api/lessons/:id` — (Admin only) Delete a lesson.

### Real-Time YouTube Videos Endpoints (`/api/videos`)
- `GET /api/videos` — Real-time fetch from YouTube channel RSS feed (`https://www.youtube.com/feeds/videos.xml?channel_id=UC77kf2jXTQvRl2vV3CI8oRA`).
  - Cached in-memory for 10 minutes (`CACHE_TTL_MS = 600,000`).
  - Returns array of `{ id, title, description, publishedAt, thumbnailUrl, videoUrl, viewCount, likeCount }`.

### Admin Operations Endpoints (`/api/admin`)
- `GET /api/admin/users` — List registered users with search, pagination, and subscription flags.
- `POST /api/admin/users/:userId/role` — Grant or revoke admin privileges.
- `POST /api/admin/subscriptions/grant` — Grant active subscription to a user.
  - Body: `{ userId: string, plan: string, durationMonths: number }`
- `GET /api/admin/users/export` — Stream users list as a downloadable `.csv` file.

### Announcements Endpoints (`/api/announcements`)
- `GET /api/announcements` — List active public broadcast notices.
- `POST /api/announcements` — (Admin only) Publish a new announcement.
- `DELETE /api/announcements/:id` — (Admin only) Remove announcement.

## 3. Rate Limiting Rules
- **General API:** 100 requests per 15 minutes per IP.
- **Auth Routes (`/api/auth/*`):** 10 requests per 15 minutes per IP to prevent brute-force attacks.
- **Video Sync (`/api/videos`):** 30 requests per minute with server-side in-memory cache.

## 4. YouTube Integration Specification
- **Channel Handle:** `@kcclassbhw`
- **Channel ID:** `UC77kf2jXTQvRl2vV3CI8oRA`
- **Method:** HTTPS RSS Feed Reader (`/feeds/videos.xml?channel_id=...`).
- **Advantage:** Zero Google Cloud API quota consumption, no API key expiration, instantaneous sync as soon as a video is uploaded to YouTube.
- **Parser Resilience:** XML entity decoding (`&amp;`, `&quot;`, `&#39;`, numeric code points), regex-based field extraction for title, views, description, and thumbnail.

## 5. Webhooks & Payment Gateway Integrations (Roadmap)
- **eSewa EPAY Webhook:** Verification via `https://uat.esewa.com.np/epay/transrec` using `amt`, `scd`, `pid`, `rid`.
- **Khalti Payment Gateway:** Verification via `POST https://khalti.com/api/v2/payment/verify/` with Secret Key.
