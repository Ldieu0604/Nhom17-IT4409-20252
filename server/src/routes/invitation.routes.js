import { Router } from "express";
import { acceptInvitation, acceptInvitationById, previewInvitation } from "../controllers/invitation.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/preview", previewInvitation);
router.post("/accept", verifyToken, acceptInvitation);
router.post("/:invitationId/accept", verifyToken, acceptInvitationById);

export default router;
