'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Users,
  Building2,
  Loader2,
  Filter,
} from 'lucide-react'

const VENUES = ['All Venues', 'Auditorium', 'Seminar Hall', 'Conference Room', 'Main Hall', 'Lab Block']

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const STATUS_COLOR = {
  published: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  pending_vc: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-blue-100 text-blue-800 border-blue-200',
  rejected: 'bg-rose-100 text-rose-800 border-rose-200',
  pending_registrar: 'bg-violet-100 text-violet-800 border-violet-200',
  pending_dean: 'bg-orange-100 text-orange-800 border-orange-200',
  completed: 'bg-slate-100 text-slate-800 border-slate-200',
}

function getStatusLabel(status) {
  const map = {
    published: 'Published',
    pending_vc: 'Pending VC',
    approved: 'Approved',
    rejected: 'Rejected',
    pending_registrar: 'Pending Registrar',
    pending_dean: 'Pending Dean',
    completed: 'Completed',
  }
  return map[status] || status
}

function EventBadge({ event, onClick }) {
  const colorClass = STATUS_COLOR[event.status] || STATUS_COLOR.approved
  return (
    <button
      onClick={() => onClick(event)}
      className={`w-full text-left px-2 py-1 rounded-md border text-xs font-medium truncate mb-1 hover:opacity-80 transition-opacity ${colorClass}`}
      title={`${event.title} — ${event.venue || 'Venue TBA'}`}
    >
      {event.title}
    </button>
  )
}

function EventDetailPanel({ event, onClose }) {
  if (!event) return null
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-lg p-5 space-y-3"
    >
      <div className="flex items-start justify-between">
        <h3 className="font-bold text-slate-900 text-base leading-tight">{event.title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xs px-2 py-0.5 rounded border border-slate-200">✕</button>
      </div>

      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLOR[event.status] || STATUS_COLOR.approved}`}>
        {getStatusLabel(event.status)}
      </span>

      <div className="space-y-2 text-sm text-slate-600">
        {event.venue && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
            <span>{event.venue}</span>
          </div>
        )}
        {event.start_date && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
            <span>
              {new Date(event.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              {event.end_date && event.end_date !== event.start_date && ` — ${new Date(event.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
            </span>
          </div>
        )}
        {(event.start_time || event.end_time) && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400 shrink-0" />
            <span>{event.start_time || '—'}{event.end_time ? ` – ${event.end_time}` : ''}</span>
          </div>
        )}
        {event.max_participants && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400 shrink-0" />
            <span>{event.max_participants} expected participants</span>
          </div>
        )}
        {event.department && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
            <span>{event.department}</span>
          </div>
        )}
        {event.organizer_name && (
          <div className="flex items-start gap-2">
            <span className="text-slate-400 shrink-0 text-xs mt-0.5">Organizer:</span>
            <span className="font-medium text-slate-800">{event.organizer_name}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function VenueSchedulePage({ role = 'dean' }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedVenue, setSelectedVenue] = useState('All Venues')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [view, setView] = useState('month') // 'month' | 'list'

  const apiPath = role === 'vc' ? '/api/vc/events?limit=200'
    : role === 'dean' ? '/api/dean/events?limit=200'
    : '/api/registrar/events?limit=200'

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(apiPath, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setEvents(data.items || [])
        }
      } catch { /* silently fail */ }
      finally { setLoading(false) }
    }
    load()
  }, [apiPath])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (selectedVenue !== 'All Venues') {
        const venue = (e.venue || '').toLowerCase()
        if (!venue.includes(selectedVenue.toLowerCase())) return false
      }
      return !!e.start_date
    })
  }, [events, selectedVenue])

  function getEventsForDay(day) {
    const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return filteredEvents.filter(e => {
      const start = e.start_date?.slice(0, 10)
      const end = e.end_date?.slice(0, 10) || start
      return start && start <= d && end >= d
    })
  }

  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' })

  const upcomingEvents = filteredEvents
    .filter(e => e.start_date && new Date(e.start_date) >= new Date())
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .slice(0, 20)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-emerald-600" />
            Venue Schedule
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Calendar view of events by venue</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1">
            <button
              onClick={() => setView('month')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${view === 'month' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >Calendar</button>
            <button
              onClick={() => setView('list')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${view === 'list' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >List</button>
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedVenue}
              onChange={e => setSelectedVenue(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              {VENUES.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(STATUS_COLOR).map(([status, cls]) => (
          <span key={status} className={`rounded-full px-3 py-0.5 text-xs font-medium border ${cls}`}>
            {getStatusLabel(status)}
          </span>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {view === 'month' && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Calendar header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <button
                  onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                  className="rounded-lg p-2 hover:bg-slate-100 text-slate-500 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <h2 className="text-lg font-bold text-slate-900">{monthName} {year}</h2>
                <button
                  onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                  className="rounded-lg p-2 hover:bg-slate-100 text-slate-500 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-slate-100">
                {DAY_HEADERS.map(day => (
                  <div key={day} className="p-2 text-center text-xs font-semibold text-slate-500 uppercase">{day}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {/* Empty slots before first day */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[90px] border-r border-b border-slate-100 bg-slate-50/50" />
                ))}

                {/* Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const dayEvents = getEventsForDay(day)
                  const today = new Date()
                  const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
                  return (
                    <div
                      key={day}
                      className={`min-h-[90px] border-r border-b border-slate-100 p-1.5 ${isToday ? 'bg-emerald-50/50' : ''}`}
                    >
                      <p className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-emerald-600 text-white' : 'text-slate-700'}`}>
                        {day}
                      </p>
                      {dayEvents.slice(0, 3).map((ev, idx) => (
                        <EventBadge key={ev._id || idx} event={ev} onClick={setSelectedEvent} />
                      ))}
                      {dayEvents.length > 3 && (
                        <p className="text-[10px] text-slate-400 pl-1">+{dayEvents.length - 3} more</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {view === 'list' && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Upcoming Events — {selectedVenue}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{upcomingEvents.length} events upcoming</p>
              </div>
              {upcomingEvents.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p>No upcoming events found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {upcomingEvents.map((ev, i) => (
                    <motion.button
                      key={ev._id || i}
                      onClick={() => setSelectedEvent(ev)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="w-full flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="shrink-0 w-12 text-center border border-slate-200 rounded-xl p-1">
                        <p className="text-xs text-slate-500">{new Date(ev.start_date).toLocaleString('default', { month: 'short' })}</p>
                        <p className="text-lg font-bold text-slate-900">{new Date(ev.start_date).getDate()}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{ev.title}</p>
                        {ev.venue && <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5"><MapPin className="h-3 w-3" />{ev.venue}</p>}
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium border ${STATUS_COLOR[ev.status] || STATUS_COLOR.approved}`}>
                        {getStatusLabel(ev.status)}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Event detail / upcoming */}
        <div className="space-y-4">
          {selectedEvent ? (
            <EventDetailPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
              <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" /> Today's Events
              </h3>
              {(() => {
                const today = new Date()
                const d = today.toISOString().slice(0, 10)
                const todayEvents = filteredEvents.filter(e => {
                  const start = e.start_date?.slice(0, 10)
                  const end = e.end_date?.slice(0, 10) || start
                  return start && start <= d && end >= d
                })
                return todayEvents.length > 0 ? (
                  <div className="space-y-2">
                    {todayEvents.map((ev, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedEvent(ev)}
                        className="w-full text-left rounded-xl border border-slate-200 p-3 hover:bg-slate-50 transition-colors"
                      >
                        <p className="font-semibold text-sm text-slate-900 truncate">{ev.title}</p>
                        {ev.venue && <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{ev.venue}</p>}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">No events today</p>
                )
              })()}
            </div>
          )}

          {/* Upcoming events mini list */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
            <h3 className="font-semibold text-slate-700 mb-3">Upcoming Events</h3>
            {upcomingEvents.slice(0, 6).map((ev, i) => (
              <button
                key={i}
                onClick={() => setSelectedEvent(ev)}
                className="w-full flex items-center gap-3 py-2 text-left hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors"
              >
                <div className="h-8 w-8 shrink-0 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                  {new Date(ev.start_date).getDate()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-800 truncate">{ev.title}</p>
                  <p className="text-xs text-slate-400">{ev.venue || 'Venue TBA'}</p>
                </div>
              </button>
            ))}
            {upcomingEvents.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-3">No upcoming events</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
