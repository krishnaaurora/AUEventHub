'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  XCircle,
  Eye,
  Loader2,
  Search,
} from 'lucide-react'
import getSocket from '../../../lib/socket'

export default function RejectedEventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function loadRejected() {
    try {
      const res = await fetch('/api/dean/events?filter=rejected', { cache: 'no-store' })
      const json = await res.json()
      setEvents(Array.isArray(json.items) ? json.items : [])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRejected() }, [])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const handleRefresh = (payload) => {
      if (!payload?.scope || payload?.scope === 'dean') loadRejected()
    }
    socket.on('dashboard:refresh', handleRefresh)
    return () => socket.off('dashboard:refresh', handleRefresh)
  }, [])

  const filtered = events.filter((e) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (e.title || '').toLowerCase().includes(q) ||
      (e.organizer || '').toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-500" />
              Rejected Events
            </h1>
            <p className="text-sm text-slate-500 mt-1">Event proposals you have rejected.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events..."
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 w-64"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-3.5 text-left font-semibold text-slate-600">Event Name</th>
                <th className="px-5 py-3.5 text-left font-semibold text-slate-600">Organizer</th>
                <th className="px-5 py-3.5 text-left font-semibold text-slate-600 hidden md:table-cell">Rejection Reason</th>
                <th className="px-5 py-3.5 text-left font-semibold text-slate-600 hidden lg:table-cell">Date Rejected</th>
                <th className="px-5 py-3.5 text-right font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    No rejected events found.
                  </td>
                </tr>
              ) : (
                filtered.map((event, i) => (
                  <motion.tr
                    key={event._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-medium text-slate-800 max-w-[200px] truncate">{event.title}</td>
                    <td className="px-5 py-3.5 text-slate-600">{event.organizer || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-600 hidden md:table-cell max-w-[250px] truncate">
                      {event.approval?.dean_rejection_reason || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 hidden lg:table-cell">
                      {event.approval?.dean_reviewed_at
                        ? new Date(event.approval.dean_reviewed_at).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href={`/dean/event/${event._id}`}>
                        <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                          <Eye className="h-3.5 w-3.5 inline mr-1" /> View
                        </button>
                      </Link>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
