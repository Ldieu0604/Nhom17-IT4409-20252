import Link from "next/link"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { RecentDocuments } from "@/components/recent-documents"
import { ActivityFeed } from "@/components/activity-feed"
import { TaskBoard } from "@/components/task-board"
import { DocumentManager } from "@/components/workspace/document-manager"
import { AssignmentPanel } from "@/components/workspace/assignment-panel"
import { WorkspacePlanner } from "@/components/workspace/workspace-planner"
import { getDashboardData, getWorkspacePageData } from "@/lib/data"
import { Button } from "@/components/ui/button"

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
              <p className="text-sm font-medium text-primary">Workspace Detail</p>
              <h1 className="mt-2 text-3xl font-bold">{workspaceData.workspace.name}</h1>
              <p className="mt-3 max-w-3xl text-muted-foreground">{workspaceData.workspace.description}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span>{workspaceData.workspace.documentsCount} tài liệu</span>
                <span>{workspaceData.workspace.tasksTotal} tasks</span>
                <span>{workspaceData.workspace.members.length} thành viên</span>
              </div>
            </div>
            <Button asChild>
              <Link href={`/workspaces/${workspaceId}/documents/${workspaceData.documents[0]?.id ?? "new"}`}>
                Mở collaborative editor
              </Link>
            </Button>
          </div>
        </section>

        <WorkspacePlanner workspaceId={workspaceId} tasks={workspaceData.tasks} />
        <DocumentManager workspaceId={workspaceId} documents={workspaceData.documents} />
        <RecentDocuments documents={workspaceData.documents} />
        <TaskBoard workspaceId={workspaceId} tasks={workspaceData.tasks} />
        <AssignmentPanel
          workspaceId={workspaceId}
          tasks={workspaceData.tasks}
          members={workspaceData.workspace.members}
        />
        <ActivityFeed activities={workspaceData.activities} />
      </main>
    </div>
  )
}
