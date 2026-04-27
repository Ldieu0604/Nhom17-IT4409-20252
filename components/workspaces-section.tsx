"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { ExternalLink, FileText, FolderOpen, LayoutGrid, MoreHorizontal, Plus, Settings, UserPlus, Users } from "lucide-react"
import { WorkspaceCardItem } from "@/lib/types"

type WorkspacesSectionProps = {
  workspaces: WorkspaceCardItem[]
}

export function WorkspacesSection({ workspaces }: WorkspacesSectionProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: "",
    description: "",
    invitedEmails: "",
  })

  const handleCreateWorkspace = async () => {
    if (!form.name.trim()) {
      toast.error("Tên workspace là bắt buộc.")
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        throw new Error("Không thể tạo workspace.")
      }

      toast.success("Workspace đã được tạo.")
      setForm({ name: "", description: "", invitedEmails: "" })
      setIsCreateDialogOpen(false)
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="workspaces" className="py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Workspace của bạn</h2>
          <p className="text-sm text-muted-foreground">Theo dõi các không gian làm việc, tiến độ và thành viên trong nhóm.</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Tạo workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo workspace mới</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="workspace-name">Tên workspace</Label>
                <Input
                  id="workspace-name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ví dụ: Nhóm phát triển sản phẩm"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="workspace-desc">Mô tả</Label>
                <Textarea
                  id="workspace-desc"
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Mô tả ngắn về mục tiêu và phạm vi của workspace..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="workspace-members">Mời thành viên bằng email</Label>
                <Input
                  id="workspace-members"
                  value={form.invitedEmails}
                  onChange={(event) => setForm((current) => ({ ...current, invitedEmails: event.target.value }))}
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleCreateWorkspace} disabled={isSubmitting}>
                {isSubmitting ? "Đang tạo..." : "Tạo workspace"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {workspaces.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderOpen />
            </EmptyMedia>
            <EmptyTitle>Bạn chưa có workspace nào</EmptyTitle>
            <EmptyDescription>Tạo workspace đầu tiên để bắt đầu quản lý công việc, tài liệu và cộng tác nhóm.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setIsCreateDialogOpen(true)}>Tạo workspace</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {workspaces.map((workspace) => {
            const progress = workspace.tasksTotal ? Math.round((workspace.tasksCompleted / workspace.tasksTotal) * 100) : 0

            return (
              <Link key={workspace.id} href={`/workspaces/${workspace.id}`} className="block">
                <Card className="group cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${workspace.color}`}>
                          <FolderOpen className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="line-clamp-1 text-lg">{workspace.name}</CardTitle>
                          <CardDescription className="line-clamp-2">{workspace.description}</CardDescription>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100"
                            onClick={(event) => event.preventDefault()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/workspaces/${workspace.id}`}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Mở workspace
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Mời thành viên
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                            <Settings className="mr-2 h-4 w-4" />
                            Cài đặt
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onSelect={(event) => event.preventDefault()}>
                            Rời khỏi workspace
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>{workspace.documentsCount} tài liệu</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <LayoutGrid className="h-4 w-4" />
                        <span>
                          {workspace.tasksCompleted}/{workspace.tasksTotal} công việc
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tiến độ</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {workspace.members.slice(0, 4).map((member, index) => (
                            <Avatar key={`${workspace.id}-${index}`} className="h-7 w-7 border-2 border-card">
                              <AvatarImage src={member.avatar ?? ""} />
                              <AvatarFallback className="bg-secondary text-[10px]">{member.initials}</AvatarFallback>
                            </Avatar>
                          ))}
                          {workspace.members.length > 4 && (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-medium">
                              +{workspace.members.length - 4}
                            </div>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          <Users className="mr-1 h-3 w-3" />
                          {workspace.members.length}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{workspace.lastActivity}</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
