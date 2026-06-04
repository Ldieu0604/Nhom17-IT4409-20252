"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpDown, CalendarDays, Filter, Grid2X2, ListChecks, MoreHorizontal, Plus, Pencil, Search, Trash2, Users, X } from "lucide-react";
import { createWorkspaceTask, deleteWorkspaceTask, updateWorkspaceTask, type Workspace, type WorkspaceTask } from "@/services/workspace.service";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, Card, PriorityPill, StatusPill } from "./shared";
import type { CustomColumn, SortDirection, TaskSortKey, TaskView } from "./types";
import { dateInputValue, dateLabel } from "./utils";

function TaskForm({
  workspace,
  onCreated,
  onCancel,
}: {
  workspace: Workspace;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<WorkspaceTask["priority"]>("medium");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    await createWorkspaceTask(workspace.id, {
      title: title.trim(),
      assigneeId: assigneeId || null,
      documentId: documentId || null,
      dueDate: dueDate ? new Date(`${dueDate}T00:00:00`).toISOString() : null,
      priority,
    });
    onCreated();
  }
  return (
    <form
      onSubmit={submit}
      className="mb-4 grid gap-2 rounded-lg border bg-slate-50 p-3 md:grid-cols-5"
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Tên công việc"
        className="rounded-md border bg-white px-3 py-2 text-sm md:col-span-2"
      />
      <select
        value={assigneeId}
        onChange={(e) => setAssigneeId(e.target.value)}
        className="rounded-md border bg-white px-2 text-sm"
      >
        <option value="">Chưa giao</option>
        {workspace.members.map((member) => (
          <option key={member.id} value={member.user.id}>
            {member.user.displayName}
          </option>
        ))}
      </select>
      <select
        value={priority}
        onChange={(e) =>
          setPriority(e.target.value as WorkspaceTask["priority"])
        }
        className="rounded-md border bg-white px-2 text-sm"
      >
        <option value="low">Thấp</option>
        <option value="medium">Trung bình</option>
        <option value="high">Cao</option>
      </select>
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="rounded-md border bg-white px-2 text-sm"
      />
      <select
        value={documentId}
        onChange={(e) => setDocumentId(e.target.value)}
        className="rounded-md border bg-white px-2 py-2 text-sm md:col-span-2"
      >
        <option value="">Không gắn tài liệu</option>
        {workspace.documents?.map((document) => (
          <option key={document.id} value={document.id}>
            {document.title}
          </option>
        ))}
      </select>
      <div className="flex gap-2 md:col-span-3 md:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-2 text-sm text-slate-500"
        >
          Hủy
        </button>
        <button className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white">
          Tạo công việc
        </button>
      </div>
    </form>
  );
}

function TaskActionMenu({
  workspace,
  task,
  reload,
}: {
  workspace: Workspace;
  task: WorkspaceTask;
  reload: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [assigneeId, setAssigneeId] = useState(task.assigneeId || "");
  const [documentId, setDocumentId] = useState(task.documentId || "");
  const [status, setStatus] = useState<WorkspaceTask["status"]>(task.status);
  const [priority, setPriority] = useState<WorkspaceTask["priority"]>(
    task.priority
  );
  const [dueDate, setDueDate] = useState(dateInputValue(task.dueDate));
  function openEditor() {
    setTitle(task.title);
    setAssigneeId(task.assigneeId || "");
    setDocumentId(task.documentId || "");
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(dateInputValue(task.dueDate));
    setEditing(true);
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await updateWorkspaceTask(workspace.id, task.id, {
        title: title.trim(),
        assigneeId: assigneeId || null,
        documentId: documentId || null,
        status,
        priority,
        dueDate: dueDate ? new Date(`${dueDate}T00:00:00`).toISOString() : null,
      });
      setEditing(false);
      reload();
    } finally {
      setSaving(false);
    }
  }
  async function removeTask() {
    setDeleting(true);
    try {
      await deleteWorkspaceTask(workspace.id, task.id);
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
            title="Tùy chọn công việc"
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
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
            className="relative grid w-full max-w-xl gap-3 rounded-xl border bg-white p-5 shadow-xl sm:grid-cols-2"
          >
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="absolute right-4 top-4"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="sm:col-span-2 font-semibold">Chỉnh sửa công việc</h3>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tên công việc"
              className="rounded-md border px-3 py-2 text-sm sm:col-span-2"
            />
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="rounded-md border px-2 py-2 text-sm"
            >
              <option value="">Chưa giao</option>
              {workspace.members.map((member) => (
                <option key={member.id} value={member.user.id}>
                  {member.user.displayName}
                </option>
              ))}
            </select>
            <select
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              className="rounded-md border px-2 py-2 text-sm"
            >
              <option value="">Không gắn tài liệu</option>
              {workspace.documents?.map((document) => (
                <option key={document.id} value={document.id}>
                  {document.title}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as WorkspaceTask["status"])
              }
              className="rounded-md border px-2 py-2 text-sm"
            >
              <option value="todo">Chưa làm</option>
              <option value="in_progress">Đang làm</option>
              <option value="done">Hoàn thành</option>
            </select>
            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as WorkspaceTask["priority"])
              }
              className="rounded-md border px-2 py-2 text-sm"
            >
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
            </select>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-md border px-2 py-2 text-sm"
            />
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-md px-3 py-2 text-sm text-slate-500"
              >
                Hủy
              </button>
              <button
                disabled={saving}
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
            <AlertDialogTitle>Xóa công việc?</AlertDialogTitle>
            <AlertDialogDescription>
              Công việc &quot;{task.title}&quot; sẽ bị xóa khỏi workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={() => void removeTask()}
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

function TodoList({
  workspace,
  tasks,
  reload,
}: {
  workspace: Workspace;
  tasks: WorkspaceTask[];
  reload: () => void;
}) {
  const [assignee, setAssignee] = useState("");
  const [status, setStatus] = useState("");
  const [deadline, setDeadline] = useState("");
  const [deadlineBase] = useState(() => Date.now());
  const visibleTasks = tasks.filter(
    (task) =>
      (!assignee || task.assigneeId === assignee) &&
      (!status || task.status === status) &&
      (!deadline ||
        (task.dueDate &&
          new Date(task.dueDate) <=
            new Date(deadlineBase + Number(deadline) * 24 * 60 * 60 * 1000)))
  );
  return (
    <Card className="p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">To-do List</h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="rounded-md border px-2 py-1.5 text-xs"
          >
            <option value="">Mọi người phụ trách</option>
            {workspace.members.map((member) => (
              <option key={member.id} value={member.user.id}>
                {member.user.displayName}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border px-2 py-1.5 text-xs"
          >
            <option value="">Mọi trạng thái</option>
            <option value="todo">Chưa làm</option>
            <option value="in_progress">Đang làm</option>
            <option value="done">Hoàn thành</option>
          </select>
          <select
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="rounded-md border px-2 py-1.5 text-xs"
          >
            <option value="">Mọi deadline</option>
            <option value="3">Trong 3 ngày</option>
            <option value="7">Trong 7 ngày</option>
          </select>
        </div>
      </div>
      {visibleTasks.map((task) => (
        <div
          key={task.id}
          className="group flex items-center gap-3 border-t py-3 text-sm"
        >
          <input
            type="checkbox"
            checked={task.completed}
            onChange={async () => {
              await updateWorkspaceTask(workspace.id, task.id, {
                completed: !task.completed,
              });
              reload();
            }}
            className="h-4 w-4 accent-primary"
          />
          <span
            className={`min-w-0 flex-1 truncate ${
              task.completed ? "text-slate-400 line-through" : "font-medium"
            }`}
          >
            {task.title}
          </span>
          <span className="hidden text-xs text-slate-500 sm:block">
            {task.assignee?.displayName || "Chưa giao"}
          </span>
          <StatusPill status={task.status} />
          <span className="hidden text-xs text-slate-500 md:block">
            {dateLabel(task.dueDate)}
          </span>
          {task.document && (
            <Link
              href={`/documents/${task.document.id}`}
              className="hidden text-xs text-primary hover:underline lg:block"
            >
              {task.document.title}
            </Link>
          )}
          <span className="opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
            <TaskActionMenu workspace={workspace} task={task} reload={reload} />
          </span>
        </div>
      ))}
      {visibleTasks.length === 0 && (
        <p className="py-6 text-sm text-slate-500">
          Không có công việc phù hợp.
        </p>
      )}
    </Card>
  );
}

function AssignmentTable({
  workspace,
  tasks,
  reload,
  customColumns,
  onAddTask,
  onAddColumn,
}: {
  workspace: Workspace;
  tasks: WorkspaceTask[];
  reload: () => void;
  customColumns: CustomColumn[];
  onAddTask: () => void;
  onAddColumn: () => void;
}) {
  const [query, setQuery] = useState("");
  const [assignee, setAssignee] = useState("");
  const [status, setStatus] = useState("");
  const [completion, setCompletion] = useState("");
  const [sortKey, setSortKey] = useState<TaskSortKey>("dueDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const activeFilterCount = [assignee, status, completion].filter(
    Boolean
  ).length;
  const priorityRank = { low: 1, medium: 2, high: 3 };
  const visibleTasks = [...tasks]
    .filter((task) => {
      const keyword = query.trim().toLowerCase();
      return (
        (!keyword || task.title.toLowerCase().includes(keyword)) &&
        (!assignee || task.assigneeId === assignee) &&
        (!status || task.status === status) &&
        (!completion ||
          (completion === "done" ? task.completed : !task.completed))
      );
    })
    .sort((first, second) => {
      let result = 0;
      if (sortKey === "dueDate") {
        if (!first.dueDate && !second.dueDate) result = 0;
        else if (!first.dueDate) return 1;
        else if (!second.dueDate) return -1;
        else
          result =
            new Date(first.dueDate).getTime() -
            new Date(second.dueDate).getTime();
      } else {
        result = priorityRank[first.priority] - priorityRank[second.priority];
      }
      if (result === 0) result = first.title.localeCompare(second.title, "vi");
      return sortDirection === "desc" ? -result : result;
    });
  function clearFilters() {
    setQuery("");
    setAssignee("");
    setStatus("");
    setCompletion("");
  }
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <button
          onClick={onAddTask}
          className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
        >
          <Plus className="mr-1 inline h-3.5 w-3.5" />
          Hàng mới
        </button>
        <button
          onClick={onAddColumn}
          className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
        >
          <Plus className="mr-1 inline h-3.5 w-3.5" />
          Cột mới
        </button>
        <label className="ml-1 flex min-w-[220px] flex-1 items-center gap-2 rounded-md border px-3 py-1.5 text-xs text-slate-400">
          <Search className="h-3.5 w-3.5" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent outline-none"
            placeholder="Tìm theo tên công việc..."
          />
        </label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`rounded-md px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 ${
                activeFilterCount ? "bg-emerald-50 text-primary" : ""
              }`}
            >
              <Filter className="mr-1 inline h-3.5 w-3.5" />
              Bộ lọc{activeFilterCount ? ` (${activeFilterCount})` : ""}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 p-3"
            onClick={(event) => event.stopPropagation()}
          >
            <DropdownMenuLabel className="px-0 pt-0 text-xs text-slate-500">
              Lọc công việc
            </DropdownMenuLabel>
            <label className="mt-2 block text-[11px] font-medium text-slate-500">
              Người phụ trách
            </label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="mt-1 w-full rounded-md border bg-white px-2 py-1.5 text-xs"
            >
              <option value="">Tất cả user</option>
              {workspace.members.map((member) => (
                <option key={member.id} value={member.user.id}>
                  {member.user.displayName}
                </option>
              ))}
            </select>
            <label className="mt-3 block text-[11px] font-medium text-slate-500">
              Trạng thái
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full rounded-md border bg-white px-2 py-1.5 text-xs"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="todo">Chưa làm</option>
              <option value="in_progress">Đang làm</option>
              <option value="done">Hoàn thành</option>
            </select>
            <label className="mt-3 block text-[11px] font-medium text-slate-500">
              Hoàn thành
            </label>
            <select
              value={completion}
              onChange={(e) => setCompletion(e.target.value)}
              className="mt-1 w-full rounded-md border bg-white px-2 py-1.5 text-xs"
            >
              <option value="">Tất cả</option>
              <option value="done">Đã hoàn thành</option>
              <option value="open">Chưa hoàn thành</option>
            </select>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 w-full rounded-md border px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Xóa bộ lọc
            </button>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-md px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <ArrowUpDown className="mr-1 inline h-3.5 w-3.5" />
              Sắp xếp
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-60 p-3"
            onClick={(event) => event.stopPropagation()}
          >
            <DropdownMenuLabel className="px-0 pt-0 text-xs text-slate-500">
              Sắp xếp theo
            </DropdownMenuLabel>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as TaskSortKey)}
              className="mt-2 w-full rounded-md border bg-white px-2 py-1.5 text-xs"
            >
              <option value="dueDate">Hạn</option>
              <option value="priority">Ưu tiên</option>
            </select>
            <select
              value={sortDirection}
              onChange={(e) =>
                setSortDirection(e.target.value as SortDirection)
              }
              className="mt-2 w-full rounded-md border bg-white px-2 py-1.5 text-xs"
            >
              <option value="asc">
                {sortKey === "dueDate" ? "Gần hạn trước" : "Ưu tiên thấp trước"}
              </option>
              <option value="desc">
                {sortKey === "dueDate" ? "Xa hạn trước" : "Ưu tiên cao trước"}
              </option>
            </select>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="w-10 border-r px-3 py-2 text-center">#</th>
              <th className="border-r px-3 py-2 font-medium">
                Aa&nbsp; Tên công việc
              </th>
              <th className="border-r px-3 py-2 font-medium">
                <Users className="mr-1 inline h-3.5 w-3.5" />
                Người phụ trách
              </th>
              <th className="border-r px-3 py-2 font-medium">Trạng thái</th>
              <th className="border-r px-3 py-2 font-medium">Ưu tiên</th>
              <th className="border-r px-3 py-2 font-medium">
                <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
                Hạn
              </th>
              {customColumns.map((column) => (
                <th key={column.id} className="border-r px-3 py-2 font-medium">
                  {column.name}
                </th>
              ))}
              <th className="border-r px-3 py-2 font-medium">Hoàn thành</th>
              <th className="w-10 px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {visibleTasks.map((task, index) => (
              <tr key={task.id} className="group border-t hover:bg-slate-50">
                <td className="border-r px-3 py-2 text-center text-slate-400">
                  {index + 1}
                </td>
                <td className="border-r px-3 py-2 font-medium">{task.title}</td>
                <td className="border-r px-3 py-2">
                  <span className="flex items-center gap-2">
                    <Avatar
                      name={task.assignee?.displayName || "?"}
                      avatar={task.assignee?.avatar}
                      size="sm"
                    />
                    {task.assignee?.displayName || "Chưa giao"}
                  </span>
                </td>
                <td className="border-r px-3 py-2">
                  <StatusPill status={task.status} />
                </td>
                <td className="border-r px-3 py-2">
                  <PriorityPill priority={task.priority} />
                </td>
                <td className="border-r px-3 py-2">
                  {dateLabel(task.dueDate)}
                </td>
                {customColumns.map((column) => (
                  <td
                    key={column.id}
                    className="border-r px-3 py-2 text-slate-400"
                  >
                    -
                  </td>
                ))}
                <td className="border-r px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={async () => {
                      await updateWorkspaceTask(workspace.id, task.id, {
                        completed: !task.completed,
                      });
                      reload();
                    }}
                    className="h-4 w-4 accent-primary"
                  />
                </td>
                <td className="px-3 py-2">
                  <span className="opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                    <TaskActionMenu
                      workspace={workspace}
                      task={task}
                      reload={reload}
                    />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function WorkspaceTasks({
  workspace,
  tasks,
  reload,
}: {
  workspace: Workspace;
  tasks: WorkspaceTask[];
  reload: () => void;
}) {
  const [view, setView] = useState<TaskView>("table");
  const [creating, setCreating] = useState(false);
  const [addingColumn, setAddingColumn] = useState(false);
  const [columnName, setColumnName] = useState("");
  const [columnType, setColumnType] = useState<CustomColumn["type"]>("text");
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  function addColumn(event: React.FormEvent) {
    event.preventDefault();
    if (!columnName.trim()) return;
    /* TODO: Persist workspace custom fields when the backend model supports them. */ setCustomColumns(
      (items) => [
        ...items,
        { id: crypto.randomUUID(), name: columnName.trim(), type: columnType },
      ]
    );
    setColumnName("");
    setAddingColumn(false);
  }
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Công việc</h2>
          <div className="mt-2 flex gap-5 text-sm">
            <button
              onClick={() => setView("todo")}
              className={
                view === "todo" ? "font-medium text-primary" : "text-slate-500"
              }
            >
              <ListChecks className="mr-1 inline h-4 w-4" />
              To-do List
            </button>
            <button
              onClick={() => setView("table")}
              className={
                view === "table" ? "font-medium text-primary" : "text-slate-500"
              }
            >
              <Grid2X2 className="mr-1 inline h-4 w-4" />
              Bảng phân công
            </button>
          </div>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white"
        >
          <Plus className="mr-1 inline h-4 w-4" />
          Thêm công việc
        </button>
      </div>
      {creating && (
        <TaskForm
          workspace={workspace}
          onCancel={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            reload();
          }}
        />
      )}
      {view === "todo" ? (
        <TodoList workspace={workspace} tasks={tasks} reload={reload} />
      ) : (
        <AssignmentTable
          workspace={workspace}
          tasks={tasks}
          reload={reload}
          customColumns={customColumns}
          onAddTask={() => setCreating(true)}
          onAddColumn={() => setAddingColumn(true)}
        />
      )}
      {addingColumn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4">
          <form
            onSubmit={addColumn}
            className="relative w-full max-w-sm rounded-xl border bg-white p-5 shadow-xl"
          >
            <button
              type="button"
              onClick={() => setAddingColumn(false)}
              className="absolute right-4 top-4"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="font-semibold">Thêm cột tùy chỉnh</h3>
            <p className="mt-1 text-xs text-slate-500">
              Cột mới được lưu trong phiên hiện tại.
            </p>
            <input
              autoFocus
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              placeholder="Tên cột"
              className="mt-4 w-full rounded-md border px-3 py-2 text-sm"
            />
            <select
              value={columnType}
              onChange={(e) =>
                setColumnType(e.target.value as CustomColumn["type"])
              }
              className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="text">Text</option>
              <option value="select">Select</option>
              <option value="date">Date</option>
              <option value="checkbox">Checkbox</option>
              <option value="person">Person</option>
            </select>
            <button className="mt-4 w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-white">
              Thêm cột
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
