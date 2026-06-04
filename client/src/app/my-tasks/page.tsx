"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CalendarDays, CheckCircle2, Clock3 } from "lucide-react"
import { listMyWorkspaceTasks, type WorkspaceTask } from "@/services/workspace.service"

const PRIORITY_LABELS = { low: "Thấp", medium: "Trung bình", high: "Cao" }

function dueDateLabel(value?: string | null) {
  return value ? new Date(value).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "Chưa đặt deadline"
}

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<WorkspaceTask[]>([])
  const [error, setError] = useState("")
  useEffect(() => { listMyWorkspaceTasks().then(setTasks).catch((e) => setError(e.message)) }, [])
  const sortedTasks = useMemo(() => [...tasks].sort((a, b) => {
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  }), [tasks])

  return <main className="min-h-screen bg-slate-50 px-5 py-8"><div className="mx-auto max-w-5xl">
    <div className="mb-6"><Link href="/#calendar" className="text-sm font-medium text-primary hover:underline">← Lịch & Công việc</Link><h1 className="mt-3 text-2xl font-semibold">Công việc của tôi</h1><p className="mt-1 text-sm text-slate-500">Công việc được giao cho bạn từ tất cả workspace.</p></div>
    {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
    <section className="overflow-hidden rounded-xl border bg-white shadow-sm shadow-slate-100">
      {sortedTasks.map((task) => <Link key={task.id} href={task.documentId ? `/documents/${task.documentId}` : `/workspaces/${task.workspaceId}?tab=tasks&task=${task.id}`} className="grid gap-2 border-t px-4 py-3 text-sm first:border-t-0 hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_140px_150px_100px] sm:items-center">
        <span className="flex min-w-0 items-center gap-2 font-medium">{task.completed ? <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> : <Clock3 className="h-4 w-4 shrink-0 text-amber-500" />}<span className={task.completed ? "truncate text-slate-400 line-through" : "truncate"}>{task.title}</span></span>
        <span className="truncate text-xs text-slate-500">{task.workspace?.name}</span>
        <span className="flex items-center gap-1 text-xs text-slate-500"><CalendarDays className="h-3.5 w-3.5" />{dueDateLabel(task.dueDate)}</span>
        <span className="text-xs text-slate-500">{PRIORITY_LABELS[task.priority]}</span>
      </Link>)}
      {sortedTasks.length === 0 && <p className="p-10 text-center text-sm text-slate-500">Bạn chưa được giao công việc nào.</p>}
    </section>
  </div></main>
}
