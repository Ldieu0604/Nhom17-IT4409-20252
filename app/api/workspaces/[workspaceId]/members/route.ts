import { randomUUID } from "crypto"
import { ActivityType, ChannelType, InvitationStatus, WorkspaceRole } from "@prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"
import { getOrCreateAppUser } from "@/lib/auth"
import { assertWorkspaceAccess, assertWorkspaceRole } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

const createMemberSchema = z.object({
  email: z.string().email("Email khong hop le."),
  role: z.nativeEnum(WorkspaceRole).default(WorkspaceRole.MEMBER),
})

type RouteContext = {
  params: Promise<{
    workspaceId: string
  }>
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function mapMember(member: {
  id: string
  role: WorkspaceRole
  joinedAt: Date
  user: { id: string; email: string; name: string | null }
}) {
  const displayName = member.user.name ?? member.user.email

  return {
    id: member.user.id,
    membershipId: member.id,
    email: member.user.email,
    name: displayName,
    initials: getInitials(displayName),
    role: member.role,
    joinedAt: member.joinedAt.toISOString(),
  }
}

function mapInvitation(invitation: {
  id: string
  email: string
  role: WorkspaceRole
  status: InvitationStatus
  expiresAt: Date
  createdAt: Date
  invitedBy: { email: string; name: string | null }
}) {
  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    status: invitation.status,
    expiresAt: invitation.expiresAt.toISOString(),
    createdAt: invitation.createdAt.toISOString(),
    invitedBy: invitation.invitedBy.name ?? invitation.invitedBy.email,
  }
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
      description: "Kenh trao doi chung cua workspace.",
      createdById: actorId ?? null,
      members: {
        create: memberRows.map((member) => ({
          userId: member.userId,
        })),
      },
    },
  })
}

async function getWorkspaceMembersPayload(workspaceId: string) {
  const [members, invitations] = await Promise.all([
    prisma.workspaceMember.findMany({
      where: {
        workspaceId,
      },
      include: {
        user: true,
      },
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    }),
    prisma.workspaceInvitation.findMany({
      where: {
        workspaceId,
        status: InvitationStatus.PENDING,
      },
      include: {
        invitedBy: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ])

  return {
    members: members.map(mapMember),
    invitations: invitations.map(mapInvitation),
  }
}

function toErrorResponse(error: unknown, fallbackMessage: string) {
  const message = error instanceof Error ? error.message : fallbackMessage
  let status = 500

  if (message === "Unauthorized") {
    status = 401
  } else if (message.includes("quyen")) {
    status = 403
  } else if (message.includes("truy cap")) {
    status = 403
  }

  return NextResponse.json({ message }, { status })
}

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const user = await getOrCreateAppUser()
    const { workspaceId } = await params

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        members: [],
        invitations: [],
        currentUserRole: "OWNER",
        canManageMembers: true,
      })
    }

    const membership = await assertWorkspaceAccess(user.id, workspaceId)
    const payload = await getWorkspaceMembersPayload(workspaceId)

    return NextResponse.json({
      ...payload,
      currentUserRole: membership.role,
      canManageMembers: membership.role === WorkspaceRole.OWNER || membership.role === WorkspaceRole.ADMIN,
    })
  } catch (error) {
    return toErrorResponse(error, "Khong the tai danh sach thanh vien.")
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const actor = await getOrCreateAppUser()
    const { workspaceId } = await params

    if (!actor) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const parsed = createMemberSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Du lieu khong hop le." },
        { status: 400 }
      )
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          mode: "added",
          member: {
            id: `mock-user-${Date.now()}`,
            membershipId: `mock-membership-${Date.now()}`,
            email: parsed.data.email,
            name: parsed.data.email,
            initials: parsed.data.email.slice(0, 2).toUpperCase(),
            role: parsed.data.role,
            joinedAt: new Date().toISOString(),
          },
        },
        { status: 201 }
      )
    }

    await assertWorkspaceRole(actor.id, workspaceId, [WorkspaceRole.OWNER, WorkspaceRole.ADMIN])

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true },
    })

    if (!workspace) {
      return NextResponse.json({ message: "Workspace khong ton tai." }, { status: 404 })
    }

    const email = parsed.data.email.trim().toLowerCase()
    const targetUser = await prisma.user.findUnique({
      where: {
        email,
      },
    })

    if (targetUser) {
      const existingMembership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: targetUser.id,
          },
        },
        include: {
          user: true,
        },
      })

      if (existingMembership) {
        return NextResponse.json(
          {
            mode: "existing",
            message: "Tai khoan nay da thuoc workspace.",
            member: mapMember(existingMembership),
          },
          { status: 200 }
        )
      }

      const generalChannel = await ensureGeneralChannel(workspaceId, actor.id)

      const membership = await prisma.workspaceMember.create({
        data: {
          workspaceId,
          userId: targetUser.id,
          role: parsed.data.role,
        },
        include: {
          user: true,
        },
      })

      await prisma.chatChannelMember.upsert({
        where: {
          channelId_userId: {
            channelId: generalChannel.id,
            userId: targetUser.id,
          },
        },
        update: {},
        create: {
          channelId: generalChannel.id,
          userId: targetUser.id,
        },
      })

      await prisma.workspaceInvitation.updateMany({
        where: {
          workspaceId,
          email,
          status: InvitationStatus.PENDING,
        },
        data: {
          status: InvitationStatus.ACCEPTED,
          invitedUserId: targetUser.id,
          acceptedAt: new Date(),
        },
      })

      await prisma.activityLog.create({
        data: {
          workspaceId,
          actorId: actor.id,
          type: ActivityType.MEMBER_JOINED,
          message: `${actor.name ?? actor.email} da them ${targetUser.name ?? targetUser.email} vao workspace.`,
          metadata: {
            addedUserId: targetUser.id,
            addedUserEmail: targetUser.email,
            role: parsed.data.role,
          },
        },
      })

      return NextResponse.json(
        {
          mode: "added",
          member: mapMember(membership),
        },
        { status: 201 }
      )
    }

    const existingInvitation = await prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId,
        email,
        status: InvitationStatus.PENDING,
      },
      include: {
        invitedBy: true,
      },
    })

    const invitation =
      existingInvitation ??
      (await prisma.workspaceInvitation.create({
        data: {
          workspaceId,
          email,
          role: parsed.data.role,
          token: randomUUID(),
          invitedById: actor.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        include: {
          invitedBy: true,
        },
      }))

    if (!existingInvitation) {
      await prisma.activityLog.create({
        data: {
          workspaceId,
          actorId: actor.id,
          type: ActivityType.MEMBER_JOINED,
          message: `${actor.name ?? actor.email} da tao loi moi cho ${email}.`,
          metadata: {
            invitationId: invitation.id,
            invitedEmail: email,
            role: parsed.data.role,
          },
        },
      })
    }

    return NextResponse.json(
      {
        mode: "invited",
        invitation: mapInvitation(invitation),
        message: existingInvitation
          ? "Email nay da co loi moi dang cho."
          : `Da tao loi moi cho ${email}.`,
      },
      { status: existingInvitation ? 200 : 201 }
    )
  } catch (error) {
    return toErrorResponse(error, "Khong the them thanh vien.")
  }
}
