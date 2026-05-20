import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { checkPermission } from "../middlewares/permission.middleware.js";
import { ROLES } from "../constants/roles.js";
import {
  createComment,
  createDocument,
  deleteComment,
  deleteDocument,
  getDocument,
  getShareSettings,
  listComments,
  listDocuments,
  listTemplates,
  renameDocument,
  revokePublicLink,
  updateShareSettings,
} from "../controllers/document.controller.js";

const router = Router();

router.get("/templates", listTemplates);
router.get("/", listDocuments);
router.post("/", createDocument);
router.get("/:documentId", getDocument);
router.patch(
  "/:documentId",
  verifyToken,
  checkPermission(ROLES.EDITOR),
  renameDocument,
);
router.delete(
  "/:documentId",
  verifyToken,
  checkPermission(ROLES.OWNER),
  deleteDocument,
);
router.get(
  "/:documentId/share",
  verifyToken,
  checkPermission(ROLES.VIEWER),
  getShareSettings,
);
router.patch(
  "/:documentId/share",
  verifyToken,
  checkPermission(ROLES.OWNER),
  updateShareSettings,
);
router.delete(
  "/:documentId/public-link",
  verifyToken,
  checkPermission(ROLES.OWNER),
  revokePublicLink,
);
router.get(
  "/:documentId/comments",
  verifyToken,
  checkPermission(ROLES.VIEWER),
  listComments,
);
router.post(
  "/:documentId/comments",
  verifyToken,
  checkPermission(ROLES.COMMENTER),
  createComment,
);
router.delete(
  "/:documentId/comments/:commentId",
  verifyToken,
  checkPermission(ROLES.EDITOR),
  deleteComment,
);

export default router;
