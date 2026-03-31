'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  CalendarRange,
  Search,
  Eye,
  XCircle,
  Loader2,
  Filter,
  ChevronDown,
  MessageSquare,
  Sparkles,
  Pencil,
} from 'lucide-react'
import getSocket from '../../../lib/socket'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending_dean', label: 'Pending Dean' },
  { value: 'pending_registrar', label: 'Pending Registrar' },
  { value: 'pending_vc', label: 'Pending VC' },
  { value: 'published', label: 'Published' },
  { value: 'completed', label: 'Completed' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

const statusStyles = {
  approved: 'bg-emerald-100 text-emerald-700',
  published: 'bg-cyan-100 text-cyan-700',
  completed: 'bg-green-100 text-green-700',
  rejected: 'bg-rose-100 text-rose-700',
  pending_dean: 'bg-amber-100 text-amber-700',
  pending_registrar: 'bg-orange-100 text-orange-700',
  pending_vc: 'bg-yellow-100 text-yellow-700',
  pending: 'bg-amber-100 text-amber-700',
}

export default function MyEventsPage() {
  const { data: session } = useSession()
  const [events, setEvents] = useState([])
  const [filtered, setFiltered] = useState([])
  const [aiDataByEvent, setAiDataByEvent] = useState({})
  const [feedbackSummaryByEvent, setFeedbackSummaryByEvent] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [cancellingId, setCancellingId] = useState(null)

  const organizerId = session?.user?.registrationId || session?.user?.id || ''
  const organizerName = session?.user?.name || session?.user?.email || ''

  async function loadEvents() {
    try {
      const res = await fetch('/api/student/events?limit=500', { cache: 'no-store' })
      const json = await res.json()
      const all = Array.isArray(json.items) ? json.items : []
      const mine = organizerId
        ? all.filter((e) => String(e.organizer_id || '') === String(organizerId))
        : organizerName
          ? all.filter((e) => e.organizer === organizerName)
          : all
      setEvents(mine)

      const eventIds = mine.map((item) => String(item._id)).filter(Boolean)
      if (eventIds.length === 0) {
        setAiDataByEvent({})
        setFeedbackSummaryByEvent({})
        return
      }

      const [aiRes, feedbackRes] = await Promise.all([
        fetch(`/api/organizer/event-ai-data?event_ids=${encodeURIComponent(eventIds.join(','))}`, { cache: 'no-store' }),
        fetch(`/api/organizer/event-feedback?event_ids=${encodeURIComponent(eventIds.join(','))}`, { cache: 'no-store' }),
      ])
      const aiJson = await aiRes.json()
      const feedbackJson = await feedbackRes.json()

      const nextAiData = Array.isArray(aiJson.items)
        ? aiJson.items.reduce((acc, item) => {
            acc[String(item.event_id)] = item
            return acc
          }, {})
        : {}

      setAiDataByEvent(nextAiData)
      setFeedbackSummaryByEvent(feedbackJson.summaryByEvent || {})
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [organizerName])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const handler = () => loadEvents()
    socket.on('event:new', handler)
    socket.on('dashboard:refresh', handler)
    return () => {
      socket.off('event:new', handler)
      socket.off('dashboard:refresh', handler)
    }
  }, [organizerName])

  useEffect(() => {
    let result = events
    if (statusFilter) {
      result = result.filter((e) => e.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.venue?.toLowerCase().includes(q) ||
          e.category?.toLowerCase().includes(q)
      )
    }
    setFiltered(result)
  }, [events, search, statusFilter])

  async function handleCancel(eventId) {
    if (!confirm('Are you sure you want to cancel this event?')) return
    setCancellingId(eventId)
    try {
      const res = await fetch('/api/organizer/event-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, action: 'cancel' }),
      })
      if (res.ok) {
        setEvents((prev) => prev.map((e) => (e._id === eventId ? { ...e, status: 'cancelled' } : e)))
      }
    } catch {
      // ignore
    } finally {
      setCancellingId(null)
    }
  }

  async function handleAddOrganizerNote(eventId) {
    const comment = window.prompt('Enter organizer note for this event:')
    if (!comment || !comment.trim()) {
      return
    }

    const ratingInput = window.prompt('Optional rating from 1 to 5 for this event overview:', '')
    const rating = ratingInput && ratingInput.trim() ? Number(ratingInput) : null

    try {
      const res = await fetch('/api/organizer/event-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          organizer_id: organizerId,
          author_name: organizerName,
          feedback_type: 'organizer_note',
          comment: comment.trim(),
          rating,
        }),
      })
      if (res.ok) {
        loadEvents()
      }
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Event Management</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">My Events</h1>
        <p className="mt-1 text-sm text-slate-500">Track all your events and their approval status.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-400 transition"
          />
        </div>
        <div className="relative">
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white pl-10 pr-8 py-2.5 text-sm outline-none focus:border-indigo-400 transition appearance-none"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* Events Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            {events.length === 0 ? 'No events yet. Create your first event!' : 'No events match your filters.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Event</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Venue</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Date</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Seats</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">AI Data</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Feedback</th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((event, i) => {
                  const aiData = aiDataByEvent[String(event._id)]
                  const feedbackSummary = feedbackSummaryByEvent[String(event._id)]
                  return (
                  <motion.tr
                    key={event._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-slate-50 hover:bg-slate-50/50"
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-800">{event.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{event.category}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{event.venue}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {event.start_date || event.date}
                      <span className="block text-xs text-slate-400">{event.start_time || event.time}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyles[event.status] || 'bg-slate-100 text-slate-600'}`}>
                        {event.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {event.registered_count || 0}/{event.seats || event.max_participants || '–'}
                    </td>
                    <td className="px-5 py-3.5">
                      {aiData ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                            <Sparkles className="h-3 w-3" />
                            {aiData.description_source === 'ai' ? 'AI description' : 'Saved profile'}
                          </span>
                          <p className="text-xs text-slate-500">
                            {aiData.clash_result?.hasClash ? 'Clash flagged' : 'Clash checked'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No AI data</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {feedbackSummary ? (
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            {feedbackSummary.averageRating ? `${feedbackSummary.averageRating}/5` : 'No ratings'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {feedbackSummary.count} note{feedbackSummary.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No feedback</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {event.status === 'pending_dean' && (
                          <Link
                            href={`/organizer/edit-event/${event._id}`}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                        )}
                        <Link
                          href={`/organizer/my-events/${event._id}`}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {!['approved', 'rejected', 'cancelled'].includes(event.status) && (
                          <button
                            onClick={() => handleCancel(event._id)}
                            disabled={cancellingId === event._id}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition disabled:opacity-40"
                            title="Cancel"
                          >
                            {cancellingId === event._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleAddOrganizerNote(event._id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition"
                          title="Add organizer note"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
