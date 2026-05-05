export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import {
  ensureStudentEventCollections,
  pingMongo,
  getUsersCollection,
  getEventsCollection,
  getEventDetailsCollection,
  getEventAiDataCollection,
  getEventApprovalsCollection,
  getEventViewsCollection,
  getEventTrendingCollection,
  getAiRecommendationsCollection,
  getFeedbackCollection,
  getEventReportsCollection,
  getNotificationsCollection,
} from '../../../_lib/db'
import { ensureStudentTransactionTables, getPool, pingPostgres } from '../../../_lib/pg'
import { requireAdminAccess } from '../../_lib/auth'

export async function GET() {
  try {
    const auth = await requireAdminAccess()
    if (auth.response) return auth.response

    await ensureStudentEventCollections()
    await ensureStudentTransactionTables()

    const pool = getPool()
    const [
      usersCollection,
      eventsCollection,
      eventDetailsCollection,
      eventAiDataCollection,
      eventApprovalsCollection,
      eventViewsCollection,
      eventTrendingCollection,
      aiRecommendationsCollection,
      eventFeedbackCollection,
      eventReportsCollection,
      notificationsCollection,
    ] =
      await Promise.all([
        getUsersCollection(),
        getEventsCollection(),
        getEventDetailsCollection(),
        getEventAiDataCollection(),
        getEventApprovalsCollection(),
        getEventViewsCollection(),
        getEventTrendingCollection(),
        getAiRecommendationsCollection(),
        getFeedbackCollection(),
        getEventReportsCollection(),
        getNotificationsCollection(),
      ])

    const [mongoOk, postgresOk, mongoCounts, postgresCounts] = await Promise.all([
      pingMongo(),
      pingPostgres(),
      Promise.all([
        usersCollection.countDocuments({}),
        eventsCollection.countDocuments({}),
        eventDetailsCollection.countDocuments({}),
        eventAiDataCollection.countDocuments({}),
        eventApprovalsCollection.countDocuments({}),
        eventViewsCollection.countDocuments({}),
        eventTrendingCollection.countDocuments({}),
        aiRecommendationsCollection.countDocuments({}),
        eventFeedbackCollection.countDocuments({}),
        eventReportsCollection.countDocuments({}),
        notificationsCollection.countDocuments({}),
      ]),
      Promise.all([
        pool.query('SELECT COUNT(*)::int AS count FROM registrations').then((r) => r.rows[0]?.count || 0),
        pool.query('SELECT COUNT(*)::int AS count FROM attendance').then((r) => r.rows[0]?.count || 0),
        pool.query('SELECT COUNT(*)::int AS count FROM certificates').then((r) => r.rows[0]?.count || 0),
      ]),
    ])

    return NextResponse.json({
      mongo: {
        status: mongoOk ? 'up' : 'down',
        users: mongoCounts[0],
        events: mongoCounts[1],
        eventDetails: mongoCounts[2],
        eventAiData: mongoCounts[3],
        eventApprovals: mongoCounts[4],
        eventViews: mongoCounts[5],
        eventTrending: mongoCounts[6],
        aiRecommendations: mongoCounts[7],
        eventFeedback: mongoCounts[8],
        eventReports: mongoCounts[9],
        notifications: mongoCounts[10],
      },
      postgres: {
        status: postgresOk ? 'up' : 'down',
        registrations: postgresCounts[0],
        attendance: postgresCounts[1],
        certificates: postgresCounts[2],
      },
    })
  } catch (error) {
    console.error('Admin DB monitor error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
