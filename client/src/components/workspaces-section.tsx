"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { FolderKanban, Plus } from "lucide-react"
import { listWorkspaces, type Workspace } from "@/services/workspace.service"

export function WorkspacesSection() {
  const [items, setItems] = useState<Workspace[]>([])
  useEffect(() => { listWorkspaces().then(setItems).catch(() => setItems([])) }, [])
  return <section className="py-8">
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-bold sm:text-2xl">Workspace của bạn</h2><p className="text-sm text-muted-foreground">Quản lý team, công việc và tiến độ</p></div><Link href="/workspaces" className="inline-flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-white sm:w-auto"><Plus className="mr-1 h-4 w-4" />Workspace</Link></div>
    <div className="grid gap-4 md:grid-cols-2">{items.slice(0, 4).map((workspace) => <Link href={`/workspaces/${workspace.id}`} key={workspace.id} className="rounded-xl border bg-white p-4 transition hover:border-primary/50 hover:shadow-sm sm:p-5"><FolderKanban className="h-6 w-6 text-primary" /><h3 className="mt-3 truncate font-semibold">{workspace.name}</h3><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{workspace.description || "Không gian làm việc của nhóm"}</p><div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground"><span>{workspace.members.length} thành viên</span><span>{workspace.documentCount} tài liệu</span><span>{workspace.completedTaskCount}/{workspace.taskCount} việc</span></div></Link>)}</div>
    {items.length === 0 && <p className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-muted-foreground">Chưa có workspace.</p>}
  </section>
}
