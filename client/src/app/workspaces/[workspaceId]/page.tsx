"use client"
import { use } from "react"
import { WorkspaceDetail } from "@/components/workspace/WorkspaceDetail"
export default function WorkspacePage({ params }: { params: Promise<{ workspaceId: string }> }) {
  return <WorkspaceDetail workspaceId={use(params).workspaceId} />
}
