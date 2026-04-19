import { NextResponse } from "next/server"
import { z } from "zod"
import { TaskPriority, TaskStatus } from "@prisma/client"
import { getOrCreateAppUser } from "@/lib/auth"
import { logActivity } from "@/lib/activity"
import { assertWorkspaceAccess } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

const createTaskSchema = z.object({
  title: z.string().min(1, "Tên task là bắt buộc."),
  description: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).optional().default(TaskPriority.MEDIUM),
  deadline: z.string().optional(),
})

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

  const items = await prisma.task.findMany({
    where: { workspaceId },
    orderBy: [{ status: "asc" }, { position: "asc" }],
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
  const parsed = createTaskSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." }, { status: 400 })
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ item: { id: `mock-task-${Date.now()}`, ...parsed.data } }, { status: 201 })
  }

  await assertWorkspaceAccess(user.id, workspaceId)

  const task = await prisma.task.create({
    data: {
      workspaceId,
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      status: TaskStatus.TODO,
      createdById: user.id,
      deadline:
        typeof parsed.data.deadline === "string" && parsed.data.deadline.length > 0
          ? new Date(parsed.data.deadline)
          : null,
    },
  })

  await logActivity({
    workspaceId,
    actorId: user.id,
    type: "TASK_CREATED",
    message: `đã tạo task "${parsed.data.title}"`,
  })

  return NextResponse.json({ item: task }, { status: 201 })
}
