const {
  PrismaClient,
  WorkspaceRole,
  WorkspaceVisibility,
  TaskPriority,
  TaskStatus,
  TaskHistoryType,
  TaskDependencyType,
  DocumentStatus,
  NotificationType,
  NotificationStatus,
  AttachmentKind,
  ChannelType,
  MessageType,
  ActivityType,
} = require("@prisma/client")

const prisma = new PrismaClient()

async function clearDatabase() {
  await prisma.chatMessageReaction.deleteMany()
  await prisma.chatMessageRead.deleteMany()
  await prisma.attachment.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.chatMessage.deleteMany()
  await prisma.chatChannelMember.deleteMany()
  await prisma.chatChannel.deleteMany()
  await prisma.commentReaction.deleteMany()
  await prisma.commentMention.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.taskHistory.deleteMany()
  await prisma.taskDependency.deleteMany()
  await prisma.taskChecklistItem.deleteMany()
  await prisma.taskChecklist.deleteMany()
  await prisma.taskWatcher.deleteMany()
  await prisma.taskLabelAssignment.deleteMany()
  await prisma.taskLabel.deleteMany()
  await prisma.documentVersion.deleteMany()
  await prisma.activityLog.deleteMany()
  await prisma.presence.deleteMany()
  await prisma.workspaceInvitation.deleteMany()
  await prisma.workspaceSetting.deleteMany()
  await prisma.task.deleteMany()
  await prisma.document.deleteMany()
  await prisma.workspaceMember.deleteMany()
  await prisma.workspace.deleteMany()
  await prisma.user.deleteMany()
}

async function main() {
  await clearDatabase()

  const users = await Promise.all([
    prisma.user.create({
      data: {
        clerkId: "seed_clerk_admin",
        email: "admin@it4409.local",
        name: "Nguyễn Quản Trị",
        username: "admin",
        avatarUrl: null,
      },
    }),
    prisma.user.create({
      data: {
        clerkId: "seed_clerk_dev1",
        email: "dev1@it4409.local",
        name: "Trần Lập Trình",
        username: "dev1",
        avatarUrl: null,
      },
    }),
    prisma.user.create({
      data: {
        clerkId: "seed_clerk_dev2",
        email: "dev2@it4409.local",
        name: "Lê Kiểm Thử",
        username: "dev2",
        avatarUrl: null,
      },
    }),
    prisma.user.create({
      data: {
        clerkId: "seed_clerk_viewer",
        email: "viewer@it4409.local",
        name: "Phạm Quan Sát",
        username: "viewer",
        avatarUrl: null,
      },
    }),
  ])

  const [owner, memberA, memberB, viewer] = users

  const workspace = await prisma.workspace.create({
    data: {
      name: "IT4409 Project Workspace",
      slug: "it4409-project-workspace",
      description: "Workspace mẫu đã khóa schema database cho đề tài website quản lý công việc.",
      visibility: WorkspaceVisibility.PRIVATE,
      ownerId: owner.id,
    },
  })

  await prisma.workspaceSetting.create({
    data: {
      workspaceId: workspace.id,
      allowMemberInvites: true,
      allowViewerComments: true,
      enableDocumentVersioning: true,
      enableTaskAutoWatch: true,
      defaultTaskStatus: TaskStatus.TODO,
      defaultTaskPriority: TaskPriority.MEDIUM,
    },
  })

  await prisma.workspaceMember.createMany({
    data: [
      { workspaceId: workspace.id, userId: owner.id, role: WorkspaceRole.OWNER },
      { workspaceId: workspace.id, userId: memberA.id, role: WorkspaceRole.ADMIN },
      { workspaceId: workspace.id, userId: memberB.id, role: WorkspaceRole.MEMBER },
      { workspaceId: workspace.id, userId: viewer.id, role: WorkspaceRole.VIEWER },
    ],
  })

  await prisma.workspaceInvitation.create({
    data: {
      workspaceId: workspace.id,
      email: "newmember@it4409.local",
      role: WorkspaceRole.MEMBER,
      token: "seed-invitation-token",
      invitedById: owner.id,
      expiresAt: new Date("2026-12-31T23:59:59.000Z"),
    },
  })

  const labels = await Promise.all([
    prisma.taskLabel.create({
      data: {
        workspaceId: workspace.id,
        name: "Backend",
        color: "#2563eb",
        description: "Các công việc backend và API",
        createdById: owner.id,
      },
    }),
    prisma.taskLabel.create({
      data: {
        workspaceId: workspace.id,
        name: "Frontend",
        color: "#16a34a",
        description: "Các công việc giao diện và trải nghiệm người dùng",
        createdById: owner.id,
      },
    }),
    prisma.taskLabel.create({
      data: {
        workspaceId: workspace.id,
        name: "Realtime",
        color: "#dc2626",
        description: "Các công việc liên quan Socket.IO và đồng bộ realtime",
        createdById: owner.id,
      },
    }),
  ])

  const [backendLabel, frontendLabel, realtimeLabel] = labels

  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        workspaceId: workspace.id,
        title: "Hoàn thiện API quản lý workspace",
        description: "Tạo đầy đủ luồng member, invite, permission và activity log.",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        startDate: new Date("2026-04-25T08:00:00.000Z"),
        deadline: new Date("2026-04-30T17:00:00.000Z"),
        estimatedMinutes: 720,
        actualMinutes: 180,
        position: 1,
        assigneeId: memberA.id,
        createdById: owner.id,
      },
    }),
    prisma.task.create({
      data: {
        workspaceId: workspace.id,
        title: "Xây dựng kéo thả cho task board",
        description: "Tích hợp dnd-kit và cập nhật position sau khi di chuyển task.",
        status: TaskStatus.TODO,
        priority: TaskPriority.URGENT,
        deadline: new Date("2026-05-02T17:00:00.000Z"),
        estimatedMinutes: 900,
        position: 2,
        assigneeId: memberB.id,
        createdById: owner.id,
      },
    }),
    prisma.task.create({
      data: {
        workspaceId: workspace.id,
        title: "Nối editor với Yjs và Socket.IO",
        description: "Biến editor hiện tại thành collaborative editor thật sự.",
        status: TaskStatus.REVIEW,
        priority: TaskPriority.HIGH,
        deadline: new Date("2026-05-05T17:00:00.000Z"),
        estimatedMinutes: 1200,
        actualMinutes: 900,
        position: 1,
        assigneeId: memberA.id,
        createdById: owner.id,
      },
    }),
  ])

  const [apiTask, boardTask, editorTask] = tasks

  await prisma.taskLabelAssignment.createMany({
    data: [
      { taskId: apiTask.id, labelId: backendLabel.id, assignedById: owner.id },
      { taskId: boardTask.id, labelId: frontendLabel.id, assignedById: owner.id },
      { taskId: boardTask.id, labelId: realtimeLabel.id, assignedById: owner.id },
      { taskId: editorTask.id, labelId: realtimeLabel.id, assignedById: owner.id },
    ],
  })

  await prisma.taskWatcher.createMany({
    data: [
      { taskId: apiTask.id, userId: owner.id },
      { taskId: apiTask.id, userId: memberA.id },
      { taskId: boardTask.id, userId: memberB.id },
      { taskId: editorTask.id, userId: owner.id },
    ],
  })

  const checklist = await prisma.taskChecklist.create({
    data: {
      taskId: boardTask.id,
      title: "Các bước triển khai kéo thả",
      position: 1,
    },
  })

  await prisma.taskChecklistItem.createMany({
    data: [
      {
        checklistId: checklist.id,
        content: "Cài dnd-kit và dựng cấu trúc drag source/drop target",
        isCompleted: true,
        completedAt: new Date("2026-04-25T09:30:00.000Z"),
        completedById: memberB.id,
        position: 1,
      },
      {
        checklistId: checklist.id,
        content: "Cập nhật position theo từng cột sau khi thả",
        position: 2,
      },
      {
        checklistId: checklist.id,
        content: "Gửi patch realtime cho các client khác",
        position: 3,
      },
    ],
  })

  await prisma.taskDependency.create({
    data: {
      taskId: editorTask.id,
      dependsOnTaskId: apiTask.id,
      type: TaskDependencyType.BLOCKS,
      createdById: owner.id,
    },
  })

  await prisma.taskHistory.createMany({
    data: [
      {
        taskId: apiTask.id,
        workspaceId: workspace.id,
        actorId: owner.id,
        type: TaskHistoryType.CREATED,
        message: "Tạo task backend ban đầu",
      },
      {
        taskId: apiTask.id,
        workspaceId: workspace.id,
        actorId: memberA.id,
        type: TaskHistoryType.STATUS_CHANGED,
        fromValue: "TODO",
        toValue: "IN_PROGRESS",
        message: "Đã bắt đầu triển khai API workspace",
      },
      {
        taskId: boardTask.id,
        workspaceId: workspace.id,
        actorId: owner.id,
        type: TaskHistoryType.ASSIGNEE_CHANGED,
        fromValue: null,
        toValue: memberB.email,
        message: "Phân công task board cho thành viên frontend",
      },
    ],
  })

  const document = await prisma.document.create({
    data: {
      workspaceId: workspace.id,
      title: "Đặc tả hệ thống quản lý công việc",
      summary: "Tài liệu mô tả kiến trúc, phạm vi chức năng và định hướng phát triển.",
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Đây là tài liệu mẫu đã được seed để nhóm dùng thử trên schema database mới.",
              },
            ],
          },
        ],
      },
      status: DocumentStatus.ACTIVE,
      createdById: owner.id,
      updatedById: owner.id,
    },
  })

  await prisma.documentVersion.createMany({
    data: [
      {
        documentId: document.id,
        workspaceId: workspace.id,
        versionNumber: 1,
        title: "Đặc tả hệ thống quản lý công việc",
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Phiên bản 1: khởi tạo tài liệu." },
              ],
            },
          ],
        },
        createdById: owner.id,
      },
      {
        documentId: document.id,
        workspaceId: workspace.id,
        versionNumber: 2,
        title: "Đặc tả hệ thống quản lý công việc",
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Phiên bản 2: bổ sung phần realtime và kéo thả." },
              ],
            },
          ],
        },
        createdById: memberA.id,
      },
    ],
  })

  const rootComment = await prisma.comment.create({
    data: {
      workspaceId: workspace.id,
      taskId: apiTask.id,
      authorId: owner.id,
      content: "Task này cần hoàn thành role guard trước khi nối invitation flow.",
    },
  })

  const replyComment = await prisma.comment.create({
    data: {
      workspaceId: workspace.id,
      taskId: apiTask.id,
      parentCommentId: rootComment.id,
      authorId: memberA.id,
      content: "Đã rõ, em sẽ tách guard theo OWNER, ADMIN, MEMBER, VIEWER.",
    },
  })

  await prisma.commentMention.create({
    data: {
      commentId: rootComment.id,
      userId: memberA.id,
    },
  })

  await prisma.commentReaction.create({
    data: {
      commentId: replyComment.id,
      userId: owner.id,
      emoji: "👍",
    },
  })

  const channel = await prisma.chatChannel.create({
    data: {
      workspaceId: workspace.id,
      name: "general",
      slug: "general",
      type: ChannelType.GENERAL,
      description: "Kênh trao đổi chung của nhóm dự án.",
      createdById: owner.id,
    },
  })

  await prisma.chatChannelMember.createMany({
    data: users.map((user) => ({
      channelId: channel.id,
      userId: user.id,
    })),
  })

  const message = await prisma.chatMessage.create({
    data: {
      workspaceId: workspace.id,
      channelId: channel.id,
      senderId: owner.id,
      type: MessageType.TEXT,
      content: "Schema database đã được chốt. Từ đây cả nhóm có thể code tiếp trên cùng một nền dữ liệu.",
    },
  })

  await prisma.chatMessageRead.createMany({
    data: [
      { messageId: message.id, userId: owner.id },
      { messageId: message.id, userId: memberA.id },
    ],
  })

  await prisma.chatMessageReaction.create({
    data: {
      messageId: message.id,
      userId: memberB.id,
      emoji: "🔥",
    },
  })

  await prisma.attachment.createMany({
    data: [
      {
        workspaceId: workspace.id,
        uploaderId: owner.id,
        documentId: document.id,
        kind: AttachmentKind.FILE,
        fileName: "dac-ta-he-thong.pdf",
        originalName: "Đặc tả hệ thống.pdf",
        mimeType: "application/pdf",
        extension: "pdf",
        sizeBytes: BigInt(245760),
        storageProvider: "local",
        storageKey: "seed/dac-ta-he-thong.pdf",
        publicUrl: "/seed/dac-ta-he-thong.pdf",
      },
      {
        workspaceId: workspace.id,
        uploaderId: memberB.id,
        taskId: boardTask.id,
        kind: AttachmentKind.IMAGE,
        fileName: "task-board-mockup.png",
        originalName: "task-board-mockup.png",
        mimeType: "image/png",
        extension: "png",
        sizeBytes: BigInt(102400),
        storageProvider: "local",
        storageKey: "seed/task-board-mockup.png",
        publicUrl: "/seed/task-board-mockup.png",
      },
    ],
  })

  await prisma.notification.createMany({
    data: [
      {
        recipientId: memberA.id,
        actorId: owner.id,
        workspaceId: workspace.id,
        taskId: apiTask.id,
        type: NotificationType.TASK_ASSIGNED,
        status: NotificationStatus.UNREAD,
        title: "Bạn được giao task backend",
        content: "Hoàn thiện API quản lý workspace",
        actionUrl: `/workspaces/${workspace.id}`,
      },
      {
        recipientId: memberB.id,
        actorId: owner.id,
        workspaceId: workspace.id,
        commentId: rootComment.id,
        type: NotificationType.COMMENT_REPLY,
        status: NotificationStatus.UNREAD,
        title: "Có trao đổi mới trong task",
        content: "Task backend vừa có comment mới",
        actionUrl: `/workspaces/${workspace.id}`,
      },
    ],
  })

  await prisma.activityLog.createMany({
    data: [
      {
        workspaceId: workspace.id,
        actorId: owner.id,
        type: ActivityType.WORKSPACE_CREATED,
        message: "đã tạo workspace dự án IT4409",
      },
      {
        workspaceId: workspace.id,
        actorId: owner.id,
        type: ActivityType.TASK_CREATED,
        taskId: apiTask.id,
        message: `đã tạo task "${apiTask.title}"`,
      },
      {
        workspaceId: workspace.id,
        actorId: owner.id,
        type: ActivityType.DOCUMENT_CREATED,
        documentId: document.id,
        message: `đã tạo tài liệu "${document.title}"`,
      },
      {
        workspaceId: workspace.id,
        actorId: memberA.id,
        type: ActivityType.COMMENT_CREATED,
        taskId: apiTask.id,
        commentId: replyComment.id,
        message: "đã phản hồi vào task backend",
      },
    ],
  })

  await prisma.presence.createMany({
    data: [
      {
        workspaceId: workspace.id,
        userId: owner.id,
        socketId: "seed-socket-owner",
        documentId: document.id,
        channelId: channel.id,
        status: "online",
      },
      {
        workspaceId: workspace.id,
        userId: memberA.id,
        socketId: "seed-socket-admin",
        channelId: channel.id,
        status: "online",
      },
    ],
  })

  console.log("Seed completed successfully.")
  console.log(`Workspace: ${workspace.name}`)
  console.log(`Users: ${users.length}`)
  console.log(`Tasks: ${tasks.length}`)
  console.log(`Document: ${document.title}`)
}

main()
  .catch((error) => {
    console.error("Seed failed:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
