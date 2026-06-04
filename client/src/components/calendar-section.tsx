"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createCalendarEvent, getMyCalendarEvents, type CalendarEvent } from "@/services/calendar.service"
import {
  getWorkspace,
  listMyWorkspaceTasks,
  listWorkspaces,
  type Workspace,
  type WorkspaceTask,
} from "@/services/workspace.service"
import { CalendarDays, ChevronLeft, ChevronRight, Clock, ExternalLink, MapPin, Plus, Users, Video, X } from "lucide-react"

const priorityColors = {
  high: "border-red-200 bg-red-50 text-red-600",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
}
const priorityLabels = { high: "Cao", medium: "Trung bình", low: "Thấp" }

function dateInputValue(date: Date) {
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 10)
}
function sameDay(value: string, date: Date) {
  const item = new Date(value)
  return item.getFullYear() === date.getFullYear() && item.getMonth() === date.getMonth() && item.getDate() === date.getDate()
}
function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(-2).map((part) => part[0]).join("").toUpperCase()
}
function timeRange(event: CalendarEvent) {
  const format = (value: string) => new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  return `${format(event.startAt)} - ${format(event.endAt)}`
}
function deadlineLabel(value: string) {
  const date = new Date(value)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const time = date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  if (sameDay(value, now)) return `Hôm nay, ${time}`
  if (sameDay(value, tomorrow)) return `Ngày mai, ${time}`
  return date.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric", year: "numeric" }) + `, ${time}`
}
function eventLocation(event: CalendarEvent) {
  if (event.meetingUrl) {
    try {
      const host = new URL(event.meetingUrl).hostname.replace(/^www\./, "")
      return host.includes("meet.google") ? "Google Meet" : host.includes("zoom") ? "Zoom" : host
    } catch {
      return "Link tham gia"
    }
  }
  return event.location || "Chưa có địa điểm"
}

function EventDialog({ workspaces, selectedDate, onClose, onCreated }: {
  workspaces: Workspace[]
  selectedDate: Date
  onClose: () => void
  onCreated: (event: CalendarEvent) => void
}) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [form, setForm] = useState({
    title: "", date: dateInputValue(selectedDate), start: "09:00", end: "10:00",
    place: "", workspaceId: "", documentId: "", description: "",
  })
  const [participantIds, setParticipantIds] = useState<string[]>([])
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (form.workspaceId) getWorkspace(form.workspaceId).then(setWorkspace).catch((e) => setError(e.message))
  }, [form.workspaceId])

  function changeWorkspace(workspaceId: string) {
    setWorkspace(null)
    setParticipantIds([])
    setForm((current) => ({ ...current, workspaceId, documentId: "" }))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      const place = form.place.trim()
      const isUrl = /^https?:\/\//i.test(place)
      const created = await createCalendarEvent({
        title: form.title.trim(),
        description: form.description.trim() || null,
        startAt: new Date(`${form.date}T${form.start}`).toISOString(),
        endAt: new Date(`${form.date}T${form.end}`).toISOString(),
        location: place && !isUrl ? place : null,
        meetingUrl: place && isUrl ? place : null,
        workspaceId: form.workspaceId || null,
        documentId: form.documentId || null,
        participantIds,
      })
      onCreated(created)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tạo sự kiện.")
    } finally {
      setSubmitting(false)
    }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4">
    <form onSubmit={submit} className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border bg-white p-5 shadow-xl">
      <button type="button" onClick={onClose} className="absolute right-4 top-4 text-slate-500"><X className="h-4 w-4" /></button>
      <h3 className="text-lg font-semibold">Thêm sự kiện</h3>
      <p className="mt-1 text-sm text-slate-500">Sự kiện mới mặc định thuộc về bạn.</p>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2"><span className="text-xs font-medium">Tiêu đề sự kiện</span><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" /></label>
        <label><span className="text-xs font-medium">Ngày</span><input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" /></label>
        <span className="grid grid-cols-2 gap-2"><label><span className="text-xs font-medium">Bắt đầu</span><input required type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" /></label><label><span className="text-xs font-medium">Kết thúc</span><input required type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" /></label></span>
        <label className="sm:col-span-2"><span className="text-xs font-medium">Địa điểm hoặc meeting link</span><input value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" /></label>
        <label><span className="text-xs font-medium">Workspace liên quan</span><select value={form.workspaceId} onChange={(e) => changeWorkspace(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm"><option value="">Không gắn workspace</option>{workspaces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label><span className="text-xs font-medium">Tài liệu liên quan</span><select disabled={!workspace} value={form.documentId} onChange={(e) => setForm({ ...form, documentId: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm disabled:bg-slate-50"><option value="">Không gắn tài liệu</option>{workspace?.documents?.map((document) => <option key={document.id} value={document.id}>{document.title}</option>)}</select></label>
        <label className="sm:col-span-2"><span className="text-xs font-medium">Mô tả</span><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 min-h-20 w-full rounded-md border px-3 py-2 text-sm" /></label>
      </div>
      {workspace && <div className="mt-3"><p className="text-xs font-medium">Người tham gia</p><div className="mt-2 flex flex-wrap gap-2">{workspace.members.map((member) => <label key={member.id} className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs"><input type="checkbox" checked={participantIds.includes(member.user.id)} onChange={(e) => setParticipantIds((ids) => e.target.checked ? [...ids, member.user.id] : ids.filter((id) => id !== member.user.id))} />{member.user.displayName}</label>)}</div></div>}
      <div className="mt-5 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Hủy</Button><Button disabled={submitting}>{submitting ? "Đang tạo..." : "Tạo sự kiện"}</Button></div>
    </form>
  </div>
}

export function CalendarSection() {
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [tasks, setTasks] = useState<WorkspaceTask[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    try {
      const [nextEvents, nextTasks, nextWorkspaces] = await Promise.all([getMyCalendarEvents(), listMyWorkspaceTasks(), listWorkspaces()])
      setEvents(nextEvents); setTasks(nextTasks); setWorkspaces(nextWorkspaces)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải lịch và công việc.")
    }
  }, [])
  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [load])

  const visibleEvents = useMemo(() => events.filter((event) => sameDay(event.startAt, selectedDate)), [events, selectedDate])
  const deadlines = useMemo(() => tasks.filter((task) => !task.completed && task.status !== "done" && task.dueDate).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()).slice(0, 5), [tasks])
  const changeDay = (days: number) => setSelectedDate((current) => { const next = new Date(current); next.setDate(next.getDate() + days); return next })

  return <section id="calendar" className="py-8">
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-bold">Lịch & Công việc</h2><p className="text-sm text-muted-foreground">Quản lý thời gian và deadline của bạn</p></div><Button className="gap-2" onClick={() => setShowDialog(true)}><Plus className="h-4 w-4" />Thêm sự kiện</Button></div>
    {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2"><CardHeader className="pb-3"><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle className="text-lg">Lịch hôm nay</CardTitle><div className="flex items-center gap-2"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeDay(-1)}><ChevronLeft className="h-4 w-4" /></Button><span className="text-sm font-medium">{selectedDate.toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeDay(1)}><ChevronRight className="h-4 w-4" /></Button></div></div></CardHeader><CardContent><div className="space-y-3">
        {visibleEvents.map((event) => <div key={event.id} className="flex gap-3 rounded-lg border p-4 transition hover:border-primary/50"><div className="w-1 shrink-0 rounded-full bg-primary" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><h4 className="font-semibold">{event.title}</h4><div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground"><span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{timeRange(event)}</span><span className="flex items-center gap-1">{event.meetingUrl ? <Video className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}{eventLocation(event)}</span>{event.workspace && <span>{event.workspace.name}</span>}</div></div>{event.meetingUrl && <a href={event.meetingUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">Tham gia <ExternalLink className="h-3 w-3" /></a>}</div><div className="mt-3 flex items-center gap-2"><Users className="h-3.5 w-3.5 text-muted-foreground" /><div className="flex -space-x-2">{[event.owner, ...event.participants.filter((item) => item.id !== event.ownerId)].slice(0, 5).map((user) => <Avatar key={user.id} className="h-6 w-6 border-2 border-card"><AvatarImage src={user.avatar || ""} /><AvatarFallback className="text-[9px]">{initials(user.displayName)}</AvatarFallback></Avatar>)}</div><span className="text-xs text-muted-foreground">{new Set([event.ownerId, ...event.participantIds]).size} người tham gia</span></div></div></div>)}
        {visibleEvents.length === 0 && <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Không có sự kiện trong ngày này.</p>}
      </div></CardContent></Card>
      <Card><CardHeader className="pb-3"><CardTitle className="text-lg">Deadline sắp tới</CardTitle></CardHeader><CardContent><div className="space-y-3">{deadlines.map((task) => <Link key={task.id} href={task.documentId ? `/documents/${task.documentId}` : `/workspaces/${task.workspaceId}?tab=tasks&task=${task.id}`} className="block rounded-lg border p-3 transition hover:border-primary/50"><div className="mb-2 flex items-start justify-between gap-2"><h4 className="line-clamp-2 text-sm font-medium">{task.title}</h4><Badge variant="outline" className={`shrink-0 text-[10px] ${priorityColors[task.priority]}`}>{priorityLabels[task.priority]}</Badge></div><div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{deadlineLabel(task.dueDate!)}</div><p className="mt-1 truncate text-xs text-muted-foreground">{task.workspace?.name}{task.document ? ` · ${task.document.title}` : ""}</p></Link>)}{deadlines.length === 0 && <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">Bạn chưa có deadline sắp tới.</p>}</div><Link href="/my-tasks" className="mt-4 block rounded-md px-3 py-2 text-center text-sm font-medium text-primary hover:bg-secondary">Xem tất cả công việc</Link></CardContent></Card>
    </div>
    {showDialog && <EventDialog workspaces={workspaces} selectedDate={selectedDate} onClose={() => setShowDialog(false)} onCreated={(event) => { setEvents((items) => [...items, event]); setShowDialog(false) }} />}
  </section>
}
