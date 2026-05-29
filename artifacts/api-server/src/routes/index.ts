import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import coursesRouter from "./courses";
import lessonsRouter from "./lessons";
import resourcesRouter from "./resources";
import progressRouter from "./progress";
import subscriptionsRouter from "./subscriptions";
import dashboardRouter from "./dashboard";
import adminRouter from "./admin";
import videosRouter from "./videos";
import webhooksRouter from "./webhooks";
import { ensureUser } from "./auth";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  res.json(HealthCheckResponse.parse({ status: "ok" }));
});

// Ensure every signed-in user has a row in the database.
// No-ops immediately for unauthenticated requests (public routes are unaffected).
// This is the fallback for when the Clerk webhook hasn't fired yet (e.g. local
// dev without a webhook configured, or the very first request after signup).
router.use(ensureUser);

router.use(coursesRouter);
router.use(lessonsRouter);
router.use(resourcesRouter);
router.use(progressRouter);
router.use(subscriptionsRouter);
router.use(dashboardRouter);
router.use(adminRouter);
router.use(videosRouter);
router.use(webhooksRouter);

export default router;
