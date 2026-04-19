"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CalendarDays, Clock, Plus, TimerReset } from "lucide-react"

type PlannerTask = {
  id: string
  title: string
  status: string
  priority: string
  assignee: string
  deadline: string
}

type WorkspacePlannerProps = {
  workspaceId: string
  tasks: PlannerTask[]
}

const priorityOptions = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const

export function WorkspacePlanner({ workspaceId, tasks }: WorkspacePlannerProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    deadline: "",
  })

  const upcomingTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.deadline && task.deadline !== "Chưa có")
        .sort((a, b) => a.deadline.localeCompare(b.deadline))
        .slice(0, 5),
    [tasks]
  )

  const completedCount = useMemo(
    () => tasks.filter((task) => task.status === "DONE").length,
    [tasks]
  )

  const inProgressCount = useMemo(
    () => tasks.filter((task) => task.status === "IN_PROGRESS" || task.status === "REVIEW").length,
    [tasks]
  )

  const handleCreateTask = async () => {
    if (!form.title.trim()) {
      toast.error("Tên task là bắt buộc.")
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/workspaces/${workspaceId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        throw new Error("Không thể tạo task mới.")
      }

      toast.success("Đã tạo task mới.")
      setForm({
        title: "",
        description: "",
        priority: "MEDIUM",
        deadline: "",
      })
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm font-semibold text-primary">Khu vực Lịch và Công việc</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Form tạo task nằm ngay bên dưới, ở khung có tiêu đề <strong>Tạo công việc mới</strong>.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-primary/30 shadow-md shadow-primary/5">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Tạo công việc mới</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="task-title">Tên công việc</Label>
              <Input
                id="task-title"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Ví dụ: Chuẩn bị demo realtime"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-description">Mô tả</Label>
              <Textarea
                id="task-description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Mô tả ngắn về task..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-priority">Ưu tiên</Label>
              <select
                id="task-priority"
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={form.priority}
                onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
              >
                {priorityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-deadline">Deadline</Label>
              <Input
                id="task-deadline"
                type="date"
                value={form.deadline}
                onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))}
              />
            </div>

            <div className="grid gap-3 pt-2">
              <Button onClick={handleCreateTask} disabled={isSubmitting} className="gap-2">
                <Plus className="h-4 w-4" />
                {isSubmitting ? "Đang tạo..." : "Tạo task"}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setForm({
                    title: "",
                    description: "",
                    priority: "MEDIUM",
                    deadline: "",
                  })
                }
                className="gap-2"
              >
                <TimerReset className="h-4 w-4" />
                Làm mới form
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Lịch và công việc</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Theo dõi deadline gần nhất và tiến độ công việc trong workspace này.
                </p>
              </div>
              <Badge variant="secondary" className="gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                Hôm nay
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-sm text-muted-foreground">Tổng task</p>
                <p className="mt-2 text-3xl font-bold">{tasks.length}</p>
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-sm text-muted-foreground">Đang xử lý</p>
                <p className="mt-2 text-3xl font-bold">{inProgressCount}</p>
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-sm text-muted-foreground">Hoàn thành</p>
                <p className="mt-2 text-3xl font-bold">{completedCount}</p>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Deadline sắp tới</h3>
              </div>

              {upcomingTasks.length > 0 ? (
                <div className="space-y-3">
                  {upcomingTasks.map((task) => (
                    <div key={task.id} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Assignee: {task.assignee}
                          </p>
                        </div>
                        <Badge variant="outline">{task.priority}</Badge>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="rounded-full bg-muted px-2 py-1">{task.status}</span>
                        <span>{task.deadline}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                  Chưa có deadline nào trong workspace này.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
