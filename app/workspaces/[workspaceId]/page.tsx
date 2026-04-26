import Link from "next/link"
import { notFound } from "next/navigation"
import { ActivityFeed } from "@/components/activity-feed"
import { ChatPanel } from "@/components/chat-panel"
import { Header } from "@/components/header"
import { RecentDocuments } from "@/components/recent-documents"
import { TaskBoard } from "@/components/task-board"
import { Button } from "@/components/ui/button"
import { AssignmentPanel } from "@/components/workspace/assignment-panel"
import { DocumentManager } from "@/components/workspace/document-manager"
import { MemberPanel } from "@/components/workspace/member-panel"
import { WorkspacePlanner } from "@/components/workspace/workspace-planner"
import { getDashboardData, getWorkspacePageData } from "@/lib/data"

type WorkspacePageProps = {
  params: Promise<{
    workspaceId: string
  }>
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceId } = await params
  const workspaceData = await getWorkspacePageData(workspaceId)
  const dashboardData = await getDashboardData()

  if (!workspaceData) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={dashboardData.user} />
      <main className="container mx-auto space-y-8 px-4 py-8">
        <section className="rounded-3xl border bg-card p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Chi tiết workspace</p>
              <h1 className="mt-2 text-3xl font-bold">{workspaceData.workspace.name}</h1>
              <p className="mt-3 max-w-3xl text-muted-foreground">{workspaceData.workspace.description}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span>{workspaceData.workspace.documentsCount} tài liệu</span>
                <span>{workspaceData.workspace.tasksTotal} tasks</span>
                <span>{workspaceData.workspace.members.length} thành viên</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href="#workspace-members">Thêm thành viên</Link>
              </Button>
              <Button asChild>
                <Link href={`/workspaces/${workspaceId}/documents/${workspaceData.documents[0]?.id ?? "new"}`}>
                  Mở collaborative editor
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <WorkspacePlanner workspaceId={workspaceId} tasks={workspaceData.tasks} />
        <DocumentManager workspaceId={workspaceId} documents={workspaceData.documents} />
        <RecentDocuments documents={workspaceData.documents} />
        <TaskBoard workspaceId={workspaceId} tasks={workspaceData.tasks} />
        <MemberPanel
          workspaceId={workspaceId}
          members={workspaceData.workspace.members}
          invitations={workspaceData.pendingInvitations}
          currentUserRole={workspaceData.currentUserRole}
          sectionId="workspace-members"
        />
        <AssignmentPanel
          workspaceId={workspaceId}
          tasks={workspaceData.tasks}
          members={workspaceData.workspace.members}
        />
        <ActivityFeed activities={workspaceData.activities} />
      </main>
      <ChatPanel
        mode="chat"
        workspaceId={workspaceId}
        currentUser={dashboardData.user}
        initialChat={workspaceData.chat}
      />
    </div>
  )
}
