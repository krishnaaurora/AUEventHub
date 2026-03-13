'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  Users,
  Search,
  Download,
  Loader2,
  Ticket,
  Clock,
  Building2,
} from 'lucide-react'
import getSocket from '../../../lib/socket'

export default function RegistrationsPage() {
  const { data: session } = useSession()
  const [registrations, setRegistrations] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [eventFilter, setEventFilter] = useState('')

  const organizerName = session?.user?.name || session?.user?.email || ''

  async function loadData() {
    try {
      const [eventsRes, regsRes] = await Promise.all([
        fetch('/api/student/events?limit=500', { cache: 'no-store' }),
        fetch('/api/student/registrations', { cache: 'no-store' }),
      ])
      const eventsJson = await eventsRes.json()
      const regsJson = await regsRes.json()

      const allEvents = Array.isArray(eventsJson.items) ? eventsJson.items : []
      const myEvents = organizerName
        ? allEvents.filter((e) => e.organizer === organizerName)
        : allEvents
      setEvents(myEvents)

      const myEventIds = new Set(myEvents.map((e) => String(e._id)))
      const allRegs = Array.isArray(regsJson.items) ? regsJson.items : []
      const myRegs = allRegs.filter((r) => myEventIds.has(String(r.event_id)))

      const enriched = myRegs.map((r) => {
        const event = myEvents.find((e) => String(e._id) === String(r.event_id))
        return { ...r, event_title: event?.title || 'Unknown', event_category: event?.category || '' }
      })

      setRegistrations(enriched)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [organizerName])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const handler = () => loadData()
    socket.on('registration:changed', handler)
    socket.on('dashboard:refresh', handler)
    return () => {
      socket.off('registration:changed', handler)
      socket.off('dashboard:refresh', handler)
    }
  }, [organizerName])

  const filtered = registrations.filter((r) => {
    if (eventFilter && String(r.event_id) !== eventFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        r.student_id?.toLowerCase().includes(q) ||
        r.ticket_id?.toLowerCase().includes(q) ||
        r.event_title?.toLowerCase().includes(q)
      )
    }
    return true
  })

  function handleExportCSV() {
    const headers = ['Student ID', 'Event', 'Ticket ID', 'Registered At']
    const rows = filtered.map((r) => [
      r.student_id,
      r.event_title,
      r.ticket_id,
      r.registered_at || '',
    ])
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'registrations.csv'
    a.click()
    URL.revokeObjectURL(url)
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
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Registrations</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Student Registrations</h1>
        <p className="mt-1 text-sm text-slate-500">
          {registrations.length} registration{registrations.length !== 1 ? 's' : ''} across {events.length} event{events.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student ID, ticket, or event..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-400 transition"
          />
        </div>
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-400 transition"
        >
          <option value="">All Events</option>
          {events.map((ev) => (
            <option key={ev._id} value={String(ev._id)}>{ev.title}</option>
          ))}
        </select>
        <button
          onClick={handleExportCSV}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">No registrations found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Student ID</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Event</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Ticket ID</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Registered At</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((reg, i) => (
                  <motion.tr
                    key={reg.id || `${reg.student_id}-${reg.event_id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-slate-50 hover:bg-slate-50/50"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                          <Users className="h-3.5 w-3.5 text-indigo-500" />
                        </div>
                        <span className="font-medium text-slate-800">{reg.student_id}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-slate-700">{reg.event_title}</p>
                      <p className="text-xs text-slate-400">{reg.event_category}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Ticket className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-mono text-xs">{reg.ticket_id}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs">
                          {reg.registered_at
                            ? new Date(reg.registered_at).toLocaleString('en-IN')
                            : '–'}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
