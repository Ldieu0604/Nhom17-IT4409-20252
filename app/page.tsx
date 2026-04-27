import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { TemplatesSection } from "@/components/templates-section"
import { RecentDocuments } from "@/components/recent-documents"
import { WorkspacesSection } from "@/components/workspaces-section"
import { CalendarSection } from "@/components/calendar-section"
import { ChatPanel } from "@/components/chat-panel"
import { ActivityFeed } from "@/components/activity-feed"
import { WorkspaceInvitationsPanel } from "@/components/workspace-invitations-panel"
import { getDashboardData } from "@/lib/data"

export default async function Home() {
  const data = await getDashboardData()
  const signedIn = Boolean(data.user)

  return (
    <div className="app-shell flex min-h-screen flex-col bg-background">
      <div className="accent-orb left-[-8rem] top-[7rem] h-64 w-64 bg-primary/20" />
      <div className="accent-orb right-[-7rem] top-[20rem] h-72 w-72 bg-chart-3/18" />

      <Header
        user={data.user}
        notificationCount={data.activities.length}
        searchPlaceholder={
          signedIn ? "Tìm kiếm tài liệu, workspace, thành viên..." : "Khám phá workspace và tài liệu..."
        }
      />

      <main className="flex-1">
        <div className="container mx-auto px-4">
          <HeroSection
            signedIn={signedIn}
            primaryActionHref={signedIn ? "/dashboard" : "/sign-up"}
            primaryActionLabel={signedIn ? "Mở bảng điều khiển" : "Bắt đầu ngay"}
            secondaryActionHref={signedIn ? "#workspaces" : "/sign-in"}
            secondaryActionLabel={signedIn ? "Đến workspace của bạn" : "Đăng nhập"}
          />

          {signedIn ? (
            <>
              <section className="section-shell animated-sheen grid gap-6 p-6 md:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <p className="text-sm font-semibold text-primary">Trang chủ tương tác</p>
                  <h1 className="mt-2 max-w-3xl text-3xl font-extrabold tracking-tight md:text-4xl">
                    Chào {data.user?.name ?? "bạn"}, mọi nội dung làm việc đang ở ngay đây
                  </h1>
                  <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted-foreground">
                    Trang chủ hiện đã dùng dữ liệu thật từ hệ thống. Bạn có thể mở tài liệu,
                    tạo workspace, xem lời mời, theo dõi hoạt động và tiếp tục trò chuyện
                    ngay trong cùng một trải nghiệm liền mạch.
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

              <div className="space-y-8 py-8">
                <RecentDocuments documents={data.recentDocuments} />
                <WorkspaceInvitationsPanel invitations={data.pendingInvitations ?? []} />
                <WorkspacesSection workspaces={data.workspaces} />

                <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
                  <CalendarSection events={data.events} upcomingTasks={data.upcomingTasks} />
                  <ActivityFeed activities={data.activities} />
                </div>
              </div>
            </>
          ) : (
            <>
              <FeaturesSection />
              <TemplatesSection />
            </>
          )}
        </div>
      </main>

      <Footer />
      {signedIn ? <ChatPanel activities={data.activities} /> : null}
    </div>
  )
}
