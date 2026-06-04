import { apiRequest } from "@/services/document.service"
import type { WorkspaceUser } from "@/services/workspace.service"

export type CalendarEvent = {
  id: string
  title: string
  description?: string | null
  startAt: string
  endAt: string
  location?: string | null
  meetingUrl?: string | null
  workspaceId?: string | null
  workspace?: { id: string; name: string } | null
  documentId?: string | null
  document?: { id: string; title: string } | null
  taskId?: string | null
  task?: { id: string; title: string } | null
  ownerId: string
  owner: WorkspaceUser
  participantIds: string[]
  participants: WorkspaceUser[]
  createdAt: string
  updatedAt: string
}

export type CreateCalendarEventPayload = {
  title: string
  description?: string | null
  startAt: string
  endAt: string
  location?: string | null
  meetingUrl?: string | null
  workspaceId?: string | null
  documentId?: string | null
  participantIds?: string[]
}

export const getMyCalendarEvents = () => apiRequest<CalendarEvent[]>("/calendar")
export const createCalendarEvent = (payload: CreateCalendarEventPayload) =>
  apiRequest<CalendarEvent>("/calendar", { method: "POST", body: JSON.stringify(payload) })
