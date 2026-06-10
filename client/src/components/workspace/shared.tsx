"use client";

import Image from "next/image";
import { CheckCircle2, Users } from "lucide-react";
import type { Workspace, WorkspaceDocument, WorkspaceTask } from "@/services/workspace.service";
import { PRIORITY_LABELS, STATUS_LABELS, TAB_LABELS, TEMPLATE_LABELS } from "./constants";
import type { WorkspaceTab } from "./types";
import { initials } from "./utils";

export function Avatar({
  name,
  avatar,
  size = "md",
}: {
  name: string;
  avatar?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const classes =
    size === "sm"
      ? "h-6 w-6 text-[9px]"
      : size === "lg"
      ? "h-10 w-10 text-xs"
      : "h-8 w-8 text-[10px]";
  return avatar ? (
    <Image
      src={avatar}
      alt=""
      width={40}
      height={40}
      unoptimized
      className={`${classes} rounded-full object-cover`}
    />
  ) : (
    <span
      className={`${classes} flex shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-700`}
    >
      {initials(name)}
    </span>
  );
}

export function StatusPill({ status }: { status: WorkspaceTask["status"] }) {
  const tone =
    status === "done"
      ? "bg-emerald-100 text-emerald-700"
      : status === "in_progress"
      ? "bg-blue-100 text-blue-700"
      : "bg-slate-100 text-slate-600";
  return (
    <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${tone}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityPill({
  priority = "medium",
}: {
  priority?: WorkspaceTask["priority"];
}) {
  const tone =
    priority === "high"
      ? "bg-red-100 text-red-600"
      : priority === "low"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-amber-100 text-amber-700";
  return (
    <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${tone}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export function WorkspaceTabs({
  active,
  onChange,
}: {
  active: WorkspaceTab;
  onChange: (tab: WorkspaceTab) => void;
}) {
  return (
    <div className="overflow-x-auto border-b bg-white">
      <nav className="mx-auto flex max-w-7xl gap-4 px-4 sm:gap-8 sm:px-5">
        {TAB_LABELS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition ${
              active === id
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export function WorkspaceHeader({ workspace }: { workspace: Workspace }) {
  return (
    <section className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-4 sm:items-center sm:gap-4 sm:px-5 sm:py-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-primary sm:h-12 sm:w-12">
          <Users className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
            {workspace.name}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Quản lý tài liệu, thành viên và tiến độ công việc
          </p>
        </div>
      </div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  caption,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  caption: string;
  icon: typeof CheckCircle2;
  tone: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-4 rounded-xl border bg-white p-4 shadow-sm shadow-slate-100">
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${tone}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="text-2xl font-semibold leading-tight">{value}</p>
        <p className="mt-1 truncate text-xs text-slate-500">{caption}</p>
      </div>
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-xl border bg-white shadow-sm shadow-slate-100 ${className}`}
    >
      {children}
    </section>
  );
}

export function TemplatePill({
  template,
}: {
  template: WorkspaceDocument["template"];
}) {
  return (
    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
      {TEMPLATE_LABELS[template]}
    </span>
  );
}
