import http from 'http'
import next from 'next'
import { initSocket } from './server/socket.js'

const port = Number.parseInt(process.env.PORT || '3000', 10)
const lifecycleEvent = process.env.npm_lifecycle_event
const dev = process.env.NODE_ENV
  ? process.env.NODE_ENV !== 'production'
  : lifecycleEvent !== 'start'

const app = next({ dev, hostname: '0.0.0.0', port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    handle(req, res)
  })

  initSocket(server)

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
  })
})