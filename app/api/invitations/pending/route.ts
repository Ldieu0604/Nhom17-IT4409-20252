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

  const invitations = await prisma.workspaceInvitation.findMany({
    where: {
      email: user.email,
      status: "PENDING",
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      workspace: true,
      invitedBy: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return NextResponse.json({
    items: invitations.map((invitation) => ({
      id: invitation.id,
      workspaceId: invitation.workspaceId,
      workspaceName: invitation.workspace.name,
      email: invitation.email,
      role: invitation.role,
      invitedBy: invitation.invitedBy.name ?? invitation.invitedBy.email,
      createdAt: invitation.createdAt.toISOString(),
      expiresAt: invitation.expiresAt.toISOString(),
    })),
  })
}
