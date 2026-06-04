"use client";

import Link from "next/link";
import { AlertTriangle, CalendarDays, CircleCheckBig, Clock3, FileText, Users } from "lucide-react";
import type { Workspace, WorkspaceTask } from "@/services/workspace.service";
import { Avatar, Card, StatCard, StatusPill, TemplatePill } from "./shared";
import type { WorkspaceTab } from "./types";
import { dateLabel } from "./utils";

function MemberProgressCard({
  workspace,
  tasks,
}: {
  workspace: Workspace;
  tasks: WorkspaceTask[];
}) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="font-semibold">Tiến độ thành viên</h2>
        <span className="text-[11px] text-slate-500">Deadline gần nhất</span>
      </div>
      <div>
        {workspace.members.map((member) => {
          const assigned = tasks.filter(
            (task) => task.assigneeId === member.user.id
          );
          const done = assigned.filter((task) => task.completed).length;
          const progress = assigned.length
            ? Math.round((done * 100) / assigned.length)
            : 0;
          const next = assigned
            .filter((task) => !task.completed && task.dueDate)
            .sort(
              (a, b) =>
                new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
            )[0];
          return (
            <div
              key={member.id}
              className="grid grid-cols-[minmax(110px,1.1fr)_minmax(100px,1fr)_minmax(110px,2fr)_42px_64px] items-center gap-3 border-t py-3 text-xs"
            >
              <span className="flex items-center gap-2 font-medium text-slate-800">
                <Avatar
                  name={member.user.displayName}
                  avatar={member.user.avatar}
                  size="sm"
                />
                {member.user.displayName}
              </span>
              <span className="text-slate-500">
                {done}/{assigned.length} việc hoàn thành
              </span>
              <span className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <span
                  className="block h-full rounded-full bg-primary"
                  style={{ width: `${progress}%` }}
                />
              </span>
              <span className="font-semibold text-primary">{progress}%</span>
              <span className="text-right">
                {next ? dateLabel(next.dueDate) : "-"}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function DeadlinesCard({ tasks }: { tasks: WorkspaceTask[] }) {
  const items = tasks
    .filter((task) => !task.completed && task.dueDate)
    .sort(
      (a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
    )
    .slice(0, 5);
  return (
    <Card className="p-4">
      <h2 className="mb-2 font-semibold">Deadline cần chú ý</h2>
      {items.map((task) => (
        <div
          key={task.id}
          className="grid grid-cols-[minmax(100px,1fr)_minmax(160px,2fr)_82px_88px] items-center gap-3 border-t py-2.5 text-xs"
        >
          <span className="flex items-center gap-2 font-medium">
            <Avatar
              name={task.assignee?.displayName || "?"}
              avatar={task.assignee?.avatar}
              size="sm"
            />
            {task.assignee?.displayName || "Chưa giao"}
          </span>
          <span className="truncate">{task.title}</span>
          <StatusPill status={task.status} />
          <span
            className={`${
              new Date(task.dueDate!) < new Date()
                ? "text-red-600"
                : "text-slate-600"
            } flex items-center gap-1`}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {dateLabel(task.dueDate)}
          </span>
        </div>
      ))}
      {items.length === 0 && (
        <p className="py-5 text-sm text-slate-500">
          Không có deadline cần chú ý.
        </p>
      )}
    </Card>
  );
}

function DocumentsSummaryCard({
  workspace,
  onShowAll,
}: {
  workspace: Workspace;
  onShowAll: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <FileText className="h-4 w-4 text-primary" />
            Tài liệu trong workspace
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">
            Các tài liệu này cũng hiển thị ở mục Tài liệu gần đây.
          </p>
        </div>
        <button
          onClick={onShowAll}
          className="rounded-md border px-2 py-1 text-[11px] font-medium text-primary hover:bg-emerald-50"
        >
          Xem tất cả
        </button>
      </div>
      {workspace.documents?.slice(0, 5).map((document) => (
        <Link
          key={document.id}
          href={`/documents/${document.id}`}
          className="flex items-center justify-between gap-2 border-t py-2 text-xs hover:text-primary"
        >
          <span className="flex min-w-0 items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">{document.title}</span>
          </span>
          <TemplatePill template={document.template} />
        </Link>
      ))}
      {!workspace.documents?.length && (
        <p className="py-4 text-xs text-slate-500">Chưa có tài liệu.</p>
      )}
    </Card>
  );
}

function MembersSummaryCard({
  workspace,
  onManage,
}: {
  workspace: Workspace;
  onManage: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <Users className="h-4 w-4 text-primary" />
          Thành viên
        </h2>
        <button
          onClick={onManage}
          className="rounded-md border px-2 py-1 text-[11px] font-medium text-primary hover:bg-emerald-50"
        >
          Quản lý
        </button>
      </div>
      {workspace.members.slice(0, 5).map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between border-t py-2 text-xs"
        >
          <span className="flex items-center gap-2 font-medium">
            <Avatar
              name={member.user.displayName}
              avatar={member.user.avatar}
              size="sm"
            />
            {member.user.displayName}
          </span>
          <span
            className={`rounded-md px-2 py-0.5 ${
              member.role === "owner"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {member.role === "owner" ? "Owner" : "Member"}
          </span>
        </div>
      ))}
    </Card>
  );
}

export function WorkspaceOverview({
  workspace,
  tasks,
  goTo,
}: {
  workspace: Workspace;
  tasks: WorkspaceTask[];
  goTo: (tab: WorkspaceTab) => void;
}) {
  const now = new Date();
  const soon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const done = tasks.filter((task) => task.completed).length;
  const inProgress = tasks.filter(
    (task) => task.status === "in_progress"
  ).length;
  const dueSoon = tasks.filter(
    (task) =>
      !task.completed &&
      task.dueDate &&
      new Date(task.dueDate) >= now &&
      new Date(task.dueDate) <= soon
  ).length;
  const overdue = tasks.filter(
    (task) => !task.completed && task.dueDate && new Date(task.dueDate) < now
  ).length;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Đã hoàn thành"
          value={done}
          caption="Công việc đã hoàn tất"
          icon={CircleCheckBig}
          tone="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          label="Đang thực hiện"
          value={inProgress}
          caption="Công việc đang tiến hành"
          icon={Clock3}
          tone="bg-blue-100 text-blue-700"
        />
        <StatCard
          label="Sắp đến hạn"
          value={dueSoon}
          caption="Trong 3 ngày tới"
          icon={CalendarDays}
          tone="bg-amber-100 text-amber-700"
        />
        <StatCard
          label="Quá hạn"
          value={overdue}
          caption="Cần xử lý ngay"
          icon={AlertTriangle}
          tone="bg-red-100 text-red-600"
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)]">
        <div className="space-y-4">
          <MemberProgressCard workspace={workspace} tasks={tasks} />
          <DeadlinesCard tasks={tasks} />
        </div>
        <div className="space-y-4">
          <DocumentsSummaryCard
            workspace={workspace}
            onShowAll={() => goTo("documents")}
          />
          <MembersSummaryCard
            workspace={workspace}
            onManage={() => goTo("members")}
          />
        </div>
      </div>
    </div>
  );
}
