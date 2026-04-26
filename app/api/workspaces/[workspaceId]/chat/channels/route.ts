import { ChannelType } from "@prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"
import { getOrCreateAppUser } from "@/lib/auth"
import { assertWorkspaceAccess } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

const createDirectChannelSchema = z.object({
  email: z.string().email("Email khong hop le."),
})

type RouteContext = {
  params: Promise<{
    workspaceId: string
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

async function getVisibleChannels(workspaceId: string, userId: string) {
  await ensureGeneralChannel(workspaceId, userId)

  const channels = await prisma.chatChannel.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      members: {
        some: {
          userId,
        },
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      messages: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  })

  return Promise.all(
    channels.map(async (channel) => {
      const unreadCount = await prisma.chatMessage.count({
        where: {
          workspaceId,
          channelId: channel.id,
          deletedAt: null,
          senderId: {
            not: userId,
          },
          readReceipts: {
            none: {
              userId,
            },
          },
        },
      })

      const memberNames = channel.members
        .map((member) => member.user.name ?? member.user.email)
        .filter(Boolean)

      return {
        id: channel.id,
        name: channel.type === ChannelType.DIRECT ? memberNames.join(", ") : channel.name,
        description: channel.description,
        type: channel.type,
        unreadCount,
        memberNames,
        lastMessageAt: channel.messages[0]?.createdAt?.toISOString() ?? null,
      }
    })
  )
}

function toErrorResponse(error: unknown, fallbackMessage: string) {
  const message = error instanceof Error ? error.message : fallbackMessage
  let status = 500

  if (message === "Unauthorized") {
    status = 401
  } else if (message.includes("quyen") || message.includes("truy cap")) {
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
      return NextResponse.json({ items: [] })
    }

    await assertWorkspaceAccess(user.id, workspaceId)

    const items = await getVisibleChannels(workspaceId, user.id)
    return NextResponse.json({ items })
  } catch (error) {
    return toErrorResponse(error, "Khong the tai danh sach chat.")
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const user = await getOrCreateAppUser()
    const { workspaceId } = await params

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createDirectChannelSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Du lieu khong hop le." },
        { status: 400 }
      )
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          item: {
            id: `mock-direct-${Date.now()}`,
            name: parsed.data.email,
            description: "Direct message demo",
            type: "DIRECT",
            unreadCount: 0,
            memberNames: [user.email, parsed.data.email],
            lastMessageAt: null,
          },
        },
        { status: 201 }
      )
    }

    await assertWorkspaceAccess(user.id, workspaceId)

    const normalizedEmail = parsed.data.email.trim().toLowerCase()
    const targetUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    })

    if (!targetUser) {
      return NextResponse.json({ message: "Khong tim thay tai khoan voi email nay." }, { status: 404 })
    }

    if (targetUser.id === user.id) {
      return NextResponse.json({ message: "Khong the tao chat truc tiep voi chinh ban." }, { status: 400 })
    }

    const targetMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: targetUser.id,
        },
      },
    })

    if (!targetMembership) {
      return NextResponse.json(
        { message: "Tai khoan nay chua thuoc workspace hien tai. Hay them thanh vien hoac chap nhan loi moi truoc." },
        { status: 400 }
      )
    }

    const directChannels = await prisma.chatChannel.findMany({
      where: {
        workspaceId,
        type: ChannelType.DIRECT,
        deletedAt: null,
        members: {
          some: {
            userId: {
              in: [user.id, targetUser.id],
            },
          },
        },
      },
      include: {
        members: {
          select: {
            userId: true,
          },
        },
      },
    })

    const sortedTargetIds = [user.id, targetUser.id].sort()
    const existing = directChannels.find((channel) => {
      const ids = channel.members.map((member) => member.userId).sort()
      return ids.length === 2 && ids[0] === sortedTargetIds[0] && ids[1] === sortedTargetIds[1]
    })

    const channel =
      existing ??
      (await prisma.chatChannel.create({
        data: {
          workspaceId,
          name: `${user.name ?? user.email}, ${targetUser.name ?? targetUser.email}`,
          type: ChannelType.DIRECT,
          description: "Kenh chat truc tiep giua hai thanh vien.",
          createdById: user.id,
          members: {
            create: [{ userId: user.id }, { userId: targetUser.id }],
          },
        },
      }))

    return NextResponse.json(
      {
        item: {
          id: channel.id,
          name: `${targetUser.name ?? targetUser.email}`,
          description: channel.description,
          type: channel.type,
          unreadCount: 0,
          memberNames: [user.name ?? user.email, targetUser.name ?? targetUser.email],
          lastMessageAt: null,
        },
      },
      { status: existing ? 200 : 201 }
    )
  } catch (error) {
    return toErrorResponse(error, "Khong the tao direct chat.")
  }
}
