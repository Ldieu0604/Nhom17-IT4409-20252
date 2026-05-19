import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { ROLES } from "../constants/roles.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ALLOWED_SHARE_ROLES = new Set([ROLES.VIEWER, ROLES.COMMENTER, ROLES.EDITOR]);

function resolveRole(inputRole) {
  const raw = String(inputRole || "").trim();
  if (!raw) return null;

  const upperKey = raw.toUpperCase();
  const mapped = ROLES[upperKey];
  if (mapped) return mapped;

  const lower = raw.toLowerCase();
  return lower;
}

export const listCollaborators = async (req, res) => {
  const { documentId } = req.params;
  if (!documentId) {
    return res.status(400).json({
      success: false,
      message: "documentId is required.",
    });
  }

  try {
    const permissions = await prisma.permission.findMany({
      where: { documentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstname: true,
            lastname: true,
            avatar: true,
          },
        },
      },
      orderBy: { grantedAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    console.error("[listCollaborators] error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const shareDocument = async (req, res) => {
  const { documentId } = req.params;
  const email = String(req.body.email || "").trim().toLowerCase();
  const requestedRole = resolveRole(req.body.role);

  if (!documentId) {
    return res.status(400).json({
      success: false,
      message: "documentId is required.",
    });
  }

  if (!email || !requestedRole) {
    return res.status(400).json({
      success: false,
      message: "email and role are required.",
    });
  }

  if (!ALLOWED_SHARE_ROLES.has(requestedRole)) {
    return res.status(400).json({
      success: false,
      message: "Invalid role. Allowed roles: VIEWER, COMMENTER, EDITOR.",
    });
  }

  try {
    const [document, user] = await Promise.all([
      prisma.document.findUnique({
        where: { id: documentId },
        select: { id: true, ownerId: true },
      }),
      prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, firstname: true, lastname: true, avatar: true },
      }),
    ]);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.id === document.ownerId) {
      return res.status(400).json({
        success: false,
        message: "Owner already has full access.",
      });
    }

    const permission = await prisma.permission.upsert({
      where: {
        userId_documentId: {
          userId: user.id,
          documentId,
        },
      },
      update: {
        role: requestedRole,
      },
      create: {
        userId: user.id,
        documentId,
        role: requestedRole,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstname: true,
            lastname: true,
            avatar: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Collaborator updated.",
      data: permission,
    });
  } catch (error) {
    console.error("[shareDocument] error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const updateCollaboratorRole = async (req, res) => {
  const { documentId, userId } = req.params;
  const requestedRole = resolveRole(req.body.role);

  if (!documentId || !userId) {
    return res.status(400).json({
      success: false,
      message: "documentId and userId are required.",
    });
  }

  if (!requestedRole) {
    return res.status(400).json({
      success: false,
      message: "role is required.",
    });
  }

  if (!ALLOWED_SHARE_ROLES.has(requestedRole)) {
    return res.status(400).json({
      success: false,
      message: "Invalid role. Allowed roles: VIEWER, COMMENTER, EDITOR.",
    });
  }

  try {
    const existing = await prisma.permission.findUnique({
      where: {
        userId_documentId: {
          userId,
          documentId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstname: true,
            lastname: true,
            avatar: true,
          },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Permission not found.",
      });
    }

    const permission = await prisma.permission.update({
      where: {
        userId_documentId: {
          userId,
          documentId,
        },
      },
      data: { role: requestedRole },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstname: true,
            lastname: true,
            avatar: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: permission,
    });
  } catch (error) {
    console.error("[updateCollaboratorRole] error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const revokeAccess = async (req, res) => {
  const { documentId, userId } = req.params;

  if (!documentId || !userId) {
    return res.status(400).json({
      success: false,
      message: "documentId and userId are required.",
    });
  }

  try {
    const result = await prisma.permission.deleteMany({
      where: { documentId, userId },
    });

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Permission not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Access revoked successfully.",
    });
  } catch (error) {
    console.error("[revokeAccess] error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
