'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, MapPin, Clock, Users, Zap, Sparkles, X, Filter, Radio,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import getSocket from '../../../lib/socket'

const categories = ['All', 'Technical', 'Hackathons', 'Workshops', 'Cultural', 'Sports', 'Seminars']

function formatDateTime(event) {
  const startDate = String(event.start_date || event.date || '').trim()
  const endDate = String(event.end_date || '').trim()
  const startTime = String(event.start_time || event.time || '').trim()
  const endTime = String(event.end_time || '').trim()

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

function buildGoogleCalendarUrl(event) {
  const startDate = String(event.start_date || event.date || '').replace(/-/g, '')
  const endDate = String(event.end_date || event.start_date || event.date || '').replace(/-/g, '')
  const startTime = String(event.start_time || event.time || '').replace(':', '') + '00'
  const endTime = String(event.end_time || event.start_time || event.time || '').replace(':', '') + '00'
  const dates = `${startDate}T${startTime}/${endDate}T${endTime}`
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title || '',
    dates,
    details: event.description || '',
    location: event.venue || '',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export default function BrowseEventsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading...</div>}>
      <BrowseEventsContent />
    </Suspense>
  )
}

function BrowseEventsContent() {
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const initialQ = searchParams?.get('q') || ''
  const [query, setQuery] = useState(initialQ)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [events, setEvents] = useState([])
  const [recommendationIds, setRecommendationIds] = useState([])
  const [registeredEventIds, setRegisteredEventIds] = useState([])
  const [newEventCount, setNewEventCount] = useState(0)
  const [liveEventIds, setLiveEventIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [registeringEventId, setRegisteringEventId] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const studentId = session?.user?.registrationId || session?.user?.id || ''

  async function trackEventView(eventId) {
    if (typeof window === 'undefined' || !eventId) {
      return
    }

    const storageKey = `event-viewed:${eventId}`
    if (window.sessionStorage.getItem(storageKey) === '1') {
      return
    }

    window.sessionStorage.setItem(storageKey, '1')

    try {
      await fetch('/api/student/event-views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId }),
      })
    } catch {
      // ignore analytics-only failures
    }
  }

  useEffect(() => {
    let ignore = false

    async function loadBaseData() {
      if (status === 'loading') {
        return
      }

      setLoading(true)
      setError('')

      try {
        const registrationsUrl = studentId
          ? `/api/student/registrations?student_id=${encodeURIComponent(studentId)}`
          : null
        const [eventsRes, recommendationsRes, registrationsRes] = await Promise.all([
          fetch('/api/student/events?status=approved&limit=100', { cache: 'no-store' }),
          fetch(`/api/student/ai-recommendations?student_id=${encodeURIComponent(studentId)}`, {
            cache: 'no-store',
          }),
          registrationsUrl
            ? fetch(registrationsUrl, { cache: 'no-store' })
            : Promise.resolve(new Response(JSON.stringify({ items: [] }), { status: 200 })),
        ])

        if (!eventsRes.ok || !recommendationsRes.ok || !registrationsRes.ok) {
          throw new Error('Unable to fetch events from database.')
        }

        const eventsJson = await eventsRes.json()
        const recommendationsJson = await recommendationsRes.json()
        const registrationsJson = await registrationsRes.json()

        if (!ignore) {
          setEvents(Array.isArray(eventsJson.items) ? eventsJson.items : [])
          setRecommendationIds(
            Array.isArray(recommendationsJson.recommended_events)
              ? recommendationsJson.recommended_events
              : [],
          )
          setRegisteredEventIds(
            Array.isArray(registrationsJson.items)
              ? registrationsJson.items.map((item) => String(item.event_id))
              : [],
          )
        }
      } catch (err) {
        if (!ignore) {
          setError(err?.message || 'Failed to fetch event data.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadBaseData()

    return () => {
      ignore = true
    }
  }, [status, studentId])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) {
      return undefined
    }

    const currentEventId = String(selectedEvent?._id || '')
    if (currentEventId) {
      socket.emit('join:event', currentEventId)
    }

    const handleNewEvent = (event) => {
      if (String(event?.status || '').toLowerCase() !== 'approved') {
        return
      }

      const normalized = {
        ...event,
        _id: String(event._id),
        registered_count: Number(event.registered_count || 0),
      }

      setEvents((prev) => {
        if (prev.some((item) => String(item._id) === normalized._id)) {
          return prev
        }
        return [normalized, ...prev]
      })
      setLiveEventIds((prev) => (prev.includes(normalized._id) ? prev : [normalized._id, ...prev].slice(0, 12)))
      setNewEventCount((prev) => prev + 1)
    }

    const handleRegistrationChanged = (payload) => {
      const eventId = String(payload?.event_id || '')
      if (!eventId) {
        return
      }

      setEvents((prev) => prev.map((event) => {
        if (String(event._id) !== eventId) {
          return event
        }

        const currentCount = Number(event.registered_count || 0)
        const delta = payload?.type === 'deleted' ? -1 : 1

        return {
          ...event,
          registered_count: Math.max(0, currentCount + delta),
        }
      }))

      if (String(payload?.student_id || '') === String(studentId)) {
        setRegisteredEventIds((prev) => {
          if (payload?.type === 'deleted') {
            return prev.filter((item) => item !== eventId)
          }
          return prev.includes(eventId) ? prev : [...prev, eventId]
        })
      }
    }

    const handleRecommendationsUpdated = (payload) => {
      if (String(payload?.student_id || '') === String(studentId)) {
        setRecommendationIds(Array.isArray(payload?.recommended_events) ? payload.recommended_events : [])
      }
    }

    const handleEventDetailsUpdated = (payload) => {
      if (String(payload?.event_id || '') !== String(selectedEvent?._id || '')) {
        return
      }

      setSelectedEvent((prev) => {
        if (!prev || String(prev._id) !== String(payload.event_id)) {
          return prev
        }

        return {
          ...prev,
          speakers: Array.isArray(payload.speakers) ? payload.speakers : prev.speakers,
          schedule: Array.isArray(payload.schedule)
            ? payload.schedule.map((item) => `${item.time} - ${item.activity}`)
            : prev.schedule,
          instructions: payload.instructions ? [String(payload.instructions)] : prev.instructions,
        }
      })
    }

    const handleBulkSync = (payload) => {
      if (payload?.scope === 'student-events' || payload?.scope === 'student-transactions') {
        setLoading(true)
        setError('')
        setNotice('Realtime bulk sync detected. Refreshing event data...')
        Promise.all([
          fetch('/api/student/events?status=approved&limit=100', { cache: 'no-store' }).then((res) => res.json()),
          fetch(`/api/student/ai-recommendations?student_id=${encodeURIComponent(studentId)}`, { cache: 'no-store' }).then((res) => res.json()),
          studentId
            ? fetch(`/api/student/registrations?student_id=${encodeURIComponent(studentId)}`, { cache: 'no-store' }).then((res) => res.json())
            : Promise.resolve({ items: [] }),
        ]).then(([eventsJson, recommendationsJson, registrationsJson]) => {
          setEvents(Array.isArray(eventsJson.items) ? eventsJson.items : [])
          setRecommendationIds(Array.isArray(recommendationsJson.recommended_events) ? recommendationsJson.recommended_events : [])
          setRegisteredEventIds(Array.isArray(registrationsJson.items) ? registrationsJson.items.map((item) => String(item.event_id)) : [])
          setLoading(false)
        }).catch(() => {
          setLoading(false)
        })
      }
    }

    socket.on('event:new', handleNewEvent)
    socket.on('registration:changed', handleRegistrationChanged)
    socket.on('ai-recommendations:updated', handleRecommendationsUpdated)
    socket.on('event-details:updated', handleEventDetailsUpdated)
    socket.on('bulk-sync:completed', handleBulkSync)

    return () => {
      socket.off('event:new', handleNewEvent)
      socket.off('registration:changed', handleRegistrationChanged)
      socket.off('ai-recommendations:updated', handleRecommendationsUpdated)
      socket.off('event-details:updated', handleEventDetailsUpdated)
      socket.off('bulk-sync:completed', handleBulkSync)
    }
  }, [selectedEvent?._id, studentId])

  const filtered = useMemo(() => {
    const withMetadata = events.map((event) => ({
      ...event,
      id: String(event._id),
      dateTime: formatDateTime(event),
      poster: event.poster || '/assets/seminar.png',
      badge: recommendationIds.includes(String(event._id)) ? 'AI Recommended' : null,
      isLiveNew: liveEventIds.includes(String(event._id)),
    }))

    let result = withMetadata
    if (selectedCategory !== 'All') result = result.filter((e) => e.category === selectedCategory)
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter((e) =>
        String(e.title || '').toLowerCase().includes(q) ||
        String(e.venue || '').toLowerCase().includes(q) ||
        e.organizer?.toLowerCase().includes(q) ||
        e.category?.toLowerCase().includes(q)
      )
    }
    return result
  }, [events, recommendationIds, selectedCategory, query, liveEventIds])

  function clearLiveEventMarkers() {
    setNewEventCount(0)
    setLiveEventIds([])
  }

  async function openEventDetails(event) {
    setSelectedEvent(event)
    trackEventView(String(event._id))
    try {
      const res = await fetch(`/api/student/event-details?event_id=${encodeURIComponent(String(event._id))}`, {
        cache: 'no-store',
      })
      if (!res.ok) {
        return
      }
      const details = await res.json()
      setSelectedEvent((prev) => {
        if (!prev || String(prev._id) !== String(event._id)) {
          return prev
        }
        return {
          ...prev,
          speakers: Array.isArray(details.speakers) ? details.speakers : prev.speakers,
          schedule: Array.isArray(details.schedule)
            ? details.schedule.map((item) => `${item.time} - ${item.activity}`)
            : prev.schedule,
          instructions: details.instructions
            ? [String(details.instructions)]
            : prev.instructions,
        }
      })
    } catch {
      // Keep base event data if detail fetch fails.
    }
  }

  async function handleRegister(event) {
    if (!studentId) {
      setError('No active student session found.')
      return
    }

    const eventId = String(event._id)
    if (registeredEventIds.includes(eventId)) {
      setNotice(`You are already registered for ${event.title}.`)
      return
    }

    setRegisteringEventId(eventId)
    setNotice('')
    setError('')

    try {
      const res = await fetch('/api/student/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, event_id: eventId }),
      })

      const json = await res.json()
      if (!res.ok && res.status !== 409) {
        throw new Error(json?.message || 'Registration failed.')
      }

      setRegisteredEventIds((prev) => (prev.includes(eventId) ? prev : [...prev, eventId]))
      setNotice(json?.message || `Registered for ${event.title}.`)
    } catch (err) {
      setError(err?.message || 'Failed to register for event.')
    } finally {
      setRegisteringEventId(null)
    }
  }

  return (
    <div className="space-y-6 p-6 xl:p-8">
      {/* Search + Filters */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Browse Events</h1>
        <p className="text-sm text-slate-500">Search and filter all campus events</p>

        {newEventCount > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <Radio className="h-4 w-4" />
              {newEventCount} new live event{newEventCount !== 1 && 's'} arrived just now
            </div>
            <button
              onClick={clearLiveEventMarkers}
              className="rounded-full border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              Clear badge
            </button>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, category, venue, organizer…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'border border-slate-200 text-slate-600 hover:border-indigo-300'
                }`}
              >{cat}</button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      {/* Results */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading && (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Loading events from MongoDB...
          </div>
        )}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-400">
            <Filter className="mx-auto h-10 w-10 mb-3" />
            <p className="text-lg font-semibold">No events found</p>
            <p className="text-sm">Try a different search or category filter</p>
          </div>
        )}
        {!loading && filtered.map((event) => (
          <motion.div
            key={event.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="relative overflow-hidden rounded-2xl">
              <img src={event.poster} alt={event.title} className="h-40 w-full object-cover transition-transform group-hover:scale-105" />
              {event.badge && (
                <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-cyan-600 px-3 py-1 text-[10px] font-semibold uppercase text-white">
                  <Zap className="h-3 w-3" /> {event.badge}
                </span>
              )}
              {event.isLiveNew && (
                <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-semibold uppercase text-white shadow-sm">
                  <Radio className="h-3 w-3" /> New Live
                </span>
              )}
            </div>
            <div className="mt-4 space-y-1.5">
              <h3 className="text-base font-semibold">{event.title}</h3>
              <p className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" />{event.venue}</p>
              <p className="flex items-center gap-1 text-xs text-slate-500"><Clock className="h-3 w-3" />{event.dateTime || event.date}</p>
              {event.organizer && <p className="text-xs text-slate-500">Organizer: {event.organizer}</p>}
              <div className="flex items-center gap-2">
                {event.category && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{event.category}</span>}
                {event.seats && <span className="text-[10px] font-semibold text-amber-600">{event.seats} seats left</span>}
                <span className="text-[10px] font-semibold text-emerald-600">{Number(event.registered_count || 0)} registered</span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => openEventDetails(event)} className="flex-1 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-400">View Details</button>
              <button
                onClick={() => handleRegister(event)}
                disabled={registeringEventId === event.id || registeredEventIds.includes(event.id)}
                className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold text-white ${registeredEventIds.includes(event.id) ? 'bg-emerald-600' : 'bg-slate-900 hover:bg-slate-800'} disabled:cursor-not-allowed disabled:opacity-70`}
              >
                {registeredEventIds.includes(event.id)
                  ? 'Registered'
                  : registeringEventId === event.id
                    ? 'Registering...'
                    : 'Register'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            >
              <button onClick={() => setSelectedEvent(null)} className="absolute right-4 top-4 rounded-full border border-slate-200 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 z-10">
                <X className="h-4 w-4" />
              </button>
              <img src={selectedEvent.poster} alt={selectedEvent.title} className="h-48 w-full rounded-2xl object-cover" />
              <div className="mt-5 space-y-4">
                <h2 className="text-2xl font-bold">{selectedEvent.title}</h2>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{selectedEvent.venue}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{selectedEvent.dateTime || selectedEvent.date}</span>
                  {selectedEvent.organizer && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{selectedEvent.organizer}</span>}
                </div>
                {selectedEvent.category && <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">{selectedEvent.category}</span>}
                <p className="text-sm text-slate-600 leading-relaxed">{selectedEvent.description}</p>
                {selectedEvent.aiSummary && (
                  <div className="rounded-2xl bg-cyan-50 border border-cyan-200 p-4">
                    <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.15em] text-cyan-700"><Sparkles className="h-3.5 w-3.5" /> AI Event Summary</p>
                    <p className="mt-2 text-sm text-slate-700">{selectedEvent.aiSummary}</p>
                  </div>
                )}
                {selectedEvent.speakers?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Guest Speakers</p>
                    <p className="text-sm text-slate-600">{selectedEvent.speakers.join(', ')}</p>
                  </div>
                )}
                {selectedEvent.schedule?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Schedule</p>
                    <ul className="mt-1 space-y-1 text-sm text-slate-600">{selectedEvent.schedule.map((s) => <li key={s}>• {s}</li>)}</ul>
                  </div>
                )}
                {selectedEvent.instructions?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Instructions</p>
                    <ul className="mt-1 space-y-1 text-sm text-slate-600">{selectedEvent.instructions.map((s) => <li key={s}>• {s}</li>)}</ul>
                  </div>
                )}
                {selectedEvent.seats && <p className="text-sm font-semibold text-amber-600">{selectedEvent.seats} seats remaining</p>}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleRegister(selectedEvent)}
                    disabled={registeringEventId === String(selectedEvent._id) || registeredEventIds.includes(String(selectedEvent._id))}
                    className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold text-white ${registeredEventIds.includes(String(selectedEvent._id)) ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700'} disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    {registeredEventIds.includes(String(selectedEvent._id))
                      ? 'Already Registered'
                      : registeringEventId === String(selectedEvent._id)
                        ? 'Registering...'
                        : 'Register Now'}
                  </button>
                  <a
                    href={buildGoogleCalendarUrl(selectedEvent)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 text-center"
                  >
                    + Calendar
                  </a>
                  <button onClick={() => setSelectedEvent(null)} className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Close</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
