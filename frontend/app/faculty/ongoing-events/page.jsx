'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Building2, Users, Loader2, BadgeCheck } from 'lucide-react'

function OngoingEventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch('/api/faculty/events?filter=live', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setEvents(data.items || [])
        }
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ongoing Events</h1>
        <p className="mt-1 text-sm text-slate-600">Track all currently running events and participation in real time.</p>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No live events found right now.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event, index) => (
            <motion.article
              key={event._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-36 items-center justify-center bg-gradient-to-br from-cyan-100 to-blue-100">
                <span className="text-sm text-slate-700">Event Poster</span>
              </div>

              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="line-clamp-2 text-base font-semibold text-slate-900">{event.title}</h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                    <BadgeCheck className="h-3 w-3" />
                    Live Event
                  </span>
                </div>

                <div className="space-y-1 text-sm text-slate-600">
                  <p className="flex items-center gap-2"><Users className="h-4 w-4" /> {event.organizer_name || 'Organizer'}</p>
                  <p className="flex items-center gap-2"><Building2 className="h-4 w-4" /> {event.department || 'Department'}</p>
                  <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {event.venue || 'Venue'}</p>
                  <p className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {event.start_date} to {event.end_date}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                    <p>Registrations</p>
                    <p className="text-sm font-semibold text-slate-900">{event.registrations || 0}</p>
                  </div>
                  <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                    <p>Attendance</p>
                    <p className="text-sm font-semibold text-slate-900">{event.attendanceCount || 0}</p>
                  </div>
                </div>

                <Link
                  href={`/faculty/event/${event._id}`}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-700"
                >
                  View Details
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  )
}

export default OngoingEventsPage
