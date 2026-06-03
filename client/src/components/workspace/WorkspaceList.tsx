"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderKanban, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { createWorkspace, deleteWorkspace, listWorkspaces, type Workspace } from "@/services/workspace.service";
import { getInitials, getUserAvatar } from "@/components/dashboard/dashboardUtils";
import { WorkspaceTopBar } from "@/components/layout/WorkspaceTopBar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

function WorkspaceListCard({
  workspace,
  onDelete,
}: {
  workspace: Workspace;
  onDelete: (workspace: Workspace) => Promise<boolean>;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function removeWorkspace() {
    setDeleting(true);
    try {
      if (await onDelete(workspace)) setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="group relative rounded-xl border bg-white transition hover:border-primary/50 hover:shadow-sm">
      <Link href={`/workspaces/${workspace.id}`} className="block p-5 pr-14">
        <FolderKanban className="h-6 w-6 text-primary" />
        <h2 className="mt-3 font-semibold">{workspace.name}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {workspace.description ||
            "Quản lý tài liệu, thành viên và tiến độ công việc"}
        </p>
        <p className="mt-4 text-xs text-slate-500">
          {workspace.members.length} thành viên · {workspace.documentCount} tài
          liệu · {workspace.completedTaskCount}/{workspace.taskCount} công việc
        </p>
      </Link>
      {workspace.role === "owner" && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title="Tùy chọn workspace"
              className="absolute right-3 top-3 rounded-full p-1.5 text-slate-500 opacity-0 transition hover:bg-slate-100 focus:opacity-100 group-hover:opacity-100 data-[state=open]:bg-slate-100 data-[state=open]:opacity-100"
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
              Workspace &quot;{workspace.name}&quot; và các công việc bên trong
              sẽ bị xóa vĩnh viễn. Tài liệu đang gắn với workspace sẽ được giữ
              lại.
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
  );
}

export function WorkspaceList() {
  const router = useRouter();
  const [items, setItems] = useState<Workspace[]>([]);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [userInitials, setUserInitials] = useState("T");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setUserInitials(getInitials());
      setUserAvatar(getUserAvatar());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    listWorkspaces()
      .then(setItems)
      .catch((e) => setError(e.message));
  }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setError("");
    try {
      const workspace = await createWorkspace({ name: name.trim() });
      router.push(`/workspaces/${workspace.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tạo workspace.");
    }
  }
  async function removeWorkspace(workspace: Workspace) {
    setError("");
    try {
      await deleteWorkspace(workspace.id);
      setItems((current) => current.filter((item) => item.id !== workspace.id));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể xóa workspace.");
      return false;
    }
  }
  return (
    <div className="min-h-screen bg-slate-50">
      <WorkspaceTopBar 
        search={search} 
        onSearchChange={setSearch}
        userAvatar={userAvatar}
        userInitials={userInitials}
        onLogout={() => router.push("/")} 
      />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Workspaces</h1>
            <p className="mt-1 text-sm text-slate-500">
              Không gian quản lý thành viên, công việc và tiến độ.
            </p>
          </div>
          <form onSubmit={submit} className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên workspace"
              className="rounded-md border bg-white px-3 py-2 text-sm"
            />
            <button className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white">
              <Plus className="mr-1 inline h-4 w-4" />
              Tạo
            </button>
          </form>
        </div>
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <div className="grid gap-4 md:grid-cols-2">
          {items
            .filter((item) =>
              item.name.toLowerCase().includes(search.toLowerCase())
            )
            .map((item) => (
              <WorkspaceListCard
                key={item.id}
                workspace={item}
                onDelete={removeWorkspace}
              />
            ))}
        </div>
      </main>
    </div>
  );
}
