import { DashboardData, WorkspaceCardItem, WorkspaceChatPanelData } from "@/lib/types"

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
      { id: "u-demo-1", name: "Nguyễn Văn A", initials: "NA", role: "Owner" },
      { id: "u-demo-2", name: "Trần Thị B", initials: "TB", role: "Admin" },
      { id: "u-demo-3", name: "Lê Văn C", initials: "LC", role: "Member" },
      { id: "u-demo-4", name: "Phạm Thị D", initials: "PD", role: "Viewer" },
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
      { id: "u-demo-2", name: "Trần Thị B", initials: "TB", role: "Owner" },
      { id: "u-demo-5", name: "Hoàng Minh E", initials: "HE", role: "Member" },
      { id: "u-demo-6", name: "Kim Phương F", initials: "KF", role: "Member" },
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
  pendingInvitations: [
    {
      id: "invite-dashboard-1",
      workspaceId: "ws-marketing-q2",
      workspaceName: "Marketing Campaign Q2",
      email: "nguyenvana@email.com",
      role: "MEMBER",
      invitedBy: "Trần Thị B",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
}

const demoWorkspaceChat: WorkspaceChatPanelData = {
  workspaceId: demoWorkspaces[0].id,
  channelId: "channel-demo-general",
  channels: [
    {
      id: "channel-demo-general",
      name: "general",
      description: "Kênh chat demo của workspace.",
      type: "GENERAL",
      unreadCount: 1,
      memberNames: ["Nguyễn Văn A", "Lê Văn C", "Phạm Thị D"],
    },
    {
      id: "channel-demo-direct",
      name: "Nguyễn Văn A, Lê Văn C",
      description: "Direct message demo.",
      type: "DIRECT",
      unreadCount: 0,
      memberNames: ["Nguyễn Văn A", "Lê Văn C"],
    },
  ],
  channelName: "general",
  channelDescription: "Kênh chat demo của workspace.",
  unreadCount: 1,
  messages: [
    {
      id: "chat-demo-1",
      content: "Mọi người nhớ cập nhật tiến độ task trước 17:00 hôm nay.",
      createdAtLabel: "5 phút trước",
      readByCount: 2,
      reactions: [
        {
          emoji: "👍",
          count: 1,
          reactedByCurrentUser: false,
        },
      ],
      replyTo: null,
      sender: {
        id: "u-demo-1",
        name: "Nguyễn Văn A",
        initials: "NA",
      },
      isOwn: false,
    },
    {
      id: "chat-demo-2",
      content: "Mình đang hoàn thiện phần board và sẽ đẩy code tối nay.",
      createdAtLabel: "2 phút trước",
      readByCount: 1,
      reactions: [],
      replyTo: {
        id: "chat-demo-1",
        senderName: "Nguyễn Văn A",
        content: "Mọi người nhớ cập nhật tiến độ task trước 17:00 hôm nay.",
      },
      sender: {
        id: "u-demo-3",
        name: "Lê Văn C",
        initials: "LC",
      },
      isOwn: true,
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
  currentUserRole: "OWNER",
  pendingInvitations: [
    {
      id: "invite-demo-1",
      email: "newmember@email.com",
      role: "MEMBER",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      invitedBy: "Nguyễn Văn A",
    },
  ],
  chat: demoWorkspaceChat,
}
