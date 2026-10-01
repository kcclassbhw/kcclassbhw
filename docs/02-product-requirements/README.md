# 02. PRODUCT REQUIREMENTS

## 1. Product Requirements Document (PRD) Overview
KC Class BHW provides an academic portal where students discover, watch, and learn from structured TU B.Ed English courses while administrators manage courses, track student subscriptions, post announcements, and maintain content integrity.

## 2. Functional Requirements (FRD)
### Student Features
- **FR-01 (Authentication):** Users must be able to register with their full name, valid email, and secure password.
- **FR-02 (Login/Logout):** Users can log in to obtain secure session cookies and clear their session on logout.
- **FR-03 (Course Catalog):** Users can browse all courses, view syllabus details, instructor info, lesson lists, and preview sample lessons.
- **FR-04 (Video Player):** Users can play lesson videos embedded with YouTube video IDs without distracting external recommendations or ads.
- **FR-05 (Real-time YouTube Feed):** Users can visit `/videos` to view the latest channel uploads fetched live from the YouTube RSS feed with search and filter capabilities.
- **FR-06 (Lesson Notes & Resources):** Subscribed students can download PDF slides, reading materials, and question papers linked to specific lessons.
- **FR-07 (Subscription Purchase):** Students can submit payment details (eSewa / Khalti / bank slip reference) to request premium access.
- **FR-08 (Announcements):** Students can read time-sensitive campus notices and exam reminders broadcast by admins.

### Admin Features
- **FR-09 (Course Management):** Create, update, reorder, publish, or unpublish courses with custom thumbnails and descriptions.
- **FR-10 (Lesson Management):** Add lessons under courses, specify video IDs, set premium flags, and add markdown content.
- **FR-11 (Resource Management):** Upload or attach downloadable file links (PDFs, PPTs, DOCX) to lessons.
- **FR-12 (User & Role Management):** View all registered users, promote users to admin role, or inspect user registration history.
- **FR-13 (Subscription Approval):** Manually grant or revoke active subscription status to users upon payment confirmation.
- **FR-14 (Data Export):** Export active users list to CSV format for offline reporting and record-keeping.

## 3. Non-Functional Requirements (NFRD)
- **NFR-01 (Performance):** Page load time must be under 1.5 seconds on a 4G mobile connection.
- **NFR-02 (Availability):** Target 99.9% uptime during TU examination periods.
- **NFR-03 (Security):** Passwords hashed with bcrypt (salt factor 10). JWT tokens stored in HTTP-only, SameSite=Lax cookies.
- **NFR-04 (Compatibility):** Support modern browsers (Chrome >= 100, Safari >= 15, Firefox >= 100, Edge >= 100).
- **NFR-05 (Accessibility):** Adhere to WCAG 2.1 Level AA standards for color contrast, keyboard navigation, and aria labels.
- **NFR-06 (Maintainability):** Modular monorepo with strict TypeScript typing across frontend, backend, and database schemas.

## 4. Feature Requirements Matrix
| Feature Code | Feature Description | Priority | Target User |
|---|---|---|---|
| FT-AUTH-01 | Self-service registration & login | P0 (Must have) | All |
| FT-CRS-01 | Course & lesson hierarchical viewer | P0 (Must have) | All |
| FT-VID-01 | YouTube RSS real-time channel feed | P0 (Must have) | All |
| FT-PRM-01 | Premium video lock / unlock logic | P0 (Must have) | Students / Admin |
| FT-ADM-01 | Admin portal for content & user management | P0 (Must have) | Admins |
| FT-PAY-01 | Manual payment verification submission | P1 (Should have) | Students |
| FT-ANN-01 | Banner & modal announcements | P1 (Should have) | All |
| FT-SRCH-01 | Client-side fuzzy search on videos & courses | P1 (Should have) | All |

## 5. User Stories
- **US-01:** As a B.Ed 1st-year student, I want to filter videos by "Phonetics" so that I can prepare for my oral examination.
- **US-02:** As a student, I want to watch lessons without ads so that I remain focused on study material.
- **US-03:** As an unsubscribed student, I want to see which lessons are premium so that I understand what additional content I unlock upon purchasing.
- **US-04:** As an admin, I want to enter an 11-character YouTube video ID when creating a lesson so that students can watch the video embedded directly inside the course interface.
- **US-05:** As an admin, I want to export the user directory as CSV so that I can cross-check fee receipts against college accounts.

## 6. Use Cases
### UC-01: Student Enrolling in a Course
1. Student navigates to `/courses` and selects "Foundations of Language and Linguistics".
2. Student clicks "Enroll / Start Learning".
3. System checks student's session.
4. If free course: student is granted immediate lesson access.
5. If premium course and student has no active subscription: system displays the subscription dialog with QR payment instructions.

### UC-02: Admin Publishing a New Lesson
1. Admin logs in and opens `/admin/lessons`.
2. Admin selects course, inputs lesson title, order index, YouTube Video ID (e.g., `V57Z09P_XkM`), and marks `isPremium`.
3. Backend validates YouTube ID syntax (`/^[a-zA-Z0-9_-]{11}$/`).
4. System commits lesson to PostgreSQL and invalidates lesson cache.
5. Lesson immediately appears in the course outline for enrolled students.

## 7. Acceptance Criteria
- Given an unauthenticated visitor, when they click on a premium lesson, they are redirected to `/sign-in` or prompted to subscribe.
- Given an invalid YouTube ID format (e.g. 5 characters or containing invalid punctuation), the backend rejects the insert with HTTP 400.
- Given a valid subscription, the API server includes `videoUrl` and `youtubeVideoId` in the lesson response payload.
- Given a non-subscriber, the API server strips `videoUrl` and `youtubeVideoId` from premium lessons before sending JSON to the client.

## 8. Business Rules
- **Rule 1 (First Admin Auto-Provisioning):** When the database contains 0 registered users, the first user who registers automatically receives the `admin` role. All subsequent registrations receive the `user` role.
- **Rule 2 (Content Protection):** Premium lesson video identifiers must NEVER be leaked in API responses to unverified or unsubscribed clients.
- **Rule 3 (Email Uniqueness):** Emails must be unique across the platform, sanitized (lowercased, trimmed), and validated against disposable temporary email domains.

## 9. Edge Cases & Handling
- **Disrupted Internet during Video Playback:** YouTube player native buffering handles dropped frames; app shell remains cached.
- **Expired Auth Token:** Axios/Fetch interceptor detects HTTP 401, clears invalid local state, and prompts the user to log in again without crashing the page.
- **YouTube RSS Feed Outage:** API returns cached entries (TTL 10 mins); if cache is empty, handles 502 gracefully with fallback UI messaging.

## 10. User Roles & Permissions
| Role | View Public Courses | View Premium Lessons | Download Resources | Post Announcements | Manage Courses | Grant Subscriptions |
|---|---|---|---|---|---|---|
| **Guest** | Yes | No | No | No | No | No |
| **Free User** | Yes | No | Free only | No | No | No |
| **Subscriber** | Yes | **Yes** | **Yes** | No | No | No |
| **Admin** | Yes | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** |

## 11. Product Roadmap
- **Q1 2026:** Release MVP with native JWT auth, real-time YouTube RSS sync, course player, and manual payment verification.
- **Q2 2026:** Add automated eSewa and Khalti direct API payment verification webhooks.
- **Q3 2026:** Add interactive practice quizzes and flashcards for TU B.Ed English terminologies.
- **Q4 2026:** Launch Progressive Web App (PWA) with offline reading note support and push notifications.
