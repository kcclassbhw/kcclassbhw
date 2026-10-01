# 03. UX & INFORMATION ARCHITECTURE

## 1. Information Architecture
The platform is organized into three major zones:
1. **Public Discovery Zone:** Landing page, Course Catalog, Real-time Videos directory, Pricing, Announcements, and About page.
2. **Student Learning Portal:** Dashboard, Course Enrolment View, Sequential Lesson Player, Downloadable Materials, Profile & Account Settings.
3. **Administrative Operations:** Courses Manager, Lessons Manager, Learning Resources, User Roster & Subscription Granting, Announcements Studio.

```
[Public Visitor]
   │
   ├── / (Home & Hero)
   ├── /courses (Directory of B.Ed subjects)
   │     └── /courses/:id (Syllabus, outline, instructor)
   ├── /videos (Live YouTube Channel Feed)
   ├── /pricing (Subscription packages & payment details)
   ├── /sign-in & /sign-up (Authentication)
   │
[Authenticated Student]
   │
   ├── /dashboard (Enrolled courses, quick continue, recent activity)
   ├── /lessons/:id (Dedicated lesson player + notes + downloads)
   ├── /payment-verify (Submit payment reference / slip)
   └── /settings (Profile update, password change)
   │
[Administrator]
   │
   ├── /admin (Users table, CSV export, grant subscriptions)
   ├── /admin/courses (Add/edit courses)
   ├── /admin/lessons (Organize lessons, set video IDs, toggle premium)
   ├── /admin/resources (Manage downloadable notes/PDFs)
   └── /admin/announcements (Broadcast notice banners)
```

## 2. Sitemap
- `/` — Homepage (Hero, featured courses, recent YouTube uploads, benefits, testimonials, FAQ)
- `/courses` — Filterable courses grid (1st, 2nd, 3rd, 4th Year TU B.Ed English)
- `/courses/:id` — Course detail page with lesson accordion and enrollment action
- `/lessons/:id` — Focused distraction-free lesson player and lesson notes
- `/videos` — Direct real-time YouTube sync from `@kcclassbhw` with search & embedded modal player
- `/pricing` — Pricing cards, eSewa/Khalti QR instructions, feature comparison
- `/payment-verify` — Payment reference submission page
- `/sign-in` — Email/password login with redirect support
- `/sign-up` — Account registration with immediate auto-login
- `/dashboard` — Student personalized learning center
- `/settings` — Account details and credential updates
- `/admin` — Admin control center (Users, subscribers, exports)
- `/admin/courses` — Course CRUD and reordering
- `/admin/lessons` — Lesson CRUD and video link validation
- `/admin/resources` — PDF and notes attachment
- `/admin/announcements` — Global and targeted student announcements
- `*` — 404 Not Found page with friendly navigation back home

## 3. User Flows
### Flow A: Free Video Exploration
`Visitor lands on /` → `Clicks "Watch Free Videos"` → `Redirected to /videos` → `Searches "Phonetics"` → `Clicks thumbnail` → `Modal player opens with autoplay=1` → `Option to subscribe to YouTube or browse full course`.

### Flow B: Student Enrollment & Premium Access
`Student logs in at /sign-in` → `Browses /courses` → `Clicks Course` → `Sees locked premium badge` → `Visits /pricing` → `Scans Fonepay/eSewa QR` → `Submits Transaction Ref at /payment-verify` → `Admin receives and grants access in /admin` → `Student refreshes /lessons/:id and watches unmasked video`.

## 4. User Journey Maps
- **Discovery Stage:** Student searches for "TU B.Ed English 2nd year linguistics notes" on Google or YouTube. Finds KC Class BHW video or web page.
- **Evaluation Stage:** Explores syllabus alignment on `/courses`, notices clear structure, watches free preview lessons.
- **Conversion Stage:** Chooses 6-month or 1-year pass to unlock complete model question solutions and slide decks.
- **Advocacy Stage:** Shares lessons with college classmates on WhatsApp and Facebook student groups.

## 5. Screen / Page Inventory
| Screen Name | Route | Primary Action | Responsive Breakpoints |
|---|---|---|---|
| Home | `/` | Explore courses / Sign Up | Mobile, Tablet, Desktop |
| Course Catalog | `/courses` | Filter courses by year | Mobile 1-col, Desktop 3-col |
| Course Detail | `/courses/:id` | Start course / view syllabus | Mobile stacked, Desktop split |
| Lesson Room | `/lessons/:id` | Play video, download PDF | Mobile player-first, Desktop sidebar |
| Videos Feed | `/videos` | Search live uploads, play in modal | Responsive fluid grid |
| Admin Dashboard | `/admin/*` | Manage records, grant subscriptions | Desktop-optimized with mobile support |

## 6. Wireframes & Layout Foundations
- **Global Header:** Brand Logo (`KC Class BHW`), Main Navigation (Courses, Videos, Pricing, Announcements), Theme toggle (Dark/Light), User Avatar & Login/Register CTA.
- **Footer:** Academic disclaimer (TU syllabus references), Quick Links, YouTube channel link, Contact and WhatsApp support link.
- **Lesson Player Layout:** Top breadcrumb, 16:9 responsive video container with dark ambient background, collapsible lesson list drawer on mobile / sidebar on desktop, markdown notes panel underneath.

## 7. UX Specifications
- **Micro-Interactions:** Smooth hover lift on course cards (`transform: translateY(-4px)` with spring transition).
- **Video Loading Skeleton:** Shimmering placeholder matching 16:9 aspect ratio before embed load to prevent layout shifts (CLS = 0).
- **Toast Notifications:** Sonner / Radix toast pops up on actions (e.g., "Registration successful", "Link copied", "Profile updated").

## 8. Accessibility Requirements
- **Color Contrast:** Minimum 4.5:1 ratio for regular text and 3:1 for large text across dark and light themes.
- **Keyboard Navigation:** Full focus ring visibility (`focus-visible:ring-2`) across buttons, inputs, and links.
- **Screen Readers:** Explicit `aria-label` attributes on icon buttons (e.g. YouTube icon, Theme switch, Drawer close).
- **Media Transcripts:** Clean text summaries and downloadable notes provided below audio/video lectures for hearing-impaired students.

## 9. Responsive Requirements
- **Fluid Layouts:** Uses Tailwind CSS breakpoints (`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`).
- **Touch Targets:** Minimum 44x44px clickable areas on all mobile navigation links and buttons.
- **Mobile Drawer:** Accessible slide-out navigation sheet on viewports < 768px.
