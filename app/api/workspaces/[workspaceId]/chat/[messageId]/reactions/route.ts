import { NextResponse } from "next/server"
import { z } from "zod"
import { getOrCreateAppUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { assertWorkspaceAccess } from "@/lib/permissions"

const reactionSchema = z.object({
  emoji: z.string().min(1).max(16),
})

type RouteContext = {
  params: Promise<{
    workspaceId: string
    messageId: string
  }>
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getOrCreateAppUser()
  const { workspaceId, messageId } = await params

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = reactionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." },
      { status: 400 }
    )
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      ok: true,
      emoji: parsed.data.emoji,
      reacted: true,
    })
  }

  await assertWorkspaceAccess(user.id, workspaceId)

  const message = await prisma.chatMessage.findFirst({
    where: {
      id: messageId,
      workspaceId,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  })

  if (!message) {
    return NextResponse.json({ message: "Tin nhắn không tồn tại." }, { status: 404 })
  }

  const existing = await prisma.chatMessageReaction.findFirst({
    where: {
      messageId,
      userId: user.id,
      emoji: parsed.data.emoji,
    },
    select: {
      id: true,
    },
  })

  if (existing) {
    await prisma.chatMessageReaction.delete({
      where: {
        id: existing.id,
      },
    })

    return NextResponse.json({
      ok: true,
      emoji: parsed.data.emoji,
      reacted: false,
    })
  }

  await prisma.chatMessageReaction.create({
    data: {
      messageId,
      userId: user.id,
      emoji: parsed.data.emoji,
    },
  })

  return NextResponse.json({
    ok: true,
    emoji: parsed.data.emoji,
    reacted: true,
  })
}
