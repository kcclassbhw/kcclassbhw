# 14. ANALYTICS

## 1. Analytics Strategy
KC Class BHW prioritizes student privacy, website performance, and actionable academic insights. We measure student learning engagement and syllabus completion without installing privacy-intrusive ad trackers or selling user browsing patterns.

## 2. Key Metrics Tracked
- **User Acquisition:** Daily and monthly student registrations, referral sources (YouTube video descriptions, college WhatsApp groups, organic Google search).
- **Learning Engagement:**
  - Most watched subjects (e.g. Phonetics vs. Linguistics vs. TEFL).
  - Lesson completion rates (percentage of lessons viewed per enrolled course).
  - Download frequency of PDF model question papers.
- **Platform Health:** API response times, 4xx/5xx error frequencies, and YouTube RSS cache hit ratio.
- **Monetization & Conversion:** Ratio of free visitors upgrading to 6-month or 1-year premium passes.

## 3. Conversion Funnel Definition
```
Step 1: Visitor lands on Home or /videos (100%)
   │
   ▼
Step 2: Browses /courses or watches free preview lesson (60%)
   │
   ▼
Step 3: Registers for free account (25%)
   │
   ▼
Step 4: Views /pricing and initiates QR payment (8%)
   │
   ▼
Step 5: Admin confirms payment & grants active subscription (6.5%)
```

## 4. Privacy-Friendly Implementation
- Video view telemetry relies on YouTube's embedded analytics for channel-wide statistics.
- Platform analytics are calculated directly from internal application tables (`users`, `subscriptions`, `lessons`) without third-party surveillance scripts.
