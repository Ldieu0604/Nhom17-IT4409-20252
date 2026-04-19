"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type TaskBoardItem = {
  id: string
  title: string
  status: string
  priority: string
  assignee: string
  deadline: string
}

type TaskBoardProps = {
  workspaceId: string
  tasks: TaskBoardItem[]
}

const columns = [
  { key: "TODO", label: "Todo" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "REVIEW", label: "Review" },
  { key: "DONE", label: "Done" },
]

const nextStatusMap: Record<string, string | null> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "REVIEW",
  REVIEW: "DONE",
  DONE: null,
}

const priorityTone: Record<string, string> = {
  LOW: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  MEDIUM: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  HIGH: "bg-destructive/10 text-destructive border-destructive/20",
  URGENT: "bg-destructive/10 text-destructive border-destructive/20",
}

export function TaskBoard({ workspaceId, tasks }: TaskBoardProps) {
  const router = useRouter()
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null)

  const grouped = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        tasks: tasks.filter((task) => task.status === column.key),
      })),
    [tasks]
  )

  const moveToNextStatus = async (task: TaskBoardItem) => {
    const nextStatus = nextStatusMap[task.status]

    if (!nextStatus) {
      return
    }

    try {
      setPendingTaskId(task.id)
      const response = await fetch(`/api/workspaces/${workspaceId}/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      })

      if (!response.ok) {
        throw new Error("Không thể cập nhật trạng thái task.")
      }

      toast.success("Đã cập nhật trạng thái task.")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra.")
    } finally {
      setPendingTaskId(null)
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {grouped.map((column) => (
        <Card key={column.key} className="min-h-[260px]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              {column.label}
              <Badge variant="secondary">{column.tasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {column.tasks.length > 0 ? (
              column.tasks.map((task) => (
                <div key={task.id} className="rounded-xl border bg-card p-3">
                  <p className="font-medium">{task.title}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline" className={priorityTone[task.priority] ?? ""}>
                      {task.priority}
                    </Badge>
                    <Badge variant="secondary">{task.assignee}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Deadline: {task.deadline}</p>
                  {nextStatusMap[task.status] && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 w-full"
                      onClick={() => moveToNextStatus(task)}
                      disabled={pendingTaskId === task.id}
                    >
                      {pendingTaskId === task.id
                        ? "Đang cập nhật..."
                        : `Chuyển sang ${nextStatusMap[task.status]}`}
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                Chưa có task ở cột này.
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
