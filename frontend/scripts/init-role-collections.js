import { MongoClient } from 'mongodb'

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI missing in environment.')
  }

  const dbName = process.env.MONGODB_DB || 'ai_eventmang'
  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(dbName)

  const collectionNames = [
    'users',
    'events',
    'event_details',
    'event_approvals',
    'event_views',
    'ai_recommendations',
    'event_trending',
    'event_feedback',
    'event_ai_data',
    'notifications',
    'event_reports',
  ]

  const existingCollections = await db.listCollections({}, { nameOnly: true }).toArray()
  const existingNames = new Set(existingCollections.map((item) => item.name))
  for (const name of collectionNames) {
    if (!existingNames.has(name)) {
      await db.createCollection(name)
    }
  }

  const users = db.collection('users')
  await users.createIndex({ email: 1 }, { unique: true })
  await users.createIndex({ registrationId: 1 })

  const events = db.collection('events')
  await events.createIndex({ status: 1, start_date: 1 })
  await events.createIndex({ category: 1, start_date: 1 })
  await events.createIndex({ status: 1, date: 1 })
  await events.createIndex({ category: 1, date: 1 })
  await events.createIndex({ title: 1 })
  await events.createIndex({ description: 1 })
  await events.createIndex({ venue: 1 })
  await events.createIndex({ organizer: 1, status: 1 })
  await events.createIndex({ organizer_id: 1, status: 1 })
  await events.createIndex({ venue: 1, start_date: 1, start_time: 1 })
  await events.createIndex({ created_at: -1 })

  const eventDetails = db.collection('event_details')
  await eventDetails.createIndex({ event_id: 1 }, { unique: true })

  const eventApprovals = db.collection('event_approvals')
  await eventApprovals.createIndex({ event_id: 1 }, { unique: true })
  await eventApprovals.createIndex({ dean_status: 1, submitted_at: -1 })
  await eventApprovals.createIndex({ registrar_status: 1, submitted_at: -1 })
  await eventApprovals.createIndex({ vc_status: 1, submitted_at: -1 })

  const eventViews = db.collection('event_views')
  await eventViews.createIndex({ event_id: 1 }, { unique: true })
  await eventViews.createIndex({ views: -1 })
  await eventViews.createIndex({ trending_score: -1 })

  const aiRecommendations = db.collection('ai_recommendations')
  await aiRecommendations.createIndex({ student_id: 1 }, { unique: true })

  const eventTrending = db.collection('event_trending')
  await eventTrending.createIndex({ event_id: 1 }, { unique: true })
  await eventTrending.createIndex({ score: -1 })
  await eventTrending.createIndex({ trending_score: -1 })

  const feedback = db.collection('event_feedback')
  await feedback.createIndex({ event_id: 1, createdAt: -1 })
  await feedback.createIndex({ student_id: 1, createdAt: -1 })
  await feedback.createIndex({ event_id: 1, created_at: -1 })
  await feedback.createIndex({ organizer_id: 1, created_at: -1 })

  const eventAiData = db.collection('event_ai_data')
  await eventAiData.createIndex({ event_id: 1 }, { unique: true })
  await eventAiData.createIndex({ organizer: 1 })
  await eventAiData.createIndex({ organizer_id: 1 })

  const notifications = db.collection('notifications')
  await notifications.createIndex({ user_id: 1, created_at: -1 })
  await notifications.createIndex({ role: 1, created_at: -1 })
  await notifications.createIndex({ event_id: 1, created_at: -1 })
  await notifications.createIndex({ is_read: 1, created_at: -1 })

  const eventReports = db.collection('event_reports')
  await eventReports.createIndex({ event_id: 1 }, { unique: true })
  await eventReports.createIndex({ generated_at: -1 })
  await eventReports.createIndex({ top_department: 1, generated_at: -1 })

  const dummyEmail = 'student@aurora.edu.in'
  const existingDummy = await users.findOne({ email: dummyEmail })
  if (!existingDummy) {
    await users.insertOne({
      fullName: 'Demo Student',
      email: dummyEmail,
      password: 'Student@123',
      role: 'student',
      registrationId: 'AU-0001',
      clubName: null,
      department: 'Computer Science & Engineering',
      year: '3rd Year',
      avatar: '/assets/avatars/person1.png',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  const collections = (await db.listCollections({}, { nameOnly: true }).toArray())
    .map((item) => item.name)
    .sort()

  console.log(
    JSON.stringify(
      {
        ok: true,
        db: dbName,
        collections,
      },
      null,
      2,
    ),
  )

  await client.close()
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error)
  process.exit(1)
})
