import { Header } from "@/components/header"
import { RecentDocuments } from "@/components/recent-documents"
import { WorkspacesSection } from "@/components/workspaces-section"
import { CalendarSection } from "@/components/calendar-section"
import { ChatPanel } from "@/components/chat-panel"
import { ActivityFeed } from "@/components/activity-feed"
import { WorkspaceInvitationsPanel } from "@/components/workspace-invitations-panel"
import { getDashboardData } from "@/lib/data"

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="min-h-screen bg-background">
      <Header user={data.user} />
      <main className="container mx-auto space-y-8 px-4 py-8">
        <section className="grid gap-6 rounded-3xl border bg-card p-6 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-medium text-primary">Workspace Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Chào {data.user?.name ?? "bạn"}, đây là hệ thống thật của nhóm
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Dashboard này đang dùng cùng UI với landing demo, nhưng dữ liệu đã đi qua lớp server.
              Khi cấu hình MySQL + Clerk, các widget sẽ tự lấy dữ liệu thực từ Prisma.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border bg-background p-4">
              <p className="text-sm text-muted-foreground">Workspaces</p>
              <p className="mt-2 text-3xl font-bold">{data.workspaces.length}</p>
            </div>
            <div className="rounded-2xl border bg-background p-4">
              <p className="text-sm text-muted-foreground">Documents</p>
              <p className="mt-2 text-3xl font-bold">{data.recentDocuments.length}</p>
            </div>
            <div className="rounded-2xl border bg-background p-4">
              <p className="text-sm text-muted-foreground">Upcoming tasks</p>
              <p className="mt-2 text-3xl font-bold">{data.upcomingTasks.length}</p>
            </div>
          </div>
        </section>

        <RecentDocuments documents={data.recentDocuments} />
        <WorkspaceInvitationsPanel invitations={data.pendingInvitations ?? []} />
        <WorkspacesSection workspaces={data.workspaces} />

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <CalendarSection events={data.events} upcomingTasks={data.upcomingTasks} />
          <ActivityFeed activities={data.activities} />
        </div>
      </main>
      <ChatPanel activities={data.activities} />
    </div>
  )
}
