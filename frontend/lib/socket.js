import { io } from 'socket.io-client'

let socketInstance

export function getSocket() {
  if (typeof window === 'undefined') {
    return null
  }

  if (!socketInstance) {
    socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin, {
      transports: ['websocket', 'polling'],
    })
  }

  return socketInstance
}

export default getSocket