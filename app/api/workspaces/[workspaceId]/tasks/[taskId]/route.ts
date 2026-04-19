import { NextResponse } from "next/server"
import { z } from "zod"
import { TaskPriority, TaskStatus } from "@prisma/client"
import { getOrCreateAppUser } from "@/lib/auth"
import { logActivity } from "@/lib/activity"
import { assertWorkspaceAccess } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  assigneeId: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
})

type RouteContext = {
  params: Promise<{
    workspaceId: string
    taskId: string
  }>
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getOrCreateAppUser()
  const { workspaceId, taskId } = await params

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = updateTaskSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." },
      { status: 400 }
    )
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ item: { id: taskId, ...parsed.data } })
  }

  await assertWorkspaceAccess(user.id, workspaceId)

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      status: parsed.data.status,
      assigneeId:
        typeof parsed.data.assigneeId === "string"
          ? parsed.data.assigneeId
          : parsed.data.assigneeId === null
          ? null
          : undefined,
      deadline:
        typeof parsed.data.deadline === "string" && parsed.data.deadline.length > 0
          ? new Date(parsed.data.deadline)
          : parsed.data.deadline === null
          ? null
          : undefined,
    },
  })

  await logActivity({
    workspaceId,
    actorId: user.id,
    type: "TASK_UPDATED",
    message: `đã cập nhật task "${task.title}"`,
  })

  return NextResponse.json({ item: task })
}
