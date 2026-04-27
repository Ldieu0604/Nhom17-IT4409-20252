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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

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

export function ChatPanel(props: ChatPanelProps) {
  const mode = props.mode ?? "activity"
  const currentUser = mode === "chat" ? props.currentUser : null
  const [isOpen, setIsOpen] = useState(false)
  const [channels, setChannels] = useState<ChannelItem[]>(mode === "chat" ? props.initialChat?.channels ?? [] : [])
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    mode === "chat" ? props.initialChat?.channelId ?? null : null
  )
  const [channelName, setChannelName] = useState(mode === "chat" ? props.initialChat?.channelName ?? "general" : "")
  const [channelDescription, setChannelDescription] = useState(
    mode === "chat" ? props.initialChat?.channelDescription ?? "Kênh chat của workspace." : ""
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
  const joinedChannelIdsRef = useRef<Set<string>>(new Set())

  const groupedChannels = useMemo(() => {
    const groupItems = channels.filter((channel) => channel.type !== "DIRECT")
    const directItems = channels.filter((channel) => channel.type === "DIRECT")

    return {
      groupItems,
      directItems,
    }
  }, [channels])

  useEffect(() => {
    if (mode !== "chat") {
      return
    }

    void refreshChannels()
  }, [mode])

  useEffect(() => {
    if (mode !== "chat" || !isOpen || !selectedChannelId) {
      return
    }

    const intervalId = window.setInterval(() => {
      void refreshMessages(selectedChannelId, true)
    }, 4000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [isOpen, mode, selectedChannelId])

  useEffect(() => {
    if (!isOpen || mode !== "chat") {
      return
    }

    if (!selectedChannelId && channels.length > 0) {
      setSelectedChannelId(channels[0].id)
      return
    }

    if (selectedChannelId) {
      void refreshMessages(selectedChannelId)
    }
  }, [channels, isOpen, mode, selectedChannelId])

  useEffect(() => {
    if (!isOpen || mode !== "chat") {
      return
    }

    const viewport = viewportRef.current
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight
    }
  }, [isOpen, messages, mode])

  useEffect(() => {
    if (!isOpen || mode !== "chat" || !selectedChannelId) {
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
    joinedChannelIdsRef.current = new Set()

    socket.on("chat:new", (payload: ChatApiItem & { channelId?: string }) => {
      if (!payload.channelId) {
        return
      }

      const senderName = payload.sender?.name ?? "Hệ thống"
      const preview = payload.content?.slice(0, 80) ?? ""

      if (payload.channelId !== selectedChannelId || !isOpen) {
        setChannels((current) =>
          current.map((channel) =>
            channel.id === payload.channelId
              ? {
                  ...channel,
                  unreadCount: channel.unreadCount + (payload.senderId === currentUser.id ? 0 : 1),
                }
              : channel
          )
        )

        if (payload.senderId !== currentUser.id) {
          toast.info(`Tin nhắn mới từ ${senderName}`, {
            description: preview,
          })
        }

        if (payload.channelId !== selectedChannelId) {
          void refreshChannels(true)
          return
        }
      }

      if (!isOpen) {
        return
      }

      const nextMessage = mapChatApiItem(payload)
      setMessages((current) => {
        if (current.some((message) => message.id === nextMessage.id)) {
          return current
        }

        return [...current, nextMessage]
      })

      void refreshChannels(true)

      if (payload.senderId !== currentUser.id) {
        void markMessagesAsRead(selectedChannelId)
      }
    })

    socket.on("chat:presence", (users: PresenceUser[]) => {
      setOnlineUsers(users)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      joinedChannelIdsRef.current = new Set()
      setOnlineUsers([])
    }
  }, [currentUser, mode, props.workspaceId, selectedChannelId, isOpen])

  useEffect(() => {
    if (mode !== "chat") {
      return
    }

    const intervalId = window.setInterval(() => {
      void refreshChannels(true)
    }, 5000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [mode])

  useEffect(() => {
    if (mode !== "chat" || !props.workspaceId || !currentUser || !socketRef.current || channels.length === 0) {
      return
    }

    for (const channel of channels) {
      if (joinedChannelIdsRef.current.has(channel.id)) {
        continue
      }

      socketRef.current.emit("chat:join", {
        workspaceId: props.workspaceId,
        channelId: channel.id,
        user: {
          id: currentUser.id,
          name: currentUser.name,
        },
      })
      joinedChannelIdsRef.current.add(channel.id)
    }
  }, [channels, currentUser, mode, props.workspaceId])

  async function refreshChannels(silent = false) {
    if (mode !== "chat") {
      return
    }

    try {
      if (!silent) {
        setIsRefreshing(true)
      }

      const response = await fetch(`/api/workspaces/${props.workspaceId}/chat/channels`, {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("Không thể tải danh sách chat.")
      }

      const payload = await response.json()
      const items = (payload.items ?? []) as ChannelItem[]
      setChannels(items)

      if (!selectedChannelId && items.length > 0) {
        setSelectedChannelId(items[0].id)
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
      if (!silent) {
        setIsRefreshing(true)
      }

      const response = await fetch(
        `/api/workspaces/${props.workspaceId}/chat?channelId=${encodeURIComponent(channelId)}`,
        { cache: "no-store" }
      )

      if (!response.ok) {
        throw new Error("Không thể tải tin nhắn.")
      }

      const payload = await response.json()
      setChannelName(payload.channel?.name ?? "general")
      setChannelDescription(payload.channel?.description ?? "Kênh chat của workspace.")
      setMessages((payload.items ?? []).map(mapChatApiItem))

      setChannels((current) =>
        current.map((channel) =>
          channel.id === channelId
            ? {
                ...channel,
                unreadCount: payload.unreadCount ?? 0,
              }
            : channel
        )
      )
    } catch (error) {
      if (!silent) {
        toast.error(error instanceof Error ? error.message : "Không thể tải tin nhắn.")
      }
    } finally {
      if (!silent) {
        setIsRefreshing(false)
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
        body: JSON.stringify({ channelId }),
      })

      setChannels((current) =>
        current.map((channel) =>
          channel.id === channelId
            ? {
                ...channel,
                unreadCount: 0,
              }
            : channel
        )
      )
    } catch {
      // silent
    }
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (mode !== "chat" || !selectedChannelId) {
      return
    }

    const content = draft.trim()
    if (!content) {
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/workspaces/${props.workspaceId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelId: selectedChannelId,
          content,
          parentMessageId: replyingTo?.id ?? null,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.message ?? "Không thể gửi tin nhắn.")
      }

      const nextMessage = mapChatApiItem(payload.item)
      setMessages((current) => [...current, nextMessage])
      socketRef.current?.emit("chat:message", {
        workspaceId: props.workspaceId,
        channelId: selectedChannelId,
        payload: {
          ...payload.item,
          channelId: selectedChannelId,
        },
      })
      setDraft("")
      setReplyingTo(null)
      void refreshChannels(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể gửi tin nhắn.")
    } finally {
      setIsSubmitting(false)
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

      if (!response.ok) {
        throw new Error("Không thể cập nhật cảm xúc.")
      }

      const payload = await response.json()

      setMessages((current) =>
        current.map((message) => {
          if (message.id !== messageId) {
            return message
          }

          const reactions = [...(message.reactions ?? [])]
          const existingIndex = reactions.findIndex((reaction) => reaction.emoji === emoji)

          if (payload.reacted) {
            if (existingIndex >= 0) {
              reactions[existingIndex] = {
                ...reactions[existingIndex],
                count: reactions[existingIndex].count + (reactions[existingIndex].reactedByCurrentUser ? 0 : 1),
                reactedByCurrentUser: true,
              }
            } else {
              reactions.push({
                emoji,
                count: 1,
                reactedByCurrentUser: true,
              })
            }
          } else if (existingIndex >= 0) {
            const nextCount = reactions[existingIndex].count - 1

            if (nextCount <= 0) {
              reactions.splice(existingIndex, 1)
            } else {
              reactions[existingIndex] = {
                ...reactions[existingIndex],
                count: nextCount,
                reactedByCurrentUser: false,
              }
            }
          }

          return {
            ...message,
            reactions,
          }
        })
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật cảm xúc.")
    }
  }

  async function handleCreateDirectChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (mode !== "chat") {
      return
    }

    const email = directEmail.trim()
    if (!email) {
      return
    }

    try {
      setIsCreatingDirect(true)
      const response = await fetch(`/api/workspaces/${props.workspaceId}/chat/channels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.message ?? "Không thể tạo trò chuyện riêng.")
      }

      setDirectEmail("")
      await refreshChannels(true)

      if (payload?.item?.id) {
        setSelectedChannelId(payload.item.id)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo trò chuyện riêng.")
    } finally {
      setIsCreatingDirect(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="icon" className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg">
          <MessageCircle className="h-6 w-6" />
        </Button>
      </SheetTrigger>

      <SheetContent className="flex w-full flex-col p-0 sm:max-w-6xl">
        <SheetHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              {mode === "chat" ? "Tin nhắn" : "Hoạt động"}
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        {mode === "chat" ? (
          <div className="grid min-h-0 flex-1 md:grid-cols-[280px_1fr]">
            <div className="border-r p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-medium">Kênh chat</p>
                <Button variant="ghost" size="icon" onClick={() => void refreshChannels()} disabled={isRefreshing}>
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
              </div>

              <form onSubmit={handleCreateDirectChannel} className="mb-4 space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Tạo trò chuyện riêng bằng email</label>
                <div className="flex gap-2">
                  <Input
                    value={directEmail}
                    onChange={(event) => setDirectEmail(event.target.value)}
                    placeholder="email@domain.com"
                    disabled={isCreatingDirect}
                  />
                  <Button type="submit" size="icon" disabled={isCreatingDirect || !directEmail.trim()}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </form>

              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="space-y-2 pr-3">
                  {channels.length > 0 ? (
                    <>
                      {groupedChannels.groupItems.length > 0 && (
                        <div className="space-y-2">
                          <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Hội thoại nhóm
                          </p>
                          {groupedChannels.groupItems.map((channel) => (
                            <button
                              key={channel.id}
                              type="button"
                              className={`w-full rounded-2xl border p-3 text-left transition-colors ${
                                selectedChannelId === channel.id
                                  ? "border-primary bg-primary/5"
                                  : "bg-card hover:border-primary/30"
                              }`}
                              onClick={() => setSelectedChannelId(channel.id)}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium">
                                    {channel.type === "GENERAL" ? `#${channel.name}` : channel.name}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {channel.description || "Kênh chat nhóm"}
                                  </p>
                                </div>
                                {channel.unreadCount > 0 && <Badge variant="destructive">{channel.unreadCount}</Badge>}
                              </div>
                              {channel.memberNames && channel.memberNames.length > 0 && (
                                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                                  {channel.memberNames.join(", ")}
                                </p>
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      {groupedChannels.directItems.length > 0 && (
                        <div className="space-y-2 pt-3">
                          <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Tin nhắn cá nhân
                          </p>
                          {groupedChannels.directItems.map((channel) => (
                            <button
                              key={channel.id}
                              type="button"
                              className={`w-full rounded-2xl border p-3 text-left transition-colors ${
                                selectedChannelId === channel.id
                                  ? "border-primary bg-primary/5"
                                  : "bg-card hover:border-primary/30"
                              }`}
                              onClick={() => setSelectedChannelId(channel.id)}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium">{channel.name}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {channel.description || "Tin nhắn trực tiếp"}
                                  </p>
                                </div>
                                {channel.unreadCount > 0 && <Badge variant="destructive">{channel.unreadCount}</Badge>}
                              </div>
                              {channel.memberNames && channel.memberNames.length > 0 && (
                                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                                  {channel.memberNames.join(", ")}
                                </p>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                      Chưa có cuộc trò chuyện nào.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="flex min-h-0 flex-col">
              <div className="border-b bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{channelName ? `#${channelName}` : "Chọn một cuộc trò chuyện"}</p>
                    <p className="text-xs text-muted-foreground">{channelDescription}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {onlineUsers.filter((entry) => entry.isOnline !== false).length} đang trực tuyến
                  </Badge>
                  {onlineUsers.slice(0, 6).map((entry) => (
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

              <ScrollArea className="flex-1 p-4" viewportRef={viewportRef}>
                <div className="space-y-3">
                  {selectedChannelId ? (
                    messages.length > 0 ? (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`rounded-2xl border p-3 ${
                            message.isOwn ? "ml-10 border-primary/20 bg-primary/5" : "mr-10 bg-card"
                          }`}
                        >
                          {message.replyTo && (
                            <div className="mb-2 rounded-xl border border-dashed bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                              <p className="font-medium text-foreground">{message.replyTo.senderName}</p>
                              <p className="line-clamp-2">{message.replyTo.content}</p>
                            </div>
                          )}

                          <div className="mb-1 flex items-start justify-between gap-3">
                            <div>
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

              <form onSubmit={handleSendMessage} className="border-t p-4">
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
                  <Button type="submit" size="icon" disabled={!currentUser || isSubmitting || !draft.trim() || !selectedChannelId}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-4">
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {(props.activities ?? []).length > 0 ? (
                  (props.activities ?? []).map((activity) => (
                    <div key={activity.id} className="rounded-xl border p-3">
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
      </SheetContent>
    </Sheet>
  )
}
