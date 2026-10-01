# 11. PRIVACY & DATA

## 1. Privacy Principles
KC Class BHW adheres to data minimization: we only collect the minimum personal data required to provide learning services and verify academic subscriptions. We do not sell, rent, or monetize student information to advertising networks.

## 2. Data Inventory & Classification
| Data Field | Category | Purpose | Retention |
|---|---|---|---|
| Full Name | Personally Identifiable (PII) | Personalizing certificates & account identification | Active account life |
| Email Address | PII | Login credential & critical course notices | Active account life |
| Password Hash | Sensitive Security Credential | Authentication verification | Active account life (one-way bcrypt) |
| IP Address | Metadata / Telemetry | Rate limiting & security threat mitigation | 30 days in ephemeral server logs |
| Payment Reference | Financial Audit Data | Validating eSewa/Khalti fee transactions | 7 years (tax & accounting compliance) |
| Course Progress | Academic Activity Data | Resuming video lectures & tracking completion | Indefinite (or until user requests deletion) |

## 3. Data Processing & Storage
- Primary database hosted on PostgreSQL in secure data centers with encrypted storage-at-rest (AES-256).
- All transit data protected via TLS 1.3 encryption.

## 4. User Rights & Consent
- **Right to Access:** Students can view all stored personal information directly inside the `/settings` page.
- **Right to Rectification:** Students can update their name and profile information at any time.
- **Right to Erasure (Account Deletion):** Students can request permanent account deletion via support email; upon verification, user records and enrollments are scrubbed.
- **Data Export:** Admins can export user directories for reporting; students can request a machine-readable export of their enrollment history.

## 5. Third-Party Data Sharing
- **YouTube (Google LLC):** Embedded video players load directly from `youtube.com/embed`. When students play a video, YouTube's privacy policy applies. We configure `rel=0&modestbranding=1` to limit tracking and cross-site recommendations.
- **No Analytics Trackers:** No invasive third-party tracking scripts (such as Facebook Pixel or ad retargeters) are embedded on the platform.
