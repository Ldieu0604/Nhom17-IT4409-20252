import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, CheckCircle2, ShieldCheck, Users, Zap } from "lucide-react"

type AuthShellProps = {
  mode: "sign-in" | "sign-up"
  children: React.ReactNode
}

const bullets = [
  "Đăng nhập một lần, truy cập bảng điều khiển và workspace của nhóm.",
  "Tài khoản Clerk được đồng bộ sang User nội bộ để dùng với Prisma.",
  "Sẵn sàng bảo vệ route cho dashboard, editor và API riêng của hệ thống.",
]

export function AuthShell({ mode, children }: AuthShellProps) {
  const isSignIn = mode === "sign-in"

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden overflow-hidden border-r bg-sidebar px-10 py-12 text-sidebar-foreground lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.12),transparent_30%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-sidebar-foreground/80 hover:text-sidebar-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại trang chủ
              </Link>

              <Badge className="mt-10 bg-primary text-primary-foreground">Không gian làm việc cộng tác</Badge>

              <h1 className="mt-6 max-w-xl text-4xl font-bold leading-tight">
                {isSignIn
                  ? "Đăng nhập để tiếp tục vào bảng điều khiển cộng tác của nhóm."
                  : "Tạo tài khoản để bắt đầu workspace, bảng công việc và trình soạn thảo realtime."}
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-sidebar-foreground/75">
                Luồng xác thực này dùng Clerk để quản lý tài khoản, session và bảo vệ route. Sau khi đăng nhập, người
                dùng được nối sang hệ thống dữ liệu nội bộ bằng Prisma.
              </p>
            </div>

            <div className="space-y-4">
              <Card className="border-sidebar-border bg-sidebar-accent/20 text-sidebar-foreground shadow-none">
                <CardContent className="space-y-4 p-5">
                  {bullets.map((bullet) => (
                    <div key={bullet} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <p className="text-sm text-sidebar-foreground/80">{bullet}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/20 p-4">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-sm font-medium">Bảo vệ route</p>
                </div>
                <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/20 p-4">
                  <Users className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-sm font-medium">Truy cập workspace</p>
                </div>
                <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/20 p-4">
                  <Zap className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-sm font-medium">Sẵn sàng realtime</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Link>
              <Button variant="outline" asChild>
                <Link href={isSignIn ? "/sign-up" : "/sign-in"}>{isSignIn ? "Đăng ký" : "Đăng nhập"}</Link>
              </Button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
