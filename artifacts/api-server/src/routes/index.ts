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

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  res.json(HealthCheckResponse.parse({ status: "ok" }));
});

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
