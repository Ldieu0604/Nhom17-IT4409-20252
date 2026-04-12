"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  MessageSquareText,
  MousePointer2,
  Sparkles,
  Users,
  Zap,
} from "lucide-react"

const onlineUsers = [
  { name: "Nguyễn A", initials: "NA", color: "bg-primary" },
  { name: "Trần B", initials: "TB", color: "bg-emerald-500" },
  { name: "Lê C", initials: "LC", color: "bg-orange-500" },
  { name: "Phạm D", initials: "PD", color: "bg-violet-500" },
]

const quickStats = [
  { icon: Zap, text: "Đồng bộ theo thời gian thực" },
  { icon: Users, text: "Làm việc nhóm trên cùng một tài liệu" },
  { icon: MessageSquareText, text: "Bình luận và trao đổi ngay trong workspace" },
]

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-12 md:py-20">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-10 top-40 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <Badge
            variant="secondary"
            className="mb-5 gap-2 rounded-full px-4 py-2 text-sm font-medium"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            Giải pháp cộng tác cho nhóm dự án hiện đại
          </Badge>

          <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Viết, giao việc và trao đổi
            <span className="block text-primary">
              trong cùng một workspace
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground md:text-xl">
            CoWorkHub giúp nhóm của bạn cộng tác trên tài liệu, bảng việc làm,
            lịch và trò chuyện theo thời gian thực. Mọi thay đổi được cập nhật
            ngay lập tức, rõ ràng và trực quan.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button size="lg" className="gap-2 px-8">
              Trải nghiệm ngay
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="px-8">
              Xem mô phỏng hệ thống
            </Button>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex -space-x-3">
              {onlineUsers.map((user) => (
                <Avatar
                  key={user.name}
                  className={`h-10 w-10 border-2 border-background ${user.color}`}
                >
                  <AvatarFallback className="bg-transparent text-xs font-semibold text-white">
                    {user.initials}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">
                4 thành viên đang cộng tác
              </p>
              <p className="text-sm text-muted-foreground">
                Cập nhật trực tiếp, không cần tải lại trang
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:max-w-xl">
            {quickStats.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-xl border bg-background/80 px-4 py-3 backdrop-blur"
              >
                <div className="rounded-full bg-primary/10 p-2">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-3xl border bg-card shadow-2xl shadow-primary/10">
            <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-400/70" />
                <div className="h-3 w-3 rounded-full bg-yellow-400/70" />
                <div className="h-3 w-3 rounded-full bg-green-400/70" />
              </div>

              <div className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
                coworkhub.vn/workspace/team-alpha
              </div>
            </div>

            <div className="grid gap-4 bg-muted/20 p-4 md:grid-cols-[240px_1fr]">
              <div className="rounded-2xl border bg-card p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Team Alpha</h3>
                  <Badge variant="secondary" className="text-[10px]">
                    Live
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                    Tài liệu dự án
                  </div>
                  <div className="rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
                    Kanban công việc
                  </div>
                  <div className="rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
                    Lịch sprint
                  </div>
                  <div className="rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
                    Thảo luận nhóm
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border bg-muted/40 p-3">
                  <p className="text-xs font-medium text-foreground">
                    Tiến độ sprint
                  </p>
                  <div className="mt-3 h-2 rounded-full bg-muted">
                    <div className="h-2 w-[72%] rounded-full bg-primary" />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    18/25 công việc đã hoàn thành
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border bg-card p-5">
                  <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Tài liệu đang chỉnh sửa
                      </p>
                      <h3 className="text-lg font-semibold">
                        Kế hoạch triển khai Sprint 4
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                      </span>
                      4 người đang online
                    </div>
                  </div>

                  <div className="relative mt-5 space-y-4 text-sm leading-7 text-muted-foreground">
                    <p>
                      Mục tiêu của sprint này là hoàn thiện giao diện workspace,
                      khu vực tài liệu cộng tác và luồng quản lý nhiệm vụ cho
                      nhóm người dùng.
                    </p>
                    <p>
                      Nhóm cần ưu tiên trải nghiệm thời gian thực, hiển thị rõ
                      người đang hoạt động, cập nhật thay đổi tức thời và dễ
                      theo dõi tiến độ công việc.
                    </p>
                    <p>
                      Ngoài ra, cần chuẩn bị một bản demo trực quan để người xem
                      có thể cảm nhận ngay cách hệ thống hỗ trợ làm việc nhóm.
                    </p>

                    <div className="absolute left-[38%] top-[18%] flex items-start">
                      <MousePointer2 className="h-4 w-4 -rotate-12 fill-primary text-primary" />
                      <span className="ml-1 rounded bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                        Nguyễn A
                      </span>
                    </div>

                    <div className="absolute right-[18%] top-[52%] flex items-start">
                      <MousePointer2 className="h-4 w-4 -rotate-12 fill-emerald-500 text-emerald-500" />
                      <span className="ml-1 rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] text-white">
                        Trần B
                      </span>
                    </div>

                    <div className="rounded-2xl border bg-amber-50 p-3 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                      <div className="flex items-start gap-2">
                        <MessageSquareText className="mt-0.5 h-4 w-4" />
                        <div>
                          <p className="text-xs font-semibold">
                            Bình luận mới từ Lê C
                          </p>
                          <p className="text-xs">
                            “Cần nhấn mạnh phần realtime collaboration trong
                            trang chủ để bài thuyết trình thuyết phục hơn.”
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border bg-card p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold">Hoạt động gần đây</p>
                    </div>

                    <div className="space-y-3 text-xs text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-emerald-500" />
                        <span>Phạm D vừa cập nhật deadline cho Sprint 4</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-emerald-500" />
                        <span>Nguyễn A đã chỉnh sửa tài liệu mô tả hệ thống</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-emerald-500" />
                        <span>Trần B chuyển task UI Dashboard sang Done</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-card p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold">Trạng thái nhóm</p>
                    </div>

                    <div className="space-y-3 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
                        <span>Workspace Sync</span>
                        <span className="font-medium text-emerald-600">
                          Stable
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
                        <span>Document Auto-save</span>
                        <span className="font-medium text-emerald-600">
                          Every 5s
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
                        <span>Task Progress</span>
                        <span className="font-medium text-primary">72%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-4 -left-4 hidden rounded-2xl border bg-background/95 px-4 py-3 shadow-lg backdrop-blur md:block">
            <p className="text-xs font-semibold text-foreground">
              Auto-save thành công
            </p>
            <p className="text-xs text-muted-foreground">Vừa cập nhật 2 giây trước</p>
          </div>

          <div className="absolute -right-4 top-10 hidden rounded-2xl border bg-background/95 px-4 py-3 shadow-lg backdrop-blur md:block">
            <p className="text-xs font-semibold text-foreground">
              3 bình luận chưa đọc
            </p>
            <p className="text-xs text-muted-foreground">
              Tập trung vào phần demo realtime
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}