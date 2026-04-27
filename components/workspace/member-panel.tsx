"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { UserPlus, Users } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type MemberItem = {
  id?: string
  membershipId?: string
  name: string
  email?: string
  initials: string
  role: string
  joinedAt?: string
}

type InvitationItem = {
  id: string
  email: string
  role: string
  status: string
  expiresAt: string
  createdAt: string
  invitedBy?: string
}

type MemberPanelProps = {
  workspaceId: string
  members: MemberItem[]
  invitations?: InvitationItem[]
  currentUserRole?: string
  sectionId?: string
}

const roleOptions = ["MEMBER", "VIEWER", "ADMIN"] as const

function formatDateLabel(value?: string) {
  if (!value) {
    return "Không rõ"
  }

  return new Date(value).toLocaleString("vi-VN")
}

export function MemberPanel({
  workspaceId,
  members: initialMembers,
  invitations: initialInvitations = [],
  currentUserRole = "MEMBER",
  sectionId,
}: MemberPanelProps) {
  const router = useRouter()
  const [members, setMembers] = useState(initialMembers)
  const [invitations, setInvitations] = useState(initialInvitations)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<(typeof roleOptions)[number]>("MEMBER")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const canManageMembers = currentUserRole === "OWNER" || currentUserRole === "ADMIN"

  useEffect(() => {
    setMembers(initialMembers)
  }, [initialMembers])

  useEffect(() => {
    setInvitations(initialInvitations)
  }, [initialInvitations])

  useEffect(() => {
    const intervalId = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
          cache: "no-store",
        })

        if (!response.ok) {
          return
        }

        const payload = await response.json()
        setMembers(payload.members ?? [])
        setInvitations(payload.invitations ?? [])
      } catch {
        // silent polling
      }
    }, 5000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [workspaceId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextEmail = email.trim()
    if (!nextEmail || !canManageMembers) {
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: nextEmail,
          role,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.message ?? "Không thể thêm thành viên.")
      }

      if (payload?.mode === "added" || payload?.mode === "existing") {
        const member = payload.member as MemberItem
        setMembers((current) => {
          const withoutSame = current.filter((item) => item.id !== member.id)
          return [...withoutSame, member].sort((a, b) => a.name.localeCompare(b.name, "vi"))
        })
        toast.success(
          payload?.mode === "existing"
            ? payload?.message ?? "Tài khoản đã có trong workspace."
            : "Đã thêm thành viên vào workspace."
        )
      }

      if (payload?.mode === "invited") {
        const invitation = payload.invitation as InvitationItem
        setInvitations((current) => {
          const withoutSame = current.filter((item) => item.id !== invitation.id)
          return [invitation, ...withoutSame]
        })
        toast.success(payload?.message ?? "Đã tạo lời mời tham gia workspace.")
      }

      setEmail("")
      setRole("MEMBER")
      setIsDialogOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể thêm thành viên.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card id={sectionId}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="h-5 w-5" />
              Thành viên workspace
            </CardTitle>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={canManageMembers ? "default" : "secondary"}>
              Vai trò hiện tại: {currentUserRole}
            </Badge>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!canManageMembers}>
                  <UserPlus className="h-4 w-4" />
                  Thêm thành viên
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Thêm thành viên vào workspace</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Email thành viên</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="tennguoidung@email.com"
                      disabled={!canManageMembers || isSubmitting}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Vai trò</label>
                    <select
                      className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                      value={role}
                      onChange={(event) => setRole(event.target.value as (typeof roleOptions)[number])}
                      disabled={!canManageMembers || isSubmitting}
                    >
                      {roleOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={!canManageMembers || isSubmitting || !email.trim()}>
                      <UserPlus className="h-4 w-4" />
                      Xác nhận thêm
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!canManageMembers && (
          <div className="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
            Chỉ `OWNER` hoặc `ADMIN` mới được thêm thành viên.
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Danh sách thành viên</h3>
            <Badge variant="outline">{members.length} người</Badge>
          </div>

          {members.length > 0 ? (
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.membershipId ?? member.id ?? member.email} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                        {member.initials}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email ?? "Chưa có email"}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{member.role}</Badge>
                      <Badge variant="outline">Tham gia: {formatDateLabel(member.joinedAt)}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              Workspace này chưa có thành viên nào.
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Lời mời đang chờ</h3>
            <Badge variant="outline">{invitations.length}</Badge>
          </div>

          {invitations.length > 0 ? (
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="rounded-xl border border-dashed p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Mời bởi {invitation.invitedBy ?? "Không rõ"} vào {formatDateLabel(invitation.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{invitation.role}</Badge>
                      <Badge variant="outline">Hết hạn: {formatDateLabel(invitation.expiresAt)}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              Hiện chưa có lời mời nào đang chờ.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
