import { NextResponse } from "next/server"
import { z } from "zod"
import { getOrCreateAppUser } from "@/lib/auth"
import { logActivity } from "@/lib/activity"
import { assertWorkspaceAccess } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

const updateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.any().optional(),
})

type RouteContext = {
  params: Promise<{
    workspaceId: string
    documentId: string
  }>
}

export async function GET(_: Request, { params }: RouteContext) {
  const user = await getOrCreateAppUser()
  const { workspaceId, documentId } = await params

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ item: null })
  }

  await assertWorkspaceAccess(user.id, workspaceId)

  const item = await prisma.document.findFirst({
    where: {
      id: documentId,
      workspaceId,
    },
  })

  return NextResponse.json({ item })
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getOrCreateAppUser()
  const { workspaceId, documentId } = await params

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = updateDocumentSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." },
      { status: 400 }
    )
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ item: { id: documentId, ...parsed.data } })
  }

  await assertWorkspaceAccess(user.id, workspaceId)

  const item = await prisma.document.update({
    where: { id: documentId },
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
      updatedById: user.id,
    },
  })

  await logActivity({
    workspaceId,
    actorId: user.id,
    type: "DOCUMENT_UPDATED",
    message: `đã cập nhật tài liệu "${item.title}"`,
  })

  return NextResponse.json({ item })
}
