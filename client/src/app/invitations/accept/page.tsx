"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, Mail, XCircle } from "lucide-react"
import { acceptWorkspaceInvitation, previewWorkspaceInvitation, type WorkspaceInvitationPreview } from "@/services/workspace.service"
import { getStoredUser } from "@/services/auth.service"

type PageState = "loading" | "ready" | "accepting" | "accepted" | "error"

function dateLabel(value?: string | null) {
  return value ? new Date(value).toLocaleString("vi-VN") : ""
}

export default function AcceptInvitationPage() {
  const router = useRouter()
  const [token, setToken] = useState("")
  const [preview, setPreview] = useState<WorkspaceInvitationPreview | null>(null)
  const [state, setState] = useState<PageState>("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const rawToken = new URLSearchParams(window.location.search).get("token") || ""
    setToken(rawToken)
    if (!rawToken) {
      setState("error")
      setMessage("Link lời mời không hợp lệ.")
      return
    }

    previewWorkspaceInvitation(rawToken)
      .then((data) => {
        setPreview(data)
        setState(data.status === "PENDING" ? "ready" : "error")
        if (data.status !== "PENDING") setMessage(`Lời mời này đang ở trạng thái ${data.status.toLowerCase()}.`)
      })
      .catch((error) => {
        setState("error")
        setMessage(error instanceof Error ? error.message : "Không thể tải lời mời.")
      })
  }, [])

  async function acceptInvite() {
    if (!token || state === "accepting") return
    const user = getStoredUser()
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/invitations/accept?token=${token}`)}`)
      return
    }

    setState("accepting")
    setMessage("")
    try {
      const result = await acceptWorkspaceInvitation(token)
      setState("accepted")
      setMessage("Bạn đã tham gia workspace.")
      router.push(result.workspace.redirectUrl)
    } catch (error) {
      setState("error")
      setMessage(error instanceof Error ? error.message : "Không thể chấp nhận lời mời.")
    }
  }

  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10">
    <section className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm shadow-slate-100">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-primary">
        {state === "loading" || state === "accepting" ? <Loader2 className="h-5 w-5 animate-spin" /> : state === "error" ? <XCircle className="h-5 w-5" /> : state === "accepted" ? <CheckCircle2 className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
      </div>
      <h1 className="text-xl font-semibold tracking-tight">Lời mời workspace</h1>
      {preview ? <div className="mt-4 space-y-3 text-sm">
        <p><span className="text-slate-500">Workspace:</span> <strong>{preview.workspaceName}</strong></p>
        <p><span className="text-slate-500">Người mời:</span> {preview.invitedByName}</p>
        <p><span className="text-slate-500">Email:</span> {preview.email}</p>
        <p><span className="text-slate-500">Vai trò:</span> {preview.role}</p>
        <p><span className="text-slate-500">Hết hạn:</span> {dateLabel(preview.expiresAt)}</p>
      </div> : <p className="mt-4 text-sm text-slate-500">Đang kiểm tra lời mời...</p>}
      {message && <p className={`mt-4 text-sm ${state === "error" ? "text-red-600" : "text-emerald-700"}`}>{message}</p>}
      <div className="mt-6 flex gap-2">
        <button onClick={acceptInvite} disabled={state !== "ready"} className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">
          {state === "accepting" ? "Đang tham gia..." : "Chấp nhận lời mời"}
        </button>
        <Link href="/workspaces" className="rounded-md border px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Quay lại</Link>
      </div>
    </section>
  </main>
}
