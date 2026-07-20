import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import jornadasRouter from "./jornadas";
import matchesRouter from "./matches";
import predictionsRouter from "./predictions";
import matchupsRouter from "./matchups";
import standingsRouter from "./standings";
import dashboardRouter from "./dashboard";
import historyRouter from "./history";
import hallOfFameRouter from "./hall-of-fame";
import profileRouter from "./profile";


const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(jornadasRouter);
router.use(matchesRouter);
router.use(predictionsRouter);
router.use(matchupsRouter);
router.use(standingsRouter);
router.use(dashboardRouter);
router.use(historyRouter);
router.use(hallOfFameRouter);
router.use(profileRouter);

export default router;
