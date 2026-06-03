import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { addWorkspaceMember, createTask, createWorkspace, deleteTask, deleteWorkspace, deleteWorkspaceMember, getWorkspace, listDocumentTasks, listMyTasks, listWorkspaces, updateTask, updateWorkspaceMember } from "../controllers/workspace.controller.js";

const router = Router();
router.use(verifyToken);
router.get("/", listWorkspaces);
router.post("/", createWorkspace);
router.get("/my/tasks", listMyTasks);
router.get("/documents/:documentId/tasks", listDocumentTasks);
router.get("/:workspaceId", getWorkspace);
router.delete("/:workspaceId", deleteWorkspace);
router.post("/:workspaceId/members", addWorkspaceMember);
router.patch("/:workspaceId/members/:memberId", updateWorkspaceMember);
router.delete("/:workspaceId/members/:memberId", deleteWorkspaceMember);
router.post("/:workspaceId/tasks", createTask);
router.patch("/:workspaceId/tasks/:taskId", updateTask);
router.delete("/:workspaceId/tasks/:taskId", deleteTask);
export default router;
