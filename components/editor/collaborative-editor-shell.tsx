"use client"

import { useEffect, useMemo, useState } from "react"
import { io, Socket } from "socket.io-client"
import * as Y from "yjs"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Collaboration from "@tiptap/extension-collaboration"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type CollaborativeEditorShellProps = {
  documentId: string
  workspaceId: string
  title: string
}

export function CollaborativeEditorShell({
  documentId,
  workspaceId,
  title,
}: CollaborativeEditorShellProps) {
  const [connectionState, setConnectionState] = useState<"offline" | "connecting" | "online">("offline")

  const ydoc = useMemo(() => new Y.Doc(), [])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      Placeholder.configure({
        placeholder: "Bắt đầu viết nội dung collaborative document...",
      }),
      Collaboration.configure({
        document: ydoc,
      }),
    ],
    content: "",
  })

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL

    if (!socketUrl) {
      setConnectionState("offline")
      return
    }

    setConnectionState("connecting")
    const socket: Socket = io(socketUrl, {
      path: "/socket.io",
      transports: ["websocket"],
      query: {
        workspaceId,
        documentId,
      },
    })

    socket.on("connect", () => {
      setConnectionState("online")
      socket.emit("document:join", { workspaceId, documentId })
    })

    socket.on("disconnect", () => {
      setConnectionState("offline")
    })

    return () => {
      socket.disconnect()
    }
  }, [documentId, workspaceId])

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl">{title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Tiptap + Yjs editor shell. Khi bật Socket.IO server, editor sẽ nhận realtime sync.
              </p>
            </div>
            <Badge variant={connectionState === "online" ? "default" : "secondary"}>
              {connectionState === "online"
                ? "Realtime connected"
                : connectionState === "connecting"
                ? "Connecting..."
                : "Offline fallback"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="min-h-[420px] rounded-2xl border bg-background p-4">
            <EditorContent editor={editor} className="prose prose-sm max-w-none dark:prose-invert" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Realtime checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="rounded-xl border p-3">
            Room: <span className="font-medium text-foreground">{workspaceId}</span>
          </div>
          <div className="rounded-xl border p-3">
            Document: <span className="font-medium text-foreground">{documentId}</span>
          </div>
          <div className="rounded-xl border p-3">
            Trạng thái hiện tại: <span className="font-medium text-foreground">{connectionState}</span>
          </div>
          <Button variant="outline" className="w-full">
            Lưu snapshot thủ công
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
