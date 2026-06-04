import { Router } from "express";
import { listNotifications, markNotificationRead } from "../controllers/notification.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyToken);
router.get("/", listNotifications);
router.patch("/:notificationId/read", markNotificationRead);

export default router;
