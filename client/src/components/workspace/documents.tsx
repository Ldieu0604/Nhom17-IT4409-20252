"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, MoreHorizontal, Plus, Pencil, Trash2, X } from "lucide-react";
import { deleteDashboardDocument, renameDashboardDocument } from "@/services/document.service";
import type { Workspace, WorkspaceDocument } from "@/services/workspace.service";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, TemplatePill } from "./shared";
import { TEMPLATE_LABELS } from "./constants";
import { dateLabel } from "./utils";

function WorkspaceDocumentActionMenu({
  document,
  reload,
}: {
  document: WorkspaceDocument;
  reload: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [title, setTitle] = useState(document.title);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  function openEditor() {
    setTitle(document.title);
    setEditing(true);
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await renameDashboardDocument(document.id, title.trim());
      setEditing(false);
      reload();
    } finally {
      setSaving(false);
    }
  }
  async function removeDocument() {
    setDeleting(true);
    try {
      await deleteDashboardDocument(document.id);
      setConfirmingDelete(false);
      reload();
    } finally {
      setDeleting(false);
    }
  }
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title="Tùy chọn tài liệu"
            onClick={(event) => event.preventDefault()}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={openEditor}>
            <Pencil className="h-4 w-4" />
            Chỉnh sửa
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setConfirmingDelete(true)}
          >
            <Trash2 className="h-4 w-4" />
            Xóa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4">
          <form
            onSubmit={submit}
            className="relative w-full max-w-sm rounded-xl border bg-white p-5 shadow-xl"
          >
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="absolute right-4 top-4"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="font-semibold">Chỉnh sửa tài liệu</h3>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tên tài liệu"
              className="mt-4 w-full rounded-md border px-3 py-2 text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-md px-3 py-2 text-sm text-slate-500"
              >
                Hủy
              </button>
              <button
                disabled={saving || !title.trim()}
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white"
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </form>
        </div>
      )}
      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tài liệu?</AlertDialogTitle>
            <AlertDialogDescription>
              Tài liệu &quot;{document.title}&quot; sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={() => void removeDocument()}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function WorkspaceDocuments({
  workspace,
  createDoc,
  reload,
}: {
  workspace: Workspace;
  createDoc: (template: WorkspaceDocument["template"]) => void;
  reload: () => void;
}) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Tài liệu</h2>
          <p className="text-sm text-slate-500">
            Tất cả tài liệu thuộc workspace hiện tại.
          </p>
        </div>
        <div className="flex gap-2">
          {(
            Object.keys(TEMPLATE_LABELS) as WorkspaceDocument["template"][]
          ).map((template) => (
            <button
              key={template}
              onClick={() => createDoc(template)}
              className="rounded-md border bg-white px-3 py-2 text-xs font-medium hover:border-primary hover:text-primary"
            >
              <Plus className="mr-1 inline h-3.5 w-3.5" />
              {TEMPLATE_LABELS[template]}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {workspace.documents?.map((document) => (
          <Link
            key={document.id}
            href={`/documents/${document.id}`}
            className="group relative rounded-xl border bg-white p-4 pr-12 shadow-sm shadow-slate-100 transition hover:border-primary/50 hover:shadow"
          >
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="mt-3 truncate font-medium">{document.title}</h3>
            <div className="mt-4 flex items-center justify-between">
              <TemplatePill template={document.template} />
              <span className="text-[11px] text-slate-500">
                {dateLabel(document.updatedAt)}
              </span>
            </div>
            <span className="absolute right-3 top-3 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
              <WorkspaceDocumentActionMenu
                document={document}
                reload={reload}
              />
            </span>
          </Link>
        ))}
      </div>
      {!workspace.documents?.length && (
        <Card className="p-10 text-center text-sm text-slate-500">
          Chưa có tài liệu trong workspace.
          <div>
            <button
              onClick={() => createDoc("blank")}
              className="mt-4 rounded-md bg-primary px-3 py-2 text-white"
            >
              Tạo tài liệu đầu tiên
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
