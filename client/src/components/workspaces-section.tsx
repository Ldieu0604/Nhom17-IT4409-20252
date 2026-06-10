"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { FolderKanban, MoreHorizontal, Plus, Trash2 } from "lucide-react"
import { deleteWorkspace, listWorkspaces, type Workspace } from "@/services/workspace.service"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function WorkspaceHomeCard({
  workspace,
  onDelete,
}: {
  workspace: Workspace
  onDelete: (workspace: Workspace) => Promise<boolean>
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function removeWorkspace() {
    setDeleting(true)
    try {
      if (await onDelete(workspace)) setConfirmingDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="group relative rounded-xl border bg-white transition hover:border-primary/50 hover:shadow-sm">
      <Link href={`/workspaces/${workspace.id}`} className="block p-4 pr-14 sm:p-5">
        <FolderKanban className="h-6 w-6 text-primary" />
        <h3 className="mt-3 truncate font-semibold">{workspace.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {workspace.description || "Không gian làm việc của nhóm"}
        </p>
        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{workspace.members.length} thành viên</span>
          <span>{workspace.documentCount} tài liệu</span>
          <span>{workspace.completedTaskCount}/{workspace.taskCount} việc</span>
        </div>
      </Link>
      {workspace.role === "owner" && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title="Tùy chọn workspace"
              className="absolute right-3 top-3 rounded-full p-1.5 text-slate-500 opacity-100 transition hover:bg-slate-100 focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 data-[state=open]:bg-slate-100 data-[state=open]:opacity-100"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setConfirmingDelete(true)}
            >
              <Trash2 className="h-4 w-4" />
              Xóa workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              Workspace &quot;{workspace.name}&quot; và các công việc bên trong sẽ
              bị xóa vĩnh viễn. Tài liệu đang gắn với workspace sẽ được giữ lại.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={() => void removeWorkspace()}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Đang xóa..." : "Xóa workspace"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function WorkspacesSection() {
  const [items, setItems] = useState<Workspace[]>([])
  const [error, setError] = useState("")
  useEffect(() => { listWorkspaces().then(setItems).catch(() => setItems([])) }, [])

  async function removeWorkspace(workspace: Workspace) {
    setError("")
    try {
      await deleteWorkspace(workspace.id)
      setItems((current) => current.filter((item) => item.id !== workspace.id))
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể xóa workspace.")
      return false
    }
  }

  return <section className="py-8">
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-bold sm:text-2xl">Workspace của bạn</h2><p className="text-sm text-muted-foreground">Quản lý team, công việc và tiến độ</p></div><Link href="/workspaces" className="inline-flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-white sm:w-auto"><Plus className="mr-1 h-4 w-4" />Workspace</Link></div>
    {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
    <div className="grid gap-4 md:grid-cols-2">{items.slice(0, 4).map((workspace) => <WorkspaceHomeCard key={workspace.id} workspace={workspace} onDelete={removeWorkspace} />)}</div>
    {items.length === 0 && <p className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-muted-foreground">Chưa có workspace.</p>}
  </section>
}
