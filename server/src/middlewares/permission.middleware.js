import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { ROLES, ROLE_WEIGHTS } from "../constants/roles.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const checkPermission = (requiredRole) => async (req, res, next) => {
  if (!req.user?.id) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const { documentId } = req.params;
  if (!documentId) {
    return res.status(400).json({
      success: false,
      message: "documentId is required.",
    });
  }

  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        ownerId: true,
        isPublic: true,
        publicRole: true,
        permissions: {
          where: { userId: req.user.id },
          select: {
            userId: true,
            role: true,
          },
        },
      },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    let currentRole = null;

    if (req.user.id === document.ownerId) {
      currentRole = ROLES.OWNER;
    } else if (document.permissions?.length) {
      currentRole = document.permissions[0].role;
    } else if (document.isPublic === true) {
      currentRole = document.publicRole;
    }

    if (!currentRole) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: no access to this document.",
      });
    }

    const currentWeight = ROLE_WEIGHTS[currentRole];
    const requiredWeight = ROLE_WEIGHTS[requiredRole];

    if (currentWeight === undefined || requiredWeight === undefined) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: invalid role configuration.",
      });
    }

    if (currentWeight >= requiredWeight) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Forbidden: insufficient permissions.",
    });
  } catch (error) {
    console.error("[checkPermission] error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
