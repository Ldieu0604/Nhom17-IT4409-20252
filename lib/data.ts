import { formatDistanceToNowStrict } from "date-fns"
import { vi } from "date-fns/locale"
import { prisma } from "@/lib/prisma"
import { getHeaderUser } from "@/lib/auth"
import { demoDashboardData, demoWorkspaceDetails } from "@/lib/demo-data"
import { DashboardData } from "@/lib/types"

function formatRelativeDate(date: Date) {
  return formatDistanceToNowStrict(date, { addSuffix: true, locale: vi })
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function hasDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL)
}

export async function getDashboardData(): Promise<DashboardData> {
  if (!hasDatabaseConfigured()) {
    return demoDashboardData
  }

  const user = await getHeaderUser()

  if (!user) {
    return {
      ...demoDashboardData,
      user: null,
    }
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: {
      userId: user.id,
    },
    include: {
      workspace: {
        include: {
          members: {
            include: {
              user: true,
            },
          },
          documents: true,
          tasks: true,
          activityLogs: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
      },
    },
    orderBy: {
      joinedAt: "desc",
    },
  })

  const workspaceIds = memberships.map((membership: any) => membership.workspaceId)

  const documents = await prisma.document.findMany({
    where: {
      workspaceId: { in: workspaceIds },
    },
    include: {
      workspace: true,
      createdBy: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 6,
  })

  const tasks = await prisma.task.findMany({
    where: {
      workspaceId: { in: workspaceIds },
      deadline: {
        not: null,
      },
    },
    include: {
      workspace: true,
    },
    orderBy: {
      deadline: "asc",
    },
    take: 6,
  })

  const activities = await prisma.activityLog.findMany({
    where: {
      workspaceId: {
        in: workspaceIds,
      },
    },
    include: {
      actor: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 6,
  })

  return {
    user,
    recentDocuments: documents.map((document: any) => ({
      id: document.id,
      title: document.title,
      type: "document" as const,
      workspaceId: document.workspaceId,
      workspaceName: document.workspace.name,
      updatedAtLabel: formatRelativeDate(document.updatedAt),
      isStarred: false,
      collaborators: [
        {
          name: document.createdBy.name ?? document.createdBy.email,
          initials: getInitials(document.createdBy.name ?? document.createdBy.email),
        },
      ],
    })),
    workspaces: memberships.map(({ workspace }: any) => ({
      id: workspace.id,
      slug: workspace.slug,
      name: workspace.name,
      description: workspace.description ?? "Workspace cộng tác của nhóm.",
      color: "bg-primary",
      documentsCount: workspace.documents.length,
      tasksCompleted: workspace.tasks.filter((task: any) => task.status === "DONE").length,
      tasksTotal: workspace.tasks.length,
      lastActivity: workspace.activityLogs[0]
        ? formatRelativeDate(workspace.activityLogs[0].createdAt)
        : "Chưa có hoạt động",
      members: workspace.members.map((member: any) => ({
        id: member.user.id,
        name: member.user.name ?? member.user.email,
        initials: getInitials(member.user.name ?? member.user.email),
        avatar: member.user.avatarUrl,
        role: member.role,
      })),
    })),
    events: demoDashboardData.events,
    upcomingTasks: tasks.map((task: any) => ({
      id: task.id,
      title: task.title,
      deadline: task.deadline ? task.deadline.toLocaleString("vi-VN") : "Chưa có deadline",
      priority:
        task.priority === "URGENT" || task.priority === "HIGH"
          ? "high"
          : task.priority === "MEDIUM"
          ? "medium"
          : "low",
      project: task.workspace.name,
    })),
    activities: activities.map((activity: any) => ({
      id: activity.id,
      actor: activity.actor.name ?? activity.actor.email,
      action: activity.message,
      createdAtLabel: formatRelativeDate(activity.createdAt),
    })),
  }
}

export async function getWorkspacePageData(workspaceId: string) {
  if (!hasDatabaseConfigured()) {
    return demoWorkspaceDetails
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        include: { user: true },
      },
      documents: {
        orderBy: { updatedAt: "desc" },
      },
      tasks: {
        include: { assignee: true },
        orderBy: [{ status: "asc" }, { position: "asc" }],
      },
      activityLogs: {
        include: { actor: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  })

  if (!workspace) {
    return null
  }

  return {
    workspace: {
      id: workspace.id,
      slug: workspace.slug,
      name: workspace.name,
      description: workspace.description ?? "Workspace cộng tác",
      color: "bg-primary",
      documentsCount: workspace.documents.length,
      tasksCompleted: workspace.tasks.filter((task: any) => task.status === "DONE").length,
      tasksTotal: workspace.tasks.length,
      lastActivity: workspace.activityLogs[0]
        ? formatRelativeDate(workspace.activityLogs[0].createdAt)
        : "Chưa có hoạt động",
      members: workspace.members.map((member: any) => ({
        id: member.user.id,
        name: member.user.name ?? member.user.email,
        initials: getInitials(member.user.name ?? member.user.email),
        avatar: member.user.avatarUrl,
        role: member.role,
      })),
    },
    documents: workspace.documents.map((document: any) => ({
      id: document.id,
      title: document.title,
      type: "document" as const,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      updatedAtLabel: formatRelativeDate(document.updatedAt),
      isStarred: false,
      collaborators: workspace.members.slice(0, 3).map((member: any) => ({
        name: member.user.name ?? member.user.email,
        initials: getInitials(member.user.name ?? member.user.email),
      })),
    })),
    tasks: workspace.tasks.map((task: any) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      assignee: task.assignee?.name ?? task.assignee?.email ?? "Chưa phân công",
      deadline: task.deadline?.toISOString().slice(0, 10) ?? "Chưa có",
    })),
    activities: workspace.activityLogs.map((activity: any) => ({
      id: activity.id,
      actor: activity.actor.name ?? activity.actor.email,
      action: activity.message,
      createdAtLabel: formatRelativeDate(activity.createdAt),
    })),
  }
}
