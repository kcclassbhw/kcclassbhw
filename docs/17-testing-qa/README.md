# 17. TESTING & QA

## 1. Testing Strategy
KC Class BHW follows a multi-tier testing and quality assurance approach:
1. **Static Typing & Linting:** Strict TypeScript checks (`tsc --build` and `tsc -p tsconfig.json --noEmit`) across all monorepo workspaces.
2. **Bundle & Compilation Verification:** Production bundling via Vite and esbuild to identify import issues, asset resolution failures, or circular dependencies.
3. **API & Security Testing:** Verifying authentication token enforcement, rate limiting, and parameter validation.
4. **Manual End-to-End User Journeys (UAT):** Testing registration, login, video streaming, and admin operations.

## 2. Automated Test Commands
- **Full Monorepo Typecheck:**
  ```bash
  pnpm run typecheck
  ```
- **Frontend App Build Verification:**
  ```bash
  pnpm --filter @workspace/learn run build
  ```
- **Backend API Server Build Verification:**
  ```bash
  pnpm --filter @workspace/api-server run build
  ```

## 3. Test Cases Matrix
| Test Case ID | Feature Under Test | Input / Action | Expected Result | Status |
|---|---|---|---|---|
| TC-AUTH-01 | User Registration | Valid email, password (>=8 chars), name | 201 Created, HTTP-only cookie set, profile returned | Pass |
| TC-AUTH-02 | Disposable Email Rejection | Email ending with `@mailinator.com` | 400 Bad Request ("Disposable email domains not allowed") | Pass |
| TC-AUTH-03 | Password Brute Force | 11 consecutive failed attempts | 429 Too Many Requests ("Rate limit exceeded") | Pass |
| TC-VID-01 | YouTube RSS Sync | `GET /api/videos` | 200 OK, 15 real-time video objects from `@kcclassbhw` | Pass |
| TC-VID-02 | Video ID Syntax Validation | Admin enters `"invalid#id"` (not 11 chars) | 400 Bad Request ("Must be exactly 11 characters") | Pass |
| TC-PRM-01 | Premium Content Masking | Non-subscriber requests `GET /api/lessons/:id` | `videoUrl` and `youtubeVideoId` returned as `null` | Pass |
| TC-PRM-02 | Premium Content Unlocking | Subscriber requests `GET /api/lessons/:id` | Unmasked `youtubeVideoId` returned for embedding | Pass |
| TC-ADM-01 | First Admin Assignment | Register on clean DB | User assigned `role: "admin"` automatically | Pass |
| TC-ADM-02 | Unauthorized Admin Route | Normal user calls `GET /api/admin/users` | 403 Forbidden | Pass |

## 4. Cross-Browser & Device Compatibility
- Tested on Chromium (Chrome / Edge), WebKit (Safari iOS/macOS), and Gecko (Firefox).
- Responsive viewports: 375px (iPhone SE), 390px (iPhone 14/15), 768px (iPad Mini), 1024px (iPad Pro), 1440px (Desktop HD).
