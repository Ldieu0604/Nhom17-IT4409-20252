import { NextResponse } from "next/server"
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { clerkEnabled } from "@/lib/clerk-config"

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/workspaces(.*)",
  "/api/workspaces(.*)",
  "/api/documents(.*)",
  "/api/tasks(.*)",
  "/api/activity(.*)",
])

const clerkProxy = clerkMiddleware(async (auth: any, req: any) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export default function proxy(req: Request, evt: any) {
  if (!clerkEnabled) {
    return NextResponse.next()
  }

  return clerkProxy(req as any, evt)
}

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
}
