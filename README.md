# KC Class BHW

A subscription-based B.Ed English learning platform built for students in Nepal.

Students can explore courses, watch free preview lessons, and subscribe through eSewa to unlock premium lessons, downloadable resources, grammar charts, and PDF notes.

---

## Features

### Public Access

* Browse the complete course catalog
* View course details and lesson lists
* Watch free preview lessons
* Explore the latest videos synced automatically from YouTube
* View subscription plans

### Student Features

* Secure sign-up and login with Clerk
* Track lesson progress
* Continue watching across devices
* Personal learning dashboard
* Subscription management

### Subscriber Features

* Unlimited access to premium lessons
* Downloadable PDF notes and grammar charts
* Resource vault access
* Download history tracking

### Admin Features

* Course management
* Lesson management
* Resource management
* User management
* Subscription management
* Revenue and platform statistics

---

## Subscription Plans

| Plan    | Price     |
| ------- | --------- |
| Monthly | NPR 299   |
| Yearly  | NPR 2,399 |

Payments are processed securely through eSewa.

---

## Tech Stack

| Layer          | Technology                           |
| -------------- | ------------------------------------ |
| Runtime        | Node.js 22+, TypeScript 5.9          |
| Frontend       | React 19, Vite 7                     |
| UI             | Tailwind CSS v4, shadcn/ui           |
| Routing        | wouter                               |
| Backend        | Express 5                            |
| Database       | PostgreSQL 15+, Drizzle ORM          |
| Authentication | Clerk                                |
| Payments       | eSewa v2                             |
| Validation     | Zod v4, drizzle-zod                  |
| API Contracts  | OpenAPI 3.1, Orval                   |
| Logging        | Pino                                 |
| Security       | Helmet, CORS, Clerk JWT Verification |

---

## Architecture

```text
Frontend (React + Vite)
        │
        ▼
API Server (Express)
        │
        ├── Clerk Authentication
        ├── eSewa Payments
        ├── YouTube RSS Sync
        │
        ▼
PostgreSQL (Drizzle ORM)
```

---

## Project Structure

```text
KC-Class/
│
├── artifacts/
│   ├── learn/              # React frontend
│   └── api-server/         # Express API
│
├── lib/
│   ├── api-spec/           # OpenAPI source
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas
│   └── db/                 # Drizzle schema
│
├── scripts/
├── DOCS.md
└── README.md
```

---

## Local Development

### Install Dependencies

```bash
pnpm install
```

### Start API Server

```bash
pnpm --filter @workspace/api-server run dev
```

### Start Frontend

```bash
pnpm --filter @workspace/learn run dev
```

### Type Checking

```bash
pnpm run typecheck
```

### Push Database Schema

```bash
pnpm --filter @workspace/db run push
```

---

## Documentation

Complete setup, deployment, payment configuration, and troubleshooting instructions are available in:

```text
DOCS.md
```

---

## Security

* Clerk JWT verification
* Svix webhook verification
* Helmet security headers
* HMAC-signed eSewa requests
* Server-side payment verification
* Role-based access control
* Subscription access enforcement

---

## Payment Flow

```text
Student
   │
   ▼
Choose Plan
   │
   ▼
eSewa Checkout
   │
   ▼
Payment Verification
   │
   ▼
Subscription Activated
   │
   ▼
Premium Content Unlocked
```

---

## License

Private project. All rights reserved.

---

Built for B.Ed English learners in Nepal.
