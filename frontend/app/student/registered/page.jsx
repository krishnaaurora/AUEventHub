'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  BookMarked, MapPin, Clock, Eye, XCircle, Ticket, QrCode, Calendar,
  CheckCircle2, X, Download, Image,
} from 'lucide-react'
import getSocket from '../../../lib/socket'

function QRDisplay({ qrData, ticketId }) {
  const [show, setShow] = useState(false)

  if (!qrData) return (
    <span className="text-xs text-slate-400 italic">No QR</span>
  )

  // Build an SVG-based QR visual (simple hash-based pattern since we store JSON payload)
  // We use a URL-based QR code service to render the actual QR
  const encoded = encodeURIComponent(qrData)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
      >
        <QrCode className="h-3 w-3" />
        View QR
      </button>

      {show && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShow(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShow(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Ticket className="h-4 w-4 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Your Event Ticket</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Show this QR code to the organizer at the event entrance
              </p>
              {/* QR Code Image */}
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 inline-block mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt="QR Code"
                  width={200}
                  height={200}
                  className="rounded-lg"
                  onError={(e) => {
                    // fallback: show ticket ID as text QR
                    e.target.style.display = 'none'
                  }}
                />
              </div>
              <p className="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 rounded-xl px-4 py-2 mb-4">
                {ticketId}
              </p>
              <a
                href={qrUrl}
                download={`ticket-${ticketId}.png`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download QR
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}

export default function RegisteredEventsPage() {
  const [events, setEvents] = useState([])
  const [cancelId, setCancelId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { data: session, status } = useSession()
  const studentId = session?.user?.registrationId || session?.user?.id || ''

  useEffect(() => {
    let ignore = false

    async function loadRegistrations() {
      if (status === 'loading') return
      if (!studentId) {
        setLoading(false)
        setEvents([])
        return
      }

      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/student/registrations?student_id=${encodeURIComponent(studentId)}`, {
          cache: 'no-store',
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.message || 'Failed to load registrations.')
        if (!ignore) setEvents(Array.isArray(json.items) ? json.items : [])
      } catch (err) {
        if (!ignore) setError(err?.message || 'Failed to load registrations.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadRegistrations()
    return () => { ignore = true }
  }, [status, studentId])

  // Real-time refresh
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const reload = (payload) => {
      if (payload?.scope === 'student' || payload?.student_id === studentId) {
        setLoading(true)
        fetch(`/api/student/registrations?student_id=${encodeURIComponent(studentId)}`, { cache: 'no-store' })
          .then(r => r.json())
          .then(json => { setEvents(Array.isArray(json.items) ? json.items : []); setLoading(false) })
          .catch(() => setLoading(false))
      }
    }
    socket.on('dashboard:refresh', reload)
    socket.on('registration:changed', reload)
    return () => {
      socket.off('dashboard:refresh', reload)
      socket.off('registration:changed', reload)
    }
  }, [studentId])

  async function handleCancel(id) {
    if (!studentId) { setError('No active student session found.'); setCancelId(null); return }
    try {
      const res = await fetch(`/api/student/registrations/${id}?student_id=${encodeURIComponent(studentId)}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || 'Failed to cancel registration.')
      setEvents((prev) => prev.filter((e) => e.id !== id))
      setCancelId(null)
    } catch (err) {
      setError(err?.message || 'Failed to cancel registration.')
      setCancelId(null)
    }
  }

  return (
    <div className="space-y-6 p-6 xl:p-8">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <BookMarked className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold">My Registered Events</h1>
            <p className="text-sm text-slate-500">{events.length} event{events.length !== 1 ? 's' : ''} registered • QR codes available below</p>
          </div>
        </div>
      </div>

      {/* QR Info Banner */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-4 flex items-start gap-3">
        <QrCode className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-indigo-800">How to use your QR ticket</p>
          <ul className="text-xs text-indigo-600 mt-1 space-y-0.5 list-disc list-inside">
            <li>Click "View QR" next to any registered event</li>
            <li>Show the QR code to the organizer at the event entrance</li>
            <li>The organizer will scan it to mark your attendance</li>
            <li>Download the QR to save it offline</li>
          </ul>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading your registrations…</p>
        </div>
      )}

      {!loading && events.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <Ticket className="mx-auto h-12 w-12 mb-3" />
          <p className="text-lg font-semibold">No registrations yet</p>
          <p className="text-sm">Browse events and register to see them here.</p>
          <Link href="/student/events" className="mt-4 inline-block rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            Browse Events
          </Link>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div className="grid gap-4">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Poster thumbnail */}
                {event.poster ? (
                  <img
                    src={event.poster}
                    alt={event.event_title || 'Event'}
                    className="h-20 w-28 rounded-xl object-cover shrink-0 border border-slate-100"
                    onError={(e) => { e.target.onerror = null; e.target.src = '/assets/seminar.png' }}
                  />
                ) : (
                  <div className="h-20 w-28 rounded-xl shrink-0 bg-slate-100 flex items-center justify-center">
                    <Image className="h-6 w-6 text-slate-300" />
                  </div>
                )}
                {/* Event Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{event.event_title}</h3>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      (event.status || '').toLowerCase() === 'confirmed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {event.status || 'Confirmed'}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                    {event.date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {event.date}
                        {event.time && ` · ${event.time}`}
                      </span>
                    )}
                    {event.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.venue}
                      </span>
                    )}
                    {event.organizer && (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {event.organizer}
                      </span>
                    )}
                  </div>

                  <div className="mt-2">
                    <p className="text-xs text-slate-400">
                      Ticket: <span className="font-mono font-semibold text-slate-600">{event.ticket_id}</span>
                    </p>
                    {event.registered_at && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Registered: {new Date(event.registered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                  {/* QR Code Button */}
                  <QRDisplay qrData={event.qr_code} ticketId={event.ticket_id} />

                  {/* View Ticket */}
                  <Link
                    href={`/student/ticket/${event.id}`}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-indigo-400 hover:text-indigo-700 transition-colors"
                  >
                    <Eye className="h-3 w-3" /> Ticket
                  </Link>

                  {/* Cancel */}
                  {cancelId === event.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleCancel(event.id)}
                        className="rounded-full bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setCancelId(null)}
                        className="rounded-full border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600"
                      >
                        Keep
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCancelId(event.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <XCircle className="h-3 w-3" /> Cancel
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
