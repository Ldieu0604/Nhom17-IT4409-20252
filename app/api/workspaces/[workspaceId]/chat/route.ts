import { NextResponse } from "next/server"
import {
  ChannelType,
  MessageType,
  NotificationStatus,
  NotificationType,
} from "@prisma/client"
import { z } from "zod"
import { getOrCreateAppUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { assertWorkspaceAccess } from "@/lib/permissions"

const createMessageSchema = z.object({
  content: z.string().min(1, "Nội dung tin nhắn là bắt buộc.").max(4000, "Tin nhắn quá dài."),
  parentMessageId: z.string().cuid().optional().nullable(),
  channelId: z.string().cuid().optional().nullable(),
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

async function ensureChannelAccess(workspaceId: string, userId: string, channelId?: string | null) {
  if (channelId) {
    const channel = await prisma.chatChannel.findFirst({
      where: {
        id: channelId,
        workspaceId,
        deletedAt: null,
        members: {
          some: {
            userId,
          },
        },
      },
    })

    if (channel) {
      return channel
    }
  }

  const general = await ensureGeneralChannel(workspaceId, userId)

  await prisma.chatChannelMember.upsert({
    where: {
      channelId_userId: {
        channelId: general.id,
        userId,
      },
    },
    update: {},
    create: {
      channelId: general.id,
      userId,
    },
  })

  return general
}

function mapMessage(message: any, currentUserId: string) {
  return {
    id: message.id,
    content: message.content ?? "",
    createdAt: message.createdAt.toISOString(),
    sender: {
      id: message.sender?.id ?? null,
      name: message.sender?.name ?? message.sender?.email ?? "Hệ thống",
    },
    senderId: message.senderId,
    isOwn: message.senderId === currentUserId,
    readByCount: message.readReceipts.length,
    reactions: Array.from(new Map(message.reactions.map((reaction: any) => [reaction.emoji, reaction.emoji])).values()).map(
      (emoji) => ({
        emoji,
        count: message.reactions.filter((reaction: any) => reaction.emoji === emoji).length,
        reactedByCurrentUser: message.reactions.some(
          (reaction: any) => reaction.emoji === emoji && reaction.userId === currentUserId
        ),
      })
    ),
    replyTo: message.parentMessage
      ? {
          id: message.parentMessage.id,
          senderName:
            message.parentMessage.sender?.name ??
            message.parentMessage.sender?.email ??
            "Hệ thống",
          content: message.parentMessage.content ?? "",
        }
      : null,
  }
}

export async function GET(request: Request, { params }: RouteContext) {
  const user = await getOrCreateAppUser()
  const { workspaceId } = await params

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const requestedChannelId = searchParams.get("channelId")

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      channel: {
        id: "mock-channel",
        name: "general",
        description: "Kênh chat demo của workspace.",
      },
      unreadCount: 0,
      items: [],
    })
  }

  await assertWorkspaceAccess(user.id, workspaceId)

  const channel = await ensureChannelAccess(workspaceId, user.id, requestedChannelId)

  const items = await prisma.chatMessage.findMany({
    where: {
      workspaceId,
      channelId: channel.id,
      deletedAt: null,
    },
    include: {
      sender: true,
      parentMessage: {
        include: {
          sender: true,
        },
      },
      reactions: true,
      readReceipts: {
        select: {
          userId: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 50,
  })

  const unreadCount = await prisma.chatMessage.count({
    where: {
      workspaceId,
      channelId: channel.id,
      deletedAt: null,
      senderId: {
        not: user.id,
      },
      readReceipts: {
        none: {
          userId: user.id,
        },
      },
    },
  })

  return NextResponse.json({
    channel: {
      id: channel.id,
      name: channel.name,
      description: channel.description,
      type: channel.type,
    },
    unreadCount,
    items: items.map((message) => mapMessage(message, user.id)),
  })
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getOrCreateAppUser()
  const { workspaceId } = await params

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createMessageSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." },
      { status: 400 }
    )
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        item: {
          id: `mock-message-${Date.now()}`,
          content: parsed.data.content,
          createdAt: new Date().toISOString(),
          sender: {
            id: user.id,
            name: user.name ?? user.email,
          },
          senderId: user.id,
          isOwn: true,
          readByCount: 1,
          reactions: [],
          replyTo: null,
        },
      },
      { status: 201 }
    )
  }

  await assertWorkspaceAccess(user.id, workspaceId)

  const channel = await ensureChannelAccess(workspaceId, user.id, parsed.data.channelId)

  if (parsed.data.parentMessageId) {
    const parentMessage = await prisma.chatMessage.findFirst({
      where: {
        id: parsed.data.parentMessageId,
        workspaceId,
        channelId: channel.id,
        deletedAt: null,
      },
      select: { id: true },
    })

    if (!parentMessage) {
      return NextResponse.json({ message: "Tin nhắn được trả lời không tồn tại." }, { status: 404 })
    }
  }

  const message = await prisma.chatMessage.create({
    data: {
      workspaceId,
      channelId: channel.id,
      senderId: user.id,
      type: MessageType.TEXT,
      content: parsed.data.content.trim(),
      parentMessageId: parsed.data.parentMessageId ?? null,
    },
    include: {
      sender: true,
      parentMessage: {
        include: {
          sender: true,
        },
      },
      reactions: true,
      readReceipts: true,
    },
  })

  await prisma.chatMessageRead.upsert({
    where: {
      messageId_userId: {
        messageId: message.id,
        userId: user.id,
      },
    },
    update: {
      readAt: new Date(),
    },
    create: {
      messageId: message.id,
      userId: user.id,
    },
  })

  await prisma.chatChannel.update({
    where: { id: channel.id },
    data: {
      updatedAt: new Date(),
    },
  })

  const otherMembers = await prisma.chatChannelMember.findMany({
    where: {
      channelId: channel.id,
      userId: {
        not: user.id,
      },
    },
    select: {
      userId: true,
    },
  })

  if (otherMembers.length > 0) {
    await prisma.notification.createMany({
      data: otherMembers.map((member) => ({
        recipientId: member.userId,
        actorId: user.id,
        workspaceId,
        messageId: message.id,
        type: NotificationType.CHAT_MESSAGE,
        status: NotificationStatus.UNREAD,
        title: "Tin nhắn mới trong chat",
        content: parsed.data.content.trim().slice(0, 160),
        actionUrl: `/workspaces/${workspaceId}`,
      })),
    })
  }

  const freshMessage = await prisma.chatMessage.findUnique({
    where: {
      id: message.id,
    },
    include: {
      sender: true,
      parentMessage: {
        include: {
          sender: true,
        },
      },
      reactions: true,
      readReceipts: true,
    },
  })

  return NextResponse.json(
    {
      item: mapMessage(freshMessage, user.id),
    },
    { status: 201 }
  )
}
