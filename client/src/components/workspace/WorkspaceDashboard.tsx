"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  AlertTriangle, ArrowUpDown, CalendarDays, CheckCircle2, CircleCheckBig, Clock3,
  FileText, Filter, FolderKanban, Grid2X2, ListChecks, MoreHorizontal, Plus,
  Search, Trash2, Users, X,
} from "lucide-react"
import { createDashboardDocument } from "@/services/document.service"
import {
  addWorkspaceMember, createWorkspace, createWorkspaceTask, deleteWorkspace, getWorkspace,
  listWorkspaces, updateWorkspaceTask, type Workspace, type WorkspaceDocument,
  type WorkspaceTask,
} from "@/services/workspace.service"
import { WorkspaceTopBar } from "@/components/layout/WorkspaceTopBar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

type WorkspaceTab = "overview" | "tasks" | "documents" | "members"
type TaskView = "todo" | "table"
type CustomColumn = { id: string; name: string; type: "text" | "select" | "date" | "checkbox" | "person" }

const TAB_LABELS: Array<[WorkspaceTab, string]> = [["overview", "Tổng quan"], ["tasks", "Công việc"], ["documents", "Tài liệu"], ["members", "Thành viên"]]
const STATUS_LABELS = { todo: "Chưa làm", in_progress: "Đang làm", done: "Hoàn thành" }
const PRIORITY_LABELS = { low: "Thấp", medium: "Trung bình", high: "Cao" }
const TEMPLATE_LABELS = { blank: "Trang trống", todo: "To-do List", task_table: "Bảng công việc" }

function dateLabel(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("vi-VN") : "Chưa đặt"
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(-2).map((part) => part[0]).join("").toUpperCase()
}

function Avatar({ name, avatar, size = "md" }: { name: string; avatar?: string | null; size?: "sm" | "md" | "lg" }) {
  const classes = size === "sm" ? "h-6 w-6 text-[9px]" : size === "lg" ? "h-10 w-10 text-xs" : "h-8 w-8 text-[10px]"
  return avatar
    ? <Image src={avatar} alt="" width={40} height={40} unoptimized className={`${classes} rounded-full object-cover`} />
    : <span className={`${classes} flex shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-700`}>{initials(name)}</span>
}

function StatusPill({ status }: { status: WorkspaceTask["status"] }) {
  const tone = status === "done" ? "bg-emerald-100 text-emerald-700" : status === "in_progress" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
  return <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${tone}`}>{STATUS_LABELS[status]}</span>
}

function PriorityPill({ priority = "medium" }: { priority?: WorkspaceTask["priority"] }) {
  const tone = priority === "high" ? "bg-red-100 text-red-600" : priority === "low" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
  return <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${tone}`}>{PRIORITY_LABELS[priority]}</span>
}

function WorkspaceTabs({ active, onChange }: { active: WorkspaceTab; onChange: (tab: WorkspaceTab) => void }) {
  return <div className="overflow-x-auto border-b bg-white"><nav className="mx-auto flex max-w-7xl gap-8 px-5">
    {TAB_LABELS.map(([id, label]) => <button key={id} onClick={() => onChange(id)} className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition ${active === id ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-900"}`}>{label}</button>)}
  </nav></div>
}

function WorkspaceHeader({ workspace }: { workspace: Workspace }) {
  return <section className="border-b bg-white"><div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-5">
    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-primary"><Users className="h-6 w-6" /></span>
    <div><h1 className="text-2xl font-semibold tracking-tight">{workspace.name}</h1><p className="mt-0.5 text-sm text-slate-500">Quản lý tài liệu, thành viên và tiến độ công việc</p></div>
  </div></section>
}

function StatCard({ label, value, caption, icon: Icon, tone }: { label: string; value: number; caption: string; icon: typeof CheckCircle2; tone: string }) {
  return <div className="flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm shadow-slate-100">
    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${tone}`}><Icon className="h-5 w-5" /></span>
    <div><p className="text-sm font-medium">{label}</p><p className="text-2xl font-semibold leading-tight">{value}</p><p className="mt-1 text-xs text-slate-500">{caption}</p></div>
  </div>
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-xl border bg-white shadow-sm shadow-slate-100 ${className}`}>{children}</section>
}

function MemberProgressCard({ workspace, tasks }: { workspace: Workspace; tasks: WorkspaceTask[] }) {
  return <Card className="p-4"><div className="mb-3 flex items-end justify-between"><h2 className="font-semibold">Tiến độ thành viên</h2><span className="text-[11px] text-slate-500">Deadline gần nhất</span></div>
    <div>{workspace.members.map((member) => {
      const assigned = tasks.filter((task) => task.assigneeId === member.user.id)
      const done = assigned.filter((task) => task.completed).length
      const progress = assigned.length ? Math.round(done * 100 / assigned.length) : 0
      const next = assigned.filter((task) => !task.completed && task.dueDate).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0]
      return <div key={member.id} className="grid grid-cols-[minmax(110px,1.1fr)_minmax(100px,1fr)_minmax(110px,2fr)_42px_64px] items-center gap-3 border-t py-3 text-xs">
        <span className="flex items-center gap-2 font-medium text-slate-800"><Avatar name={member.user.displayName} avatar={member.user.avatar} size="sm" />{member.user.displayName}</span>
        <span className="text-slate-500">{done}/{assigned.length} việc hoàn thành</span>
        <span className="h-1.5 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></span>
        <span className="font-semibold text-primary">{progress}%</span><span className="text-right">{next ? dateLabel(next.dueDate) : "-"}</span>
      </div>
    })}</div>
  </Card>
}

function DeadlinesCard({ tasks }: { tasks: WorkspaceTask[] }) {
  const items = tasks.filter((task) => !task.completed && task.dueDate).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()).slice(0, 5)
  return <Card className="p-4"><h2 className="mb-2 font-semibold">Deadline cần chú ý</h2>
    {items.map((task) => <div key={task.id} className="grid grid-cols-[minmax(100px,1fr)_minmax(160px,2fr)_82px_88px] items-center gap-3 border-t py-2.5 text-xs">
      <span className="flex items-center gap-2 font-medium"><Avatar name={task.assignee?.displayName || "?"} avatar={task.assignee?.avatar} size="sm" />{task.assignee?.displayName || "Chưa giao"}</span>
      <span className="truncate">{task.title}</span><StatusPill status={task.status} /><span className={`${new Date(task.dueDate!) < new Date() ? "text-red-600" : "text-slate-600"} flex items-center gap-1`}><CalendarDays className="h-3.5 w-3.5" />{dateLabel(task.dueDate)}</span>
    </div>)}{items.length === 0 && <p className="py-5 text-sm text-slate-500">Không có deadline cần chú ý.</p>}
  </Card>
}

function TemplatePill({ template }: { template: WorkspaceDocument["template"] }) {
  return <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">{TEMPLATE_LABELS[template]}</span>
}

function DocumentsSummaryCard({ workspace, onShowAll }: { workspace: Workspace; onShowAll: () => void }) {
  return <Card className="p-4"><div className="mb-2 flex items-start justify-between"><div><h2 className="flex items-center gap-2 font-semibold"><FileText className="h-4 w-4 text-primary" />Tài liệu trong workspace</h2><p className="mt-1 text-[11px] text-slate-500">Các tài liệu này cũng hiển thị ở mục Tài liệu gần đây.</p></div><button onClick={onShowAll} className="rounded-md border px-2 py-1 text-[11px] font-medium text-primary hover:bg-emerald-50">Xem tất cả</button></div>
    {workspace.documents?.slice(0, 5).map((document) => <Link key={document.id} href={`/documents/${document.id}`} className="flex items-center justify-between gap-2 border-t py-2 text-xs hover:text-primary"><span className="flex min-w-0 items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-primary" /><span className="truncate">{document.title}</span></span><TemplatePill template={document.template} /></Link>)}
    {!workspace.documents?.length && <p className="py-4 text-xs text-slate-500">Chưa có tài liệu.</p>}
  </Card>
}

function MembersSummaryCard({ workspace, onManage }: { workspace: Workspace; onManage: () => void }) {
  return <Card className="p-4"><div className="mb-2 flex items-center justify-between"><h2 className="flex items-center gap-2 font-semibold"><Users className="h-4 w-4 text-primary" />Thành viên</h2><button onClick={onManage} className="rounded-md border px-2 py-1 text-[11px] font-medium text-primary hover:bg-emerald-50">Quản lý</button></div>
    {workspace.members.slice(0, 5).map((member) => <div key={member.id} className="flex items-center justify-between border-t py-2 text-xs"><span className="flex items-center gap-2 font-medium"><Avatar name={member.user.displayName} avatar={member.user.avatar} size="sm" />{member.user.displayName}</span><span className={`rounded-md px-2 py-0.5 ${member.role === "owner" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{member.role === "owner" ? "Owner" : "Member"}</span></div>)}
  </Card>
}

function WorkspaceOverview({ workspace, tasks, goTo }: { workspace: Workspace; tasks: WorkspaceTask[]; goTo: (tab: WorkspaceTab) => void }) {
  const now = new Date()
  const soon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const done = tasks.filter((task) => task.completed).length
  const inProgress = tasks.filter((task) => task.status === "in_progress").length
  const dueSoon = tasks.filter((task) => !task.completed && task.dueDate && new Date(task.dueDate) >= now && new Date(task.dueDate) <= soon).length
  const overdue = tasks.filter((task) => !task.completed && task.dueDate && new Date(task.dueDate) < now).length
  return <div className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Đã hoàn thành" value={done} caption="Công việc đã hoàn tất" icon={CircleCheckBig} tone="bg-emerald-100 text-emerald-700" /><StatCard label="Đang thực hiện" value={inProgress} caption="Công việc đang tiến hành" icon={Clock3} tone="bg-blue-100 text-blue-700" /><StatCard label="Sắp đến hạn" value={dueSoon} caption="Trong 3 ngày tới" icon={CalendarDays} tone="bg-amber-100 text-amber-700" /><StatCard label="Quá hạn" value={overdue} caption="Cần xử lý ngay" icon={AlertTriangle} tone="bg-red-100 text-red-600" /></div>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)]"><div className="space-y-4"><MemberProgressCard workspace={workspace} tasks={tasks} /><DeadlinesCard tasks={tasks} /></div><div className="space-y-4"><DocumentsSummaryCard workspace={workspace} onShowAll={() => goTo("documents")} /><MembersSummaryCard workspace={workspace} onManage={() => goTo("members")} /></div></div>
  </div>
}

function TaskForm({ workspace, onCreated, onCancel }: { workspace: Workspace; onCreated: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState(""); const [assigneeId, setAssigneeId] = useState(""); const [documentId, setDocumentId] = useState(""); const [dueDate, setDueDate] = useState(""); const [priority, setPriority] = useState<WorkspaceTask["priority"]>("medium")
  async function submit(event: React.FormEvent) { event.preventDefault(); if (!title.trim()) return; await createWorkspaceTask(workspace.id, { title: title.trim(), assigneeId: assigneeId || null, documentId: documentId || null, dueDate: dueDate ? new Date(`${dueDate}T00:00:00`).toISOString() : null, priority }); onCreated() }
  return <form onSubmit={submit} className="mb-4 grid gap-2 rounded-lg border bg-slate-50 p-3 md:grid-cols-5"><input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tên công việc" className="rounded-md border bg-white px-3 py-2 text-sm md:col-span-2" /><select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="rounded-md border bg-white px-2 text-sm"><option value="">Chưa giao</option>{workspace.members.map((member) => <option key={member.id} value={member.user.id}>{member.user.displayName}</option>)}</select><select value={priority} onChange={(e) => setPriority(e.target.value as WorkspaceTask["priority"])} className="rounded-md border bg-white px-2 text-sm"><option value="low">Thấp</option><option value="medium">Trung bình</option><option value="high">Cao</option></select><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-md border bg-white px-2 text-sm" /><select value={documentId} onChange={(e) => setDocumentId(e.target.value)} className="rounded-md border bg-white px-2 py-2 text-sm md:col-span-2"><option value="">Không gắn tài liệu</option>{workspace.documents?.map((document) => <option key={document.id} value={document.id}>{document.title}</option>)}</select><div className="flex gap-2 md:col-span-3 md:justify-end"><button type="button" onClick={onCancel} className="rounded-md px-3 py-2 text-sm text-slate-500">Hủy</button><button className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white">Tạo công việc</button></div></form>
}

function TodoList({ workspace, tasks, reload }: { workspace: Workspace; tasks: WorkspaceTask[]; reload: () => void }) {
  const [assignee, setAssignee] = useState(""); const [status, setStatus] = useState(""); const [deadline, setDeadline] = useState("")
  const [deadlineBase] = useState(() => Date.now())
  const visibleTasks = tasks.filter((task) => (!assignee || task.assigneeId === assignee) && (!status || task.status === status) && (!deadline || (task.dueDate && new Date(task.dueDate) <= new Date(deadlineBase + Number(deadline) * 24 * 60 * 60 * 1000))))
  return <Card className="p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">To-do List</h2><div className="flex flex-wrap gap-2"><select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="rounded-md border px-2 py-1.5 text-xs"><option value="">Mọi người phụ trách</option>{workspace.members.map((member) => <option key={member.id} value={member.user.id}>{member.user.displayName}</option>)}</select><select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border px-2 py-1.5 text-xs"><option value="">Mọi trạng thái</option><option value="todo">Chưa làm</option><option value="in_progress">Đang làm</option><option value="done">Hoàn thành</option></select><select value={deadline} onChange={(e) => setDeadline(e.target.value)} className="rounded-md border px-2 py-1.5 text-xs"><option value="">Mọi deadline</option><option value="3">Trong 3 ngày</option><option value="7">Trong 7 ngày</option></select></div></div>{visibleTasks.map((task) => <div key={task.id} className="flex items-center gap-3 border-t py-3 text-sm"><input type="checkbox" checked={task.completed} onChange={async () => { await updateWorkspaceTask(workspace.id, task.id, { completed: !task.completed }); reload() }} className="h-4 w-4 accent-primary" /><span className={`min-w-0 flex-1 truncate ${task.completed ? "text-slate-400 line-through" : "font-medium"}`}>{task.title}</span><span className="hidden text-xs text-slate-500 sm:block">{task.assignee?.displayName || "Chưa giao"}</span><StatusPill status={task.status} /><span className="hidden text-xs text-slate-500 md:block">{dateLabel(task.dueDate)}</span>{task.document && <Link href={`/documents/${task.document.id}`} className="hidden text-xs text-primary hover:underline lg:block">{task.document.title}</Link>}<MoreHorizontal className="h-4 w-4 text-slate-400" /></div>)}{visibleTasks.length === 0 && <p className="py-6 text-sm text-slate-500">Không có công việc phù hợp.</p>}</Card>
}

function AssignmentTable({ workspace, tasks, reload, customColumns, onAddTask, onAddColumn }: { workspace: Workspace; tasks: WorkspaceTask[]; reload: () => void; customColumns: CustomColumn[]; onAddTask: () => void; onAddColumn: () => void }) {
  const [query, setQuery] = useState(""); const visibleTasks = tasks.filter((task) => task.title.toLowerCase().includes(query.trim().toLowerCase()))
  return <Card className="overflow-hidden"><div className="flex flex-wrap items-center gap-2 border-b p-3"><button onClick={onAddTask} className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-slate-50"><Plus className="mr-1 inline h-3.5 w-3.5" />Hàng mới</button><button onClick={onAddColumn} className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-slate-50"><Plus className="mr-1 inline h-3.5 w-3.5" />Cột mới</button><label className="ml-1 flex min-w-[220px] flex-1 items-center gap-2 rounded-md border px-3 py-1.5 text-xs text-slate-400"><Search className="h-3.5 w-3.5" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent outline-none" placeholder="Tìm kiếm hoặc lọc công việc..." /></label><button className="px-2 text-xs text-slate-600"><Filter className="mr-1 inline h-3.5 w-3.5" />Bộ lọc</button><button className="px-2 text-xs text-slate-600"><ArrowUpDown className="mr-1 inline h-3.5 w-3.5" />Sắp xếp</button><MoreHorizontal className="h-4 w-4 text-slate-500" /></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[900px] border-collapse text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="w-10 border-r px-3 py-2 text-center">#</th><th className="border-r px-3 py-2 font-medium">Aa&nbsp; Tên công việc</th><th className="border-r px-3 py-2 font-medium"><Users className="mr-1 inline h-3.5 w-3.5" />Người phụ trách</th><th className="border-r px-3 py-2 font-medium">Trạng thái</th><th className="border-r px-3 py-2 font-medium">Ưu tiên</th><th className="border-r px-3 py-2 font-medium"><CalendarDays className="mr-1 inline h-3.5 w-3.5" />Hạn</th>{customColumns.map((column) => <th key={column.id} className="border-r px-3 py-2 font-medium">{column.name}</th>)}<th className="border-r px-3 py-2 font-medium">Hoàn thành</th><th className="w-10 px-3 py-2" /></tr></thead><tbody>{visibleTasks.map((task, index) => <tr key={task.id} className="border-t hover:bg-slate-50"><td className="border-r px-3 py-2 text-center text-slate-400">{index + 1}</td><td className="border-r px-3 py-2 font-medium">{task.title}</td><td className="border-r px-3 py-2"><span className="flex items-center gap-2"><Avatar name={task.assignee?.displayName || "?"} avatar={task.assignee?.avatar} size="sm" />{task.assignee?.displayName || "Chưa giao"}</span></td><td className="border-r px-3 py-2"><StatusPill status={task.status} /></td><td className="border-r px-3 py-2"><PriorityPill priority={task.priority} /></td><td className="border-r px-3 py-2">{dateLabel(task.dueDate)}</td>{customColumns.map((column) => <td key={column.id} className="border-r px-3 py-2 text-slate-400">-</td>)}<td className="border-r px-3 py-2 text-center"><input type="checkbox" checked={task.completed} onChange={async () => { await updateWorkspaceTask(workspace.id, task.id, { completed: !task.completed }); reload() }} className="h-4 w-4 accent-primary" /></td><td className="px-3 py-2"><MoreHorizontal className="h-4 w-4 text-slate-400" /></td></tr>)}</tbody></table></div>
  </Card>
}

function WorkspaceTasks({ workspace, tasks, reload }: { workspace: Workspace; tasks: WorkspaceTask[]; reload: () => void }) {
  const [view, setView] = useState<TaskView>("table"); const [creating, setCreating] = useState(false); const [addingColumn, setAddingColumn] = useState(false); const [columnName, setColumnName] = useState(""); const [columnType, setColumnType] = useState<CustomColumn["type"]>("text"); const [customColumns, setCustomColumns] = useState<CustomColumn[]>([])
  function addColumn(event: React.FormEvent) { event.preventDefault(); if (!columnName.trim()) return; /* TODO: Persist workspace custom fields when the backend model supports them. */ setCustomColumns((items) => [...items, { id: crypto.randomUUID(), name: columnName.trim(), type: columnType }]); setColumnName(""); setAddingColumn(false) }
  return <div><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Công việc</h2><div className="mt-2 flex gap-5 text-sm"><button onClick={() => setView("todo")} className={view === "todo" ? "font-medium text-primary" : "text-slate-500"}><ListChecks className="mr-1 inline h-4 w-4" />To-do List</button><button onClick={() => setView("table")} className={view === "table" ? "font-medium text-primary" : "text-slate-500"}><Grid2X2 className="mr-1 inline h-4 w-4" />Bảng phân công</button></div></div><button onClick={() => setCreating(true)} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white"><Plus className="mr-1 inline h-4 w-4" />Thêm công việc</button></div>
    {creating && <TaskForm workspace={workspace} onCancel={() => setCreating(false)} onCreated={() => { setCreating(false); reload() }} />}
    {view === "todo" ? <TodoList workspace={workspace} tasks={tasks} reload={reload} /> : <AssignmentTable workspace={workspace} tasks={tasks} reload={reload} customColumns={customColumns} onAddTask={() => setCreating(true)} onAddColumn={() => setAddingColumn(true)} />}
    {addingColumn && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4"><form onSubmit={addColumn} className="relative w-full max-w-sm rounded-xl border bg-white p-5 shadow-xl"><button type="button" onClick={() => setAddingColumn(false)} className="absolute right-4 top-4"><X className="h-4 w-4" /></button><h3 className="font-semibold">Thêm cột tùy chỉnh</h3><p className="mt-1 text-xs text-slate-500">Cột mới được lưu trong phiên hiện tại.</p><input autoFocus value={columnName} onChange={(e) => setColumnName(e.target.value)} placeholder="Tên cột" className="mt-4 w-full rounded-md border px-3 py-2 text-sm" /><select value={columnType} onChange={(e) => setColumnType(e.target.value as CustomColumn["type"])} className="mt-2 w-full rounded-md border px-3 py-2 text-sm"><option value="text">Text</option><option value="select">Select</option><option value="date">Date</option><option value="checkbox">Checkbox</option><option value="person">Person</option></select><button className="mt-4 w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-white">Thêm cột</button></form></div>}
  </div>
}

function WorkspaceDocuments({ workspace, createDoc }: { workspace: Workspace; createDoc: (template: WorkspaceDocument["template"]) => void }) {
  return <div><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Tài liệu</h2><p className="text-sm text-slate-500">Tất cả tài liệu thuộc workspace hiện tại.</p></div><div className="flex gap-2">{(Object.keys(TEMPLATE_LABELS) as WorkspaceDocument["template"][]).map((template) => <button key={template} onClick={() => createDoc(template)} className="rounded-md border bg-white px-3 py-2 text-xs font-medium hover:border-primary hover:text-primary"><Plus className="mr-1 inline h-3.5 w-3.5" />{TEMPLATE_LABELS[template]}</button>)}</div></div>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{workspace.documents?.map((document) => <Link key={document.id} href={`/documents/${document.id}`} className="rounded-xl border bg-white p-4 shadow-sm shadow-slate-100 transition hover:border-primary/50 hover:shadow"><FileText className="h-5 w-5 text-primary" /><h3 className="mt-3 truncate font-medium">{document.title}</h3><div className="mt-4 flex items-center justify-between"><TemplatePill template={document.template} /><span className="text-[11px] text-slate-500">{dateLabel(document.updatedAt)}</span></div></Link>)}</div>
    {!workspace.documents?.length && <Card className="p-10 text-center text-sm text-slate-500">Chưa có tài liệu trong workspace.<div><button onClick={() => createDoc("blank")} className="mt-4 rounded-md bg-primary px-3 py-2 text-white">Tạo tài liệu đầu tiên</button></div></Card>}
  </div>
}

function WorkspaceMembers({ workspace, tasks, reload }: { workspace: Workspace; tasks: WorkspaceTask[]; reload: () => void }) {
  const [email, setEmail] = useState("")
  async function invite(event: React.FormEvent) { event.preventDefault(); if (!email.trim()) return; await addWorkspaceMember(workspace.id, email.trim()); setEmail(""); reload() }
  return <div><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold">Thành viên</h2><p className="text-sm text-slate-500">Quản lý thành viên và tải công việc trong nhóm.</p></div>{workspace.role === "owner" && <form onSubmit={invite} className="flex gap-2"><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email thành viên" className="rounded-md border bg-white px-3 py-2 text-sm" /><button className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white">Mời thành viên</button></form>}</div>
    <Card className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-4 py-3 font-medium">Thành viên</th><th className="px-4 py-3 font-medium">Vai trò</th><th className="px-4 py-3 font-medium">Tổng task</th><th className="px-4 py-3 font-medium">Đã hoàn thành</th><th className="px-4 py-3 font-medium">Đang làm</th><th className="px-4 py-3 font-medium">Deadline gần nhất</th><th /></tr></thead><tbody>{workspace.members.map((member) => { const assigned = tasks.filter((task) => task.assigneeId === member.user.id); const next = assigned.filter((task) => !task.completed && task.dueDate).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0]; return <tr key={member.id} className="border-t"><td className="px-4 py-3"><span className="flex items-center gap-2"><Avatar name={member.user.displayName} avatar={member.user.avatar} /><span><strong className="block text-sm">{member.user.displayName}</strong><span className="text-xs text-slate-500">{member.user.email}</span></span></span></td><td className="px-4 py-3 capitalize">{member.role}</td><td className="px-4 py-3">{assigned.length}</td><td className="px-4 py-3">{assigned.filter((task) => task.completed).length}</td><td className="px-4 py-3">{assigned.filter((task) => task.status === "in_progress").length}</td><td className="px-4 py-3">{next ? dateLabel(next.dueDate) : "-"}</td><td className="px-4 py-3"><MoreHorizontal className="h-4 w-4 text-slate-400" /></td></tr> })}</tbody></table></Card>
  </div>
}

function WorkspaceListCard({ workspace, onDelete }: { workspace: Workspace; onDelete: (workspace: Workspace) => Promise<boolean> }) {
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

  return <div className="group relative rounded-xl border bg-white transition hover:border-primary/50 hover:shadow-sm">
    <Link href={`/workspaces/${workspace.id}`} className="block p-5 pr-14">
      <FolderKanban className="h-6 w-6 text-primary" /><h2 className="mt-3 font-semibold">{workspace.name}</h2><p className="mt-1 text-sm text-slate-500">{workspace.description || "Quản lý tài liệu, thành viên và tiến độ công việc"}</p><p className="mt-4 text-xs text-slate-500">{workspace.members.length} thành viên · {workspace.documentCount} tài liệu · {workspace.completedTaskCount}/{workspace.taskCount} công việc</p>
    </Link>
    {workspace.role === "owner" && <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" title="Tùy chọn workspace" className="absolute right-3 top-3 rounded-full p-1.5 text-slate-500 opacity-0 transition hover:bg-slate-100 focus:opacity-100 group-hover:opacity-100 data-[state=open]:bg-slate-100 data-[state=open]:opacity-100"><MoreHorizontal className="h-5 w-5" /></button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem variant="destructive" onSelect={() => setConfirmingDelete(true)}>
          <Trash2 className="h-4 w-4" />Xóa workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>}
    <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Xóa workspace?</AlertDialogTitle><AlertDialogDescription>Workspace &quot;{workspace.name}&quot; và các công việc bên trong sẽ bị xóa vĩnh viễn. Tài liệu đang gắn với workspace sẽ được giữ lại.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel><AlertDialogAction disabled={deleting} onClick={() => void removeWorkspace()} className="bg-red-600 hover:bg-red-700">{deleting ? "Đang xóa..." : "Xóa workspace"}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
}

export function WorkspaceList() {
  const router = useRouter(); const [items, setItems] = useState<Workspace[]>([]); const [name, setName] = useState(""); const [search, setSearch] = useState(""); const [error, setError] = useState("")
  useEffect(() => { listWorkspaces().then(setItems).catch((e) => setError(e.message)) }, [])
  async function submit(event: React.FormEvent) { event.preventDefault(); if (!name.trim()) return; setError(""); try { const workspace = await createWorkspace({ name: name.trim() }); router.push(`/workspaces/${workspace.id}`) } catch (e) { setError(e instanceof Error ? e.message : "Không thể tạo workspace.") } }
  async function removeWorkspace(workspace: Workspace) { setError(""); try { await deleteWorkspace(workspace.id); setItems((current) => current.filter((item) => item.id !== workspace.id)); return true } catch (e) { setError(e instanceof Error ? e.message : "Không thể xóa workspace."); return false } }
  return <div className="min-h-screen bg-slate-50"><WorkspaceTopBar search={search} onSearchChange={setSearch} /><main className="mx-auto max-w-6xl px-5 py-8"><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-semibold">Workspaces</h1><p className="mt-1 text-sm text-slate-500">Không gian quản lý thành viên, công việc và tiến độ.</p></div><form onSubmit={submit} className="flex gap-2"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên workspace" className="rounded-md border bg-white px-3 py-2 text-sm" /><button className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white"><Plus className="mr-1 inline h-4 w-4" />Tạo</button></form></div>{error && <p className="mb-4 text-sm text-red-600">{error}</p>}<div className="grid gap-4 md:grid-cols-2">{items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())).map((item) => <WorkspaceListCard key={item.id} workspace={item} onDelete={removeWorkspace} />)}</div></main></div>
}

export function WorkspaceDetail({ workspaceId }: { workspaceId: string }) {
  const router = useRouter(); const [workspace, setWorkspace] = useState<Workspace | null>(null); const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview"); const [search, setSearch] = useState(""); const [error, setError] = useState("")
  const load = useCallback(() => getWorkspace(workspaceId).then(setWorkspace).catch((e) => setError(e.message)), [workspaceId])
  useEffect(() => { void load() }, [load])
  useEffect(() => { const timeoutId = window.setTimeout(() => { if (new URLSearchParams(window.location.search).get("tab") === "tasks") setActiveTab("tasks") }, 0); return () => window.clearTimeout(timeoutId) }, [])
  const tasks = useMemo(() => workspace?.tasks || [], [workspace?.tasks])
  async function createDoc(template: WorkspaceDocument["template"]) { const document = await createDashboardDocument({ templateId: template, workspaceId }); router.push(`/documents/${document.id}`) }
  if (!workspace) return <div className="p-8 text-sm text-slate-500">{error || "Đang tải workspace..."}</div>
  const filteredTasks = tasks.filter((task) => task.title.toLowerCase().includes(search.trim().toLowerCase()))
  return <div className="min-h-screen bg-slate-50"><WorkspaceTopBar search={search} onSearchChange={setSearch} /><WorkspaceHeader workspace={workspace} /><WorkspaceTabs active={activeTab} onChange={setActiveTab} /><main className="mx-auto max-w-7xl px-5 py-5">{activeTab === "overview" && <WorkspaceOverview workspace={workspace} tasks={tasks} goTo={setActiveTab} />}{activeTab === "tasks" && <WorkspaceTasks workspace={workspace} tasks={filteredTasks} reload={load} />}{activeTab === "documents" && <WorkspaceDocuments workspace={workspace} createDoc={createDoc} />}{activeTab === "members" && <WorkspaceMembers workspace={workspace} tasks={tasks} reload={load} />}</main></div>
}
