import { io } from 'socket.io-client'

let socketInstance

export function getSocket() {
  if (typeof window === 'undefined') {
    return null
  }

  if (!socketInstance) {
    socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin, {
      // Start with polling (works with plain next dev), then upgrade to WS
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
    })

    socketInstance.on('connect_error', (err) => {
      // Suppress noisy errors — Socket.io works even without a custom server via polling
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Socket] Connection issue (non-critical):', err.message)
      }
    })
  }

  return socketInstance
}

export default getSocket