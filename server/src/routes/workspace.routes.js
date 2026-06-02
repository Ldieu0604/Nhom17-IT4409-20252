import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { addWorkspaceMember, createTask, createWorkspace, getWorkspace, listDocumentTasks, listWorkspaces, updateTask } from "../controllers/workspace.controller.js";

const router = Router();
router.use(verifyToken);
router.get("/", listWorkspaces);
router.post("/", createWorkspace);
router.get("/documents/:documentId/tasks", listDocumentTasks);
router.get("/:workspaceId", getWorkspace);
router.post("/:workspaceId/members", addWorkspaceMember);
router.post("/:workspaceId/tasks", createTask);
router.patch("/:workspaceId/tasks/:taskId", updateTask);
export default router;
