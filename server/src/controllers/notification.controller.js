import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function ok(res, status, data, message) {
  return res.status(status).json({ success: true, ...(message ? { message } : {}), data });
}

function fail(res, status, message) {
  return res.status(status).json({ success: false, message });
}

function userId(req) {
  return req.user?.id || req.user?.userId;
}

export async function listNotifications(req, res) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: userId(req) },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return ok(res, 200, notifications);
  } catch (error) {
    console.error("[listNotifications]", error);
    return fail(res, 500, "Internal server error.");
  }
}

export async function markNotificationRead(req, res) {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.notificationId, userId: userId(req) },
    });
    if (!notification) return fail(res, 404, "Notification not found.");

    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { readAt: notification.readAt || new Date() },
    });
    return ok(res, 200, updated);
  } catch (error) {
    console.error("[markNotificationRead]", error);
    return fail(res, 500, "Internal server error.");
  }
}
