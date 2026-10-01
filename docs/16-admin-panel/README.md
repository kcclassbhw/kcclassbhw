# 16. ADMIN PANEL

## 1. Admin Panel Overview
The Admin Panel (`/admin/*`) is the central control room for academic instructors and platform operators. It allows administrators to manage courses, organize syllabus modules, upload lesson notes, publish time-sensitive notices, approve subscription payments, and monitor registered student rosters.

## 2. Admin Roles & Permissions
- Access is strictly restricted via `requireAdmin` middleware on the API and client-side route guards in `App.tsx`.
- First user registered on an empty database is automatically assigned the `admin` role.
- Existing admins can promote other users to `admin` or demote them back to standard `user`.

## 3. Core Admin Sub-Modules
### 1. User Management (`/admin`)
- Real-time search across student names and emails.
- View user registration date, active role, and subscription status.
- One-click CSV Export button triggering `/api/admin/users/export`.
- "Grant Subscription" modal: input User ID (`usr_...`), choose plan duration (3, 6, 12 months), and activate instant premium access.

### 2. Courses Studio (`/admin/courses`)
- Create new courses: Title, Year (1st, 2nd, 3rd, 4th Year), Description, Thumbnail URL.
- Edit existing course metadata and reorder display sequence.
- Toggle publish/unpublish state to hide draft courses from students.

### 3. Lessons Studio (`/admin/lessons`)
- Filter lessons by course.
- Add lessons: Title, 11-character YouTube Video ID (e.g. `V57Z09P_XkM`), order index, markdown content.
- Toggle `isPremium` checkbox: Locks video and notes behind subscription paywall.
- Edit/Delete lessons with immediate cache invalidation.

### 4. Learning Resources Studio (`/admin/resources`)
- Attach downloadable PDF lecture notes, TU model question papers, and syllabus guides to specific lessons.
- Manage external document download links or cloud-stored files.

### 5. Announcements Studio (`/admin/announcements`)
- Compose urgent banners or general notices.
- Set priority flags (`high`, `normal`, `info`).
- Publish notices that display across student homepages and course dashboards.
