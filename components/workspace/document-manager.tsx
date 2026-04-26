"use client"

import Link from "next/link"
import { ChangeEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Plus, TimerReset, Upload } from "lucide-react"
import { DocumentCardItem } from "@/lib/types"

type DocumentManagerProps = {
  workspaceId: string
  documents: DocumentCardItem[]
}

export function DocumentManager({ workspaceId, documents }: DocumentManagerProps) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [fileName, setFileName] = useState("")
  const [initialText, setInitialText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setTitle("")
    setFileName("")
    setInitialText("")
  }

  const handleCreateDocument = async () => {
    if (!title.trim()) {
      toast.error("Tiêu đề tài liệu là bắt buộc.")
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/workspaces/${workspaceId}/documents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, initialText }),
      })

      if (!response.ok) {
        throw new Error("Không thể tạo tài liệu.")
      }

      const payload = await response.json()
      toast.success("Đã tạo tài liệu mới.")
      resetForm()

      if (payload?.item?.id) {
        router.push(`/workspaces/${workspaceId}/documents/${payload.item.id}`)
        return
      }

      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!file.name.endsWith(".txt") && !file.name.endsWith(".md")) {
      toast.error("Hiện tại chỉ hỗ trợ import file .txt hoặc .md")
      return
    }

    const text = await file.text()
    setInitialText(text)
    setFileName(file.name)

    if (!title.trim()) {
      const inferredTitle = file.name.replace(/\.(txt|md)$/i, "")
      setTitle(inferredTitle)
    }

    toast.success("Đã nạp nội dung file vào tài liệu mới.")
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="border-primary/30 shadow-md shadow-primary/5">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Tạo tài liệu mới</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="document-title">Tiêu đề tài liệu</Label>
            <Input
              id="document-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ví dụ: Kế hoạch triển khai Sprint 5"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="document-upload">Import file .txt / .md</Label>
            <Input id="document-upload" type="file" accept=".txt,.md,text/plain,text/markdown" onChange={handleFileImport} />
            {fileName ? (
              <p className="text-xs text-muted-foreground">Đã nạp file: {fileName}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Bạn có thể nhập tay sau khi tạo tài liệu hoặc import nhanh từ file văn bản.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="document-seed">Nội dung khởi tạo</Label>
            <textarea
              id="document-seed"
              className="min-h-32 rounded-md border bg-background px-3 py-2 text-sm"
              value={initialText}
              onChange={(event) => setInitialText(event.target.value)}
              placeholder="Nhập tay nội dung ban đầu hoặc import từ file..."
            />
          </div>

          <div className="grid gap-3 pt-2">
            <Button onClick={handleCreateDocument} disabled={isSubmitting} className="gap-2">
              <Plus className="h-4 w-4" />
              {isSubmitting ? "Đang tạo..." : "Tạo và mở editor"}
            </Button>
            <Button variant="outline" onClick={resetForm} className="gap-2">
              <TimerReset className="h-4 w-4" />
              Làm mới
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Tài liệu trong workspace</CardTitle>
            <Badge variant="secondary" className="gap-1">
              <Upload className="h-3.5 w-3.5" />
              Nhập tay hoặc import file
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.length > 0 ? (
            documents.map((document) => (
              <Link
                key={document.id}
                href={`/workspaces/${workspaceId}/documents/${document.id}`}
                className="block rounded-xl border p-4 transition-colors hover:border-primary/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{document.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Cập nhật {document.updatedAtLabel}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Editor</Badge>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              Workspace này chưa có tài liệu nào.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
