import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import router from "./routes";
import { logger } from "./lib/logger";
import { enhancedSecurityHeaders } from "./middleware/security";

const app: Express = express();

// Trust the first proxy hop — required when running behind Render's load
// balancer so req.ip returns the real client IP instead of the proxy IP.
// Without this, rate limiting and IP-based logging are inaccurate.
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    // Assign a request ID to every request so errors can be correlated
    genReqId: (req) => {
      const existing = req.headers["x-request-id"];
      return (Array.isArray(existing) ? existing[0] : existing) ?? crypto.randomUUID();
    },
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Enhanced security headers (nosniff, sameorigin frames, XSS protection, permissions policy)
app.use(enhancedSecurityHeaders);

// HTTP security headers — removes X-Powered-By, adds HSTS, CSP, etc.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        frameSrc: ["'self'", "https://www.youtube.com", "https://youtube.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      },
    },
  }),
);

app.use(cookieParser());

// CORS — allow the configured frontend origin(s).
// In production, CORS_ORIGIN MUST be set. If it is missing, we log an error
// and fall back to blocking all cross-origin requests (origin: false) to avoid
// accidentally opening the API to the world.
const corsOrigin: string[] | boolean = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : process.env.NODE_ENV === "production"
    ? (() => {
        logger.error(
          "CORS_ORIGIN env var is not set in production — cross-origin requests will be blocked. Set CORS_ORIGIN to your frontend URL on Render.",
        );
        return false;
      })()
    : true; // dev: allow all origins
app.use(cors({ credentials: true, origin: corsOrigin }));

// Body parsers — explicit limits prevent memory exhaustion from large payloads.
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: true, limit: "256kb" }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
// General: 120 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — please wait a moment and try again" },
  skip: (req) => req.path === "/healthz",
});

// Auth limiter: 10 attempts per 15 minutes — login / register are high-value targets
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts — please wait before trying again" },
});

// Payment limiter: 20 per 15 minutes
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many payment requests — please wait before trying again" },
});

// Admin limiter: 60 per 15 minutes (admins do work but 403s should lock quickly)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many admin requests — please wait a moment" },
});

app.use("/api", generalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/refresh", authLimiter);
app.use("/api/subscriptions/checkout", paymentLimiter);
app.use("/api/subscriptions/verify", paymentLimiter);
app.use("/api/admin", adminLimiter);

// ── Root health check ─────────────────────────────────────────────────────────
// Registered before API routes so it is always reachable without authentication.
// Render's health check pings GET /healthz (configured in render.yaml).
// The full deep health check (including DB) lives at /api/healthz in the router.
app.get("/healthz", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", router);

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: any, req: any, res: any, _next: any) => {
  const requestId = (req as any).id ?? "unknown";
  logger.error({ err, url: req.url, method: req.method, requestId }, "Unhandled error");
  const status = err?.status ?? err?.statusCode ?? 500;
  const message =
    status < 500 ? (err?.message ?? "Bad request") : "Internal server error";
  res.status(status).json({ error: message, requestId });
});

export default app;
