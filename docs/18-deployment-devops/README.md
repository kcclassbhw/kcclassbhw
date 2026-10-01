# 18. DEPLOYMENT & DEVOPS

## 1. Deployment Architecture
KC Class BHW is designed for zero-hassle cloud deployment. The configuration is declared in `render.yaml` for unified infrastructure-as-code deployment on Render or Vercel:

```yaml
services:
  # ── API Server Web Service ──
  - type: web
    name: api-server
    runtime: node
    plan: starter
    buildCommand: pnpm install && pnpm --filter @workspace/api-server run build
    startCommand: node --enable-source-maps ./apps/api-server/dist/index.mjs
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: YOUTUBE_CHANNEL_ID
        value: UC77kf2jXTQvRl2vV3CI8oRA

  # ── Frontend Web Service / Static Site ──
  - type: web
    name: learn
    runtime: static
    buildCommand: pnpm install && pnpm --filter @workspace/learn run build
    staticPublishPath: ./apps/learn/dist/public
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

## 2. Environment Configuration
### Backend Environment (`apps/api-server/.env`)
- `PORT`: HTTP port to bind (default: `5000` locally, `10000` on Render).
- `NODE_ENV`: `"development"` or `"production"`.
- `DATABASE_URL`: PostgreSQL connection URI (`postgresql://user:password@host:5432/dbname?sslmode=require`).
- `JWT_SECRET`: High-entropy 32+ character string for HMAC-SHA256 signature.
- `YOUTUBE_CHANNEL_ID`: Channel ID (`UC77kf2jXTQvRl2vV3CI8oRA`).
- `CORS_ORIGIN`: Allowed frontend origin (e.g. `https://kcclassbhw.com`).

### Frontend Environment (`apps/learn/.env`)
- `VITE_API_URL`: Backend API base URL (e.g., `https://api.kcclassbhw.com` or empty for same-domain proxy).

## 3. Database Migration Deployment
Before launching new app versions with schema changes:
```bash
# Push schema updates directly to target database
DATABASE_URL="your-production-database-url" pnpm --filter @workspace/db run push
```

## 4. Release & Rollback Strategy
- **Atomic Git Deploys:** Every push to `main` triggers automated CI build and preview.
- **Rollback:** In the event of an unforeseen regression, Render/Vercel allows instant 1-click rollback to the previous active deployment hash in under 30 seconds.

## 5. Launch Pre-Flight Checklist
- [x] Run `pnpm run typecheck` across all workspaces (0 errors).
- [x] Verify Vite frontend production build (`pnpm --filter @workspace/learn run build`).
- [x] Verify esbuild API server production build (`pnpm --filter @workspace/api-server run build`).
- [x] Verify YouTube RSS feed parsing endpoint (`/api/videos`).
- [x] Confirm `JWT_SECRET` is set and exceeds 32 characters in production.
- [x] Confirm `DATABASE_URL` is pointing to an SSL-enabled production PostgreSQL instance.
