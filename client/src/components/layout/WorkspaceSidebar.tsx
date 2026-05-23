"use client"

import Link from "next/link"
import { Clock, FileText, Home, MessageSquareText, Plus, Search, Users } from "lucide-react"

type WorkspaceSidebarProps = {
  title?: string
  activeUsers?: Array<{
    name: string
    color: string
  }>
}

export function WorkspaceSidebar({ title = "Untitled document", activeUsers = [] }: WorkspaceSidebarProps) {
  const recentTitle = title.trim() || "Untitled document"

  return (
    <aside className="hidden h-screen w-72 shrink-0 flex-col border-r border-neutral-800 bg-neutral-950 text-neutral-300 lg:flex">
      <div className="flex h-14 items-center gap-3 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 text-sm font-semibold text-white">
          C
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-neutral-100">CoWorkHub</div>
          <div className="truncate text-xs text-neutral-500">Workspace</div>
        </div>
      </div>

      <div className="space-y-1 px-2">
        <Link href="/dashboard" className="flex h-9 items-center gap-3 rounded-md bg-neutral-800 px-3 text-sm font-medium text-neutral-100">
          <Home className="h-4 w-4" />
          Home
        </Link>
        <button type="button" className="flex h-9 w-full items-center gap-3 rounded-md px-3 text-left text-sm text-neutral-400 transition hover:bg-neutral-900 hover:text-neutral-100">
          <Search className="h-4 w-4" />
          Search
        </button>
        <button type="button" className="flex h-9 w-full items-center gap-3 rounded-md px-3 text-left text-sm text-neutral-400 transition hover:bg-neutral-900 hover:text-neutral-100">
          <MessageSquareText className="h-4 w-4" />
          Comments
        </button>
      </div>

      <div className="mt-6 px-4 text-xs font-semibold uppercase tracking-wide text-neutral-600">Current</div>
      <div className="mt-2 px-2">
        <div className="flex items-center gap-3 rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-neutral-100">
          <FileText className="h-4 w-4 shrink-0 text-emerald-400" />
          <span className="truncate">{recentTitle}</span>
        </div>
      </div>

      <div className="mt-6 px-4 text-xs font-semibold uppercase tracking-wide text-neutral-600">Recents</div>
      <div className="mt-2 space-y-1 px-2">
        <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-400">
          <Clock className="h-4 w-4" />
          <span className="truncate">{recentTitle}</span>
        </div>
      </div>

      <div className="mt-6 px-4 text-xs font-semibold uppercase tracking-wide text-neutral-600">Collaborators</div>
      <div className="mt-2 space-y-1 px-2">
        {activeUsers.length > 0 ? (
          activeUsers.slice(0, 5).map((user) => (
            <div key={`${user.name}-${user.color}`} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-400">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: user.color }} />
              <span className="truncate">{user.name}</span>
            </div>
          ))
        ) : (
          <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-500">
            <Users className="h-4 w-4" />
            No one else online
          </div>
        )}
      </div>

      <div className="mt-auto p-4">
        <Link href="/dashboard" className="flex h-10 items-center justify-center gap-2 rounded-full bg-neutral-800 text-sm font-medium text-neutral-100 transition hover:bg-neutral-700">
          <Plus className="h-4 w-4" />
          New document
        </Link>
      </div>
    </aside>
  )
}
