"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Download, FileText, LogOut, MessageSquareText, Wifi, WifiOff } from "lucide-react"
import { ShareDialog } from "@/components/editor/ShareDialog"
import { getStoredUser, logoutUser, onSessionChange } from "@/services/auth.service"

type StoredUser = {
    firstname?: string
    lastname?: string
    username?: string
    email?: string
}

function getDisplayName(user: StoredUser | null) {
    if (!user) return "Người dùng"

    const fullName = [user.firstname, user.lastname].filter(Boolean).join(" ").trim()
    return fullName || user.username || user.email || "Người dùng"
}

function getInitials(displayName: string) {
    return displayName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "U"
}

export function Navbar({
    documentId,
    title = "Untitled document",
    onExportPdf,
    onRename,
    onTitleDraftChange,
    onToggleComments,
}: {
    documentId: string
    title?: string
    onExportPdf?: () => void
    onRename?: (title: string) => Promise<void> | void
    onTitleDraftChange?: (title: string) => void
    onToggleComments?: () => void
}) {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [editing, setEditing] = useState(false)
    const [name, setName] = useState(title)
    const [user, setUser] = useState<StoredUser | null>(() => getStoredUser())
    const [isOnline, setIsOnline] = useState(true)

    useEffect(() => {
        const syncUser = () => setUser(getStoredUser())
        window.addEventListener("storage", syncUser)
        const unsubscribe = onSessionChange(syncUser)

        return () => {
            window.removeEventListener("storage", syncUser)
            unsubscribe()
        }
    }, [])

    useEffect(() => {
        const syncNetworkStatus = () => setIsOnline(navigator.onLine)
        syncNetworkStatus()
        window.addEventListener("online", syncNetworkStatus)
        window.addEventListener("offline", syncNetworkStatus)

        return () => {
            window.removeEventListener("online", syncNetworkStatus)
            window.removeEventListener("offline", syncNetworkStatus)
        }
    }, [])

    const displayName = useMemo(() => getDisplayName(user), [user])
    const initials = useMemo(() => getInitials(displayName), [displayName])

    async function commitName() {
        const nextName = name.trim() || title || "Untitled document"
        setName(nextName)
        onTitleDraftChange?.(nextName)
        setEditing(false)
        if (nextName !== title) {
            setSaving(true)
            try {
                await onRename?.(nextName)
            } finally {
                setSaving(false)
            }
        }
    }

    async function handleLogout() {
        await logoutUser()
        router.replace("/login")
    }

    return (
        <header className="flex h-14 items-center justify-between gap-4 border-b border-neutral-200 bg-[#fbfbfa] px-4">
            <div className="flex min-w-0 items-center gap-3">
                <Link
                    href="/dashboard"
                    title="Về dashboard"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
                >
                    <FileText className="h-5 w-5" />
                </Link>

                <div className="flex min-w-0 flex-col">
                    {editing ? (
                        <input
                            className="w-64 max-w-[55vw] rounded-md border px-2 py-1 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            value={name}
                            onChange={(event) => {
                                const nextName = event.target.value
                                setName(nextName)
                                onTitleDraftChange?.(nextName)
                            }}
                            onBlur={commitName}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault()
                                    event.currentTarget.blur()
                                }
                            }}
                        />
                    ) : (
                        <div className="flex min-w-0 items-baseline gap-2">
                            <h1
                                className="max-w-[48vw] cursor-text truncate text-sm font-medium text-neutral-700"
                                onClick={() => {
                                    setName(title)
                                    setEditing(true)
                                }}
                            >
                                {title}
                            </h1>
                            <span className="hidden text-xs text-neutral-400 sm:inline">
                                {saving ? "Đang lưu..." : "Đã lưu"}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
                <button
                    type="button"
                    onClick={onExportPdf}
                    className="hidden h-8 items-center gap-2 rounded-md px-2.5 text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 md:flex"
                >
                    <Download className="h-4 w-4" />
                    Xuất PDF
                </button>
                <button
                    type="button"
                    onClick={onToggleComments}
                    className="hidden h-8 items-center gap-2 rounded-md px-2.5 text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 md:flex"
                >
                    <MessageSquareText className="h-4 w-4" />
                    Bình luận
                </button>
                <div
                    className={`hidden h-8 items-center gap-2 rounded-md px-2.5 text-sm md:flex ${
                        isOnline ? "text-emerald-700" : "text-amber-700"
                    }`}
                    title={isOnline ? "Online" : "Offline"}
                >
                    {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                    {isOnline ? "Online" : "Offline"}
                </div>
                <ShareDialog documentId={documentId} />
                <button
                    type="button"
                    onClick={handleLogout}
                    className="hidden h-8 items-center gap-2 rounded-md px-2.5 text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-red-600 md:flex"
                >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                </button>
                <Avatar className="h-8 w-8" title={displayName}>
                    <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
                </Avatar>
            </div>
        </header>
    )
}
