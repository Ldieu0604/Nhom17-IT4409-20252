import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { checkPermission } from "../middlewares/permission.middleware.js";
import { ROLES } from "../constants/roles.js";
import {
  listCollaborators,
  revokeAccess,
  shareDocument,
  updateCollaboratorRole,
} from "../controllers/permission.controller.js";

const router = Router({ mergeParams: true });

router.get("/", verifyToken, checkPermission(ROLES.VIEWER), listCollaborators);
router.post("/", verifyToken, checkPermission(ROLES.OWNER), shareDocument);
router.patch("/:userId", verifyToken, checkPermission(ROLES.OWNER), updateCollaboratorRole);
router.delete("/:userId", verifyToken, checkPermission(ROLES.OWNER), revokeAccess);

export default router;
