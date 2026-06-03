import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { z } from "zod";
import { buildWorkspaceInviteLink, sendWorkspaceInviteEmail } from "../services/mail.service.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const inviteSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(["owner", "member"]).default("member"),
});
const acceptSchema = z.object({ token: z.string().trim().min(32) });
const INVITATION_TTL_DAYS = Number(process.env.WORKSPACE_INVITE_EXPIRES_IN_DAYS || "7");

function ok(res, status, data, message) {
  return res.status(status).json({ success: true, ...(message ? { message } : {}), data });
}

function fail(res, status, message) {
  return res.status(status).json({ success: false, message });
}

function userId(req) {
  return req.user?.id || req.user?.userId;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function displayName(user) {
  return [user.firstname, user.lastname].filter(Boolean).join(" ") || user.username || user.email;
}

function generateToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function expiresAt() {
  return new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

function formatInvitation(invitation, extra = {}) {
  return {
    id: invitation.id,
    workspaceId: invitation.workspaceId,
    email: invitation.email,
    role: invitation.role,
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    acceptedAt: invitation.acceptedAt,
    createdAt: invitation.createdAt,
    updatedAt: invitation.updatedAt,
    ...extra,
  };
}

async function markInvitationNotificationsRead(tx, userId, invitationId) {
  return tx.notification.updateMany({
    where: {
      userId,
      type: "WORKSPACE_INVITE",
      data: { path: ["invitationId"], equals: invitationId },
    },
    data: { readAt: new Date() },
  });
}

async function notifyInviteeJoined(tx, workspaceId, invitationId, joinedUser, workspaceName) {
  const joinedName = displayName(joinedUser);
  await tx.notification.create({
    data: {
      userId: joinedUser.id,
      type: "WORKSPACE_JOINED",
      title: `${workspaceName}: thành viên mới`,
      body: `${joinedName} đã tham gia workspace ${workspaceName}.`,
      data: {
        workspaceId,
        invitationId,
        joinedUserId: joinedUser.id,
        action: "OPEN_WORKSPACE",
      },
    },
  });
}

async function requireInviter(req, res, workspaceId) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: userId(req) } },
  });
  if (!membership) {
    fail(res, 403, "You are not a member of this workspace.");
    return null;
  }
  if (membership.role !== "owner") {
    fail(res, 403, "Only workspace owners can invite members.");
    return null;
  }
  return membership;
}

async function markExpired(invitation) {
  if (invitation.status !== "PENDING" || invitation.expiresAt > new Date()) return invitation;
  return prisma.workspaceInvitation.update({
    where: { id: invitation.id },
    data: { status: "EXPIRED" },
    include: {
      workspace: true,
      invitedBy: true,
    },
  });
}

export async function createWorkspaceInvitation(req, res) {
  try {
    const parsed = inviteSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, "A valid email is required.");

    const workspaceId = req.params.workspaceId;
    if (!await requireInviter(req, res, workspaceId)) return;

    const email = normalizeEmail(parsed.data.email);
    const currentUser = await prisma.user.findUnique({ where: { id: userId(req) } });
    if (!currentUser) return fail(res, 401, "Please sign in again.");
    if (normalizeEmail(currentUser.email) === email) {
      return fail(res, 400, "You cannot invite yourself to this workspace.");
    }

    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) return fail(res, 404, "Workspace not found.");

    const invitedUser = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
    if (invitedUser) {
      const activeMember = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: invitedUser.id } },
      });
      if (activeMember) return fail(res, 409, "User is already a member of this workspace.");
    }

    const rawToken = generateToken();
    const nextExpiresAt = expiresAt();
    const acceptUrl = buildWorkspaceInviteLink(rawToken);

    const invitation = await prisma.$transaction(async (tx) => {
      const existingPending = await tx.workspaceInvitation.findFirst({
        where: { workspaceId, email, status: "PENDING" },
      });

      const saved = existingPending
        ? await tx.workspaceInvitation.update({
            where: { id: existingPending.id },
            data: {
              role: parsed.data.role,
              tokenHash: hashToken(rawToken),
              invitedById: currentUser.id,
              expiresAt: nextExpiresAt,
              acceptedAt: null,
            },
          })
        : await tx.workspaceInvitation.create({
            data: {
              workspaceId,
              email,
              role: parsed.data.role,
              tokenHash: hashToken(rawToken),
              invitedById: currentUser.id,
              expiresAt: nextExpiresAt,
            },
          });

      if (invitedUser) {
        await tx.notification.create({
          data: {
            userId: invitedUser.id,
            type: "WORKSPACE_INVITE",
            title: `Workspace invitation: ${workspace.name}`,
            body: `${displayName(currentUser)} invited you to join ${workspace.name}.`,
            data: {
              workspaceId,
              invitationId: saved.id,
              action: "ACCEPT_WORKSPACE_INVITE",
            },
          },
        });
      }

      return saved;
    });

    await sendWorkspaceInviteEmail({
      to: email,
      workspaceName: workspace.name,
      inviterName: displayName(currentUser),
      role: parsed.data.role,
      acceptUrl,
      expiresAt: nextExpiresAt,
      existingAccount: Boolean(invitedUser),
    });

    const message = invitedUser
      ? "Invitation sent. The user also received an in-app notification."
      : "Invitation sent. The recipient can accept after registering with this email.";
    return ok(res, 201, formatInvitation(invitation, { existingAccount: Boolean(invitedUser) }), message);
  } catch (error) {
    console.error("[createWorkspaceInvitation]", error);
    if (error?.code === "P2002") return fail(res, 409, "A pending invitation already exists for this email.");
    return fail(res, 500, "Internal server error.");
  }
}

export async function previewInvitation(req, res) {
  try {
    const parsed = acceptSchema.safeParse({ token: req.query.token });
    if (!parsed.success) return fail(res, 400, "A valid invitation token is required.");

    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { tokenHash: hashToken(parsed.data.token) },
      include: { workspace: true, invitedBy: true },
    });
    if (!invitation) return fail(res, 404, "Invitation not found.");

    const current = await markExpired(invitation);
    return ok(res, 200, {
      workspaceName: current.workspace.name,
      invitedByName: displayName(current.invitedBy),
      email: current.email,
      role: current.role,
      expiresAt: current.expiresAt,
      status: current.status,
    });
  } catch (error) {
    console.error("[previewInvitation]", error);
    return fail(res, 500, "Internal server error.");
  }
}

export async function acceptInvitation(req, res) {
  try {
    const parsed = acceptSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, "A valid invitation token is required.");

    const currentUser = await prisma.user.findUnique({ where: { id: userId(req) } });
    if (!currentUser) return fail(res, 401, "Please sign in.");

    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { tokenHash: hashToken(parsed.data.token) },
      include: { workspace: true },
    });
    if (!invitation) return fail(res, 404, "Invitation not found.");
    if (invitation.status !== "PENDING") return fail(res, 400, `Invitation is ${invitation.status.toLowerCase()}.`);
    if (invitation.expiresAt <= new Date()) {
      await prisma.workspaceInvitation.update({ where: { id: invitation.id }, data: { status: "EXPIRED" } });
      return fail(res, 400, "Invitation has expired.");
    }
    if (normalizeEmail(currentUser.email) !== invitation.email) {
      return fail(res, 403, "Please sign in with the email address that was invited.");
    }

    const result = await prisma.$transaction(async (tx) => {
      const member = await tx.workspaceMember.upsert({
        where: { workspaceId_userId: { workspaceId: invitation.workspaceId, userId: currentUser.id } },
        create: {
          workspaceId: invitation.workspaceId,
          userId: currentUser.id,
          role: invitation.role,
        },
        update: {},
      });

      const accepted = await tx.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
        include: { workspace: true },
      });

      await markInvitationNotificationsRead(tx, currentUser.id, invitation.id);
      await notifyInviteeJoined(tx, accepted.workspaceId, accepted.id, currentUser, accepted.workspace.name);

      return { member, invitation: accepted };
    });

    return ok(res, 200, {
      workspace: {
        id: result.invitation.workspace.id,
        name: result.invitation.workspace.name,
        redirectUrl: `/workspaces/${result.invitation.workspace.id}`,
      },
      member: result.member,
    }, "Invitation accepted.");
  } catch (error) {
    console.error("[acceptInvitation]", error);
    return fail(res, 500, "Internal server error.");
  }
}

export async function acceptInvitationById(req, res) {
  try {
    const currentUser = await prisma.user.findUnique({ where: { id: userId(req) } });
    if (!currentUser) return fail(res, 401, "Please sign in.");

    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { id: req.params.invitationId },
      include: { workspace: true },
    });
    if (!invitation) return fail(res, 404, "Invitation not found.");
    if (invitation.status !== "PENDING") return fail(res, 400, `Invitation is ${invitation.status.toLowerCase()}.`);
    if (invitation.expiresAt <= new Date()) {
      await prisma.workspaceInvitation.update({ where: { id: invitation.id }, data: { status: "EXPIRED" } });
      return fail(res, 400, "Invitation has expired.");
    }
    if (normalizeEmail(currentUser.email) !== invitation.email) {
      return fail(res, 403, "This invitation belongs to another email address.");
    }

    const result = await prisma.$transaction(async (tx) => {
      const member = await tx.workspaceMember.upsert({
        where: { workspaceId_userId: { workspaceId: invitation.workspaceId, userId: currentUser.id } },
        create: {
          workspaceId: invitation.workspaceId,
          userId: currentUser.id,
          role: invitation.role,
        },
        update: {},
      });

      const accepted = await tx.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
        include: { workspace: true },
      });

      await markInvitationNotificationsRead(tx, currentUser.id, invitation.id);
      await notifyInviteeJoined(tx, accepted.workspaceId, accepted.id, currentUser, accepted.workspace.name);

      return { member, invitation: accepted };
    });

    return ok(res, 200, {
      workspace: {
        id: result.invitation.workspace.id,
        name: result.invitation.workspace.name,
        redirectUrl: `/workspaces/${result.invitation.workspace.id}`,
      },
      member: result.member,
    }, "Invitation accepted.");
  } catch (error) {
    console.error("[acceptInvitationById]", error);
    return fail(res, 500, "Internal server error.");
  }
}
