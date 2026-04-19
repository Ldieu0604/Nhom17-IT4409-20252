import { NextResponse } from "next/server"
import { getOrCreateAppUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const user = await getOrCreateAppUser()

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ items: [] })
  }

  const workspaceIds = await prisma.workspaceMember.findMany({
    where: { userId: user.id },
    select: { workspaceId: true },
  })

  const items = await prisma.activityLog.findMany({
    where: {
      workspaceId: {
        in: workspaceIds.map((item: { workspaceId: string }) => item.workspaceId),
      },
    },
    include: {
      actor: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  })

  return NextResponse.json({ items })
}
