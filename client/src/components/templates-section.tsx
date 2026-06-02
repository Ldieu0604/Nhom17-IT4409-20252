"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, ListTodo, Table2 } from "lucide-react"
import { createDashboardDocument } from "@/services/document.service"

const templates = [
  { id: "blank", title: "Trang trống", description: "Bắt đầu với một trang trắng", icon: FileText },
  { id: "todo", title: "To-do List", description: "Danh sách công việc với checkbox", icon: ListTodo },
  { id: "task_table", title: "Bảng công việc", description: "Theo dõi công việc bằng bảng", icon: Table2 },
] as const

export function TemplatesSection() {
  const router = useRouter()
  const [creating, setCreating] = useState<string | null>(null)
  const [error, setError] = useState("")
  async function create(templateId: string) {
    try {
      setCreating(templateId); setError("")
      const document = await createDashboardDocument({ templateId })
      router.push(`/documents/${document.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tạo tài liệu.")
    } finally { setCreating(null) }
  }
  return <section className="py-12">
    <div className="mb-8 text-center"><h2 className="text-3xl font-bold">Bắt đầu dự án mới</h2><p className="mt-2 text-muted-foreground">Chọn nội dung tài liệu bạn muốn tạo</p></div>
    {error && <p className="mb-4 text-center text-sm text-red-600">{error}</p>}
    <div className="grid gap-4 sm:grid-cols-3">{templates.map((template) => {
      const Icon = template.icon
      return <button key={template.id} onClick={() => create(template.id)} disabled={creating !== null} className="rounded-xl border bg-white p-5 text-left transition hover:border-primary hover:shadow-sm disabled:opacity-60">
        <Icon className="h-6 w-6 text-primary" /><h3 className="mt-4 font-semibold">{template.title}</h3><p className="mt-1 text-sm text-muted-foreground">{template.description}</p><span className="mt-4 inline-block text-sm font-medium text-primary">{creating === template.id ? "Đang tạo..." : "Tạo mới"}</span>
      </button>
    })}</div>
  </section>
}
