export type AppUser = {
  id: string
  clerkId?: string
  name: string
  email: string
  imageUrl?: string | null
  initials: string
}

export type DocumentCardItem = {
  id: string
  title: string
  type: "document"
  workspaceId: string
  workspaceName: string
  updatedAtLabel: string
  isStarred: boolean
  collaborators: Array<{
    name: string
    initials: string
    avatar?: string | null
  }>
}

export type WorkspaceCardItem = {
  id: string
  name: string
  slug: string
  description: string
  color: string
  documentsCount: number
  tasksCompleted: number
  tasksTotal: number
  lastActivity: string
  members: Array<{
    id?: string
    name: string
    initials: string
    avatar?: string | null
    role: string
  }>
}

export type TaskSummaryItem = {
  id: string
  title: string
  deadline: string
  priority: "high" | "medium" | "low"
  project: string
}

export type ScheduleEventItem = {
  id: string
  title: string
  time: string
  color: string
  location: string
  isOnline: boolean
  attendees: Array<{
    name: string
    initials: string
  }>
}

export type ActivityItem = {
  id: string
  actor: string
  action: string
  createdAtLabel: string
}

export type ChatMessageItem = {
  id: string
  content: string
  createdAtLabel: string
  readByCount?: number
  reactions?: Array<{
    emoji: string
    count: number
    reactedByCurrentUser: boolean
  }>
  replyTo?: {
    id: string
    senderName: string
    content: string
  } | null
  sender: {
    id?: string | null
    name: string
    initials: string
  }
  isOwn: boolean
}

export type WorkspaceChatPanelData = {
  workspaceId: string
  channelId?: string | null
  channels?: Array<{
    id: string
    name: string
    description?: string | null
    type: "GENERAL" | "DIRECT" | "GROUP" | "ANNOUNCEMENT"
    unreadCount: number
    memberNames?: string[]
  }>
  channelName: string
  channelDescription?: string | null
  unreadCount: number
  messages: ChatMessageItem[]
}

export type WorkspaceInvitationItem = {
  id: string
  workspaceId: string
  workspaceName: string
  email: string
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"
  invitedBy: string
  createdAt: string
  expiresAt: string
}

export type DashboardData = {
  user: AppUser | null
  recentDocuments: DocumentCardItem[]
  workspaces: WorkspaceCardItem[]
  events: ScheduleEventItem[]
  upcomingTasks: TaskSummaryItem[]
  activities: ActivityItem[]
  pendingInvitations?: WorkspaceInvitationItem[]
}
