"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createDashboardDocument } from "@/services/document.service";
import {
  getWorkspace,
  type Workspace,
  type WorkspaceDocument,
} from "@/services/workspace.service";
import { WorkspaceTopBar } from "@/components/layout/WorkspaceTopBar";
import { WorkspaceDocuments } from "./documents";
import { WorkspaceMembers } from "./members";
import { WorkspaceOverview } from "./overview";
import { WorkspaceHeader, WorkspaceTabs } from "./shared";
import { WorkspaceTasks } from "./tasks";
import type { WorkspaceTab } from "./types";
import { getInitials, getUserAvatar } from "@/components/dashboard/dashboardUtils";

export function WorkspaceDetail({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [userInitials, setUserInitials] = useState("T");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setUserInitials(getInitials())
      setUserAvatar(getUserAvatar())
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const load = useCallback(
    () =>
      getWorkspace(workspaceId)
        .then(setWorkspace)
        .catch((e) => setError(e.message)),
    [workspaceId]
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (new URLSearchParams(window.location.search).get("tab") === "tasks")
        setActiveTab("tasks");
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const tasks = useMemo(() => workspace?.tasks || [], [workspace?.tasks]);
  async function createDoc(template: WorkspaceDocument["template"]) {
    const document = await createDashboardDocument({
      templateId: template,
      workspaceId,
    });
    router.push(`/documents/${document.id}`);
  }
  if (!workspace)
    return (
      <div className="p-8 text-sm text-slate-500">
        {error || "Đang tải workspace..."}
      </div>
    );
  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(search.trim().toLowerCase())
  );
  return (
    <div className="min-h-screen bg-slate-50">
      <WorkspaceTopBar
        search={search}
        onSearchChange={setSearch}
        userAvatar={userAvatar}
        userInitials={userInitials}
        onLogout={() => router.push("/")}
      />
      <WorkspaceHeader workspace={workspace} />
      <WorkspaceTabs active={activeTab} onChange={setActiveTab} />
      <main className="mx-auto max-w-7xl px-5 py-5">
        {activeTab === "overview" && (
          <WorkspaceOverview
            workspace={workspace}
            tasks={tasks}
            goTo={setActiveTab}
          />
        )}
        {activeTab === "tasks" && (
          <WorkspaceTasks
            workspace={workspace}
            tasks={filteredTasks}
            reload={load}
          />
        )}
        {activeTab === "documents" && (
          <WorkspaceDocuments
            workspace={workspace}
            createDoc={createDoc}
            reload={load}
          />
        )}
        {activeTab === "members" && (
          <WorkspaceMembers workspace={workspace} tasks={tasks} reload={load} />
        )}
      </main>
    </div>
  );
}
