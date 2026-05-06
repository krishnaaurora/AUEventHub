import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import OrganizerDashboardClient from './OrganizerDashboardClient'

import { 
  getEventsCollection, 
  getEventViewsCollection,
  getDb
} from '@/app/api/_lib/db'

async function getOrganizerStats(organizerId, organizerName) {
  try {
    const [eventsColl, viewsColl, db] = await Promise.all([
      getEventsCollection(),
      getEventViewsCollection(),
      getDb()
    ])

    const query = organizerId ? { organizer_id: organizerId } : { organizer: organizerName }
    
    const [myEvents, allRegs] = await Promise.all([
      eventsColl.find(query).toArray(),
      db.collection('registrations').find({}).toArray()
    ])

    const myEventIds = myEvents.map(e => String(e._id))
    let viewsMap = {}
    
    if (myEventIds.length > 0) {
      const views = await viewsColl.find({ event_id: { $in: myEventIds } }).toArray()
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

    return { stats }
  } catch (error) {
    console.error('Failed to load organizer dashboard stats:', error)
    return { stats: { total: 0, pending: 0, approved: 0, rejected: 0, registrations: 0, trendingScore: 0 } }
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
    />
  )
}
