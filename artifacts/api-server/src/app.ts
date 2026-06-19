import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

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

// HTTP security headers — removes X-Powered-By, adds HSTS, CSP, etc.
// crossOriginResourcePolicy: cross-origin is required so the frontend
// (on a different origin) can load images served from the API.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // Content-Security-Policy: allow Clerk and YouTube iframes
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://clerk.accounts.dev", "https://*.clerk.accounts.dev"],
        frameSrc: ["'self'", "https://www.youtube.com", "https://youtube.com", "https://*.clerk.accounts.dev"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://*.clerk.accounts.dev", "https://api.clerk.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", "data:"],
      },
    },
  }),
);

// Clerk Frontend API proxy — only active in production with live keys.
// In development (NODE_ENV=development) this is a no-op passthrough.
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

// Raw body for Clerk webhook signature verification — must be before express.json()
app.use("/api/webhooks/clerk", express.raw({ type: "application/json" }));

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
// General limiter: 120 requests per 15 minutes per IP (8/min average).
// Generous enough for normal use but blocks scrapers and runaway clients.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — please wait a moment and try again" },
  skip: (req) => req.path === "/healthz",
});

// Strict limiter for payment and auth-sensitive endpoints: 20 per 15 minutes.
// Prevents checkout/verify from being called in rapid loops.
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many payment requests — please wait before trying again" },
});

// Admin limiter: 200 requests per 15 minutes — admins do bulk work but
// we still protect against accidental runaway scripts or credential theft.
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many admin requests — please wait a moment" },
});

app.use("/api", generalLimiter);
app.use("/api/subscriptions/checkout", paymentLimiter);
app.use("/api/subscriptions/verify", paymentLimiter);
app.use("/api/admin", adminLimiter);

// ── Root health check ─────────────────────────────────────────────────────────
// Registered BEFORE clerkMiddleware so it is always reachable.
// Render's health check pings GET /healthz (configured in render.yaml).
// The full deep health check (including DB) lives at /api/healthz in the router.
app.get("/healthz", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Clerk auth middleware ─────────────────────────────────────────────────────
// Resolves the publishable key from the incoming request host so the same
// server can serve multiple Clerk custom domains. Falls back to
// CLERK_PUBLISHABLE_KEY when the host doesn't map to a custom domain.
app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

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
