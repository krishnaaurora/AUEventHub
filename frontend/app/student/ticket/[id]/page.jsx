'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { ArrowLeft, MapPin, Clock, Users, Download, CalendarPlus } from 'lucide-react'

export default function TicketPage({ params }) {
  const { data: session } = useSession()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const profileName = session?.user?.name || 'Student User'
  const profileRegId = session?.user?.registrationId || session?.user?.id || 'Not assigned'

  useEffect(() => {
    let ignore = false

    async function loadTicket() {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/student/registrations/${params.id}`, { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok) {
          throw new Error(json?.message || 'Ticket not found.')
        }
        if (!ignore) {
          setEvent(json)
        }
      } catch (err) {
        if (!ignore) {
          setError(err?.message || 'Ticket not found.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadTicket()

    return () => {
      ignore = true
    }
  }, [params.id])

  const gcalUrl = useMemo(() => {
    if (!event) {
      return '#'
    }
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.event_title)}&dates=20260520T100000/20260520T130000&details=${encodeURIComponent(`Ticket ID: ${event.ticket_id}`)}&location=${encodeURIComponent(event.venue)}`
  }, [event])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <p className="text-lg font-semibold">Loading ticket...</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <p className="text-lg font-semibold">{error || 'Ticket not found'}</p>
        <Link href="/student/registered" className="mt-4 text-sm font-semibold text-indigo-600 hover:underline">Back to Registered Events</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 xl:p-8">
      <Link href="/student/registered" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Registered Events
      </Link>

      <div className="mx-auto max-w-lg">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          {/* Header */}
          <div className="text-center border-b border-dashed border-slate-200 pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Event Ticket</p>
            <h2 className="mt-2 text-xl font-bold">{event.event_title}</h2>
            <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
              event.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>{event.status}</span>
          </div>

          {/* Details */}
          <div className="py-6 space-y-4 border-b border-dashed border-slate-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase text-slate-400">Student</p>
                <p className="text-sm font-semibold">{profileName}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-slate-400">Reg ID</p>
                <p className="text-sm font-semibold">{profileRegId}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-slate-400">Date & Time</p>
                <p className="flex items-center gap-1 text-sm font-semibold"><Clock className="h-3 w-3 text-slate-400" />{event.date} · {event.time}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-slate-400">Venue</p>
                <p className="flex items-center gap-1 text-sm font-semibold"><MapPin className="h-3 w-3 text-slate-400" />{event.venue}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-slate-400">Organizer</p>
                <p className="flex items-center gap-1 text-sm font-semibold"><Users className="h-3 w-3 text-slate-400" />{event.organizer}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-slate-400">Ticket ID</p>
                <p className="font-mono text-sm font-bold text-indigo-600">{event.ticket_id}</p>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="py-6 flex flex-col items-center">
            <p className="text-[10px] font-semibold uppercase text-slate-400 mb-3">Scan for Attendance</p>
            <div className="h-36 w-36 rounded-2xl bg-slate-50 p-4 shadow-inner border border-slate-200">
              <div className="grid h-full w-full grid-cols-7 gap-0.5">
                {Array.from({ length: 49 }).map((_, i) => (
                  <div key={i} className={`rounded-[1px] ${(i * 7 + i) % 3 === 0 || i % 5 === 0 ? 'bg-slate-900' : 'bg-slate-200'}`} />
                ))}
              </div>
            </div>
            <p className="mt-3 text-[11px] text-slate-400">Show this QR at the event entrance</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-700 transition-colors">
              <Download className="h-4 w-4" /> Download
            </button>
            <a
              href={gcalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              <CalendarPlus className="h-4 w-4" /> Add to Calendar
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
