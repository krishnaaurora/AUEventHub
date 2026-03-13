'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  History,
  Eye,
  Loader2,
  Search,
  Filter,
} from 'lucide-react'
import getSocket from '../../../lib/socket'

const FILTER_OPTIONS = [
  { value: '', label: 'All Events' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'pending', label: 'Pending' },
]

export default function EventHistoryPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')

  async function loadHistory() {
    try {
      const url = filter
        ? `/api/dean/events?filter=${filter}`
        : '/api/dean/events'
      const res = await fetch(url, { cache: 'no-store' })
      const json = await res.json()
      setEvents(Array.isArray(json.items) ? json.items : [])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    loadHistory()
  }, [filter])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const handleRefresh = () => loadHistory()
    socket.on('dashboard:refresh', handleRefresh)
    return () => socket.off('dashboard:refresh', handleRefresh)
  }, [filter])

  const filtered = events.filter((e) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (e.title || '').toLowerCase().includes(q) ||
      (e.organizer || '').toLowerCase().includes(q) ||
      (e.department || '').toLowerCase().includes(q)
    )
  })

  function getStatusBadge(event) {
    const deanStatus = event.approval?.dean_status
    if (deanStatus === 'approved') {
      return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Approved</span>
    }
    if (deanStatus === 'rejected') {
      return <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">Rejected</span>
    }
    if (['pending_dean', 'pending'].includes(event.status)) {
      return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Pending</span>
    }
    return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{event.status?.replace(/_/g, ' ')}</span>
  }

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
              <History className="h-5 w-5 text-indigo-500" />
              Event History
            </h1>
            <p className="text-sm text-slate-500 mt-1">All events previously reviewed.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white appearance-none w-40"
              >
                {FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 w-52"
              />
            </div>
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
                <th className="px-5 py-3.5 text-left font-semibold text-slate-600 hidden md:table-cell">Department</th>
                <th className="px-5 py-3.5 text-left font-semibold text-slate-600 hidden lg:table-cell">Venue</th>
                <th className="px-5 py-3.5 text-left font-semibold text-slate-600 hidden lg:table-cell">Date</th>
                <th className="px-5 py-3.5 text-left font-semibold text-slate-600">Dean Status</th>
                <th className="px-5 py-3.5 text-left font-semibold text-slate-600 hidden xl:table-cell">Overall</th>
                <th className="px-5 py-3.5 text-right font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No events found.
                  </td>
                </tr>
              ) : (
                filtered.map((event, i) => (
                  <motion.tr
                    key={event._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-medium text-slate-800 max-w-[200px] truncate">{event.title}</td>
                    <td className="px-5 py-3.5 text-slate-600">{event.organizer || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-600 hidden md:table-cell">{event.department || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-600 hidden lg:table-cell">{event.venue || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-600 hidden lg:table-cell">{event.start_date || event.date || '—'}</td>
                    <td className="px-5 py-3.5">{getStatusBadge(event)}</td>
                    <td className="px-5 py-3.5 hidden xl:table-cell">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        event.status === 'approved' ? 'bg-emerald-100 text-emerald-700'
                        : event.status === 'rejected' ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                      }`}>
                        {event.status?.replace(/_/g, ' ')}
                      </span>
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
