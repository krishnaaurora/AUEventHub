import { Server } from 'socket.io'

let io

function setGlobalIO(instance) {
  globalThis.__auroraSocketIO = instance
}

function resolveIO() {
  return globalThis.__auroraSocketIO || io || null
}

export function initSocket(server) {
  const existing = resolveIO()
  if (existing) {
    io = existing
    return existing
  }

  io = new Server(server, {
    cors: { origin: '*' },
  })
  setGlobalIO(io)

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id)

    socket.on('join:user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`)
      }
    })

    socket.on('join:role', (role) => {
      if (role) {
        socket.join(`role:${role}`)
      }
    })

    socket.on('join:event', (eventId) => {
      if (eventId) {
        socket.join(`event:${eventId}`)
      }
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id)
    })
  })

  return io
}

export function getIO() {
  return resolveIO()
}

export function emitSocketEvent(eventName, payload, room) {
  const socketServer = resolveIO()
  if (!socketServer) {
    return false
  }

  if (room) {
    socketServer.to(room).emit(eventName, payload)
    return true
  }

  socketServer.emit(eventName, payload)
  return true
}