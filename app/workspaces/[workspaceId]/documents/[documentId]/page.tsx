import { Header } from "@/components/header"
import { notFound } from "next/navigation"
import { CollaborativeEditorShell } from "@/components/editor/collaborative-editor-shell"
import { getDashboardData, getWorkspaceDocumentData } from "@/lib/data"

type DocumentEditorPageProps = {
  params: Promise<{
    workspaceId: string
    documentId: string
  }>
}

export default async function DocumentEditorPage({ params }: DocumentEditorPageProps) {
  const { workspaceId, documentId } = await params
  const dashboardData = await getDashboardData()
  const documentData = await getWorkspaceDocumentData(workspaceId, documentId)

  if (!documentData) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={dashboardData.user} />
      <main className="container mx-auto px-4 py-8">
        <CollaborativeEditorShell
          workspaceId={workspaceId}
          documentId={documentId}
          title={documentData.title}
          initialContent={documentData.content}
        />
      </main>
    </div>
  )
}
