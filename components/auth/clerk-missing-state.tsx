import Link from "next/link"
import { AlertTriangle, KeyRound } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type ClerkMissingStateProps = {
  mode: "sign-in" | "sign-up"
}

export function ClerkMissingState({ mode }: ClerkMissingStateProps) {
  return (
    <Card className="border-amber-200 bg-amber-50 shadow-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-amber-100 p-2 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-amber-900">Chưa cấu hình Clerk</CardTitle>
            <CardDescription className="text-amber-800/80">
              Trang {mode === "sign-in" ? "đăng nhập" : "đăng ký"} đã sẵn sàng nhưng cần API keys để hoạt động.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-amber-900">
        <div className="rounded-xl border border-amber-200 bg-white/70 p-4">
          <p className="font-medium">Điền vào file `.env`:</p>
          <div className="mt-2 space-y-1 font-mono text-xs">
            <p>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...</p>
            <p>CLERK_SECRET_KEY=...</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="https://dashboard.clerk.com/" target="_blank" rel="noreferrer">
              <KeyRound className="mr-2 h-4 w-4" />
              Mở Clerk Dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={mode === "sign-in" ? "/sign-up" : "/sign-in"}>
              {mode === "sign-in" ? "Sang đăng ký" : "Sang đăng nhập"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
