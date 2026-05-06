export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import StudentDashboardClient from './StudentDashboardClient'
import { headers } from 'next/headers'

// ✅ Server Component - FETCHER (Fastest Win)
// Fetches all dashboard components in parallel on the server side
// Eliminates JS waterfalls and reduces client-side JS volume.

import { 
  getEventsCollection, 
  getAiRecommendationsCollection, 
  getNotificationsCollection,
  getDb, 
  COLLECTIONS 
} from '@/app/api/_lib/db'

async function getDashboardData(studentId) {
  try {
    const db = await getDb()
    const [eventsColl, recosColl, notifiesColl] = await Promise.all([
      getEventsCollection(),
      getAiRecommendationsCollection(),
      getNotificationsCollection()
    ])

    // Fetch all required data in parallel directly from DB
    const [events, regs, trending, recos, certs, notifies] = await Promise.all([
      eventsColl.find({ status: 'approved' }).sort({ created_at: -1 }).limit(100).toArray(),
      db.collection('registrations').find({ student_id: studentId }).toArray(),
      db.collection(COLLECTIONS.eventTrending).find({}).sort({ score: -1 }).limit(6).toArray(),
      recosColl.findOne({ student_id: studentId }),
      db.collection('certificates').find({ student_id: studentId }).toArray(),
      notifiesColl.find({ user_id: studentId }).sort({ created_at: -1 }).limit(10).toArray()
    ])

    return {
      events: events.map(e => ({ ...e, _id: String(e._id) })),
      registrations: regs.map(r => ({ ...r, _id: String(r._id) })),
      trending: trending.map(t => ({ ...t, _id: String(t._id) })),
      recommendations: recos?.recommended_events || [],
      certificates: certs.map(c => ({ ...c, _id: String(c._id) })),
      notifications: notifies.map(n => ({ ...n, _id: String(n._id) }))
    }
  } catch (error) {
    console.error('Failed to load student dashboard (Direct DB):', error)
    return { events: [], registrations: [], trending: [], recommendations: [], certificates: [], notifications: [] }
  }
}

export default async function StudentDashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-slate-500">Redirecting to login...</p>
      </div>
    )
  }

  const studentId = session.user.registrationId || session.user.id
  const data = await getDashboardData(studentId)

  return (
    <StudentDashboardClient 
      studentId={studentId}
      initialEvents={data.events}
      initialRegistrations={data.registrations}
      initialCertificates={data.certificates}
      initialTrending={data.trending}
      initialRecommendations={data.recommendations}
      initialNotifications={data.notifications}
    />
  )
}
