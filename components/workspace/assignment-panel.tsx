"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type AssignmentTask = {
  id: string
  title: string
  status: string
  priority: string
  assignee: string
  deadline: string
}

type MemberOption = {
  id?: string
  name: string
  initials: string
  role: string
}

type AssignmentPanelProps = {
  workspaceId: string
  tasks: AssignmentTask[]
  members: MemberOption[]
}

export function AssignmentPanel({ workspaceId, tasks, members }: AssignmentPanelProps) {
  const router = useRouter()
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null)

  const handleAssign = async (taskId: string, assigneeId: string) => {
    try {
      setPendingTaskId(taskId)
      const response = await fetch(`/api/workspaces/${workspaceId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assigneeId: assigneeId === "unassigned" ? null : assigneeId,
        }),
      })

      if (!response.ok) {
        throw new Error("Không thể cập nhật phân công.")
      }

      toast.success("Đã cập nhật người phụ trách.")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra.")
    } finally {
      setPendingTaskId(null)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Phân công công việc</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task.id} className="rounded-xl border p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-medium">{task.title}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline">{task.status}</Badge>
                    <Badge variant="secondary">{task.priority}</Badge>
                    <Badge variant="outline">Deadline: {task.deadline}</Badge>
                  </div>
                </div>

                <div className="min-w-[220px]">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Người phụ trách
                  </label>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    defaultValue={
                      members.find((member) => member.name === task.assignee)?.id ?? "unassigned"
                    }
                    onChange={(event) => handleAssign(task.id, event.target.value)}
                    disabled={pendingTaskId === task.id}
                  >
                    <option value="unassigned">Chưa phân công</option>
                    {members
                      .filter((member) => member.id)
                      .map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.role})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Chưa có task nào để phân công.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
