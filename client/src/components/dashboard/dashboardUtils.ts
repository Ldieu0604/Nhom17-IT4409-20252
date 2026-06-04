import { DashboardDocument, DashboardTemplate } from "@/services/document.service"

export const FALLBACK_TEMPLATES: DashboardTemplate[] = [
  { id: "blank", title: "Trang trống", subtitle: "Bắt đầu với một trang trắng", accent: "primary", preview: "blank" },
  { id: "todo", title: "To-do List", subtitle: "Danh sách công việc với checkbox", accent: "sky", preview: "todo" },
  { id: "task_table", title: "Bảng công việc", subtitle: "Theo dõi công việc bằng bảng", accent: "amber", preview: "task_table" },
]
export const ESSENTIAL_TEMPLATE_IDS = new Set(["blank", "todo", "task_table"])

export const ACCENT_CLASSES: Record<string, { bar: string; soft: string; text: string; ring: string }> = {
  primary: { bar: "bg-primary", soft: "bg-primary/10", text: "text-primary", ring: "group-hover:border-primary" },
  blue: { bar: "bg-primary", soft: "bg-primary/10", text: "text-primary", ring: "group-hover:border-primary" },
  emerald: { bar: "bg-primary", soft: "bg-primary/10", text: "text-primary", ring: "group-hover:border-primary" },
  sky: { bar: "bg-sky-500", soft: "bg-sky-50", text: "text-sky-700", ring: "group-hover:border-sky-500" },
  amber: { bar: "bg-amber-500", soft: "bg-amber-50", text: "text-amber-700", ring: "group-hover:border-amber-500" },
  rose: { bar: "bg-rose-500", soft: "bg-rose-50", text: "text-rose-700", ring: "group-hover:border-rose-500" },
  violet: { bar: "bg-violet-500", soft: "bg-violet-50", text: "text-violet-700", ring: "group-hover:border-violet-500" },
  slate: { bar: "bg-slate-500", soft: "bg-slate-50", text: "text-slate-700", ring: "group-hover:border-slate-500" },
}

export function getInitials() {
  if (typeof window === "undefined") return "T"

  const rawUser = localStorage.getItem("user")
  if (rawUser) {
    try {
      const user = JSON.parse(rawUser)
      const initials = `${user.firstname?.[0] || ""}${user.lastname?.[0] || ""}`.toUpperCase()
      return initials || user.username?.slice(0, 1).toUpperCase() || "T"
    } catch {
      return "T"
    }
  }

  return "T"
}

export function getUserAvatar() {
  if (typeof window === "undefined") return null

  const rawUser = localStorage.getItem("user")
  if (rawUser) {
    try {
      const user = JSON.parse(rawUser)
      return user?.avatar || null
    } catch {
      return null
    }
  }

  return null
}

export function formatDocumentDate(value: string) {
  if (value.startsWith("Đã mở") || value.includes("thg")) return value

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Vừa mở"

  return new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function isUserAuthenticated() {
  if (typeof window === "undefined") return false
  const raw = localStorage.getItem("auth-session")
  if (!raw) return false
  try {
    const session = JSON.parse(raw)
    return !!(session?.accessToken || session?.token)
  } catch {
    return false
  }
}

export type OwnerFilter = "all" | "me" | "shared"
export type SortMode = "openedAt" | "title"
export type ViewMode = "grid" | "list"
