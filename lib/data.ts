import { formatDistanceToNowStrict } from "date-fns"
import { vi } from "date-fns/locale"
import { demoDashboardData, demoWorkspaceDetails } from "@/lib/demo-data"
import { getHeaderUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DashboardData, WorkspaceChatPanelData, WorkspaceDocumentData } from "@/lib/types"

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

function inferDocumentFormat(attachments?: Array<{ extension?: string | null }>) {
  const extension = attachments?.[0]?.extension?.toLowerCase()

  if (extension === "pdf") {
    return "PDF" as const
  }

  if (extension === "docx") {
    return "DOCX" as const
  }

  return "EDITOR" as const
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
      pendingInvitations: [],
    }
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: user.id },
    include: {
      workspace: {
        include: {
          members: { include: { user: true } },
          documents: true,
          tasks: true,
          activityLogs: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  })

  const workspaceIds = memberships.map((membership: any) => membership.workspaceId)

  const [documents, tasks, activities, pendingInvitations] = await Promise.all([
    prisma.document.findMany({
      where: { workspaceId: { in: workspaceIds }, deletedAt: null },
      include: { workspace: true, createdBy: true, attachments: { where: { deletedAt: null }, take: 1 } },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.task.findMany({
      where: { workspaceId: { in: workspaceIds }, deletedAt: null, deadline: { not: null } },
      include: { workspace: true },
      orderBy: { deadline: "asc" },
      take: 6,
    }),
    prisma.activityLog.findMany({
      where: { workspaceId: { in: workspaceIds } },
      include: { actor: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.workspaceInvitation.findMany({
      where: {
        email: user.email,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      include: { workspace: true, invitedBy: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ])

  return {
    user,
    recentDocuments: documents.map((document: any) => ({
      id: document.id,
      title: document.title,
      type: "document" as const,
      format: inferDocumentFormat(document.attachments),
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
      description: workspace.description ?? "Workspace cong tac cua nhom.",
      color: "bg-primary",
      documentsCount: workspace.documents.length,
      tasksCompleted: workspace.tasks.filter((task: any) => task.status === "DONE").length,
      tasksTotal: workspace.tasks.length,
      lastActivity: workspace.activityLogs[0]
        ? formatRelativeDate(workspace.activityLogs[0].createdAt)
        : "Chua co hoat dong",
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
      deadline: task.deadline ? task.deadline.toLocaleString("vi-VN") : "Chua co deadline",
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
    pendingInvitations: pendingInvitations.map((invitation: any) => ({
      id: invitation.id,
      workspaceId: invitation.workspaceId,
      workspaceName: invitation.workspace.name,
      email: invitation.email,
      role: invitation.role,
      invitedBy: invitation.invitedBy.name ?? invitation.invitedBy.email,
      createdAt: invitation.createdAt.toISOString(),
      expiresAt: invitation.expiresAt.toISOString(),
    })),
  }
}

export async function getWorkspacePageData(workspaceId: string) {
  if (!hasDatabaseConfigured()) {
    return demoWorkspaceDetails
  }

  const currentUser = await getHeaderUser()
  if (!currentUser) {
    return null
  }

  const currentMembership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: currentUser.id,
      },
    },
  })

  if (!currentMembership) {
    return null
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: { include: { user: true } },
      documents: {
        where: { deletedAt: null },
        include: { attachments: { where: { deletedAt: null }, take: 1 } },
        orderBy: { updatedAt: "desc" },
      },
      tasks: {
        where: { deletedAt: null },
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

  const [pendingInvitations, channels] = await Promise.all([
    prisma.workspaceInvitation.findMany({
      where: { workspaceId, status: "PENDING" },
      include: { invitedBy: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.chatChannel.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        members: { some: { userId: currentUser.id } },
      },
      include: {
        members: { include: { user: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ])

  let generalChannel: any | null = channels.find((channel: any) => channel.type === "GENERAL") ?? null
  if (!generalChannel) {
    generalChannel = await prisma.chatChannel.findFirst({
      where: { workspaceId, type: "GENERAL", deletedAt: null },
      include: { members: { include: { user: true } } },
      orderBy: { createdAt: "asc" },
    })
  }

  const generalMessages = generalChannel
    ? await prisma.chatMessage.findMany({
      where: {
        workspaceId,
        channelId: generalChannel.id,
        deletedAt: null,
      },
      include: {
        sender: true,
        parentMessage: { include: { sender: true } },
        reactions: true,
        readReceipts: true,
      },
      orderBy: { createdAt: "asc" },
      take: 25,
    })
    : []

  const chat: WorkspaceChatPanelData = {
    workspaceId,
    channelId: generalChannel?.id ?? null,
    channels: await Promise.all(
      channels.map(async (channel: any) => ({
        id: channel.id,
        name:
          channel.type === "DIRECT"
            ? channel.members
              .map((member: any) => member.user.name ?? member.user.email)
              .filter(Boolean)
              .join(", ")
            : channel.name,
        description: channel.description,
        type: channel.type,
        unreadCount: await prisma.chatMessage.count({
          where: {
            workspaceId,
            channelId: channel.id,
            deletedAt: null,
            senderId: { not: currentUser.id },
            readReceipts: { none: { userId: currentUser.id } },
          },
        }),
        memberNames: channel.members.map((member: any) => member.user.name ?? member.user.email),
      }))
    ),
    channelName: generalChannel?.name ?? "general",
    channelDescription: generalChannel?.description ?? "Kenh trao doi chung cua workspace nay.",
    unreadCount: generalChannel
      ? await prisma.chatMessage.count({
        where: {
          workspaceId,
          channelId: generalChannel.id,
          deletedAt: null,
          senderId: { not: currentUser.id },
          readReceipts: { none: { userId: currentUser.id } },
        },
      })
      : 0,
    messages: generalMessages.map((message: any) => ({
      id: message.id,
      content: message.content ?? "",
      createdAtLabel: formatRelativeDate(message.createdAt),
      readByCount: message.readReceipts?.length ?? 0,
      reactions: Array.from(
        new Map((message.reactions ?? []).map((reaction: any) => [reaction.emoji, reaction.emoji])).values()
      ).map((emoji: any) => ({
        emoji,
        count: (message.reactions ?? []).filter((reaction: any) => reaction.emoji === emoji).length,
        reactedByCurrentUser: (message.reactions ?? []).some(
          (reaction: any) => reaction.emoji === emoji && reaction.userId === currentUser.id
        ),
      })),
      replyTo: message.parentMessage
        ? {
          id: message.parentMessage.id,
          senderName: message.parentMessage.sender?.name ?? message.parentMessage.sender?.email ?? "He thong",
          content: message.parentMessage.content ?? "",
        }
        : null,
      sender: {
        id: message.sender?.id,
        name: message.sender?.name ?? message.sender?.email ?? "He thong",
        initials: getInitials(message.sender?.name ?? message.sender?.email ?? "He thong"),
      },
      isOwn: message.senderId === currentUser.id,
    })),
  }

  return {
    workspace: {
      id: workspace.id,
      slug: workspace.slug,
      name: workspace.name,
      description: workspace.description ?? "Workspace cong tac",
      color: "bg-primary",
      documentsCount: workspace.documents.length,
      tasksCompleted: workspace.tasks.filter((task: any) => task.status === "DONE").length,
      tasksTotal: workspace.tasks.length,
      lastActivity: workspace.activityLogs[0]
        ? formatRelativeDate(workspace.activityLogs[0].createdAt)
        : "Chua co hoat dong",
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
      format: inferDocumentFormat(document.attachments),
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
      assignee: task.assignee?.name ?? task.assignee?.email ?? "Chua phan cong",
      deadline: task.deadline?.toISOString().slice(0, 10) ?? "Chua co",
    })),
    activities: workspace.activityLogs.map((activity: any) => ({
      id: activity.id,
      actor: activity.actor.name ?? activity.actor.email,
      action: activity.message,
      createdAtLabel: formatRelativeDate(activity.createdAt),
    })),
    currentUserRole: currentMembership.role,
    pendingInvitations: pendingInvitations.map((invitation: any) => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt.toISOString(),
      createdAt: invitation.createdAt.toISOString(),
      invitedBy: invitation.invitedBy.name ?? invitation.invitedBy.email,
    })),
    chat,
  }
}

export async function getWorkspaceDocumentData(workspaceId: string, documentId: string): Promise<WorkspaceDocumentData | null> {
  if (!hasDatabaseConfigured()) {
    return {
      id: documentId,
      workspaceId,
      title: "Tài liệu cộng tác",
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Day la tai lieu demo. Ban co the nhap tay va he thong se tu dong luu khi hoan thien API/document route.",
              },
            ],
          },
        ],
      },
      format: "EDITOR",
      fileUrl: null,
      fileName: null,
    }
  }

  const currentUser = await getHeaderUser()
  if (!currentUser) {
    return null
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: currentUser.id,
      },
    },
  })

  if (!membership) {
    return null
  }

  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      workspaceId,
      deletedAt: null,
    },
    include: {
      attachments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  })

  if (!document) {
    return null
  }

  const attachment = document.attachments?.[0] ?? null
  const format = inferDocumentFormat(document.attachments)

  return {
    id: document.id,
    workspaceId: document.workspaceId,
    title: document.title,
    content:
      format === "PDF"
        ? null
        : document.content ?? {
          type: "doc",
          content: [],
        },
    format,
    fileUrl: attachment?.publicUrl ?? null,
    fileName: attachment?.originalName ?? attachment?.fileName ?? null,
  }
}
