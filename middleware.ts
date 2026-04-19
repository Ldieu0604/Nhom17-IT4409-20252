import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/workspaces(.*)",
  "/api/workspaces(.*)",
  "/api/documents(.*)",
  "/api/tasks(.*)",
  "/api/activity(.*)",
])

export default clerkMiddleware(async (auth: any, req: any) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
}
