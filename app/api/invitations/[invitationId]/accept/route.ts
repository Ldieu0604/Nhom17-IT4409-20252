import { ActivityType, ChannelType, InvitationStatus } from "@prisma/client"
import { NextResponse } from "next/server"
import { getOrCreateAppUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type RouteContext = {
  params: Promise<{
    invitationId: string
  }>
}

async function ensureGeneralChannel(workspaceId: string, actorId?: string) {
  const existing = await prisma.chatChannel.findFirst({
    where: {
      workspaceId,
      type: ChannelType.GENERAL,
      deletedAt: null,
    },
    orderBy: {
      createdAt: "asc",
    },
  })

  if (existing) {
    return existing
  }

  const memberRows = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: { userId: true },
  })

  return prisma.chatChannel.create({
    data: {
      workspaceId,
      name: "general",
      slug: "general",
      type: ChannelType.GENERAL,
      description: "Kênh trao đổi chung của workspace.",
      createdById: actorId ?? null,
      members: {
        create: memberRows.map((member) => ({
          userId: member.userId,
        })),
      },
    },
  })
}

export async function POST(_: Request, { params }: RouteContext) {
  const user = await getOrCreateAppUser()
  const { invitationId } = await params

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      ok: true,
      workspaceId: "mock-workspace",
      message: "Đã tham gia workspace demo.",
    })
  }

  const invitation = await prisma.workspaceInvitation.findUnique({
    where: {
      id: invitationId,
    },
    include: {
      workspace: true,
    },
  })

  if (!invitation) {
    return NextResponse.json({ message: "Lời mời không tồn tại." }, { status: 404 })
  }

  if (invitation.status !== InvitationStatus.PENDING) {
    return NextResponse.json({ message: "Lời mời này không còn hiệu lực." }, { status: 400 })
  }

  if (invitation.expiresAt <= new Date()) {
    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: {
        status: InvitationStatus.EXPIRED,
      },
    })

    return NextResponse.json({ message: "Lời mời đã hết hạn." }, { status: 400 })
  }

  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({ message: "Lời mời này không thuộc về tài khoản hiện tại." }, { status: 403 })
  }

  const existingMembership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: invitation.workspaceId,
        userId: user.id,
      },
    },
  })

  if (!existingMembership) {
    await prisma.workspaceMember.create({
      data: {
        workspaceId: invitation.workspaceId,
        userId: user.id,
        role: invitation.role,
      },
    })
  }

  const generalChannel = await ensureGeneralChannel(invitation.workspaceId, user.id)

  await prisma.chatChannelMember.upsert({
    where: {
      channelId_userId: {
        channelId: generalChannel.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      channelId: generalChannel.id,
      userId: user.id,
    },
  })

  await prisma.workspaceInvitation.update({
    where: {
      id: invitation.id,
    },
    data: {
      status: InvitationStatus.ACCEPTED,
      invitedUserId: user.id,
      acceptedAt: new Date(),
    },
  })

  await prisma.activityLog.create({
    data: {
      workspaceId: invitation.workspaceId,
      actorId: user.id,
      type: ActivityType.MEMBER_JOINED,
      message: `${user.name ?? user.email} đã tham gia workspace từ lời mời.`,
      metadata: {
        invitationId: invitation.id,
        acceptedEmail: user.email,
      },
    },
  })

  return NextResponse.json({
    ok: true,
    workspaceId: invitation.workspaceId,
    workspaceName: invitation.workspace.name,
    message: `Đã tham gia workspace ${invitation.workspace.name}.`,
  })
}
