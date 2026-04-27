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
    <div className="app-shell min-h-screen bg-background">
      <div className="accent-orb left-[-7rem] top-[8rem] h-56 w-56 bg-primary/18" />
      <div className="accent-orb right-[-5rem] top-[18rem] h-64 w-64 bg-chart-2/14" />

      <Header user={data.user} notificationCount={data.activities.length} />

      <main className="container mx-auto space-y-8 px-4 py-8">
        <section className="section-shell grid gap-6 p-6 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-semibold text-primary">Bảng điều khiển workspace</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
              Chào {data.user?.name ?? "bạn"}, đây là không gian làm việc của nhóm
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted-foreground">
              Tại đây bạn có thể theo dõi workspace, tài liệu, công việc sắp tới, lời
              mời tham gia và các hoạt động gần đây trong một giao diện sáng, rõ ràng
              và tối ưu cho làm việc hằng ngày.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="glass-card p-4">
              <p className="text-sm text-muted-foreground">Workspace</p>
              <p className="mt-2 text-3xl font-extrabold">{data.workspaces.length}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-sm text-muted-foreground">Tài liệu</p>
              <p className="mt-2 text-3xl font-extrabold">{data.recentDocuments.length}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-sm text-muted-foreground">Công việc sắp tới</p>
              <p className="mt-2 text-3xl font-extrabold">{data.upcomingTasks.length}</p>
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
