import { createClient } from 'redis'

let client

if (!global.redisClient) {
  global.redisClient = createClient({
    url: process.env.REDIS_URL,
  })

  global.redisClient.on('error', (err) => console.log('Redis Error:', err))

  global.redisClient.connect().catch((err) => console.error('Redis connection error:', err))
}

client = global.redisClient

export default client
