"use client"

import Link from "next/link"
import { ExternalLink, FileDown, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type PdfDocumentViewerProps = {
  title: string
  fileUrl: string
  fileName?: string | null
}

export function PdfDocumentViewer({ title, fileUrl, fileName }: PdfDocumentViewerProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Tài liệu PDF được mở ở chế độ xem trên web.
              </p>
            </div>
            <Badge variant="secondary">PDF</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-hidden rounded-2xl border bg-background">
            <iframe
              src={fileUrl}
              title={title}
              className="h-[72vh] w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thông tin tài liệu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="rounded-xl border p-3">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <FileText className="h-4 w-4" />
              PDF đính kèm
            </div>
            <p className="mt-2 break-all">{fileName ?? title}</p>
          </div>

          <Button className="w-full" asChild>
            <Link href={fileUrl} target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              Mở ở tab mới
            </Link>
          </Button>

          <Button variant="outline" className="w-full" asChild>
            <Link href={fileUrl} download>
              <FileDown className="mr-2 h-4 w-4" />
              Tải file PDF
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
