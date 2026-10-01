# 06. TECHNICAL ARCHITECTURE

## 1. Technical Requirements
- Monorepo architecture managed via `pnpm` workspaces.
- Strict type-safety across client, server, and database layers.
- High efficiency, low latency runtime suitable for low-bandwidth regions in Nepal.
- Zero reliance on heavy third-party vendor lock-in auth (self-contained native JWT).

## 2. Software Architecture
The system uses a modern decoupled architecture:
```
┌─────────────────────────────────────────────────────────────┐
│                 Client Layer (Browser / PWA)                │
│       React 19 + TypeScript + Vite + Tailwind CSS           │
│       Wouter Router + TanStack Query + Radix UI             │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON API
                               │ Credentials: include (Cookies)
┌──────────────────────────────▼─────────────────────────────┐
│                 Backend API Server (Node.js)                │
│       Express 5 + TypeScript + Helmet + CORS                │
│       Pino Logger + Rate Limiter + Cookie Parser            │
│       Native JWT Auth Engine (bcryptjs + jsonwebtoken)      │
└──────────────┬──────────────────────────────┬───────────────┘
               │ Drizzle ORM                  │ HTTPS Fetch
               │ SQL Queries                  │ (Cached RSS)
┌──────────────▼─────────────┐ ┌──────────────▼──────────────┐
│  PostgreSQL Database       │ │  YouTube RSS / Video Feed   │
│  (Neon / Supabase Server)  │ │  @kcclassbhw Channel        │
│  Users, Courses, Lessons   │ │  ID: UC77kf2jXTQvRl2vV3CI8oRA│
└────────────────────────────┘ └─────────────────────────────┘
```

## 3. Monorepo Organization
```
kcclassbhw/
├── apps/
│   ├── learn/                  # Frontend SPA (Vite + React 19)
│   │   ├── src/
│   │   │   ├── components/     # UI primitives & design system
│   │   │   ├── hooks/          # React hooks (useSEO, useMobile)
│   │   │   ├── lib/            # AuthContext, QueryClient, API utils
│   │   │   ├── pages/          # Route components (Home, Courses, Lesson, etc.)
│   │   │   └── index.css       # Tailwind & custom tokens
│   │   └── vite.config.ts      # Chunking, alias, and dev proxy config
│   │
│   └── api-server/             # Backend API (Express 5 + Node)
│       ├── src/
│       │   ├── routes/         # auth, courses, lessons, videos, admin, etc.
│       │   ├── middleware/     # Auth guard, rate limiters, logging
│       │   ├── app.ts          # Express setup, Helmet, CORS, routers
│       │   └── index.ts        # Entry point and preflight checks
│       └── build.mjs           # esbuild bundling script
│
├── lib/
│   ├── db/                     # Drizzle ORM schemas & migrations
│   │   ├── migrations/         # SQL migration files
│   │   └── src/schema/         # users, courses, lessons, subscriptions
│   │
│   └── api-zod/                # Shared Zod validation schemas
│
├── docs/                       # Master Project Documentation
└── package.json                # Monorepo root and typecheck scripts
```

## 4. Technology Stack
| Layer | Technology | Justification |
|---|---|---|
| **Monorepo Manager** | pnpm 10+ workspaces | Fast dependency symlinking, isolated catalogs, disk-efficient. |
| **Frontend Framework** | React 19 + TypeScript | Concurrent rendering, declarative UI, industry standard. |
| **Frontend Bundler** | Vite 7 | Sub-second HMR, optimized tree-shaking, lightweight production chunks. |
| **Routing** | Wouter | Tiny (~2KB) alternative to React Router with full nested matching. |
| **Styling** | Vanilla CSS + Tailwind | Maximum styling flexibility with no heavy runtime overhead. |
| **Backend Framework**| Express 5 (latest) | High throughput, stable middleware ecosystem, robust routing. |
| **Bundler (Backend)**| esbuild | Sub-second server bundle compilation to a standalone `.mjs` file. |
| **Database ORM** | Drizzle ORM | Zero-overhead type-safe SQL, automatic schema migrations. |
| **Database** | PostgreSQL | ACID compliance, JSONB support, relational integrity. |
| **Logger** | Pino + pino-http | Asynchronous ultra-fast JSON structured logging. |

## 5. Frontend Architecture
- **State Management:** TanStack Query (`@tanstack/react-query`) handles server state, caching, optimistic updates, and background refetching.
- **Client Auth Context:** React Context (`AuthContext`) manages `user`, `status`, `signIn`, and `signOut` state, synchronizing with the backend `/api/auth/me` endpoint.
- **Optimized Code Splitting:** `vite.config.ts` segments vendor bundles into distinct chunks (`vendor-react`, `vendor-radix`, `vendor-motion`, `vendor-query`) to maximize browser HTTP/2 caching.

## 6. Backend Architecture
- **Layered Structure:**
  1. **Transport / Middleware Layer:** CORS, Helmet CSP, Cookie Parser, JSON Parser, Pino Request Logger.
  2. **Security & Guard Layer:** JWT verification, Admin authorization guards, Rate limiters.
  3. **Route Handlers:** Input validation using Zod, business logic execution, response serialization.
  4. **Data Access Layer:** Drizzle query builder querying PostgreSQL via connection pooling.

## 7. Infrastructure & Hosting Strategy
- **Web App Hosting:** Render Web Service or Vercel static build deployment.
- **API Server Hosting:** Render Node Web Service with automated Docker / Node.js runtime.
- **Database Hosting:** Neon Serverless PostgreSQL with autoscaling and branching support.
- **Asset Delivery:** Global CDN edge caching for static assets (Vite production bundle in `dist/public`).

## 8. Third-Party Services
- **YouTube RSS Feed:** `https://www.youtube.com/feeds/videos.xml?channel_id=UC77kf2jXTQvRl2vV3CI8oRA` (Provides free, zero-quota video listing).
- **YouTube Player Embed:** `https://www.youtube.com/embed/{id}` with `rel=0&modestbranding=1` parameters for student distraction control.
