import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import StudentEventsClient from '@/features/events/StudentEventsClient'
import { headers } from 'next/headers'

// ✅ Server Component - FETCHER (Fastest Win)

async function getEventsData(studentId) {
  const host = headers().get('host')
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`

  try {
    const urls = [
      `${baseUrl}/api/student/events?status=published&limit=100`,
      `${baseUrl}/api/student/ai-recommendations?student_id=${encodeURIComponent(studentId)}`,
      studentId 
        ? `${baseUrl}/api/student/registrations?student_id=${encodeURIComponent(studentId)}`
        : null
    ].filter(Boolean)

    const [eventsJson, recosJson, regsJson] = await Promise.all(
      urls.map(url => fetch(url, { cache: 'no-store' }).then(r => r.json()))
    )

    return {
      events: eventsJson?.items || [],
      recommendations: recosJson?.recommended_events || [],
      registrations: (regsJson?.items || []).map(r => String(r.event_id))
    }
  } catch (error) {
    console.error('Failed to load events data:', error)
    return { events: [], recommendations: [], registrations: [] }
  }
}

export default async function BrowseEventsPage({ searchParams }) {
  const session = await getServerSession(authOptions)
  const studentId = session?.user?.registrationId || session?.user?.id || ''
  
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
