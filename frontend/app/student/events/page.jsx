export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import StudentEventsClient from '@/features/events/StudentEventsClient'
import { headers } from 'next/headers'

import { 
  getEventsCollection, 
  getAiRecommendationsCollection, 
  getDb, 
  COLLECTIONS 
} from '@/app/api/_lib/db'

async function getEventsData(studentId) {
  try {
    const db = await getDb()
    const [eventsColl, recosColl] = await Promise.all([
      getEventsCollection(),
      getAiRecommendationsCollection()
    ])

    // Fetch published events and student specific data in parallel
    const [events, recos, regs] = await Promise.all([
      eventsColl.find({ status: 'published' }).sort({ start_date: 1, start_time: 1 }).limit(100).toArray(),
      recosColl.findOne({ student_id: studentId }),
      db.collection('registrations').find({ student_id: studentId }).toArray()
    ])

    return {
      events: events.map(e => ({ ...e, _id: String(e._id) })),
      recommendations: recos?.recommended_events || [],
      registrations: regs.map(r => String(r.event_id))
    }
  } catch (error) {
    console.error('Failed to load browse events data (Direct DB):', error)
    return { events: [], recommendations: [], registrations: [] }
  }
}

export default async function BrowseEventsPage({ searchParams }) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-slate-500">Redirecting to login...</p>
      </div>
    )
  }

  const studentId = session.user.registrationId || session.user.id
  const initialData = await getEventsData(studentId)

  return (
    <StudentEventsClient 
      studentId={studentId}
      initialEvents={initialData.events}
      initialRecommendations={initialData.recommendations}
      initialRegistrations={initialData.registrations}
      initialQuery={searchParams?.q || ''}
    />
  )
}
