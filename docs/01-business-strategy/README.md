# 01. BUSINESS & STRATEGY

## 1. Project Brief
**KC Class BHW** is an online learning platform tailored specifically for Tribhuvan University (TU) Bachelor of Education (B.Ed) English major students in Nepal. It centralizes curriculum-aligned video lectures (syndicated from the KC Class BHW YouTube channel), lecture notes, downloadable model question papers, and premium course materials into a modern, fast, mobile-friendly web application.

## 2. Vision & Mission
- **Vision:** To become the premier digital learning companion for education students across Nepal, bridging geographical divides and making top-tier teacher-training education accessible anywhere.
- **Mission:** Provide structured, syllabus-aligned, high-clarity video lessons, examination guides, and study materials with zero barriers to entry for free content, and low-cost subscriptions for premium masterclasses.

## 3. Problem Statement
1. **Scattered Resources:** Students across regional campuses (Bhairahawa, Butwal, Pokhara, Kathmandu, etc.) struggle with fragmented study materials, outdated textbooks, and absent lecture recordings.
2. **Connectivity Constraints:** Heavy international LMS platforms consume high bandwidth, have expensive dollar-denominated subscriptions, and lack local payment integration.
3. **Examination Readiness:** TU B.Ed English examinations demand strict academic formats (pedagogical frameworks, phonetic transcriptions, literary analysis) which students rarely find synthesized in one place.

## 4. Goals & Objectives
- **Short-Term (0–6 Months):**
  - Launch web platform with 100% curriculum coverage for B.Ed 1st, 2nd, 3rd, and 4th-year English core subjects.
  - Onboard 1,500 active registered students from TU constituent and affiliated colleges.
  - Maintain a 99.9% uptime on API server and frontend with sub-second page loads.
- **Long-Term (6–24 Months):**
  - Integrate interactive mock quizzes and past 10-year TU solved question banks.
  - Partner with local education colleges in Lumbini Province and Bagmati Province.
  - Expand to M.Ed English and general teaching license preparation modules.

## 5. Market Research
- Over 80,000 students enroll in TU B.Ed programs annually across 60+ constituent campuses and 500+ affiliated private colleges.
- Over 75% of tertiary students in Nepal consume educational content via smartphones on Ncell/Namaste 4G and home fiber connections.
- Existing YouTube channels suffer from low engagement tracking, lack of accompanying PDF notes, and inability to organize videos hierarchically into sequential courses.

## 6. Competitor Analysis
| Feature / Competitor | Generic YouTube | International LMS (Udemy/Coursera) | KC Class BHW |
|---|---|---|---|
| **TU B.Ed Syllabus Alignment** | Partial / Disorganized | None | **100% Strict TU Syllabus** |
| **Downloadable Notes & Slides** | Description links (often broken) | Rare / English only | **Integrated per-lesson resources** |
| **Local Nepali Payment (eSewa/Khalti/QR)** | None | None (Card/USD only) | **Native NPR Fonepay/eSewa/Khalti** |
| **Video Quality & Speed** | Standard | High | **Optimized YouTube embed + CDN** |
| **Affordability** | Ad-supported | Expensive ($15–$100) | **Free tier + Affordable NPR plans** |

## 7. Target Audience
- Primary: Tribhuvan University B.Ed English 1st, 2nd, 3rd, and 4th-year undergraduates.
- Secondary: Teachers Service Commission (TSC / Shikshak Sewa Aayog) English secondary/lower secondary aspirants.
- Tertiary: In-service English teachers seeking modern pedagogical techniques.

## 8. User Personas
### Persona 1: Sunita Shrestha (B.Ed 2nd Year, Bhairahawa Multiple Campus)
- **Age:** 21
- **Needs:** Clear explanations of Phonetics and Linguistics; model questions for upcoming annual board exams; ability to study late on Android phone.
- **Pain Points:** Missed classes during harvest/travel season; textbook language is dense; needs summary notes in PDF.

### Persona 2: Ramesh Chaudhary (B.Ed 4th Year & TSC Aspirant, Butwal)
- **Age:** 24
- **Needs:** Advanced Literature analysis, Teaching English as a Foreign Language (TEFL) lesson plans, and past paper solutions.
- **Pain Points:** Cannot afford expensive coaching institutes in Kathmandu; wants curated video access with guaranteed syllabus coverage.

## 9. Value Proposition
- **For Students:** Complete academic syllabus mapped directly to TU question patterns, crystal-clear explanations in bilingual contexts (English + Nepali pedagogical clarifications), and downloadable revision notes.
- **For Educators:** Structured delivery of lectures, automated tracking of views, and direct broadcast of announcements to all students.

## 10. Business Model
- **Freemium Platform:**
  - **Free Tier:** Access to all public video lectures synced directly from YouTube, public announcements, and course outlines.
  - **Premium Pro Tier:** Access to exclusive masterclasses, downloadable PDF lecture notes, solved past exams, assignment guidelines, and direct instructor Q&A sessions.

## 11. Revenue Model
1. **Subscription Passes:**
   - Term Pass (6 Months): NPR 999
   - Annual Pass (12 Months): NPR 1,799
2. **Subject Bundles:**
   - Single Subject Mastery (e.g., Phonetics & Phonology Complete): NPR 499 one-time.
3. **Institutional Licensing (Future):**
   - Bulk access passes for partner colleges and coaching centers.

## 12. Pricing Strategy
- **Localized Value Pricing:** Priced at roughly 10% of traditional offline tuition fees (NPR 15,000–25,000 per term in physical institutes).
- **Frictionless Onboarding:** Instant QR payment submission with rapid admin verification or direct payment integration.

## 13. Budget & Resource Allocation
- **Hosting & Infrastructure:** ~$15–$30/month (Render / Neon PostgreSQL / Vercel Edge).
- **Content Creation & Recording Equipment:** High-grade condenser microphones, graphic tablets, presentation decks.
- **Maintenance & DevOps:** Zero licensing fees through lightweight open-source stack (Express + React + Drizzle).

## 14. Project Scope
- **In Scope:**
  - Responsive web application (desktop, tablet, mobile).
  - Native JWT authentication (sign-up, login, logout, password hashing).
  - YouTube RSS real-time feed synchronization.
  - Course, Module, Lesson, and Resource management.
  - Admin management dashboard (courses, lessons, resources, announcements, user roles, manual subscription approval).
- **Out of Scope for Initial Release:**
  - Live WebRTC 1-on-1 video streaming (handled via embedded live events/recorded video).
  - Physical textbook distribution.

## 15. Risk Assessment
| Risk | Severity | Mitigation Strategy |
|---|---|---|
| YouTube API rate limits | Medium | RSS feed caching with 10-minute in-memory TTL; fallback to database video IDs. |
| Account sharing among students | Medium | Single active session token per device or IP limit; JWT short expiration with renewal. |
| Server downtime during exam months | High | Stateless Express container running on high-availability cloud; Neon autoscaling Postgres. |
| Payment fraud with fake bank slips | Low | Transaction ID unique check and manual admin verification dashboard before activating subscription. |

## 16. Success Metrics / KPIs
- **Monthly Active Users (MAU):** Target > 2,500 students in Month 3.
- **Course Completion Rate:** > 65% of enrolled lessons watched.
- **Subscription Conversion:** > 8% conversion rate from free viewers to premium subscribers.
- **API Performance:** 95th percentile latency < 150ms for lesson and course endpoints.
- **Zero Critical Security Vulnerabilities:** 100% adherence to OWASP top 10 guidelines.
