import Link from "next/link"
import { ArrowLeft, ChevronRight, FileText } from "lucide-react"
import { Header } from "@/components/header"
import { notFound } from "next/navigation"
import { CollaborativeEditorShell } from "@/components/editor/collaborative-editor-shell"
import { PdfDocumentViewer } from "@/components/editor/pdf-document-viewer"
import { Button } from "@/components/ui/button"
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
      <Header user={dashboardData.user} notificationCount={dashboardData.activities.length} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Link href="/dashboard" className="transition-colors hover:text-foreground">
              Tổng quan
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link
              href={`/workspaces/${workspaceId}`}
              className="transition-colors hover:text-foreground"
            >
              Workspace
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="inline-flex items-center gap-2 text-foreground">
              <FileText className="h-4 w-4" />
              {documentData.title}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" asChild>
              <Link href={`/workspaces/${workspaceId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại workspace
              </Link>
            </Button>
          </div>
        </div>

        {documentData.format === "PDF" && documentData.fileUrl ? (
          <PdfDocumentViewer
            title={documentData.title}
            fileUrl={documentData.fileUrl}
            fileName={documentData.fileName}
          />
        ) : (
          <CollaborativeEditorShell
            workspaceId={workspaceId}
            documentId={documentId}
            title={documentData.title}
            initialContent={documentData.content}
          />
        )}
      </main>
    </div>
  )
}
