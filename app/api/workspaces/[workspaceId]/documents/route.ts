import { NextResponse } from "next/server"
import { z } from "zod"
import { DocumentStatus } from "@prisma/client"
import { getOrCreateAppUser } from "@/lib/auth"
import { logActivity } from "@/lib/activity"
import { assertWorkspaceAccess } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

const createDocumentSchema = z.object({
  title: z.string().min(1, "Tiêu đề tài liệu là bắt buộc."),
  initialText: z.string().optional(),
})

function textToTiptapDoc(text?: string) {
  const normalized = (text ?? "").trim()

  if (!normalized) {
    return {
      type: "doc",
      content: [],
    }
  }

  return {
    type: "doc",
    content: normalized.split(/\n{2,}/).map((paragraph) => ({
      type: "paragraph",
      content: [
        {
          type: "text",
          text: paragraph,
        },
      ],
    })),
  }
}

type RouteContext = {
  params: Promise<{
    workspaceId: string
  }>
}

export async function GET(_: Request, { params }: RouteContext) {
  const user = await getOrCreateAppUser()
  const { workspaceId } = await params

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ items: [] })
  }

  await assertWorkspaceAccess(user.id, workspaceId)

  const items = await prisma.document.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json({ items })
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getOrCreateAppUser()
  const { workspaceId } = await params

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createDocumentSchema.safeParse(body)

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
          id: `mock-doc-${Date.now()}`,
          title: parsed.data.title,
          content: textToTiptapDoc(parsed.data.initialText),
        },
      },
      { status: 201 }
    )
  }

  await assertWorkspaceAccess(user.id, workspaceId)

  const document = await prisma.document.create({
    data: {
      workspaceId,
      title: parsed.data.title,
      status: DocumentStatus.ACTIVE,
      createdById: user.id,
      updatedById: user.id,
      content: textToTiptapDoc(parsed.data.initialText),
    },
  })

  await logActivity({
    workspaceId,
    actorId: user.id,
    type: "DOCUMENT_CREATED",
    message: `đã tạo tài liệu "${parsed.data.title}"`,
  })

  return NextResponse.json({ item: document }, { status: 201 })
}
