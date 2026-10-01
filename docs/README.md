# MASTER PROJECT DOCUMENTATION
## KC Class BHW — Tribhuvan University B.Ed English E-Learning Platform

---

### Navigation Index

| # | Section | Description |
|---|---|---|
| **01** | [01. Business & Strategy](./01-business-strategy/README.md) | Vision, mission, market research, revenue models, and KPIs |
| **02** | [02. Product Requirements](./02-product-requirements/README.md) | PRD, FRD, NFRD, user stories, use cases, and roadmap |
| **03** | [03. UX & Information Architecture](./03-ux-information-architecture/README.md) | Sitemap, user flows, wireframes, and responsive requirements |
| **04** | [04. UI & Brand](./04-ui-brand/README.md) | Design system, colors, typography, and motion guidelines |
| **05** | [05. Content](./05-content/README.md) | Strategy, copy, error messages, and email/notification templates |
| **06** | [06. Technical Architecture](./06-technical-architecture/README.md) | System architecture, monorepo stack, and deployment topologies |
| **07** | [07. Database](./07-database/README.md) | Drizzle schema, ERD, tables, indexes, and migration strategies |
| **08** | [08. API & Integrations](./08-api-integrations/README.md) | REST APIs, YouTube RSS pipeline, and payment gateways |
| **09** | [09. Authentication & Access](./09-authentication-access/README.md) | Native JWT auth, RBAC, session cookies, and security |
| **10** | [10. Security](./10-security/README.md) | Threat model, CSP, Helmet, rate limiting, and incident response |
| **11** | [11. Privacy & Data](./11-privacy-data/README.md) | Data protection, retention, GDPR/Nepali privacy considerations |
| **12** | [12. Payments & Billing](./12-payments-billing/README.md) | Nepal payment gateways (eSewa/Khalti/QR), manual approval flow |
| **13** | [13. Notifications](./13-notifications/README.md) | In-app announcements, banner alerts, and future email/SMS |
| **14** | [14. Analytics](./14-analytics/README.md) | Privacy-friendly event tracking, metrics, and funnel analysis |
| **15** | [15. SEO — Website](./15-seo-website/README.md) | Meta tags, OpenGraph, JSON-LD schemas, and sitemaps |
| **16** | [16. Admin Panel](./16-admin-panel/README.md) | Course management, user approval, subscription grants, and CSV |
| **17** | [17. Testing & QA](./17-testing-qa/README.md) | QA plans, test cases, automated suites, and cross-browser matrices |
| **18** | [18. Deployment & DevOps](./18-deployment-devops/README.md) | Render/Vercel pipelines, environment setups, and rollback plans |
| **19** | [19. Monitoring & Operations](./19-monitoring-operations/README.md) | Pino logging, health checks, uptime monitoring, and runbooks |
| **20** | [20. Legal](./20-legal/README.md) | Terms of Service, Privacy Policy, Copyright, and TU compliance |
| **21** | [21. Mobile App](./21-mobile-app/README.md) | PWA capabilities, responsive viewport design, and mobile roadmap |
| **22** | [22. Documentation](./22-documentation/README.md) | User manuals, Admin guide, Developer onboarding, and API reference |
| **23** | [23. Post-Launch](./23-post-launch/README.md) | Launch verification, known issues, changelog, and continuous growth |

---

### Project Overview
- **Name:** KC Class BHW
- **Target Audience:** Bachelor of Education (B.Ed) English specialization students under Tribhuvan University (TU), Nepal.
- **Tech Stack:**
  - **Frontend:** React 19, TypeScript, Tailwind CSS, Radix UI, Lucide Icons, Wouter routing, TanStack Query.
  - **Backend:** Node.js, Express 5, TypeScript, Drizzle ORM, PostgreSQL (Neon / Supabase / Railway), Pino Logger.
  - **Authentication:** Native JWT with HTTP-only cookies and bcrypt password hashing.
  - **Integrations:** Real-time YouTube RSS feed parsing (`@kcclassbhw`), local Nepalese payment workflows.
