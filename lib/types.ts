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

export type DashboardData = {
  user: AppUser | null
  recentDocuments: DocumentCardItem[]
  workspaces: WorkspaceCardItem[]
  events: ScheduleEventItem[]
  upcomingTasks: TaskSummaryItem[]
  activities: ActivityItem[]
}
