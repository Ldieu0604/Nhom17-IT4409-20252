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

  socket.on("disconnect", () => {
    for (const [roomKey, users] of roomPresence.entries()) {
      const nextUsers = users.filter((item) => item.socketId !== socket.id)
      if (nextUsers.length === 0) {
        roomPresence.delete(roomKey)
      } else {
        roomPresence.set(roomKey, nextUsers)
      }
      io.to(roomKey).emit("presence:update", nextUsers)
    }
  })
})

httpServer.listen(port, () => {
  console.log(`Realtime server running on http://localhost:${port}`)
})
