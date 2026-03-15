import clientPromise from '../../../lib/mongodb.js'
import { getMockMongoDatabase, MOCK_DB_MODE } from './mock-store'

let dbInstance

export const COLLECTIONS = {
  users: 'users',
  events: 'events',
  eventDetails: 'event_details',
  eventApprovals: 'event_approvals',
  eventViews: 'event_views',
  aiRecommendations: 'ai_recommendations',
  eventTrending: 'event_trending',
  feedback: 'event_feedback',
  eventAiData: 'event_ai_data',
  notifications: 'notifications',
  eventReports: 'event_reports',
}

async function getDb() {
  if (!dbInstance) {
    if (!clientPromise) {
      dbInstance = getMockMongoDatabase()
    } else {
      const client = await clientPromise
      dbInstance = client.db(process.env.MONGODB_DB || 'ai_eventmang')
    }
  }
  return dbInstance
}

export async function pingMongo() {
  const db = await getDb()
  await db.command({ ping: 1 })
  return true
}

export async function ensureStudentEventCollections() {
  const db = await getDb()
  const names = Object.values(COLLECTIONS).filter((name) => name !== COLLECTIONS.users)

  const existingCollections = await db.listCollections({}, { nameOnly: true }).toArray()
  const existingNames = new Set(existingCollections.map((item) => item.name))

  for (const name of names) {
    if (!existingNames.has(name)) {
      await db.createCollection(name)
    }
  }

  const events = db.collection(COLLECTIONS.events)
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

  const eventDetails = db.collection(COLLECTIONS.eventDetails)
  await eventDetails.createIndex({ event_id: 1 }, { unique: true })

  const eventApprovals = db.collection(COLLECTIONS.eventApprovals)
  await eventApprovals.createIndex({ event_id: 1 }, { unique: true })
  await eventApprovals.createIndex({ dean_status: 1, submitted_at: -1 })
  await eventApprovals.createIndex({ registrar_status: 1, submitted_at: -1 })
  await eventApprovals.createIndex({ vc_status: 1, submitted_at: -1 })

  const eventViews = db.collection(COLLECTIONS.eventViews)
  await eventViews.createIndex({ event_id: 1 }, { unique: true })
  await eventViews.createIndex({ views: -1 })
  await eventViews.createIndex({ trending_score: -1 })

  const aiRecommendations = db.collection(COLLECTIONS.aiRecommendations)
  await aiRecommendations.createIndex({ student_id: 1 }, { unique: true })

  const eventTrending = db.collection(COLLECTIONS.eventTrending)
  await eventTrending.createIndex({ event_id: 1 }, { unique: true })
  await eventTrending.createIndex({ score: -1 })
  await eventTrending.createIndex({ trending_score: -1 })

  const feedback = db.collection(COLLECTIONS.feedback)
  await feedback.createIndex({ event_id: 1, createdAt: -1 })
  await feedback.createIndex({ student_id: 1, createdAt: -1 })
  await feedback.createIndex({ event_id: 1, created_at: -1 })
  await feedback.createIndex({ organizer_id: 1, created_at: -1 })

  const eventAiData = db.collection(COLLECTIONS.eventAiData)
  await eventAiData.createIndex({ event_id: 1 }, { unique: true })
  await eventAiData.createIndex({ organizer: 1 })
  await eventAiData.createIndex({ organizer_id: 1 })

  const notifications = db.collection(COLLECTIONS.notifications)
  await notifications.createIndex({ user_id: 1, created_at: -1 })
  await notifications.createIndex({ role: 1, created_at: -1 })
  await notifications.createIndex({ event_id: 1, created_at: -1 })
  await notifications.createIndex({ is_read: 1, created_at: -1 })

  const eventReports = db.collection(COLLECTIONS.eventReports)
  await eventReports.createIndex({ event_id: 1 }, { unique: true })
  await eventReports.createIndex({ generated_at: -1 })
  await eventReports.createIndex({ top_department: 1, generated_at: -1 })

  if (MOCK_DB_MODE) {
    const eventsCount = await events.countDocuments({})
    if (eventsCount === 0) {
      await events.insertMany([])
    }
  }
}

export async function ensureOrganizerEventCollections() {
  return ensureStudentEventCollections()
}

export async function ensureAuthCollections() {
  const db = await getDb()
  const usersCollection = db.collection(COLLECTIONS.users)
  await usersCollection.createIndex({ email: 1 }, { unique: true })
  await usersCollection.createIndex({ registrationId: 1 })

  const dummyEmail = 'student@aurora.edu.in'
  const adminEmail = 'admin@aurora.edu.in'
  const existing = await usersCollection.findOne({ email: dummyEmail })
  if (!existing) {
    await usersCollection.insertOne({
      fullName: 'Demo Student',
      email: dummyEmail,
      password: 'Student@123',
      role: 'student',
      accountStatus: 'active',
      registrationId: 'AU-0001',
      clubName: null,
      department: "Computer Science & Engineering",
      year: "3rd Year",
      avatar: "/assets/avatars/person1.png",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  } else {
    await usersCollection.updateOne({
      email: dummyEmail
    }, {
      $set: {
        department: existing.department || "Computer Science & Engineering",
        year: existing.year || "3rd Year",
        avatar: existing.avatar || "/assets/avatars/person1.png",
        accountStatus: existing.accountStatus || 'active',
        updatedAt: new Date()
      }
    });
  }

  const existingAdmin = await usersCollection.findOne({ email: adminEmail })
  if (!existingAdmin) {
    await usersCollection.insertOne({
      fullName: 'Aurora Admin',
      email: adminEmail,
      password: 'admin123',
      role: 'admin',
      accountStatus: 'active',
      registrationId: 'ADMIN-0001',
      clubName: null,
      department: 'Administration',
      year: null,
      avatar: '/assets/avatars/person1.png',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  } else {
    await usersCollection.updateOne(
      { email: adminEmail },
      {
        $set: {
          fullName: existingAdmin.fullName || 'Aurora Admin',
          password: existingAdmin.password || 'admin123',
          role: 'admin',
          registrationId: existingAdmin.registrationId || 'ADMIN-0001',
          department: existingAdmin.department || 'Administration',
          avatar: existingAdmin.avatar || '/assets/avatars/person1.png',
          accountStatus: existingAdmin.accountStatus || 'active',
          updatedAt: new Date(),
        },
      },
    )
  }
}

export async function getUsersCollection() {
  const db = await getDb()
  return db.collection(COLLECTIONS.users)
}

export async function getEventsCollection() {
  const db = await getDb()
  return db.collection(COLLECTIONS.events)
}

export async function getEventDetailsCollection() {
  const db = await getDb()
  return db.collection(COLLECTIONS.eventDetails)
}

export async function getEventApprovalsCollection() {
  const db = await getDb()
  return db.collection(COLLECTIONS.eventApprovals)
}

export async function getEventViewsCollection() {
  const db = await getDb()
  return db.collection(COLLECTIONS.eventViews)
}

export async function getAiRecommendationsCollection() {
  const db = await getDb()
  return db.collection(COLLECTIONS.aiRecommendations)
}

export async function getEventTrendingCollection() {
  const db = await getDb()
  return db.collection(COLLECTIONS.eventTrending)
}

export async function getFeedbackCollection() {
  const db = await getDb()
  return db.collection(COLLECTIONS.feedback)
}

export async function getEventAiDataCollection() {
  const db = await getDb()
  return db.collection(COLLECTIONS.eventAiData)
}

export async function getNotificationsCollection() {
  const db = await getDb()
  return db.collection(COLLECTIONS.notifications)
}

export async function getEventReportsCollection() {
  const db = await getDb()
  return db.collection(COLLECTIONS.eventReports)
}
