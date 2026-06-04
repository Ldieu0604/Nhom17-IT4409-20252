import { apiRequest } from "@/services/document.service"

export type WorkspaceUser = {
  id: string
  email: string
  username: string
  firstname?: string
  lastname?: string
  avatar?: string | null
  displayName: string
}
export type WorkspaceMember = { id: string; role: "owner" | "member"; createdAt: string; user: WorkspaceUser }
export type WorkspaceInvitation = {
  id: string
  workspaceId: string
  email: string
  role: "owner" | "member"
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED"
  expiresAt: string
  acceptedAt?: string | null
  createdAt: string
  updatedAt: string
  existingAccount?: boolean
  invitedBy?: WorkspaceUser | null
}
export type WorkspaceNotification = {
  id: string
  userId: string
  type: "WORKSPACE_INVITE" | "WORKSPACE_JOINED"
  title: string
  body: string
  data?: { workspaceId?: string; invitationId?: string; action?: string } | null
  readAt?: string | null
  createdAt: string
}
export type WorkspaceInvitationPreview = {
  workspaceName: string
  invitedByName: string
  email: string
  role: "owner" | "member"
  expiresAt: string
  status: WorkspaceInvitation["status"]
}
export type WorkspaceDocument = { id: string; title: string; template: "blank" | "todo" | "task_table"; updatedAt: string }
export type WorkspaceTask = {
  id: string
  workspaceId: string
  documentId?: string | null
  document?: { id: string; title: string } | null
  title: string
  description?: string | null
  assigneeId?: string | null
  assignee?: WorkspaceUser | null
  status: "todo" | "in_progress" | "done"
  priority: "low" | "medium" | "high"
  completed: boolean
  dueDate?: string | null
  completedAt?: string | null
  createdAt: string
  updatedAt: string
  workspace?: { id: string; name: string }
}
export type Workspace = {
  id: string
  name: string
  description?: string | null
  ownerId: string
  role: "owner" | "member"
  documentCount: number
  taskCount: number
  completedTaskCount: number
  members: WorkspaceMember[]
  invitations?: WorkspaceInvitation[]
  documents?: WorkspaceDocument[]
  tasks?: WorkspaceTask[]
  updatedAt: string
}

export const listWorkspaces = () => apiRequest<Workspace[]>("/workspaces")
export const getWorkspace = (workspaceId: string) => apiRequest<Workspace>(`/workspaces/${workspaceId}`)
export const createWorkspace = (payload: { name: string; description?: string }) =>
  apiRequest<Workspace>("/workspaces", { method: "POST", body: JSON.stringify(payload) })
export const deleteWorkspace = (workspaceId: string) =>
  apiRequest<{ id: string }>(`/workspaces/${workspaceId}`, { method: "DELETE" })
export const addWorkspaceMember = (workspaceId: string, email: string) =>
  apiRequest<WorkspaceInvitation>(`/workspaces/${workspaceId}/invitations`, { method: "POST", body: JSON.stringify({ email }) })
export const createWorkspaceInvitation = (workspaceId: string, payload: { email: string; role?: WorkspaceInvitation["role"] }) =>
  apiRequest<WorkspaceInvitation>(`/workspaces/${workspaceId}/invitations`, { method: "POST", body: JSON.stringify(payload) })
export const previewWorkspaceInvitation = (token: string) =>
  apiRequest<WorkspaceInvitationPreview>(`/invitations/preview?token=${encodeURIComponent(token)}`)
export const acceptWorkspaceInvitation = (token: string) =>
  apiRequest<{ workspace: { id: string; name: string; redirectUrl: string }; member: WorkspaceMember }>("/invitations/accept", { method: "POST", body: JSON.stringify({ token }) })
export const acceptWorkspaceInvitationById = (invitationId: string) =>
  apiRequest<{ workspace: { id: string; name: string; redirectUrl: string }; member: WorkspaceMember }>(`/invitations/${invitationId}/accept`, { method: "POST", body: JSON.stringify({}) })
export const listNotifications = () => apiRequest<WorkspaceNotification[]>("/notifications")
export const markNotificationRead = (notificationId: string) =>
  apiRequest<WorkspaceNotification>(`/notifications/${notificationId}/read`, { method: "PATCH", body: JSON.stringify({}) })
export const updateWorkspaceMember = (workspaceId: string, memberId: string, payload: { role: WorkspaceMember["role"] }) =>
  apiRequest<WorkspaceMember>(`/workspaces/${workspaceId}/members/${memberId}`, { method: "PATCH", body: JSON.stringify(payload) })
export const deleteWorkspaceMember = (workspaceId: string, memberId: string) =>
  apiRequest<{ id: string }>(`/workspaces/${workspaceId}/members/${memberId}`, { method: "DELETE" })
export const createWorkspaceTask = (workspaceId: string, payload: Partial<WorkspaceTask> & { title: string }) =>
  apiRequest<WorkspaceTask>(`/workspaces/${workspaceId}/tasks`, { method: "POST", body: JSON.stringify(payload) })
export const updateWorkspaceTask = (workspaceId: string, taskId: string, payload: Partial<WorkspaceTask>) =>
  apiRequest<WorkspaceTask>(`/workspaces/${workspaceId}/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(payload) })
export const deleteWorkspaceTask = (workspaceId: string, taskId: string) =>
  apiRequest<{ id: string }>(`/workspaces/${workspaceId}/tasks/${taskId}`, { method: "DELETE" })
export const listDocumentTasks = (documentId: string) =>
  apiRequest<WorkspaceTask[]>(`/workspaces/documents/${documentId}/tasks`)
export const listMyWorkspaceTasks = () => apiRequest<WorkspaceTask[]>("/workspaces/my/tasks")
