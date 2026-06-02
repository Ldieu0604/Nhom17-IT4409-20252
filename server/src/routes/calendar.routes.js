import { Router } from "express";
import { createCalendarEvent, listMyCalendarEvents } from "../controllers/calendar.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyToken);
router.get("/", listMyCalendarEvents);
router.post("/", createCalendarEvent);

export default router;
