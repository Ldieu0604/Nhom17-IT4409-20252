"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Clock, FileText } from "lucide-react"
import { listDashboardDocuments, type DashboardDocument } from "@/services/document.service"
import { formatDocumentDate } from "@/components/dashboard/dashboardUtils"

export function RecentDocuments() {
  const [documents, setDocuments] = useState<DashboardDocument[]>([])
  useEffect(() => { listDashboardDocuments({ owner: "me", sort: "openedAt", order: "desc", limit: 2 }).then(setDocuments).catch(() => setDocuments([])) }, [])
  return <section className="py-8">
    <div className="mb-6 flex items-center justify-between"><div><h2 className="text-2xl font-bold">Tài liệu gần đây</h2><p className="text-sm text-muted-foreground">Các tài liệu bạn đã truy cập gần đây</p></div><Link href="/dashboard" className="rounded-md border px-3 py-2 text-sm hover:border-primary">Xem tất cả</Link></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{documents.map((document) => <Link href={`/documents/${document.id}`} key={document.id} className="rounded-xl border bg-white p-5 transition hover:border-primary/50 hover:shadow-sm"><FileText className="h-5 w-5 text-primary" /><h3 className="mt-3 truncate font-semibold">{document.title}</h3><p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" />{formatDocumentDate(document.openedAt || document.updatedAt)}</p></Link>)}</div>
    {documents.length === 0 && <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-muted-foreground">Chưa có tài liệu gần đây. <Link href="/dashboard" className="text-primary hover:underline">Tạo tài liệu mới</Link></div>}
  </section>
}
