"use client"

import Link from "next/link"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Clock, Copy, FileText, MoreVertical, Share2, Star, Trash2, Users } from "lucide-react"
import { DocumentCardItem } from "@/lib/types"

type RecentDocumentsProps = {
  documents: DocumentCardItem[]
}

function getFormatLabel(format?: DocumentCardItem["format"]) {
  if (format === "PDF") {
    return "PDF"
  }

  if (format === "DOCX") {
    return "DOCX"
  }

  return "Tài liệu"
}

export function RecentDocuments({ documents }: RecentDocumentsProps) {
  const [starredDocs, setStarredDocs] = useState<string[]>(
    documents.filter((document) => document.isStarred).map((document) => document.id)
  )

  const toggleStar = (id: string) => {
    setStarredDocs((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  return (
    <section id="documents" className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tài liệu gần đây</h2>
          <p className="text-sm text-muted-foreground">
            Các tài liệu được cập nhật gần nhất trong không gian làm việc của bạn.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">Xem tất cả</Link>
        </Button>
      </div>

      {documents.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText />
            </EmptyMedia>
            <EmptyTitle>Chưa có tài liệu nào</EmptyTitle>
            <EmptyDescription>
              Tạo tài liệu đầu tiên để bắt đầu cộng tác cùng nhóm.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/dashboard#workspaces">Mở workspace</Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => {
            const isStarred = starredDocs.includes(doc.id)

            return (
              <Card key={doc.id} className="group transition-all duration-200 hover:border-primary/50 hover:shadow-md">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="line-clamp-1 text-base font-semibold">
                        <Link href={`/workspaces/${doc.workspaceId}/documents/${doc.id}`} className="hover:text-primary">
                          {doc.title}
                        </Link>
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {getFormatLabel(doc.format)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{doc.workspaceName}</span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toggleStar(doc.id)}>
                        <Star className={`mr-2 h-4 w-4 ${isStarred ? "fill-chart-4 text-chart-4" : ""}`} />
                        {isStarred ? "Bỏ đánh dấu" : "Đánh dấu"}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 className="mr-2 h-4 w-4" />
                        Chia sẻ
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" />
                        Nhân bản
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{doc.updatedAtLabel}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="mr-1 flex items-center text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex -space-x-2">
                        {doc.collaborators.slice(0, 3).map((collaborator, index) => (
                          <Avatar key={`${doc.id}-${index}`} className="h-6 w-6 border-2 border-card">
                            <AvatarImage src={collaborator.avatar ?? ""} />
                            <AvatarFallback className="bg-secondary text-[10px]">{collaborator.initials}</AvatarFallback>
                          </Avatar>
                        ))}
                        {doc.collaborators.length > 3 && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-medium">
                            +{doc.collaborators.length - 3}
                          </div>
                        )}
                      </div>
                      {isStarred && <Star className="ml-2 h-4 w-4 fill-chart-4 text-chart-4" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}
