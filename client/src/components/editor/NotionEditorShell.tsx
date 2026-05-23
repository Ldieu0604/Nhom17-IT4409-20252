"use client"

import React from "react"
import { CheckCircle2, FileText, MessageSquareText, Users } from "lucide-react"

type NotionEditorShellProps = {
  children?: React.ReactNode
  commentsOpen?: boolean
  title?: string
  canRename?: boolean
  currentRole?: string | null
  canEdit?: boolean
  activeUsersCount?: number
  onTitleDraftChange?: (title: string) => void
  onTitleCommit?: (title: string) => Promise<void> | void
}

export function NotionEditorShell({
  children,
  commentsOpen = false,
  title = "Untitled document",
  canRename = true,
  currentRole,
  canEdit = false,
  activeUsersCount = 0,
  onTitleDraftChange,
  onTitleCommit,
}: NotionEditorShellProps) {
  function commitTitle() {
    const nextTitle = title.trim() || "Untitled document"
    onTitleDraftChange?.(nextTitle)
    void onTitleCommit?.(nextTitle)
  }

  return (
    <div className="h-full overflow-auto bg-[#fbfbfa]">
      <div
        className={[
          "mx-auto min-h-full w-full px-5 py-10 transition-[max-width,padding] duration-200 sm:px-8 lg:py-14",
          commentsOpen ? "max-w-4xl lg:px-10" : "max-w-5xl lg:px-16",
        ].join(" ")}
      >
        <div className="mx-auto w-full max-w-3xl pb-8 pt-2">
          <div className="mb-8">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50 text-5xl shadow-sm ring-1 ring-emerald-100">
              📝
            </div>
            <input
              aria-label="Document title"
              value={title}
              readOnly={!canRename}
              placeholder="Untitled document"
              onChange={(event) => onTitleDraftChange?.(event.target.value)}
              onBlur={commitTitle}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  event.currentTarget.blur()
                }
              }}
              className="block w-full resize-none rounded-md bg-transparent px-1 py-1 text-5xl font-bold leading-tight tracking-normal text-neutral-900 outline-none transition placeholder:text-neutral-300 hover:bg-neutral-100/70 focus:bg-neutral-100 focus:ring-2 focus:ring-neutral-200 read-only:cursor-default read-only:hover:bg-transparent read-only:focus:ring-0"
            />
            <div className="mt-6 grid gap-3 border-y border-neutral-200 py-4 text-sm text-neutral-500 sm:grid-cols-[170px_1fr]">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Type
              </div>
              <div className="text-neutral-700">Document</div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Access
              </div>
              <div className="text-neutral-700">{canEdit ? "Can edit" : "Read only"}{currentRole ? ` · ${currentRole}` : ""}</div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Online
              </div>
              <div className="text-neutral-700">{activeUsersCount + 1} active</div>
              <div className="flex items-center gap-2">
                <MessageSquareText className="h-4 w-4" />
                Comments
              </div>
              <div className="text-neutral-700">{commentsOpen ? "Open" : "Hidden"}</div>
            </div>
          </div>
        </div>

        <div className="mx-auto min-h-[calc(100vh-24rem)] w-full max-w-3xl">
          {children}
        </div>
      </div>
    </div>
  )
}
