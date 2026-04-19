import { Header } from "@/components/header"
import { CollaborativeEditorShell } from "@/components/editor/collaborative-editor-shell"
import { getDashboardData } from "@/lib/data"

type DocumentEditorPageProps = {
  params: Promise<{
    workspaceId: string
    documentId: string
  }>
}

export default async function DocumentEditorPage({ params }: DocumentEditorPageProps) {
  const { workspaceId, documentId } = await params
  const dashboardData = await getDashboardData()

  return (
    <div className="min-h-screen bg-background">
      <Header user={dashboardData.user} />
      <main className="container mx-auto px-4 py-8">
        <CollaborativeEditorShell
          workspaceId={workspaceId}
          documentId={documentId}
          title="Collaborative Document"
        />
      </main>
    </div>
  )
}
