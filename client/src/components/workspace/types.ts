import type { WorkspaceTask } from "@/services/workspace.service";

export type WorkspaceTab = "overview" | "tasks" | "documents" | "members";
export type TaskView = "todo" | "table";
export type CustomColumn = {
  id: string;
  name: string;
  type: "text" | "select" | "date" | "checkbox" | "person";
};
export type TaskSortKey = "dueDate" | "priority";
export type SortDirection = "asc" | "desc";
export type TaskStatus = WorkspaceTask["status"];
export type TaskPriority = WorkspaceTask["priority"];
