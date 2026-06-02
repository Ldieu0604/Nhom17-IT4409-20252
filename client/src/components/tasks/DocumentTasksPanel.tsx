"use client"
import { useCallback, useEffect, useState } from "react"
import { CheckSquare, X } from "lucide-react"
import { listDocumentTasks, updateWorkspaceTask, type WorkspaceTask } from "@/services/workspace.service"

export function DocumentTasksPanel({ documentId, onClose }: { documentId: string; onClose: () => void }) {
  const [tasks, setTasks] = useState<WorkspaceTask[]>([])
  const [error, setError] = useState("")
  const load = useCallback(() => listDocumentTasks(documentId).then(setTasks).catch((e) => setError(e.message)), [documentId])
  useEffect(() => { void load() }, [load])
  async function toggle(task: WorkspaceTask) {
    await updateWorkspaceTask(task.workspaceId, task.id, { completed: !task.completed })
    await load()
  }
  return <aside className="flex h-full w-80 flex-col border-l bg-white">
    <div className="flex items-center justify-between border-b px-4 py-3"><h2 className="flex items-center gap-2 font-semibold"><CheckSquare className="h-4 w-4" /> Công việc</h2><button onClick={onClose}><X className="h-4 w-4" /></button></div>
    <div className="flex-1 overflow-y-auto p-4">{error && <p className="text-sm text-red-600">{error}</p>}{tasks.map((task) => <label key={task.id} className="flex gap-3 border-b py-3 last:border-0"><input type="checkbox" checked={task.completed} onChange={() => toggle(task)} className="mt-1 h-4 w-4 accent-primary" /><span className="min-w-0"><span className={task.completed ? "block text-sm text-slate-400 line-through" : "block text-sm font-medium"}>{task.title}</span><span className="mt-1 block text-xs text-slate-500">{task.assignee?.displayName || "Chưa giao"}{task.dueDate ? ` · ${new Date(task.dueDate).toLocaleDateString("vi-VN")}` : ""}</span></span></label>)}{!error && tasks.length === 0 && <p className="text-sm text-slate-500">Tài liệu này chưa có công việc liên quan.</p>}</div>
  </aside>
}
