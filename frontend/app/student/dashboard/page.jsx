'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CalendarDays,
  Sparkles,
  TrendingUp,
  Users,
  MapPin,
  Clock,
  Radio,
} from 'lucide-react'
import getSocket from '../../../lib/socket'

function formatDate(dateValue, timeValue, event) {
  const startDate = event?.start_date || dateValue
  const endDate = event?.end_date || ''
  const startTime = event?.start_time || timeValue
  const endTime = event?.end_time || ''

  if (!startDate) {
    return 'Date TBA'
  }

  const parsedStart = new Date(startDate)
  if (Number.isNaN(parsedStart.getTime())) {
    return startTime ? `${startDate} · ${startTime}` : startDate
  }

  const opts = { day: '2-digit', month: 'short', year: 'numeric' }
  const startText = parsedStart.toLocaleDateString('en-IN', opts)

  let dateDisplay = startText
  if (endDate && endDate !== startDate) {
    const parsedEnd = new Date(endDate)
    if (!Number.isNaN(parsedEnd.getTime())) {
      dateDisplay = `${startText} – ${parsedEnd.toLocaleDateString('en-IN', opts)}`
    }
  }

  let timeDisplay = ''
  if (startTime) {
    const fmt = (t) => {
      try { return new Date(`2000-01-01T${t}`).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) } catch { return t }
    }
    timeDisplay = endTime && endTime !== startTime ? `${fmt(startTime)} – ${fmt(endTime)}` : fmt(startTime)
  }

  return timeDisplay ? `${dateDisplay} · ${timeDisplay}` : dateDisplay
}

export default function StudentDashboardPage() {
  const { data: session, status } = useSession()
  const [events, setEvents] = useState([])
  const [recommendationIds, setRecommendationIds] = useState([])
  const [trending, setTrending] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [certificates, setCertificates] = useState([])
  const [notifications, setNotifications] = useState([])
  const [newEventCount, setNewEventCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const studentId = session?.user?.registrationId || session?.user?.id || ''

  async function loadDashboardData(activeStudentId) {
    if (!activeStudentId) {
      setLoading(false)
      setEvents([])
      setRecommendationIds([])
      setTrending([])
      setRegistrations([])
      setCertificates([])
      setNotifications([])
      return
    }

    setLoading(true)
    setError('')

    try {
      const [eventsRes, recommendationRes, trendingRes, registrationsRes, certificatesRes, notificationsRes] = await Promise.all([
        fetch('/api/student/events?status=approved&limit=100', { cache: 'no-store' }),
        fetch(`/api/student/ai-recommendations?student_id=${encodeURIComponent(activeStudentId)}`, {
          cache: 'no-store',
        }),
        fetch('/api/student/event-trending?limit=6', { cache: 'no-store' }),
        fetch(`/api/student/registrations?student_id=${encodeURIComponent(activeStudentId)}`, { cache: 'no-store' }),
        fetch(`/api/student/certificates?student_id=${encodeURIComponent(activeStudentId)}`, { cache: 'no-store' }),
        fetch(`/api/student/notifications?user_id=${encodeURIComponent(activeStudentId)}`, { cache: 'no-store' }),
      ])

      if (!eventsRes.ok || !recommendationRes.ok || !trendingRes.ok || !registrationsRes.ok || !certificatesRes.ok || !notificationsRes.ok) {
        throw new Error('Unable to load dashboard data from server.')
      }

      const eventsJson = await eventsRes.json()
      const recommendationJson = await recommendationRes.json()
      const trendingJson = await trendingRes.json()
      const registrationsJson = await registrationsRes.json()
      const certificatesJson = await certificatesRes.json()
      const notificationsJson = await notificationsRes.json()

      setEvents(Array.isArray(eventsJson.items) ? eventsJson.items : [])
      setRecommendationIds(
        Array.isArray(recommendationJson.recommended_events)
          ? recommendationJson.recommended_events
          : [],
      )
      setTrending(Array.isArray(trendingJson.items) ? trendingJson.items : [])
      setRegistrations(Array.isArray(registrationsJson.items) ? registrationsJson.items : [])
      setCertificates(Array.isArray(certificatesJson.items) ? certificatesJson.items : [])
      setNotifications(Array.isArray(notificationsJson.items) ? notificationsJson.items : [])
    } catch (err) {
      setError(err?.message || 'Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'loading') {
      return undefined
    }

    loadDashboardData(studentId)

    if (!studentId) {
      return undefined
    }

    const socket = getSocket()
    if (!socket) {
      return undefined
    }

    socket.emit('join:user', studentId)

    const refreshHandlers = {
      registrationChanged: (payload) => {
        if (String(payload?.student_id || '') === String(studentId)) {
          setRegistrations((prev) => {
            if (payload?.type === 'deleted') {
              return prev.filter((item) => item.id !== payload.registration_id && String(item.event_id) !== String(payload.event_id))
            }

            const registration = payload?.registration
            if (!registration) {
              return prev
            }

            const nextItem = {
              id: registration.id,
              student_id: registration.student_id,
              event_id: registration.event_id,
              ticket_id: registration.ticket_id,
              registered_at: registration.registered_at,
              event_title: payload?.event_title || registration.event_id,
              venue: payload?.venue || 'Venue TBA',
              organizer: payload?.organizer || 'Organizer TBA',
              date: payload?.date || null,
              time: payload?.time || null,
              status: 'Confirmed',
            }

            return [nextItem, ...prev.filter((item) => item.id !== nextItem.id)]
          })
        }
      },
      notificationNew: (payload) => {
        if (String(payload?.user_id || '') === String(studentId)) {
          setNotifications((prev) => [payload, ...prev.filter((item) => item.id !== payload.id)])
        }
      },
      certificateUpdated: (payload) => {
        if (String(payload?.student_id || '') === String(studentId)) {
          setCertificates((prev) => [payload, ...prev.filter((item) => item.id !== payload.id)])
        }
      },
      aiRecommendationsUpdated: (payload) => {
        if (String(payload?.student_id || '') === String(studentId)) {
          setRecommendationIds(Array.isArray(payload?.recommended_events) ? payload.recommended_events : [])
        }
      },
      trendingUpdated: (payload) => {
        const eventId = String(payload?.event_id || '')
        if (!eventId) {
          return
        }

        setTrending((prev) => {
          const next = [payload, ...prev.filter((item) => String(item.event_id) !== eventId)]
          return next.sort((a, b) => Number(b.score || 0) - Number(a.score || 0)).slice(0, 6)
        })
      },
      eventNew: (payload) => {
        setEvents((prev) => {
          if (prev.some((item) => String(item._id) === String(payload?._id))) {
            return prev
          }
          return [payload, ...prev]
        })
        setNewEventCount((prev) => prev + 1)
      },
      dashboardRefresh: (payload) => {
        if (payload?.scope === 'student' && (
          (String(payload?.studentId || '') === String(studentId) && payload?.type === 'certificates-sync') ||
          payload?.type === 'bulk-sync'
        )) {
          loadDashboardData(studentId)
        }
      },
    }

    socket.on('registration:changed', refreshHandlers.registrationChanged)
    socket.on('notification:new', refreshHandlers.notificationNew)
    socket.on('certificate:updated', refreshHandlers.certificateUpdated)
    socket.on('ai-recommendations:updated', refreshHandlers.aiRecommendationsUpdated)
    socket.on('event-trending:updated', refreshHandlers.trendingUpdated)
    socket.on('event:new', refreshHandlers.eventNew)
    socket.on('dashboard:refresh', refreshHandlers.dashboardRefresh)

    return () => {
      socket.off('registration:changed', refreshHandlers.registrationChanged)
      socket.off('notification:new', refreshHandlers.notificationNew)
      socket.off('certificate:updated', refreshHandlers.certificateUpdated)
      socket.off('ai-recommendations:updated', refreshHandlers.aiRecommendationsUpdated)
      socket.off('event-trending:updated', refreshHandlers.trendingUpdated)
      socket.off('event:new', refreshHandlers.eventNew)
      socket.off('dashboard:refresh', refreshHandlers.dashboardRefresh)
    }
  }, [status, studentId])

  const eventTitleById = useMemo(
    () => Object.fromEntries(events.map((event) => [String(event._id), event.title])),
    [events],
  )

  const { totalEvents, upcomingEvents, ongoingEvents, recommendedEvents } = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10)
    const nextEvents = events
      .filter((event) => {
        const endDate = String(event.end_date || event.start_date || event.date || '')
        return endDate >= todayIso
      })
      .sort((a, b) => String(a.start_date || a.date).localeCompare(String(b.start_date || b.date)))

    const liveEvents = events
      .filter((event) => {
        const startDate = String(event.start_date || event.date || '')
        const endDate = String(event.end_date || event.start_date || event.date || '')
        return startDate <= todayIso && endDate >= todayIso
      })
      .sort((a, b) => String(a.start_date || a.date).localeCompare(String(b.start_date || b.date)))

    const aiEvents = events.filter((event) => recommendationIds.includes(String(event._id)))

    return {
      totalEvents: events.length,
      upcomingEvents: nextEvents.slice(0, 4),
      ongoingEvents: liveEvents.slice(0, 4),
      recommendedEvents: aiEvents.slice(0, 4),
    }
  }, [events, recommendationIds])

  return (
    <div className="space-y-6 p-6 xl:p-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Student Dashboard</h1>
        <p className="text-sm text-slate-500">Live data from your registered events and campus catalog</p>
        {newEventCount > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800">
            <Radio className="h-3.5 w-3.5" /> {newEventCount} new event{newEventCount !== 1 && 's'} added live
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Total Events</p>
          <p className="mt-2 text-3xl font-bold text-indigo-800">{totalEvents}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Registrations</p>
          <p className="mt-2 text-3xl font-bold text-emerald-800">{registrations.length}</p>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">AI Recommended</p>
          <p className="mt-2 text-3xl font-bold text-violet-800">{recommendedEvents.length}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 md:col-span-3 xl:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Certificates</p>
          <p className="mt-2 text-3xl font-bold text-amber-800">{certificates.length}</p>
          <p className="mt-1 text-xs text-amber-700/80">Notifications: {notifications.length}</p>
        </div>
      </section>

      {error && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </section>
      )}

      {loading ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Loading dashboard data...
        </section>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Sparkles className="h-4 w-4 text-violet-600" /> AI Recommended Events
              </h2>
              <Link href="/student/events" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {recommendedEvents.length === 0 && (
                <p className="text-sm text-slate-500">No AI recommendations yet for this student.</p>
              )}
              {recommendedEvents.map((event) => (
                <motion.div
                  key={String(event._id)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4"
                >
                  <p className="font-semibold text-slate-900">{event.title}</p>
                  <p className="mt-1 text-xs text-slate-600">{formatDate(event.date, event.time, event)}</p>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <TrendingUp className="h-4 w-4 text-amber-600" /> Trending Now
              </h2>
              <Link href="/student/events" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                Explore
              </Link>
            </div>
            <div className="space-y-3">
              {trending.length === 0 && (
                <p className="text-sm text-slate-500">No trending signals available yet.</p>
              )}
              {trending.map((item) => (
                <motion.div
                  key={String(item.event_id)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">
                      {eventTitleById[String(item.event_id)] || item.event_id}
                    </p>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      score {item.score}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{item.reason || 'High engagement'}</p>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <CalendarDays className="h-4 w-4 text-emerald-600" /> Upcoming Events
            </div>
            <div className="space-y-3">
              {upcomingEvents.length === 0 && (
                <p className="text-sm text-slate-500">No upcoming events in the catalog.</p>
              )}
              {upcomingEvents.map((event) => (
                <div key={String(event._id)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{event.title}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(event.date, event.time, event)}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.venue}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Users className="h-4 w-4 text-cyan-600" /> Ongoing Events
            </div>
            <div className="space-y-3">
              {ongoingEvents.length === 0 && (
                <p className="text-sm text-slate-500">No ongoing events currently.</p>
              )}
              {ongoingEvents.map((event) => (
                <div key={String(event._id)} className="rounded-2xl border border-cyan-200 bg-cyan-50/60 p-4">
                  <p className="font-semibold text-slate-900">{event.title}</p>
                  <p className="mt-1 text-xs text-slate-600">{event.venue}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <Link
          href="/student/events"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Browse all events <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  )
}
