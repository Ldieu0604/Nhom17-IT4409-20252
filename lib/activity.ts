import { ActivityType, Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

type LogActivityInput = {
  workspaceId: string
  actorId: string
  type: ActivityType
  message: string
  metadata?: Prisma.InputJsonValue
}

export async function logActivity(input: LogActivityInput) {
  if (!process.env.DATABASE_URL) {
    return null
  }

  return prisma.activityLog.create({
    data: input,
  })
}
