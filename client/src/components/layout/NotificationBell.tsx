"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Check, Loader2 } from "lucide-react"
import { acceptWorkspaceInvitationById, listNotifications, markNotificationRead, type WorkspaceNotification } from "@/services/workspace.service"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

function timeLabel(value: string) {
  return new Date(value).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
}

export function NotificationBell() {
  const router = useRouter()
  const [items, setItems] = useState<WorkspaceNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [actingId, setActingId] = useState("")

  async function load() {
    setLoading(true)
    try {
      setItems(await listNotifications())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const interval = window.setInterval(load, 30000)
    return () => window.clearInterval(interval)
  }, [])

  const unreadCount = useMemo(() => items.filter((item) => !item.readAt).length, [items])

  async function acceptInvite(notification: WorkspaceNotification) {
    const invitationId = notification.data?.invitationId
    if (!invitationId || actingId) return
    setActingId(notification.id)
    try {
      const result = await acceptWorkspaceInvitationById(invitationId)
      await load()
      router.push(result.workspace.redirectUrl)
    } finally {
      setActingId("")
    }
  }

  async function markRead(notification: WorkspaceNotification) {
    if (notification.readAt) return
    await markNotificationRead(notification.id)
    setItems((current) => current.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item))
  }

  return (
    <DropdownMenu onOpenChange={(open) => { if (open) load() }}>
      <DropdownMenuTrigger asChild>
        <button type="button" title="Thông báo" className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-slate-600 transition hover:bg-secondary hover:text-primary">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 min-w-4 rounded-full bg-red-500 px-1 text-center text-[10px] font-semibold leading-4 text-white">{unreadCount}</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Thông báo</span>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 && <div className="px-3 py-6 text-center text-sm text-slate-500">Chưa có thông báo.</div>}
        {items.slice(0, 8).map((notification) => {
          const canAccept = notification.type === "WORKSPACE_INVITE" && notification.data?.invitationId
          return <div key={notification.id} className={`border-b px-3 py-3 last:border-b-0 ${notification.readAt ? "bg-white" : "bg-emerald-50/60"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{notification.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-600">{notification.body}</p>
                <p className="mt-1 text-[11px] text-slate-400">{timeLabel(notification.createdAt)}</p>
              </div>
              {!notification.readAt && <button type="button" title="Đánh dấu đã đọc" onClick={() => void markRead(notification)} className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-primary"><Check className="h-3.5 w-3.5" /></button>}
            </div>
            {canAccept && <button type="button" disabled={actingId === notification.id} onClick={() => void acceptInvite(notification)} className="mt-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60">{actingId === notification.id ? "Đang chấp nhận..." : "Chấp nhận lời mời"}</button>}
          </div>
        })}
        {items.length > 8 && <DropdownMenuItem disabled className="justify-center text-xs text-slate-500">Hiển thị 8 thông báo mới nhất</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
