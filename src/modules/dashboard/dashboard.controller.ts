import { Router } from "express";
import { authentication } from "../../common/middleware/authentication";
import { adminOnly } from "../../common/middleware/adminOnly";
import dashboardService from "./dashboard.service";

const dashboardRouter = Router();

dashboardRouter.get(
  "/",
  authentication,
  adminOnly,
  dashboardService.summary,
);

export default dashboardRouter;
