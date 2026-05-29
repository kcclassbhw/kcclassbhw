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
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// Clerk Frontend API proxy — only active in production with live keys.
// In development (NODE_ENV=development) this is a no-op passthrough.
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

// Raw body for Clerk webhook signature verification — must be before express.json()
app.use("/api/webhooks/clerk", express.raw({ type: "application/json" }));

// CORS — allow the configured frontend origin(s). In development, allow all.
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : true;
app.use(cors({ credentials: true, origin: corsOrigin }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use("/api", generalLimiter);
app.use("/api/subscriptions/checkout", paymentLimiter);
app.use("/api/subscriptions/verify", paymentLimiter);

// ── Clerk auth middleware ─────────────────────────────────────────────────────
// In production the publishable key is derived from the request host when
// using the Clerk proxy. In development it always falls back to the env var.
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
  logger.error({ err, url: req.url, method: req.method }, "Unhandled error");
  const status = err?.status ?? err?.statusCode ?? 500;
  const message =
    status < 500 ? (err?.message ?? "Bad request") : "Internal server error";
  res.status(status).json({ error: message });
});

export default app;
