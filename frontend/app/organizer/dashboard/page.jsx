import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import OrganizerDashboardClient from './OrganizerDashboardClient'
import { headers } from 'next/headers'

// ✅ Server Component - FETCHER (Fastest Win)
// Parallel server-side data fetching eliminates client waterfalls.

import { 
  getEventsCollection, 
  getEventApprovalsCollection, 
  getEventViewsCollection,
  getDb
} from '@/app/api/_lib/db'

async function getOrganizerStats(organizerId, organizerName) {
  try {
    const [eventsColl, approvalsColl, viewsColl, db] = await Promise.all([
      getEventsCollection(),
      getEventApprovalsCollection(),
      getEventViewsCollection(),
      getDb()
    ])

    const query = organizerId ? { organizer_id: organizerId } : { organizer: organizerName }
    
    // Fetch base events and total registrations in parallel
    const [myEvents, allRegs] = await Promise.all([
      eventsColl.find(query).sort({ start_date: 1 }).toArray(),
      db.collection('registrations').find({}).toArray()
    ])

    const myEventIds = myEvents.map(e => String(e._id))
    
    // Fetch approvals and views for these events in parallel
    let approvalMap = {}
    let viewsMap = {}
    
    if (myEventIds.length > 0) {
      const [approvals, views] = await Promise.all([
        approvalsColl.find({ event_id: { $in: myEventIds } }).toArray(),
        viewsColl.find({ event_id: { $in: myEventIds } }).toArray()
      ])
      
      approvalMap = approvals.reduce((acc, item) => ({ ...acc, [String(item.event_id)]: item }), {})
      viewsMap = views.reduce((acc, item) => ({ ...acc, [String(item.event_id)]: item }), {})
    }

    const total = myEvents.length
    const pending = myEvents.filter(e => ['pending_dean', 'pending_registrar', 'pending_vc', 'pending'].includes(e.status)).length
    const approved = myEvents.filter(e => ['approved', 'published'].includes(e.status)).length
    const rejected = myEvents.filter(e => e.status === 'rejected').length
    
    const myEventIdSet = new Set(myEventIds)
    const registrationsCount = allRegs.filter(r => myEventIdSet.has(String(r.event_id))).length
    const trendingScore = Object.values(viewsMap).reduce((sum, item) => sum + Number(item.trending_score || 0), 0)

    const stats = { total, pending, approved, rejected, registrations: registrationsCount, trendingScore }
    const now = new Date().toISOString().slice(0, 10)
    
    const upcoming = myEvents
      .filter(e => (e.start_date || e.date || '') >= now)
      .slice(0, 5)
      .map(event => ({
        ...event,
        _id: String(event._id),
        approval: approvalMap[String(event._id)] || null,
        views: viewsMap[String(event._id)] || null,
      }))

    return { stats, upcoming }
  } catch (error) {
    console.error('Failed to load organizer dashboard (Direct DB):', error)
    return { stats: { total: 0, pending: 0, approved: 0, rejected: 0, registrations: 0, trendingScore: 0 }, upcoming: [] }
  }
}

export default async function OrganizerDashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-slate-500">Redirecting...</p>
      </div>
    )
  }

  const organizerId = session.user.registrationId || session.user.id
  const organizerName = session.user.name || session.user.email
  const data = await getOrganizerStats(organizerId, organizerName)

  return (
    <OrganizerDashboardClient 
      organizerId={organizerId}
      organizerName={organizerName}
      initialStats={data.stats}
      initialUpcoming={data.upcoming}
    />
  )
}
