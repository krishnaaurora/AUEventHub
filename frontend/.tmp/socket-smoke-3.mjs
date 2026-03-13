import { io } from 'socket.io-client'

const mode = process.argv[2]
const baseUrl = process.argv[3] || 'http://localhost:3004'

function fail(message) {
  console.error(message)
  process.exit(1)
}

async function testTrending() {
  const socket = io(baseUrl, { transports: ['websocket'] })
  const timeout = setTimeout(() => {
    socket.close()
    fail('Timed out waiting for event-trending:updated')
  }, 15000)

  socket.on('connect', async () => {
    socket.emit('join:event', 'event123')
    const response = await fetch(`${baseUrl}/api/student/event-trending`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: 'event123', score: 91, reason: 'Realtime trending smoke test' }),
    })
    const json = await response.json()
    if (!response.ok) {
      clearTimeout(timeout)
      socket.close()
      fail(JSON.stringify(json))
    }
  })

  socket.on('event-trending:updated', (payload) => {
    if (String(payload?.event_id) === 'event123' && Number(payload?.score) === 91) {
      console.log(JSON.stringify(payload))
      clearTimeout(timeout)
      socket.close()
      process.exit(0)
    }
  })
}

async function testEventDetails() {
  const socket = io(baseUrl, { transports: ['websocket'] })
  const timeout = setTimeout(() => {
    socket.close()
    fail('Timed out waiting for event-details:updated')
  }, 15000)

  socket.on('connect', async () => {
    socket.emit('join:event', 'event123')
    const response = await fetch(`${baseUrl}/api/student/event-details`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: 'event123',
        speakers: ['Realtime QA Speaker'],
        schedule: [{ time: '12:00', activity: 'Realtime Detail Update' }],
        instructions: 'Bring your updated badge',
      }),
    })
    const json = await response.json()
    if (!response.ok) {
      clearTimeout(timeout)
      socket.close()
      fail(JSON.stringify(json))
    }
  })

  socket.on('event-details:updated', (payload) => {
    if (String(payload?.event_id) === 'event123' && String(payload?.instructions) === 'Bring your updated badge') {
      console.log(JSON.stringify(payload))
      clearTimeout(timeout)
      socket.close()
      process.exit(0)
    }
  })
}

async function testBulkSync() {
  const socket = io(baseUrl, { transports: ['websocket'] })
  const timeout = setTimeout(() => {
    socket.close()
    fail('Timed out waiting for bulk-sync:completed')
  }, 15000)

  socket.on('connect', async () => {
    const response = await fetch(`${baseUrl}/api/student/transactions/setup`, {
      method: 'POST',
    })
    const json = await response.json()
    if (!response.ok) {
      clearTimeout(timeout)
      socket.close()
      fail(JSON.stringify(json))
    }
  })

  socket.on('bulk-sync:completed', (payload) => {
    if (String(payload?.scope) === 'student-transactions') {
      console.log(JSON.stringify(payload))
      clearTimeout(timeout)
      socket.close()
      process.exit(0)
    }
  })
}

if (mode === 'trending') {
  await testTrending()
} else if (mode === 'details') {
  await testEventDetails()
} else if (mode === 'bulk') {
  await testBulkSync()
} else {
  fail('Unknown mode')
}
