import type { WorkspaceTab } from "./types";

export const TAB_LABELS: Array<[WorkspaceTab, string]> = [
  ["overview", "Tổng quan"],
  ["tasks", "Công việc"],
  ["documents", "Tài liệu"],
  ["members", "Thành viên"],
];
export const STATUS_LABELS = {
  todo: "Chưa làm",
  in_progress: "Đang làm",
  done: "Hoàn thành",
};
export const PRIORITY_LABELS = { low: "Thấp", medium: "Trung bình", high: "Cao" };
export const TEMPLATE_LABELS = {
  blank: "Trang trống",
  todo: "To-do List",
  task_table: "Bảng công việc",
};
