# 12. PAYMENTS & BILLING

## 1. Payment Overview
Because a majority of university students in Nepal rely on domestic mobile digital wallets (eSewa, Khalti, IME Pay) and Fonepay QR code scanning from local banking apps (Global IME, NIC Asia, Nabil, Prabhu, etc.), the payment architecture supports both:
1. **Instant QR Code + Manual Reference Verification (Active):** Zero-friction payment where students scan the official merchant/personal QR code, enter the payment code/bank slip reference, and admins approve access within minutes.
2. **Automated Gateway Webhooks (Roadmap):** Direct programmatic settlement via eSewa EPAY and Khalti v2 APIs.

## 2. Pricing Plans
| Plan Name | Duration | Price (NPR) | Inclusions |
|---|---|---|---|
| **Free Starter** | Lifetime | **Rs. 0** | Access to all YouTube channel lessons, course outlines, and campus announcements. |
| **Semester Pass** | 6 Months | **Rs. 999** | Unlocks all premium lessons for 1 semester, model answers, and downloadable PDF slides. |
| **Annual Master Pass**| 12 Months | **Rs. 1,799** | Full access to all 4 years of TU B.Ed English courses, TSC exam prep materials, and instructor Q&A. |

## 3. Payment Verification Workflow
```
[Student on /pricing]
       │
       │ 1. Selects Plan (e.g. Annual Master Pass - NPR 1,799)
       │ 2. Scans KC Class BHW Fonepay / eSewa QR Code
       │ 3. Completes payment in banking app (takes screenshot & note of Txn ID)
       ▼
[Payment Submission Page /payment-verify]
       │
       │ 4. Submits Form:
       │    - User Email
       │    - Plan Selected
       │    - Transaction ID (e.g., "TXN-8947219")
       │    - Optional screenshot attachment / note
       ▼
[Admin Dashboard /admin]
       │
       │ 5. Admin verifies receipt against bank statement
       │ 6. Clicks "Grant Subscription"
       │    - Selects User ID (starts with usr_...)
       │    - Selects Plan & Duration
       ▼
[Database update]
       │
       │ 7. Creates/updates `subscriptions` table row (status: "active")
       │ 8. Student immediately has premium badge & video locks unmasked
```

## 4. Refund & Cancellation Policy
- **7-Day Satisfaction Guarantee:** If course materials do not align with the student's TU college syllabus, a full refund can be requested within 7 days of purchase.
- **Processing Time:** Refunds are processed back to the original source digital wallet (eSewa/Khalti) within 2 business days.
