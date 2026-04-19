import { Badge } from "@/components/ui/badge"
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
  tasks: TaskBoardItem[]
}

const columns = [
  { key: "TODO", label: "Todo" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "REVIEW", label: "Review" },
  { key: "DONE", label: "Done" },
]

export function TaskBoard({ tasks }: TaskBoardProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {columns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.key)

        return (
          <Card key={column.key} className="min-h-[240px]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                {column.label}
                <Badge variant="secondary">{columnTasks.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {columnTasks.length > 0 ? (
                columnTasks.map((task) => (
                  <div key={task.id} className="rounded-xl border bg-card p-3">
                    <p className="font-medium">{task.title}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="outline">{task.priority}</Badge>
                      <Badge variant="secondary">{task.assignee}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Deadline: {task.deadline}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  Chưa có task ở cột này.
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
