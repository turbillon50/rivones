import { Router, type IRouter } from "express";
import healthRouter from "./health";
import carsRouter from "./cars";
import usersRouter from "./users";
import notificationsRouter from "./notifications";
import adminRouter from "./admin";
import bookingsRouter from "./bookings";
import messagesRouter from "./messages";
import inspectionsRouter from "./inspections";
import stripeRouter from "./stripe";
import reviewsRouter from "./reviews";
import storageRouter from "./storage";
import documentsRouter from "./documents";
import partnersRouter from "./partners";
import emailRouter from "./email";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/cars", carsRouter);
router.use("/cars", reviewsRouter);
router.use("/users", usersRouter);
router.use("/notifications", notificationsRouter);
router.use("/admin", adminRouter);
router.use("/bookings", bookingsRouter);
router.use("/bookings", messagesRouter);
router.use("/bookings", inspectionsRouter);
router.use("/stripe", stripeRouter);
router.use(storageRouter);
router.use("/documents", documentsRouter);
router.use("/partners", partnersRouter);
router.use("/email", emailRouter);

export default router;
