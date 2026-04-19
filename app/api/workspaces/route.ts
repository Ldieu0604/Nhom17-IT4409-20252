import { NextResponse } from "next/server"
import { z } from "zod"
import { WorkspaceRole, WorkspaceVisibility } from "@prisma/client"
import { getOrCreateAppUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/utils/slug"
import { logActivity } from "@/lib/activity"

const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Tên workspace là bắt buộc."),
  description: z.string().optional().default(""),
  invitedEmails: z.string().optional().default(""),
})

export async function GET() {
  const user = await getOrCreateAppUser()

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ items: [] })
  }

  const items = await prisma.workspaceMember.findMany({
    where: { userId: user.id },
    include: { workspace: true },
  })

  return NextResponse.json({ items })
}

export async function POST(request: Request) {
  const user = await getOrCreateAppUser()

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createWorkspaceSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." }, { status: 400 })
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        message: "Workspace giả lập đã được tạo. Hãy cấu hình DATABASE_URL để lưu thật.",
        item: {
          id: `mock-${Date.now()}`,
          ...parsed.data,
        },
      },
      { status: 201 }
    )
  }

  const baseSlug = slugify(parsed.data.name)
  const slug = `${baseSlug}-${Date.now().toString().slice(-6)}`
  const invitedEmails = parsed.data.invitedEmails
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean)

  const workspace = await prisma.workspace.create({
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      visibility: WorkspaceVisibility.PRIVATE,
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: WorkspaceRole.OWNER,
        },
      },
      invitations: {
        create: invitedEmails.map((email) => ({
          email,
          token: crypto.randomUUID(),
          invitedById: user.id,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        })),
      },
    },
  })

  await logActivity({
    workspaceId: workspace.id,
    actorId: user.id,
    type: "WORKSPACE_CREATED",
    message: "đã tạo workspace mới",
  })

  return NextResponse.json({ item: workspace }, { status: 201 })
}
