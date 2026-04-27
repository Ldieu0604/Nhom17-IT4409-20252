"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { MailCheck } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WorkspaceInvitationItem } from "@/lib/types"

type WorkspaceInvitationsPanelProps = {
  invitations: WorkspaceInvitationItem[]
}

function formatDateLabel(value: string) {
  return new Date(value).toLocaleString("vi-VN")
}

export function WorkspaceInvitationsPanel({ invitations: initialInvitations }: WorkspaceInvitationsPanelProps) {
  const router = useRouter()
  const [invitations, setInvitations] = useState(initialInvitations)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const sortedInvitations = useMemo(
    () =>
      [...invitations].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      ),
    [invitations]
  )

  useEffect(() => {
    setInvitations(initialInvitations)
  }, [initialInvitations])

  useEffect(() => {
    const intervalId = window.setInterval(async () => {
      try {
        const response = await fetch("/api/invitations/pending", {
          cache: "no-store",
        })

        if (!response.ok) {
          return
        }

        const payload = await response.json()
        setInvitations(payload.items ?? [])
      } catch {
        // silent polling
      }
    }, 5000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  async function handleAccept(invitationId: string) {
    try {
      setPendingId(invitationId)
      const response = await fetch(`/api/invitations/${invitationId}/accept`, {
        method: "POST",
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.message ?? "Không thể chấp nhận lời mời.")
      }

      setInvitations((current) => current.filter((invitation) => invitation.id !== invitationId))
      toast.success(payload?.message ?? "Đã tham gia workspace.")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể chấp nhận lời mời.")
    } finally {
      setPendingId(null)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <MailCheck className="h-5 w-5" />
            Lời mời tham gia workspace
          </CardTitle>
          <Badge variant="outline">{sortedInvitations.length}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {sortedInvitations.length > 0 ? (
          sortedInvitations.map((invitation) => (
            <div key={invitation.id} className="rounded-2xl border p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-medium">{invitation.workspaceName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Mời bởi {invitation.invitedBy} với vai trò {invitation.role}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>Tạo lúc: {formatDateLabel(invitation.createdAt)}</span>
                    <span>Hết hạn: {formatDateLabel(invitation.expiresAt)}</span>
                  </div>
                </div>

                <Button onClick={() => void handleAccept(invitation.id)} disabled={pendingId === invitation.id}>
                  Tham gia workspace
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Hiện tại bạn chưa có lời mời nào đang chờ.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
