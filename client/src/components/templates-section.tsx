"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { createDashboardDocument } from "@/services/document.service"

export function TemplatesSection() {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  async function createBlankDocument() {
    try {
      setCreating(true)
      setError("")
      const document = await createDashboardDocument({ templateId: "blank" })
      router.push(`/documents/${document.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tạo tài liệu.")
    } finally {
      setCreating(false)
    }
  }

  return (
    <section className="flex flex-col items-center pb-8 pt-0">
      {error && <p className="mb-4 text-center text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={createBlankDocument}
        disabled={creating}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Plus className="h-4 w-4" />
        {creating ? "Đang tạo..." : "Tạo trang mới"}
      </button>
    </section>
  )
}
