import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { z } from "zod";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const workspaceSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).nullable().optional(),
});
const memberSchema = z.object({ email: z.string().trim().email() });
const taskSchema = z.object({
  title: z.string().trim().min(1).max(240),
  description: z.string().trim().max(4000).nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  documentId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
});
const taskUpdateSchema = z.object({
  title: z.string().trim().min(1).max(240).optional(),
  description: z.string().trim().max(4000).nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  documentId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  completed: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, "Update is required");

function ok(res, status, data, message) {
  return res.status(status).json({ success: true, ...(message ? { message } : {}), data });
}
function fail(res, status, message) {
  return res.status(status).json({ success: false, message });
}
function userId(req) {
  return req.user?.id || req.user?.userId;
}
function displayName(user) {
  return [user.firstname, user.lastname].filter(Boolean).join(" ") || user.username || user.email;
}
function formatUser(user) {
  if (!user) return null;
  return { id: user.id, email: user.email, username: user.username, firstname: user.firstname, lastname: user.lastname, avatar: user.avatar, displayName: displayName(user) };
}
function formatTask(task) {
  return { ...task, assignee: formatUser(task.assignee), createdBy: formatUser(task.createdBy) };
}
const taskInclude = {
  assignee: true,
  createdBy: true,
  document: { select: { id: true, title: true } },
  workspace: { select: { id: true, name: true } },
};
async function getMembership(workspaceId, currentUserId) {
  return prisma.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId, userId: currentUserId } } });
}
async function requireMembership(req, res, ownerOnly = false) {
  const membership = await getMembership(req.params.workspaceId, userId(req));
  if (!membership) {
    fail(res, 403, "You are not a member of this workspace.");
    return null;
  }
  if (ownerOnly && membership.role !== "owner") {
    fail(res, 403, "Only the workspace owner can perform this action.");
    return null;
  }
  return membership;
}
async function validateTaskLinks(res, workspaceId, { assigneeId, documentId }) {
  if (assigneeId) {
    const member = await prisma.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId, userId: assigneeId } } });
    if (!member) {
      fail(res, 400, "Assignee must be a workspace member.");
      return false;
    }
  }
  if (documentId) {
    const document = await prisma.document.findFirst({ where: { id: documentId, workspaceId } });
    if (!document) {
      fail(res, 400, "Document must belong to this workspace.");
      return false;
    }
  }
  return true;
}
function workspaceInclude() {
  return {
    owner: true,
    members: { include: { user: true }, orderBy: { createdAt: "asc" } },
    documents: { orderBy: { updatedAt: "desc" } },
    tasks: { include: { assignee: true, createdBy: true, document: { select: { id: true, title: true } } }, orderBy: { updatedAt: "desc" } },
  };
}
function formatWorkspace(workspace, currentUserId, detailed = false) {
  const completedTasks = workspace.tasks.filter((task) => task.completed).length;
  const base = {
    id: workspace.id, name: workspace.name, description: workspace.description, ownerId: workspace.ownerId,
    role: workspace.members.find((member) => member.userId === currentUserId)?.role,
    createdAt: workspace.createdAt, updatedAt: workspace.updatedAt,
    documentCount: workspace.documents.length, taskCount: workspace.tasks.length, completedTaskCount: completedTasks,
    members: workspace.members.map((member) => ({ id: member.id, role: member.role, createdAt: member.createdAt, user: formatUser(member.user) })),
  };
  return detailed ? { ...base, owner: formatUser(workspace.owner), documents: workspace.documents, tasks: workspace.tasks.map(formatTask) } : base;
}

export async function listWorkspaces(req, res) {
  try {
    const currentUserId = userId(req);
    const workspaces = await prisma.workspace.findMany({
      where: { members: { some: { userId: currentUserId } } },
      include: workspaceInclude(),
      orderBy: { updatedAt: "desc" },
    });
    return ok(res, 200, workspaces.map((workspace) => formatWorkspace(workspace, currentUserId)));
  } catch (error) {
    console.error("[listWorkspaces]", error);
    return fail(res, 500, "Internal server error.");
  }
}

export async function createWorkspace(req, res) {
  try {
    const parsed = workspaceSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, "Invalid workspace input.");
    const currentUserId = userId(req);
    const workspace = await prisma.workspace.create({
      data: { ...parsed.data, ownerId: currentUserId, members: { create: { userId: currentUserId, role: "owner" } } },
      include: workspaceInclude(),
    });
    return ok(res, 201, formatWorkspace(workspace, currentUserId, true), "Workspace created.");
  } catch (error) {
    console.error("[createWorkspace]", error);
    return fail(res, 500, "Internal server error.");
  }
}

export async function getWorkspace(req, res) {
  try {
    if (!await requireMembership(req, res)) return;
    const workspace = await prisma.workspace.findUnique({ where: { id: req.params.workspaceId }, include: workspaceInclude() });
    if (!workspace) return fail(res, 404, "Workspace not found.");
    return ok(res, 200, formatWorkspace(workspace, userId(req), true));
  } catch (error) {
    console.error("[getWorkspace]", error);
    return fail(res, 500, "Internal server error.");
  }
}

export async function deleteWorkspace(req, res) {
  try {
    if (!await requireMembership(req, res, true)) return;
    await prisma.workspace.delete({ where: { id: req.params.workspaceId } });
    return ok(res, 200, { id: req.params.workspaceId }, "Workspace deleted.");
  } catch (error) {
    console.error("[deleteWorkspace]", error);
    return fail(res, 500, "Internal server error.");
  }
}

export async function addWorkspaceMember(req, res) {
  try {
    if (!await requireMembership(req, res, true)) return;
    const parsed = memberSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, "A valid email is required.");
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) return fail(res, 404, "User not found.");
    const member = await prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: req.params.workspaceId, userId: user.id } },
      create: { workspaceId: req.params.workspaceId, userId: user.id, role: "member" },
      update: {},
      include: { user: true },
    });
    return ok(res, 201, { ...member, user: formatUser(member.user) }, "Member added.");
  } catch (error) {
    console.error("[addWorkspaceMember]", error);
    return fail(res, 500, "Internal server error.");
  }
}

export async function createTask(req, res) {
  try {
    if (!await requireMembership(req, res)) return;
    const parsed = taskSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, "Invalid task input.");
    if (!await validateTaskLinks(res, req.params.workspaceId, parsed.data)) return;
    const task = await prisma.task.create({
      data: { ...parsed.data, dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null, workspaceId: req.params.workspaceId, createdById: userId(req) },
      include: { assignee: true, createdBy: true, document: { select: { id: true, title: true } } },
    });
    return ok(res, 201, formatTask(task), "Task created.");
  } catch (error) {
    console.error("[createTask]", error);
    return fail(res, 500, "Internal server error.");
  }
}

export async function listMyTasks(req, res) {
  try {
    const currentUserId = userId(req);
    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: currentUserId,
        workspace: { members: { some: { userId: currentUserId } } },
      },
      include: taskInclude,
      orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
    });
    return ok(res, 200, tasks.map(formatTask));
  } catch (error) {
    console.error("[listMyTasks]", error);
    return fail(res, 500, "Internal server error.");
  }
}

export async function updateTask(req, res) {
  try {
    if (!await requireMembership(req, res)) return;
    const parsed = taskUpdateSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, "Invalid task input.");
    const existing = await prisma.task.findFirst({ where: { id: req.params.taskId, workspaceId: req.params.workspaceId } });
    if (!existing) return fail(res, 404, "Task not found.");
    if (!await validateTaskLinks(res, req.params.workspaceId, { assigneeId: parsed.data.assigneeId, documentId: parsed.data.documentId })) return;
    const data = { ...parsed.data };
    if (data.dueDate !== undefined) data.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.completed !== undefined) {
      data.status = data.completed ? "done" : (data.status === "done" || existing.status === "done" ? "todo" : data.status);
      data.completedAt = data.completed ? new Date() : null;
    } else if (data.status !== undefined) {
      data.completed = data.status === "done";
      data.completedAt = data.completed ? new Date() : null;
    }
    const task = await prisma.task.update({ where: { id: existing.id }, data, include: { assignee: true, createdBy: true, document: { select: { id: true, title: true } } } });
    return ok(res, 200, formatTask(task), "Task updated.");
  } catch (error) {
    console.error("[updateTask]", error);
    return fail(res, 500, "Internal server error.");
  }
}

export async function listDocumentTasks(req, res) {
  try {
    const currentUserId = userId(req);
    const document = await prisma.document.findUnique({ where: { id: req.params.documentId }, select: { ownerId: true, permissions: { where: { userId: currentUserId } } } });
    if (!document) return fail(res, 404, "Document not found.");
    if (document.ownerId !== currentUserId && document.permissions.length === 0) return fail(res, 403, "No access to this document.");
    const tasks = await prisma.task.findMany({ where: { documentId: req.params.documentId }, include: { assignee: true, createdBy: true, document: { select: { id: true, title: true } } }, orderBy: { updatedAt: "desc" } });
    return ok(res, 200, tasks.map(formatTask));
  } catch (error) {
    console.error("[listDocumentTasks]", error);
    return fail(res, 500, "Internal server error.");
  }
}
