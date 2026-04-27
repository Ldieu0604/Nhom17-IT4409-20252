"use client"

import Link from "next/link"
import { ChangeEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNowStrict } from "date-fns"
import { vi } from "date-fns/locale"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, FileType, Plus, TimerReset, Upload } from "lucide-react"
import { DocumentCardItem } from "@/lib/types"

type DocumentManagerProps = {
  workspaceId: string
  documents: DocumentCardItem[]
}

function getFormatLabel(format?: DocumentCardItem["format"]) {
  if (format === "PDF") {
    return "PDF"
  }

  if (format === "DOCX") {
    return "DOCX"
  }

  return "Trình soạn thảo"
}

function toRelativeDate(value: string) {
  return formatDistanceToNowStrict(new Date(value), {
    addSuffix: true,
    locale: vi,
  })
}

export function DocumentManager({ workspaceId, documents }: DocumentManagerProps) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState("")
  const [fileFormat, setFileFormat] = useState<"PDF" | "DOCX" | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [documentItems, setDocumentItems] = useState(documents)

  useEffect(() => {
    setDocumentItems(documents)
  }, [documents])

  useEffect(() => {
    const intervalId = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/documents`, {
          cache: "no-store",
        })

        if (!response.ok) {
          return
        }

        const payload = await response.json()
        setDocumentItems(
          (payload.items ?? []).map((item: any) => ({
            ...item,
            updatedAtLabel: toRelativeDate(item.updatedAtLabel),
          }))
        )
      } catch {
        // silent polling
      }
    }, 5000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [workspaceId])

  const resetForm = () => {
    setTitle("")
    setSelectedFile(null)
    setFileName("")
    setFileFormat(null)
  }

  const handleCreateDocument = async () => {
    if (!title.trim()) {
      toast.error("Tiêu đề tài liệu là bắt buộc.")
      return
    }

    if (!selectedFile) {
      toast.error("Bạn cần chọn file PDF hoặc DOCX.")
      return
    }

    try {
      setIsSubmitting(true)
      const formData = new FormData()
      formData.append("title", title)
      formData.append("file", selectedFile)

      const response = await fetch(`/api/workspaces/${workspaceId}/documents`, {
        method: "POST",
        body: formData,
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.message ?? "Không thể tạo tài liệu.")
      }

      toast.success(
        fileFormat === "PDF"
          ? "Đã tải lên tài liệu PDF."
          : "Đã nhập nội dung DOCX và mở trình soạn thảo."
      )
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

  const handleFileImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const extension = file.name.split(".").pop()?.toLowerCase()
    if (extension !== "pdf" && extension !== "docx") {
      toast.error("Chỉ hỗ trợ file PDF hoặc DOCX.")
      return
    }

    setSelectedFile(file)
    setFileName(file.name)
    setFileFormat(extension === "pdf" ? "PDF" : "DOCX")

    if (!title.trim()) {
      setTitle(file.name.replace(/\.(pdf|docx)$/i, ""))
    }

    toast.success(
      extension === "pdf"
        ? "Đã chọn file PDF. Tài liệu sẽ mở ở chế độ xem."
        : "Đã chọn file DOCX. Nội dung sẽ được chuyển vào trình soạn thảo."
    )
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="border-primary/20 shadow-md shadow-primary/5">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Tạo tài liệu từ PDF hoặc DOCX</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="document-title">Tiêu đề tài liệu</Label>
            <Input
              id="document-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ví dụ: Đặc tả hệ thống Sprint 5"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="document-upload">Chọn file PDF hoặc DOCX</Label>
            <Input
              id="document-upload"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileImport}
            />
            {fileName ? (
              <div className="rounded-xl border bg-secondary/50 p-3 text-xs text-muted-foreground">
                <p>
                  Đã chọn file: <span className="font-medium text-foreground">{fileName}</span>
                </p>
                <p className="mt-1">
                  Chế độ xử lý:{" "}
                  <span className="font-medium text-foreground">
                    {fileFormat === "PDF"
                      ? "Xem PDF trên web"
                      : "Chuyển nội dung DOCX vào trình soạn thảo"}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                PDF sẽ mở ở chế độ xem. DOCX sẽ được nhập vào trình soạn thảo để chỉnh sửa trực tiếp trên web.
              </p>
            )}
          </div>

          <div className="grid gap-3 pt-2">
            <Button onClick={handleCreateDocument} disabled={isSubmitting} className="gap-2">
              <Plus className="h-4 w-4" />
              {isSubmitting ? "Đang tạo..." : "Tạo tài liệu"}
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
              Chỉ nhận PDF và DOCX
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {documentItems.length > 0 ? (
            documentItems.map((document) => (
              <Link
                key={document.id}
                href={`/workspaces/${workspaceId}/documents/${document.id}`}
                className="block rounded-xl border p-4 transition-colors hover:border-primary/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      {document.format === "PDF" ? (
                        <FileType className="h-4 w-4 text-primary" />
                      ) : (
                        <FileText className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{document.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">Cập nhật {document.updatedAtLabel}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{getFormatLabel(document.format)}</Badge>
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
