# 19. MONITORING & OPERATIONS

## 1. Logging Architecture
- **Framework:** Pino (`pino` and `pino-http`).
- **Log Format:** Asynchronous structured JSON output in production for machine parsing and log aggregation (e.g. Datadog, Better Stack, or Render Log Streams).
- **Log Levels:** `debug` (local dev), `info` (normal operational requests), `warn` (rate limit hits, 4xx responses), `error` (unhandled exceptions, database query failures).
- **Data Redaction:** Sensitive headers (Authorization tokens, Cookies) and password fields are excluded from log outputs.

## 2. Health Check Monitoring
- Root endpoint `GET /` and `/healthz` respond with HTTP 200 and JSON status indicator:
  ```json
  {
    "status": "healthy",
    "uptime": 14285.3,
    "timestamp": "2026-10-01T14:50:00.000Z"
  }
  ```
- Cloud load balancers and uptime monitors (e.g. UptimeRobot, BetterUptime) poll every 60 seconds.

## 3. Performance & Resource Monitoring
- **Memory Footprint:** The combined Node.js Express process uses < 75MB of RAM at idle and scales up to 150MB under load.
- **CPU Utilization:** Monitored via hosting dashboard; target < 40% CPU under normal load.
- **Database Connection Pool:** Kept at a moderate pool size (typically 10-20 connections) to prevent exhausting serverless Postgres limits.

## 4. Runbook for Common Operational Incidents
### Incident A: 502 Bad Gateway on `/api/videos`
- **Cause:** YouTube RSS feed unreachable, rate limited, or timeout.
- **Resolution:** Check `apps/api-server/src/routes/videos.ts`. Cached videos will continue to serve for up to 10 minutes. If persistent, verify outgoing network access from server.

### Incident B: Database Connection Error (`DATABASE_URL`)
- **Cause:** PostgreSQL host rotated credentials or paused serverless compute.
- **Resolution:** Verify Neon / Supabase database is active; update `DATABASE_URL` in environment secrets and restart container.
