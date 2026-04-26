"use client"

import { useEffect, useRef, useState } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type CollaborativeEditorShellProps = {
  documentId: string
  workspaceId: string
  title: string
  initialContent: any
}

export function CollaborativeEditorShell({
  documentId,
  workspaceId,
  title,
  initialContent,
}: CollaborativeEditorShellProps) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [documentTitle, setDocumentTitle] = useState(title)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Bắt đầu viết nội dung tài liệu...",
      }),
    ],
    content: initialContent,
  })

  const persistDocument = async (payload: { title?: string; content?: any }) => {
    try {
      setSaveState("saving")
      const response = await fetch(`/api/workspaces/${workspaceId}/documents/${documentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Không thể lưu tài liệu.")
      }

      setSaveState("saved")
    } catch {
      setSaveState("error")
    }
  }

  useEffect(() => {
    if (!editor) {
      return
    }

    const handleUpdate = () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }

      saveTimerRef.current = setTimeout(() => {
        void persistDocument({
          title: documentTitle,
          content: editor.getJSON(),
        })
      }, 800)
    }

    editor.on("update", handleUpdate)

    return () => {
      editor.off("update", handleUpdate)
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [editor, documentTitle, documentId, workspaceId])

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Input
                value={documentTitle}
                onChange={(event) => setDocumentTitle(event.target.value)}
                onBlur={() => void persistDocument({ title: documentTitle })}
                className="max-w-2xl text-lg font-semibold"
              />
              <Badge variant={saveState === "error" ? "destructive" : "secondary"}>
                {saveState === "saving"
                  ? "Đang lưu..."
                  : saveState === "saved"
                  ? "Đã lưu"
                  : saveState === "error"
                  ? "Lưu lỗi"
                  : "Sẵn sàng"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Bạn có thể nhập tay trực tiếp trong editor. Nội dung được tự động lưu về database.
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="min-h-[520px] rounded-2xl border bg-background p-4">
            <EditorContent editor={editor} className="prose prose-sm max-w-none dark:prose-invert" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tài liệu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="rounded-xl border p-3">
            Workspace: <span className="font-medium text-foreground">{workspaceId}</span>
          </div>
          <div className="rounded-xl border p-3">
            Document: <span className="font-medium text-foreground">{documentId}</span>
          </div>
          <div className="rounded-xl border p-3">
            Chế độ hiện tại: <span className="font-medium text-foreground">Nhập tay + autosave</span>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              void persistDocument({
                title: documentTitle,
                content: editor?.getJSON(),
              })
            }
          >
            Lưu thủ công
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
