import { DashboardData, WorkspaceCardItem } from "@/lib/types"

const demoUser = {
  id: "demo-user",
  name: "Nguyễn Văn A",
  email: "nguyenvana@email.com",
  imageUrl: null,
  initials: "NA",
}

const demoWorkspaces: WorkspaceCardItem[] = [
  {
    id: "ws-team-alpha",
    slug: "team-alpha",
    name: "Team Alpha - Product Development",
    description: "Phát triển sản phẩm chính của nhóm và quản lý sprint hiện tại.",
    color: "bg-primary",
    documentsCount: 24,
    tasksCompleted: 18,
    tasksTotal: 25,
    lastActivity: "5 phút trước",
    members: [
      { name: "Nguyễn Văn A", initials: "NA", role: "Owner" },
      { name: "Trần Thị B", initials: "TB", role: "Admin" },
      { name: "Lê Văn C", initials: "LC", role: "Member" },
      { name: "Phạm Thị D", initials: "PD", role: "Viewer" },
    ],
  },
  {
    id: "ws-marketing-q2",
    slug: "marketing-q2",
    name: "Marketing Campaign Q2",
    description: "Workspace dành cho chiến dịch truyền thông quý 2.",
    color: "bg-accent",
    documentsCount: 12,
    tasksCompleted: 8,
    tasksTotal: 15,
    lastActivity: "1 giờ trước",
    members: [
      { name: "Trần Thị B", initials: "TB", role: "Owner" },
      { name: "Hoàng Minh E", initials: "HE", role: "Member" },
      { name: "Kim Phương F", initials: "KF", role: "Member" },
    ],
  },
]

export const demoDashboardData: DashboardData = {
  user: demoUser,
  recentDocuments: [
    {
      id: "doc-sprint-plan",
      title: "Kế hoạch dự án Q2 2026",
      type: "document",
      workspaceId: "ws-team-alpha",
      workspaceName: "Team Alpha - Product Development",
      updatedAtLabel: "2 phút trước",
      isStarred: true,
      collaborators: [
        { name: "Nguyễn Văn A", initials: "NA" },
        { name: "Trần Thị B", initials: "TB" },
        { name: "Lê Văn C", initials: "LC" },
      ],
    },
    {
      id: "doc-roadmap",
      title: "Product Roadmap 2026",
      type: "document",
      workspaceId: "ws-team-alpha",
      workspaceName: "Team Alpha - Product Development",
      updatedAtLabel: "Hôm qua",
      isStarred: true,
      collaborators: [
        { name: "Nguyễn Văn A", initials: "NA" },
        { name: "Lê Văn C", initials: "LC" },
      ],
    },
    {
      id: "doc-campaign",
      title: "Sprint Board - Team Alpha",
      type: "document",
      workspaceId: "ws-team-alpha",
      workspaceName: "Team Alpha - Product Development",
      updatedAtLabel: "15 phút trước",
      isStarred: false,
      collaborators: [
        { name: "Phạm Thị D", initials: "PD" },
        { name: "Hoàng Minh E", initials: "HE" },
      ],
    },
  ],
  workspaces: demoWorkspaces,
  events: [
    {
      id: "event-sprint-planning",
      title: "Sprint Planning Meeting",
      time: "09:00 - 10:30",
      color: "bg-primary",
      location: "Google Meet",
      isOnline: true,
      attendees: [
        { name: "Nguyễn Văn A", initials: "NA" },
        { name: "Trần Thị B", initials: "TB" },
        { name: "Lê Văn C", initials: "LC" },
      ],
    },
    {
      id: "event-design-review",
      title: "Design Review - Workspace Dashboard",
      time: "14:00 - 15:00",
      color: "bg-accent",
      location: "Phòng họp A3",
      isOnline: false,
      attendees: [
        { name: "Lê Văn C", initials: "LC" },
        { name: "Phạm Thị D", initials: "PD" },
      ],
    },
  ],
  upcomingTasks: [
    {
      id: "task-api-docs",
      title: "Hoàn thành API dashboard và workspace",
      deadline: "Hôm nay, 18:00",
      priority: "high",
      project: "Team Alpha",
    },
    {
      id: "task-review-editor",
      title: "Review collaborative editor shell",
      deadline: "Ngày mai, 10:00",
      priority: "medium",
      project: "Product Development",
    },
    {
      id: "task-mobile-state",
      title: "Bổ sung empty state cho mobile dashboard",
      deadline: "Thứ 5, 14:00",
      priority: "low",
      project: "UI/UX Design",
    },
  ],
  activities: [
    {
      id: "activity-1",
      actor: "Phạm Thị D",
      action: "vừa cập nhật deadline cho Sprint 4",
      createdAtLabel: "5 phút trước",
    },
    {
      id: "activity-2",
      actor: "Nguyễn Văn A",
      action: "đã chỉnh sửa tài liệu mô tả hệ thống",
      createdAtLabel: "10 phút trước",
    },
    {
      id: "activity-3",
      actor: "Trần Thị B",
      action: "chuyển task UI Dashboard sang Done",
      createdAtLabel: "20 phút trước",
    },
  ],
}

export const demoWorkspaceDetails = {
  workspace: demoWorkspaces[0],
  documents: demoDashboardData.recentDocuments,
  tasks: [
    {
      id: "kanban-1",
      title: "Thiết kế dashboard mobile",
      status: "TODO",
      priority: "HIGH",
      assignee: "Lê Văn C",
      deadline: "2026-04-21",
    },
    {
      id: "kanban-2",
      title: "Tích hợp Prisma schema",
      status: "IN_PROGRESS",
      priority: "URGENT",
      assignee: "Phạm Thị D",
      deadline: "2026-04-20",
    },
    {
      id: "kanban-3",
      title: "Tạo activity log API",
      status: "DONE",
      priority: "MEDIUM",
      assignee: "Nguyễn Văn A",
      deadline: "2026-04-18",
    },
  ],
  activities: demoDashboardData.activities,
}
