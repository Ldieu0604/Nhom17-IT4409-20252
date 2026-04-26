const { createServer } = require("http")
const { Server } = require("socket.io")

const port = process.env.SOCKET_PORT || 4001
const httpServer = createServer()

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    credentials: true,
  },
})

const roomPresence = new Map()

function getRoomKey(workspaceId, documentId) {
  return `${workspaceId}:${documentId || "general"}`
}

function getChatRoomKey(workspaceId, channelId) {
  return `chat:${workspaceId}:${channelId || "general"}`
}

function normalizePresence(users) {
  const grouped = new Map()

  for (const item of users) {
    const key = item.user?.id || item.socketId
    const current = grouped.get(key)

    if (!current) {
      grouped.set(key, {
        socketId: item.socketId,
        user: item.user || { name: "Anonymous" },
        isOnline: Boolean(item.isOnline),
        lastSeenAt: item.lastSeenAt || new Date().toISOString(),
      })
      continue
    }

    const nextIsOnline = current.isOnline || Boolean(item.isOnline)
    const nextLastSeenAt =
      nextIsOnline && item.isOnline
        ? item.lastSeenAt || current.lastSeenAt
        : current.lastSeenAt > (item.lastSeenAt || current.lastSeenAt)
          ? current.lastSeenAt
          : item.lastSeenAt || current.lastSeenAt

    grouped.set(key, {
      socketId: item.socketId,
      user: item.user || current.user,
      isOnline: nextIsOnline,
      lastSeenAt: nextLastSeenAt,
    })
  }

  return Array.from(grouped.values())
}

io.on("connection", (socket) => {
  const { workspaceId, documentId } = socket.handshake.query

  socket.on("document:join", ({ workspaceId: wsId, documentId: docId, user }) => {
    const roomKey = getRoomKey(wsId || workspaceId, docId || documentId)
    socket.join(roomKey)

    const currentUsers = roomPresence.get(roomKey) || []
    const nextUsers = [
      ...currentUsers.filter((item) => item.socketId !== socket.id),
      {
        socketId: socket.id,
        user: user || { name: "Anonymous" },
      },
    ]

    roomPresence.set(roomKey, nextUsers)
    io.to(roomKey).emit("presence:update", nextUsers)
  })

  socket.on("document:update", ({ workspaceId: wsId, documentId: docId, payload }) => {
    const roomKey = getRoomKey(wsId || workspaceId, docId || documentId)
    socket.to(roomKey).emit("document:patch", payload)
  })

  socket.on("activity:push", ({ workspaceId: wsId, payload }) => {
    io.to(getRoomKey(wsId || workspaceId)).emit("activity:new", payload)
  })

  socket.on("chat:join", ({ workspaceId: wsId, channelId, user }) => {
    const roomKey = getChatRoomKey(wsId || workspaceId, channelId)
    socket.join(roomKey)

    const currentUsers = roomPresence.get(roomKey) || []
    const nextUsers = normalizePresence([
      ...currentUsers.filter(
        (item) => item.socketId !== socket.id && item.user?.id !== user?.id
      ),
      {
        socketId: socket.id,
        user: user || { name: "Anonymous" },
        isOnline: true,
        lastSeenAt: new Date().toISOString(),
      },
    ])

    roomPresence.set(roomKey, nextUsers)
    io.to(roomKey).emit("chat:presence", nextUsers)
  })

  socket.on("chat:message", ({ workspaceId: wsId, channelId, payload }) => {
    const roomKey = getChatRoomKey(wsId || workspaceId, channelId)
    socket.to(roomKey).emit("chat:new", payload)
  })

  socket.on("disconnect", () => {
    for (const [roomKey, users] of roomPresence.entries()) {
      const currentEntry = users.find((item) => item.socketId === socket.id)
      const remainingUsers = users.filter((item) => item.socketId !== socket.id)
      let nextUsers = remainingUsers

      if (currentEntry?.user?.id) {
        nextUsers = normalizePresence([
          ...remainingUsers.filter((item) => item.user?.id !== currentEntry.user.id),
          {
            ...currentEntry,
            isOnline: false,
            lastSeenAt: new Date().toISOString(),
          },
        ])
      }

      if (nextUsers.length === 0) {
        roomPresence.delete(roomKey)
      } else {
        roomPresence.set(roomKey, nextUsers)
      }
      if (roomKey.startsWith("chat:")) {
        io.to(roomKey).emit("chat:presence", nextUsers)
      } else {
        io.to(roomKey).emit("presence:update", nextUsers)
      }
    }
  })
})

httpServer.listen(port, () => {
  console.log(`Realtime server running on http://localhost:${port}`)
})
