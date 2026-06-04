import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { z } from "zod";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const eventSchema = z.object({
  title: z.string().trim().min(1).max(240),
  description: z.string().trim().max(4000).nullable().optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  location: z.string().trim().max(240).nullable().optional(),
  meetingUrl: z.string().trim().url().max(500).nullable().optional(),
  workspaceId: z.string().uuid().nullable().optional(),
  documentId: z.string().uuid().nullable().optional(),
  taskId: z.string().uuid().nullable().optional(),
  participantIds: z.array(z.string().uuid()).max(100).optional(),
}).refine((event) => new Date(event.endAt) > new Date(event.startAt), {
  message: "Event end time must be after its start time.",
});

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
  return { id: user.id, email: user.email, username: user.username, firstname: user.firstname, lastname: user.lastname, avatar: user.avatar, displayName: displayName(user) };
}
async function formatEvents(events) {
  const participantIds = [...new Set(events.flatMap((event) => event.participantIds))];
  const participants = participantIds.length
    ? await prisma.user.findMany({ where: { id: { in: participantIds } } })
    : [];
  const participantsById = new Map(participants.map((user) => [user.id, formatUser(user)]));
  return events.map((event) => ({
    ...event,
    owner: formatUser(event.owner),
    participants: event.participantIds.map((id) => participantsById.get(id)).filter(Boolean),
  }));
}
async function validateLinks(res, currentUserId, data) {
  if (data.workspaceId) {
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: data.workspaceId, userId: currentUserId } },
    });
    if (!membership) {
      fail(res, 400, "Workspace must be one of your workspaces.");
      return false;
    }
    if (data.participantIds?.length) {
      const memberCount = await prisma.workspaceMember.count({
        where: { workspaceId: data.workspaceId, userId: { in: data.participantIds } },
      });
      if (memberCount !== new Set(data.participantIds).size) {
        fail(res, 400, "Participants must be members of the selected workspace.");
        return false;
      }
    }
  } else if (data.participantIds?.length) {
    fail(res, 400, "Select a workspace before adding participants.");
    return false;
  }
  if (data.documentId) {
    if (!data.workspaceId) {
      fail(res, 400, "Select a workspace before linking a document.");
      return false;
    }
    const document = await prisma.document.findFirst({ where: { id: data.documentId, workspaceId: data.workspaceId } });
    if (!document) {
      fail(res, 400, "Document must belong to the selected workspace.");
      return false;
    }
  }
  if (data.taskId) {
    if (!data.workspaceId) {
      fail(res, 400, "Select a workspace before linking a task.");
      return false;
    }
    const task = await prisma.task.findFirst({ where: { id: data.taskId, workspaceId: data.workspaceId } });
    if (!task) {
      fail(res, 400, "Task must belong to the selected workspace.");
      return false;
    }
  }
  return true;
}

export async function listMyCalendarEvents(req, res) {
  try {
    const currentUserId = userId(req);
    const events = await prisma.calendarEvent.findMany({
      where: { OR: [{ ownerId: currentUserId }, { participantIds: { has: currentUserId } }] },
      include: {
        owner: true,
        workspace: { select: { id: true, name: true } },
        document: { select: { id: true, title: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { startAt: "asc" },
    });
    return ok(res, 200, await formatEvents(events));
  } catch (error) {
    console.error("[listMyCalendarEvents]", error);
    return fail(res, 500, "Internal server error.");
  }
}

export async function createCalendarEvent(req, res) {
  try {
    const parsed = eventSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, "Invalid calendar event input.");
    const currentUserId = userId(req);
    if (!await validateLinks(res, currentUserId, parsed.data)) return;
    const event = await prisma.calendarEvent.create({
      data: {
        ...parsed.data,
        participantIds: [...new Set(parsed.data.participantIds || [])],
        startAt: new Date(parsed.data.startAt),
        endAt: new Date(parsed.data.endAt),
        ownerId: currentUserId,
      },
      include: {
        owner: true,
        workspace: { select: { id: true, name: true } },
        document: { select: { id: true, title: true } },
        task: { select: { id: true, title: true } },
      },
    });
    return ok(res, 201, (await formatEvents([event]))[0], "Calendar event created.");
  } catch (error) {
    console.error("[createCalendarEvent]", error);
    return fail(res, 500, "Internal server error.");
  }
}
