import { NextResponse } from "next/server"
import { z } from "zod"
import { getOrCreateAppUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { assertWorkspaceAccess } from "@/lib/permissions"

const markReadSchema = z.object({
  channelId: z.string().cuid().optional().nullable(),
})

type RouteContext = {
  params: Promise<{
    workspaceId: string
  }>
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getOrCreateAppUser()
  const { workspaceId } = await params

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: true, unreadCount: 0 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = markReadSchema.safeParse(body)
  const requestedChannelId = parsed.success ? parsed.data.channelId ?? undefined : undefined

  await assertWorkspaceAccess(user.id, workspaceId)

  const channel = await prisma.chatChannel.findFirst({
    where: {
      workspaceId,
      deletedAt: null,
      ...(requestedChannelId ? { id: requestedChannelId } : { type: "GENERAL" }),
      members: {
        some: {
          userId: user.id,
        },
      },
    },
    select: {
      id: true,
    },
  })

  if (!channel) {
    return NextResponse.json({ ok: true, unreadCount: 0 })
  }

  const unreadMessages = await prisma.chatMessage.findMany({
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
    select: {
      id: true,
    },
  })

  if (unreadMessages.length > 0) {
    await prisma.chatMessageRead.createMany({
      data: unreadMessages.map((message) => ({
        messageId: message.id,
        userId: user.id,
      })),
      skipDuplicates: true,
    })
  }

  await prisma.chatChannelMember.upsert({
    where: {
      channelId_userId: {
        channelId: channel.id,
        userId: user.id,
      },
    },
    update: {
      lastReadAt: new Date(),
    },
    create: {
      channelId: channel.id,
      userId: user.id,
      lastReadAt: new Date(),
    },
  })

  return NextResponse.json({ ok: true, unreadCount: 0 })
}
