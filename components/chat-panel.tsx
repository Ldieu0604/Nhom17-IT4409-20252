"use client"

import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { format, formatDistanceToNowStrict } from "date-fns"
import { vi } from "date-fns/locale"
import {
  Circle,
  CornerDownLeft,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  SmilePlus,
  Users,
  X,
} from "lucide-react"
import { io, Socket } from "socket.io-client"
import { toast } from "sonner"
import { ActivityItem, AppUser, WorkspaceChatPanelData } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

type ChatPanelProps =
  | {
      mode?: "activity"
      activities?: ActivityItem[]
      workspaceId?: never
      currentUser?: never
      initialChat?: never
    }
  | {
      mode: "chat"
      workspaceId: string
      currentUser: AppUser | null
      initialChat?: WorkspaceChatPanelData
      activities?: never
    }

type ChannelItem = {
  id: string
  name: string
  description?: string | null
  type: "GENERAL" | "DIRECT" | "GROUP" | "ANNOUNCEMENT"
  unreadCount: number
  memberNames?: string[]
}

type ChatApiItem = {
  id: string
  content: string
  createdAt: string
  readByCount?: number
  reactions?: Array<{
    emoji: string
    count: number
    reactedByCurrentUser: boolean
  }>
  replyTo?: {
    id: string
    senderName: string
    content: string
  } | null
  sender: {
    id?: string | null
    name: string
  }
  senderId?: string | null
  isOwn: boolean
}

type PresenceUser = {
  socketId: string
  user: {
    id?: string
    name: string
  }
  isOnline?: boolean
  lastSeenAt?: string
}

type UiMessage = {
  id: string
  content: string
  createdAtLabel: string
  readByCount: number
  reactions: Array<{
    emoji: string
    count: number
    reactedByCurrentUser: boolean
  }>
  replyTo?: {
    id: string
    senderName: string
    content: string
  } | null
  sender: {
    id?: string | null
    name: string
    initials: string
  }
  isOwn: boolean
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function formatPresenceTime(date: Date) {
  return formatDistanceToNowStrict(date, {
    addSuffix: true,
    locale: vi,
  })
}

function formatMessageTime(date: Date) {
  return format(date, "HH:mm dd/MM")
}

function mapChatApiItem(item: ChatApiItem): UiMessage {
  return {
    id: item.id,
    content: item.content,
    createdAtLabel: formatMessageTime(new Date(item.createdAt)),
    readByCount: item.readByCount ?? 0,
    reactions: item.reactions ?? [],
    replyTo: item.replyTo ?? null,
    sender: {
      id: item.sender.id ?? null,
      name: item.sender.name,
      initials: getInitials(item.sender.name),
    },
    isOwn: item.isOwn,
  }
}

function upsertChannel(items: ChannelItem[], nextItem: ChannelItem) {
  const existing = items.find((item) => item.id === nextItem.id)
  if (!existing) {
    return [nextItem, ...items]
  }

  return items.map((item) => (item.id === nextItem.id ? nextItem : item))
}

export function ChatPanel(props: ChatPanelProps) {
  const mode = props.mode ?? "activity"
  const currentUser = mode === "chat" ? props.currentUser : null
  const [isOpen, setIsOpen] = useState(false)
  const [channels, setChannels] = useState<ChannelItem[]>(mode === "chat" ? props.initialChat?.channels ?? [] : [])
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    mode === "chat" ? props.initialChat?.channelId ?? props.initialChat?.channels?.[0]?.id ?? null : null
  )
  const [channelName, setChannelName] = useState(mode === "chat" ? props.initialChat?.channelName ?? "general" : "")
  const [channelDescription, setChannelDescription] = useState(
    mode === "chat" ? props.initialChat?.channelDescription ?? "Kênh trao đổi của workspace." : ""
  )
  const [messages, setMessages] = useState<UiMessage[]>(
    mode === "chat"
      ? (props.initialChat?.messages ?? []).map((message) => ({
          ...message,
          readByCount: message.readByCount ?? 0,
          reactions: message.reactions ?? [],
          replyTo: message.replyTo ?? null,
        }))
      : []
  )
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])
  const [replyingTo, setReplyingTo] = useState<{ id: string; senderName: string; content: string } | null>(null)
  const [directEmail, setDirectEmail] = useState("")
  const [draft, setDraft] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isCreatingDirect, setIsCreatingDirect] = useState(false)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const joinedChannelIdRef = useRef<string | null>(null)

  const groupedChannels = useMemo(() => {
    const groupItems = channels.filter((channel) => channel.type !== "DIRECT")
    const directItems = channels.filter((channel) => channel.type === "DIRECT")

    return {
      groupItems,
      directItems,
    }
  }, [channels])

  async function refreshChannels(silent = false) {
    if (mode !== "chat") {
      return
    }

    if (!silent) {
      setIsRefreshing(true)
    }

    try {
      const response = await fetch(`/api/workspaces/${props.workspaceId}/chat/channels`, {
        cache: "no-store",
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data?.message ?? "Không thể tải danh sách chat.")
      }

      const nextChannels = (data.items ?? []) as ChannelItem[]
      setChannels(nextChannels)

      if (!selectedChannelId && nextChannels.length > 0) {
        setSelectedChannelId(nextChannels[0].id)
      } else if (selectedChannelId && !nextChannels.some((channel) => channel.id === selectedChannelId)) {
        setSelectedChannelId(nextChannels[0]?.id ?? null)
      }
    } catch (error) {
      if (!silent) {
        toast.error(error instanceof Error ? error.message : "Không thể tải danh sách chat.")
      }
    } finally {
      if (!silent) {
        setIsRefreshing(false)
      }
    }
  }

  async function refreshMessages(channelId: string, silent = false) {
    if (mode !== "chat") {
      return
    }

    try {
      const response = await fetch(`/api/workspaces/${props.workspaceId}/chat?channelId=${channelId}`, {
        cache: "no-store",
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data?.message ?? "Không thể tải tin nhắn.")
      }

      setChannelName(data.channel?.name ?? "general")
      setChannelDescription(data.channel?.description ?? "Kênh trao đổi của workspace.")
      setMessages(((data.items ?? []) as ChatApiItem[]).map(mapChatApiItem))
      setChannels((current) =>
        current.map((channel) =>
          channel.id === channelId ? { ...channel, unreadCount: data.unreadCount ?? channel.unreadCount } : channel
        )
      )

      if (!silent) {
        requestAnimationFrame(() => {
          const viewport = viewportRef.current
          if (viewport) {
            viewport.scrollTop = viewport.scrollHeight
          }
        })
      }
    } catch (error) {
      if (!silent) {
        toast.error(error instanceof Error ? error.message : "Không thể tải tin nhắn.")
      }
    }
  }

  async function markMessagesAsRead(channelId: string) {
    if (mode !== "chat") {
      return
    }

    try {
      await fetch(`/api/workspaces/${props.workspaceId}/chat/read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelId,
        }),
      })

      setChannels((current) =>
        current.map((channel) => (channel.id === channelId ? { ...channel, unreadCount: 0 } : channel))
      )
    } catch {
      return
    }
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (mode !== "chat" || !selectedChannelId || !draft.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/workspaces/${props.workspaceId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelId: selectedChannelId,
          content: draft.trim(),
          parentMessageId: replyingTo?.id ?? null,
        }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data?.message ?? "Không thể gửi tin nhắn.")
      }

      const nextMessage = mapChatApiItem(data.item as ChatApiItem)
      setMessages((current) => [...current, nextMessage])
      setDraft("")
      setReplyingTo(null)

      socketRef.current?.emit("chat:message", {
        workspaceId: props.workspaceId,
        channelId: selectedChannelId,
        payload: {
          ...data.item,
          channelId: selectedChannelId,
        },
      })

      await refreshChannels(true)

      requestAnimationFrame(() => {
        const viewport = viewportRef.current
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight
        }
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể gửi tin nhắn.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCreateDirectChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (mode !== "chat" || !directEmail.trim()) {
      return
    }

    setIsCreatingDirect(true)

    try {
      const response = await fetch(`/api/workspaces/${props.workspaceId}/chat/channels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: directEmail.trim(),
        }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data?.message ?? "Không thể tạo cuộc trò chuyện.")
      }

      const nextChannel = data.item as ChannelItem
      setChannels((current) => upsertChannel(current, nextChannel))
      setSelectedChannelId(nextChannel.id)
      setDirectEmail("")
      toast.success("Đã mở cuộc trò chuyện riêng.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo cuộc trò chuyện.")
    } finally {
      setIsCreatingDirect(false)
    }
  }

  async function handleToggleReaction(messageId: string, emoji: string) {
    if (mode !== "chat") {
      return
    }

    try {
      const response = await fetch(`/api/workspaces/${props.workspaceId}/chat/${messageId}/reactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emoji }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data?.message ?? "Không thể thả cảm xúc.")
      }

      await refreshMessages(selectedChannelId ?? "", true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể thả cảm xúc.")
    }
  }

  useEffect(() => {
    if (mode !== "chat") {
      return
    }

    void refreshChannels(true)
  }, [mode])

  useEffect(() => {
    if (mode !== "chat") {
      return
    }

    const intervalId = window.setInterval(() => {
      void refreshChannels(true)
    }, 5000)

    return () => window.clearInterval(intervalId)
  }, [mode, selectedChannelId])

  useEffect(() => {
    if (mode !== "chat" || !selectedChannelId || !isOpen) {
      return
    }

    void refreshMessages(selectedChannelId, true)

    const intervalId = window.setInterval(() => {
      void refreshMessages(selectedChannelId, true)
    }, 4000)

    return () => window.clearInterval(intervalId)
  }, [isOpen, mode, selectedChannelId])

  useEffect(() => {
    if (mode !== "chat" || !isOpen || !selectedChannelId) {
      return
    }

    void markMessagesAsRead(selectedChannelId)
  }, [isOpen, messages.length, mode, selectedChannelId])

  useEffect(() => {
    if (mode !== "chat" || !props.workspaceId || !currentUser) {
      return
    }

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4001", {
      transports: ["websocket"],
    })

    socketRef.current = socket

    socket.on("chat:new", (payload: ChatApiItem & { channelId?: string }) => {
      if (!payload.channelId) {
        return
      }

      if (payload.channelId === selectedChannelId && isOpen) {
        setMessages((current) => {
          if (current.some((item) => item.id === payload.id)) {
            return current
          }

          return [...current, mapChatApiItem(payload)]
        })
        void markMessagesAsRead(payload.channelId)
      } else if (payload.senderId !== currentUser.id) {
        toast.message(`Tin nhắn mới từ ${payload.sender?.name ?? "thành viên"}`)
      }

      void refreshChannels(true)
    })

    socket.on("chat:presence", (payload: PresenceUser[]) => {
      setOnlineUsers(payload)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      joinedChannelIdRef.current = null
    }
  }, [currentUser, isOpen, mode, props.workspaceId, selectedChannelId])

  useEffect(() => {
    if (mode !== "chat" || !socketRef.current || !currentUser || !selectedChannelId) {
      return
    }

    if (joinedChannelIdRef.current === selectedChannelId) {
      return
    }

    joinedChannelIdRef.current = selectedChannelId
    socketRef.current.emit("chat:join", {
      workspaceId: props.workspaceId,
      channelId: selectedChannelId,
      user: {
        id: currentUser.id,
        name: currentUser.name,
      },
    })
  }, [currentUser, mode, props.workspaceId, selectedChannelId])

  useEffect(() => {
    if (mode !== "chat" || !isOpen) {
      return
    }

    requestAnimationFrame(() => {
      const viewport = viewportRef.current
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      }
    })
  }, [isOpen, messages, mode])

  return (
    <>
      {!isOpen && (
        <Button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full border border-primary/15 bg-primary text-primary-foreground shadow-[0_20px_45px_-20px_rgba(79,70,229,0.7)] transition-transform hover:scale-105 hover:bg-primary"
          aria-label={mode === "chat" ? "Mở chat" : "Mở hoạt động"}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[min(460px,calc(100vw-0.75rem))]">
          <div className="glass-card flex max-h-[calc(100vh-5rem)] flex-col overflow-hidden rounded-[22px] border border-primary/10 bg-background/95 shadow-[0_28px_90px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-border/70 bg-background/85 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{mode === "chat" ? "Tin nhắn" : "Hoạt động"}</p>
                  <p className="text-xs text-muted-foreground">
                    {mode === "chat" ? "Trao đổi nhanh trong workspace" : "Cập nhật mới nhất"}
                  </p>
                </div>
              </div>
              <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {mode === "chat" ? (
              <div className="grid min-h-0 flex-1 grid-cols-[140px_minmax(0,1fr)] sm:grid-cols-[160px_minmax(0,1fr)]">
                <div className="flex min-h-0 flex-col border-r border-border/70 bg-muted/25 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold">Đoạn chat</p>
                    <Button type="button" variant="ghost" size="icon" onClick={() => void refreshChannels()} disabled={isRefreshing}>
                      <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    </Button>
                  </div>

                  <form onSubmit={handleCreateDirectChannel} className="mb-3 space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Chat riêng theo email
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={directEmail}
                        onChange={(event) => setDirectEmail(event.target.value)}
                        placeholder="email@domain.com"
                        disabled={isCreatingDirect}
                        className="h-9 text-sm"
                      />
                      <Button
                        type="submit"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        disabled={isCreatingDirect || !directEmail.trim()}
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>

                  <ScrollArea className="min-h-0 flex-1">
                    <div className="space-y-2 pr-2">
                      {channels.length > 0 ? (
                        <>
                          {groupedChannels.groupItems.length > 0 && (
                            <div className="space-y-2">
                              <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Nhóm
                              </p>
                              {groupedChannels.groupItems.map((channel) => (
                                <button
                                  key={channel.id}
                                  type="button"
                                  className={`w-full rounded-2xl border px-3 py-2.5 text-left transition-colors ${
                                    selectedChannelId === channel.id
                                      ? "border-primary/30 bg-primary/10"
                                      : "bg-background hover:border-primary/20"
                                  }`}
                                  onClick={() => setSelectedChannelId(channel.id)}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-medium">
                                        {channel.type === "GENERAL" ? `#${channel.name}` : channel.name}
                                      </p>
                                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                                        {channel.description || "Kênh chat nhóm"}
                                      </p>
                                    </div>
                                    {channel.unreadCount > 0 && <Badge variant="destructive">{channel.unreadCount}</Badge>}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}

                          {groupedChannels.directItems.length > 0 && (
                            <div className="space-y-2 pt-2">
                              <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Cá nhân
                              </p>
                              {groupedChannels.directItems.map((channel) => (
                                <button
                                  key={channel.id}
                                  type="button"
                                  className={`w-full rounded-2xl border px-3 py-2.5 text-left transition-colors ${
                                    selectedChannelId === channel.id
                                      ? "border-primary/30 bg-primary/10"
                                      : "bg-background hover:border-primary/20"
                                  }`}
                                  onClick={() => setSelectedChannelId(channel.id)}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-medium">{channel.name}</p>
                                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                                        {channel.description || "Tin nhắn trực tiếp"}
                                      </p>
                                    </div>
                                    {channel.unreadCount > 0 && <Badge variant="destructive">{channel.unreadCount}</Badge>}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                          Chưa có cuộc trò chuyện nào.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                <div className="flex min-h-0 flex-col overflow-hidden">
                  <div className="border-b border-border/70 bg-background/80 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {channelName ? `#${channelName}` : "Chọn một cuộc trò chuyện"}
                        </p>
                        <p className="line-clamp-1 text-xs text-muted-foreground">{channelDescription}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {onlineUsers.filter((entry) => entry.isOnline !== false).length} đang trực tuyến
                      </Badge>
                      {onlineUsers.slice(0, 2).map((entry) => (
                        <Badge key={entry.user.id ?? entry.socketId} variant="outline" className="gap-1">
                          <Circle
                            className={`h-2.5 w-2.5 ${
                              entry.isOnline === false ? "fill-muted text-muted-foreground" : "fill-primary text-primary"
                            }`}
                          />
                          {entry.user.name} •{" "}
                          {entry.isOnline === false && entry.lastSeenAt
                            ? formatPresenceTime(new Date(entry.lastSeenAt))
                            : "trực tuyến"}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <ScrollArea className="min-h-0 flex-1 bg-background/70 p-4" viewportRef={viewportRef}>
                    <div className="space-y-3">
                      {selectedChannelId ? (
                        messages.length > 0 ? (
                          messages.map((message) => (
                            <div
                              key={message.id}
                              className={`rounded-2xl border p-3 shadow-sm ${
                                message.isOwn ? "ml-8 border-primary/20 bg-primary/5" : "mr-8 bg-card"
                              }`}
                            >
                              {message.replyTo && (
                                <div className="mb-2 rounded-xl border border-dashed bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                                  <p className="font-medium text-foreground">{message.replyTo.senderName}</p>
                                  <p className="line-clamp-2">{message.replyTo.content}</p>
                                </div>
                              )}

                              <div className="mb-1 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium">{message.sender.name}</p>
                                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{message.content}</p>
                                </div>
                                <Badge variant={message.isOwn ? "default" : "secondary"} className="text-[10px]">
                                  {message.isOwn ? "Bạn" : message.sender.initials}
                                </Badge>
                              </div>

                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <p className="text-xs text-muted-foreground">{message.createdAtLabel}</p>
                                <p className="text-xs text-muted-foreground">
                                  {message.isOwn
                                    ? message.readByCount > 1
                                      ? `Đã đọc ${message.readByCount - 1}`
                                      : "Chưa đọc"
                                    : `Đã đọc: ${message.readByCount ?? 0}`}
                                </p>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() =>
                                    setReplyingTo({
                                      id: message.id,
                                      senderName: message.sender.name,
                                      content: message.content,
                                    })
                                  }
                                >
                                  <CornerDownLeft className="mr-1 h-3.5 w-3.5" />
                                  Trả lời
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => void handleToggleReaction(message.id, "👍")}
                                >
                                  <SmilePlus className="mr-1 h-3.5 w-3.5" />
                                  Thả cảm xúc
                                </Button>
                              </div>

                              {message.reactions.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {message.reactions.map((reaction) => (
                                    <button
                                      key={`${message.id}-${reaction.emoji}`}
                                      type="button"
                                      className={`rounded-full border px-2 py-1 text-xs ${
                                        reaction.reactedByCurrentUser
                                          ? "border-primary bg-primary/10 text-primary"
                                          : "border-border bg-background"
                                      }`}
                                      onClick={() => void handleToggleReaction(message.id, reaction.emoji)}
                                    >
                                      {reaction.emoji} {reaction.count}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                            Chưa có tin nhắn nào trong cuộc trò chuyện này.
                          </div>
                        )
                      ) : (
                        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                          Chọn một kênh chat.
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <form onSubmit={handleSendMessage} className="border-t border-border/70 bg-background/85 p-4">
                    {replyingTo && (
                      <div className="mb-3 rounded-xl border border-dashed bg-muted/40 px-3 py-2 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">Đang trả lời: {replyingTo.senderName}</p>
                            <p className="line-clamp-2 text-muted-foreground">{replyingTo.content}</p>
                          </div>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
                            Bỏ
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-end gap-2">
                      <Input
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        placeholder={
                          currentUser
                            ? selectedChannelId
                              ? "Nhập tin nhắn..."
                              : "Chọn một cuộc trò chuyện trước"
                            : "Cần đăng nhập để gửi tin nhắn"
                        }
                        disabled={!currentUser || isSubmitting || !selectedChannelId}
                      />
                      <Button
                        type="submit"
                        size="icon"
                        className="h-10 w-10 shrink-0 rounded-full"
                        disabled={!currentUser || isSubmitting || !draft.trim() || !selectedChannelId}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="h-[420px] p-4">
                <ScrollArea className="h-full">
                  <div className="space-y-3">
                    {(props.activities ?? []).length > 0 ? (
                      (props.activities ?? []).map((activity) => (
                        <div key={activity.id} className="rounded-xl border bg-card p-3">
                          <div className="mb-1 flex items-start justify-between gap-3">
                            <p className="text-sm font-medium">{activity.actor}</p>
                            <Badge variant="secondary" className="text-[10px]">
                              <Circle className="mr-1 h-2.5 w-2.5 fill-primary text-primary" />
                              trực tiếp
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{activity.action}</p>
                          <p className="mt-2 text-xs text-muted-foreground">{activity.createdAtLabel}</p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                        Chưa có hoạt động mới.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
