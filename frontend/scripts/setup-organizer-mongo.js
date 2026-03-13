import { MongoClient } from 'mongodb'

async function main() {
  const uri = process.env.MONGODB_URI
  const dbName = process.env.MONGODB_DB || 'ai_eventmang'

  if (!uri) {
    throw new Error('MONGODB_URI missing in environment.')
  }

  const client = new MongoClient(uri)
  await client.connect()

  try {
    const db = client.db(dbName)
    const collections = ['events', 'event_details', 'event_ai_data', 'event_feedback']
    const existing = new Set(
      (await db.listCollections({}, { nameOnly: true }).toArray()).map((item) => item.name),
    )

    for (const name of collections) {
      if (!existing.has(name)) {
        await db.createCollection(name)
      }
    }

    const events = db.collection('events')
    await events.createIndex({ status: 1, start_date: 1 })
    await events.createIndex({ category: 1, start_date: 1 })
    await events.createIndex({ organizer_id: 1, status: 1 })
    await events.createIndex({ venue: 1, start_date: 1, start_time: 1 })
    await events.createIndex({ created_at: -1 })

    const eventDetails = db.collection('event_details')
    await eventDetails.createIndex({ event_id: 1 }, { unique: true })

    const eventAiData = db.collection('event_ai_data')
    await eventAiData.createIndex({ event_id: 1 }, { unique: true })
    await eventAiData.createIndex({ organizer_id: 1 })

    const eventFeedback = db.collection('event_feedback')
    await eventFeedback.createIndex({ event_id: 1, created_at: -1 })
    await eventFeedback.createIndex({ student_id: 1, created_at: -1 })

    await events.updateOne(
      { _id: 'event123' },
      {
        $setOnInsert: {
          _id: 'event123',
          title: 'AI Hackathon',
          category: 'Technical',
          department: 'CSE',
          venue: 'Main Auditorium',
          start_date: '2026-05-20',
          end_date: '2026-05-21',
          start_time: '10:00',
          end_time: '18:00',
          organizer_id: 'org123',
          status: 'approved',
          created_at: '2026-03-12',
          createdAt: new Date('2026-03-12T00:00:00Z'),
          updatedAt: new Date('2026-03-12T00:00:00Z'),
        },
      },
      { upsert: true },
    )

    console.log(
      JSON.stringify(
        {
          ok: true,
          dbName,
          collections,
          sampleEventId: 'event123',
        },
        null,
        2,
      ),
    )
  } finally {
    await client.close()
  }
}

main().catch((error) => {
  console.error(error.stack || error.message)
  process.exit(1)
})