import { ensureStudentTransactionTables, getPool } from '../app/api/_lib/pg.js'
import { MongoClient } from 'mongodb'

async function verifyMongo() {
  const uri = process.env.MONGODB_URI
  const dbName = process.env.MONGODB_DB || 'ai_eventmang'
  const client = new MongoClient(uri)
  await client.connect()
  try {
    const db = client.db(dbName)
    const requiredCollections = [
      'users',
      'events',
      'event_details',
      'event_ai_data',
      'event_approvals',
      'event_views',
      'event_trending',
      'ai_recommendations',
      'event_feedback',
      'feedback',
      'notifications',
      'event_reports',
    ]

    const collections = (await db.listCollections({}, { nameOnly: true }).toArray())
      .map((item) => item.name)
      .sort()

    const missing = requiredCollections.filter((name) => !collections.includes(name))
    return { dbName, collections, missing }
  } finally {
    await client.close()
  }
}

async function verifyPostgres() {
  await ensureStudentTransactionTables()
  const pool = getPool()
  try {
    const result = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('registrations','attendance','certificates','notifications') ORDER BY table_name",
    )
    return result.rows.map((row) => row.table_name)
  } finally {
    await pool.end()
  }
}

async function main() {
  const mongo = await verifyMongo()
  const pgTables = await verifyPostgres()
  console.log(
    JSON.stringify(
      {
        ok: true,
        mongoDb: mongo.dbName,
        mongoCollections: mongo.collections,
        mongoMissingCollections: mongo.missing,
        postgresTables: pgTables,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error)
  process.exit(1)
})
