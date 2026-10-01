# 13. NOTIFICATIONS

## 1. Notification Architecture
The notification system is designed to keep students informed of critical academic deadlines, Tribhuvan University examination routines, newly published course units, and account subscription updates.

## 2. Notification Channels
1. **In-App Announcements Bar & Modal:** Global broadcast banners posted by instructors from `/admin/announcements` displayed across student dashboards and the homepage.
2. **Toast Feedback Alerts:** Real-time feedback using Radix Toast / Sonner for micro-events (e.g., successful enrollment, password update, video playback errors).
3. **Email Notifications (Transactional):** Welcome emails, password reset links, and subscription activation notices.
4. **SMS / Viber / WhatsApp Alerts (Roadmap):** Direct urgent alerts for TU exam routine publication or emergency campus notices.

## 3. Notification Triggers & Priority
| Trigger Event | Priority | Channel | Target Audience |
|---|---|---|---|
| TU Examination Schedule Released | Urgent | In-App Banner + Global Notice | All Students |
| New Lesson Unit Uploaded | Normal | In-App Feed | Enrolled Students |
| Premium Subscription Granted | High | In-App Alert + Email | Individual Student |
| Scheduled System Maintenance | Low | Header Banner (24h in advance) | All Visitors |

## 4. Notification Failure Handling
- If email delivery fails via SMTP provider, a log entry is created with error code and the event is placed in a retry queue with exponential backoff (1m, 5m, 15m).
- In-app notices are persisted in the PostgreSQL database, guaranteeing students see them on their next login regardless of email status.
