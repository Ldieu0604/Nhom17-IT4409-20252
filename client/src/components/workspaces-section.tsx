"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { FolderKanban, Plus } from "lucide-react"
import { listWorkspaces, type Workspace } from "@/services/workspace.service"

export function WorkspacesSection() {
  const [items, setItems] = useState<Workspace[]>([])
  useEffect(() => { listWorkspaces().then(setItems).catch(() => setItems([])) }, [])
  return <section className="py-8">
    <div className="mb-6 flex items-center justify-between"><div><h2 className="text-2xl font-bold">Workspace của bạn</h2><p className="text-sm text-muted-foreground">Quản lý team, công việc và tiến độ</p></div><Link href="/workspaces" className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white"><Plus className="mr-1 inline h-4 w-4" />Workspace</Link></div>
    <div className="grid gap-4 md:grid-cols-2">{items.slice(0, 4).map((workspace) => <Link href={`/workspaces/${workspace.id}`} key={workspace.id} className="rounded-xl border bg-white p-5 transition hover:border-primary/50 hover:shadow-sm"><FolderKanban className="h-6 w-6 text-primary" /><h3 className="mt-3 font-semibold">{workspace.name}</h3><p className="mt-1 text-sm text-muted-foreground">{workspace.description || "Không gian làm việc của nhóm"}</p><div className="mt-4 flex gap-3 text-xs text-muted-foreground"><span>{workspace.members.length} thành viên</span><span>{workspace.documentCount} tài liệu</span><span>{workspace.completedTaskCount}/{workspace.taskCount} việc</span></div></Link>)}</div>
    {items.length === 0 && <p className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-muted-foreground">Chưa có workspace.</p>}
  </section>
}
