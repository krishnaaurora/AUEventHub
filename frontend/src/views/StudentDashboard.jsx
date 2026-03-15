'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays, BookMarked, CheckCircle2, Award, Zap, Radio,
  MapPin, Clock, Users, Sparkles, X, Flame,
} from 'lucide-react'
import { useEffect } from 'react'

const iconMap = { calendar: CalendarDays, bookmark: BookMarked, check: CheckCircle2, award: Award }
const fade = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } }

export default function StudentDashboard() {
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showAiRec, setShowAiRec] = useState(true)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch('/api/student/events?status=approved&limit=100')
        const data = await res.json()
        setEvents(data.items || [])
      } catch (error) {
        console.error('Failed to load events:', error)
      } finally {
        setLoading(false)
      }
    }
    loadEvents()
  }, [])

  const { upcomingEvents, ongoingEvents } = useMemo(() => {
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

    return {
      upcomingEvents: nextEvents.slice(0, 4),
      ongoingEvents: liveEvents.slice(0, 4),
    }
  }, [events])

  const filteredUpcoming = useMemo(() => {
    if (selectedCategory === 'All') return upcomingEvents
    return upcomingEvents.filter((e) => e.category === selectedCategory)
  }, [selectedCategory, upcomingEvents])

  function openDetail(event) {
    setSelectedEvent(event)
    setDetailOpen(true)
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  function openDetail(event) {
    setSelectedEvent(event)
    setDetailOpen(true)
  }

  return (
    <div className="space-y-8 p-6 xl:p-8">

      {/* ── Stats Cards ───────────────────────────────── */}
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((s, i) => {
          const Icon = iconMap[s.icon] || CalendarDays
          return (
            <motion.div
              key={s.label}
              {...fade}
              transition={{ delay: i * 0.07 }}
              className={`rounded-2xl border ${s.border} ${s.bg} p-5 shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg} ${s.text}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-500">{s.label}</p>
            </motion.div>
          )
        })}
      </section>

      {/* ── AI Recommended Events ─────────────────────── */}
      <AnimatePresence>
        {showAiRec && (
          <motion.section
            initial={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0, marginTop: 0, overflow: 'hidden' }}
            transition={{ duration: 0.3 }}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600 flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5" /> AI Recommended
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Recommended For You</h2>
                <p className="text-sm text-slate-500">Based on your department, past registrations &amp; campus trends.</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-cyan-300">
                  Refresh AI
                </button>
                <button
                  onClick={() => setShowAiRec(false)}
                  className="rounded-full border border-slate-200 p-2 text-slate-400 hover:border-rose-300 hover:text-rose-500 transition-colors"
                  title="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {recommendedEvents.map((event) => (
                <div
                  key={event.id}
                  className="group cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative overflow-hidden rounded-2xl">
                    <img src={event.poster} alt={event.title} className="h-36 w-full object-cover transition-transform group-hover:scale-105" />
                    <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-cyan-600 px-3 py-1 text-[10px] font-semibold uppercase text-white">
                      <Zap className="h-3 w-3" /> AI Recommended
                    </span>
                  </div>
                  <div className="mt-4 space-y-1.5">
                    <h3 className="text-base font-semibold">{event.title}</h3>
                    <p className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" />{event.venue}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-500"><Clock className="h-3 w-3" />{event.dateTime}</p>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{event.category}</span>
                      <span className="text-[10px] font-semibold text-amber-600">{event.seats} seats left</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => openDetail(event)} className="flex-1 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-cyan-400">
                      View Details
                    </button>
                    <button className="flex-1 rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">
                      Register
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Ongoing + Notifications ───────────────────── */}
      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 flex items-center gap-1"><Radio className="h-3.5 w-3.5" /> Live</p>
              <h2 className="mt-2 text-2xl font-semibold">Happening Now</h2>
            </div>
            <Link href="/student/events" className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-emerald-300">View All</Link>
          </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {ongoingEvents.length === 0 ? (
            <p className="text-sm text-slate-500 col-span-2">No ongoing events currently.</p>
          ) : (
            ongoingEvents.map((event) => (
              <div key={event._id} className="group rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="relative overflow-hidden rounded-2xl">
                  <img src="/assets/galleryimage4.png" alt={event.title} className="h-36 w-full object-cover" />
                  <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-semibold uppercase text-white animate-pulse">
                    <Radio className="h-3 w-3" /> Live Now
                  </span>
                </div>
                <div className="mt-4 space-y-1">
                  <h3 className="text-base font-semibold">{event.title}</h3>
                  <p className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" />{event.venue}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-500"><Clock className="h-3 w-3" />{event.start_time}</p>
                </div>
                <button className="mt-4 w-full rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
                  Join / View
                </button>
              </div>
            ))
          )}
        </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Notifications</h3>
              <p className="text-sm text-slate-500">AI prioritized updates</p>
            </div>
            <Link href="/student/notifications" className="text-xs font-semibold text-indigo-600 hover:underline">View All</Link>
          </div>
          <div className="mt-4 space-y-3">
            {notifications.slice(0, 3).map((note) => (
              <div key={note.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{note.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    note.priority === 'high' ? 'bg-rose-100 text-rose-600'
                    : note.priority === 'medium' ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-500'
                  }`}>{note.priority}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{note.detail}</p>
                <p className="mt-2 text-[11px] text-slate-400">{note.time}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Category Filters ──────────────────────────── */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Filters</p>
            <h2 className="mt-2 text-2xl font-semibold">Event Categories</h2>
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
      </section>

      {/* ── Upcoming Events ───────────────────────────── */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Upcoming</p>
            <h2 className="mt-2 text-2xl font-semibold">Upcoming Events</h2>
          </div>
          <Link href="/student/events" className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-indigo-300">View Calendar</Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredUpcoming.length === 0 ? (
            <p className="text-sm text-slate-500 col-span-3">No upcoming events in the catalog.</p>
          ) : (
            filteredUpcoming.map((event) => (
              <motion.div key={event._id} layout className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="relative overflow-hidden rounded-2xl">
                  <img src="/assets/galleryimage3.png" alt={event.title} className="h-36 w-full object-cover transition-transform group-hover:scale-105" />
                </div>
                <div className="mt-4 space-y-1.5">
                  <h3 className="text-base font-semibold">{event.title}</h3>
                  <p className="flex items-center gap-1 text-xs text-slate-500"><Clock className="h-3 w-3" />{event.start_date} · {event.start_time}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" />{event.venue}</p>
                  <p className="text-xs text-slate-500">Organizer: {event.organizer}</p>
                  <p className="text-xs font-semibold text-amber-600">{event.max_participants - event.registered_count} seats left</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => openDetail(event)} className="flex-1 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-400">View Details</button>
                  <button className="flex-1 rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">Register</button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* ── Trending Events ───────────────────────────── */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 flex items-center gap-1"><Flame className="h-3.5 w-3.5" /> Trending</p>
            <h2 className="mt-2 text-2xl font-semibold">Trending on Campus</h2>
          </div>
          <button className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-amber-300">See Rankings</button>
        </div>
        <div className="mt-6 space-y-4">
          {trendingEvents.map((event) => (
            <div key={event.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg md:flex-row md:items-center">
              <img src={event.poster} alt={event.title} className="h-28 w-full rounded-2xl object-cover md:w-40" />
              <div className="flex-1 space-y-1">
                <h3 className="text-base font-semibold">{event.title}</h3>
                <p className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" />{event.venue}</p>
                <p className="flex items-center gap-1 text-xs text-slate-500"><Clock className="h-3 w-3" />{event.date}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-amber-700"><Flame className="h-3 w-3" /> Trending</span>
                  <span className="flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 text-slate-600"><Users className="h-3 w-3" /> {event.registrations}+ registered</span>
                </div>
              </div>
              <button onClick={() => openDetail(event)} className="rounded-full bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 self-start md:self-center">View</button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Registered Events Quick View ──────────────── */}
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">My Registered Events</h2>
              <p className="text-sm text-slate-500">Track your registrations</p>
            </div>
            <Link href="/student/registered" className="text-xs font-semibold text-indigo-600 hover:underline">View All</Link>
          </div>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Venue</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {registeredEvents.map((event) => (
                  <tr key={event.id} className="border-t border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold">{event.name}</td>
                    <td className="px-4 py-3 text-slate-500">{event.date}</td>
                    <td className="px-4 py-3 text-slate-500">{event.venue}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        event.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>{event.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <Link href={`/student/ticket/${event.id}`} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-indigo-400">View Ticket</Link>
                        <button className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50">Cancel</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Event Ticket</h2>
          <p className="text-sm text-slate-500">Digital access pass</p>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Student Name</p>
                <p className="font-semibold">Lalitha S</p>
              </div>
              <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">Active Ticket</span>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <p><span className="text-slate-500">Event:</span> {registeredEvents[0]?.name}</p>
              <p><span className="text-slate-500">Venue:</span> {registeredEvents[0]?.venue}</p>
              <p><span className="text-slate-500">Date:</span> {registeredEvents[0]?.date}</p>
              <p><span className="text-slate-500">Ticket ID:</span> <span className="font-mono text-xs">{registeredEvents[0]?.ticketId}</span></p>
            </div>
            <div className="mt-4 flex items-center justify-center">
              <div className="h-28 w-28 rounded-2xl bg-white p-3 shadow-inner">
                <div className="grid h-full w-full grid-cols-5 gap-0.5">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i} className={`rounded-sm ${i % 3 === 0 || i % 7 === 0 ? 'bg-slate-900' : 'bg-slate-200'}`} />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-indigo-300">Download Ticket</button>
              <button className="flex-1 rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">Add to Calendar</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Event Detail Modal ────────────────────────── */}
      <AnimatePresence>
        {detailOpen && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setDetailOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
              <button onClick={() => setDetailOpen(false)} className="absolute right-4 top-4 rounded-full border border-slate-200 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 z-10">
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

                {selectedEvent.category && (
                  <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">{selectedEvent.category}</span>
                )}

                <p className="text-sm text-slate-600 leading-relaxed">{selectedEvent.description}</p>

                {selectedEvent.aiSummary && (
                  <div className="rounded-2xl bg-cyan-50 border border-cyan-200 p-4">
                    <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.15em] text-cyan-700"><Sparkles className="h-3.5 w-3.5" /> AI Event Summary</p>
                    <p className="mt-2 text-sm text-slate-700">{selectedEvent.aiSummary}</p>
                  </div>
                )}

                {selectedEvent.skills?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-800 mb-1.5">Skills You&apos;ll Gain</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedEvent.skills.map((s) => (
                        <span key={s} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">{s}</span>
                      ))}
                    </div>
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
                    <ul className="mt-1 space-y-1 text-sm text-slate-600">
                      {selectedEvent.schedule.map((item) => <li key={item}>• {item}</li>)}
                    </ul>
                  </div>
                )}

                {selectedEvent.instructions?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Instructions</p>
                    <ul className="mt-1 space-y-1 text-sm text-slate-600">
                      {selectedEvent.instructions.map((item) => <li key={item}>• {item}</li>)}
                    </ul>
                  </div>
                )}

                {selectedEvent.seats && (
                  <p className="text-sm font-semibold text-amber-600">{selectedEvent.seats} seats remaining</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button className="flex-1 rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">Register Now</button>
                  <button onClick={() => setDetailOpen(false)} className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Close</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
