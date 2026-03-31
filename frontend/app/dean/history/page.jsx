'use client'

import { useEffect, useState, memo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  History,
  Eye,
  Loader2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import getSocket from '../../../lib/socket'

const EventRowSkeleton = () => (
  <tr className="border-b border-slate-50 animate-pulse">
    <td className="px-5 py-3.5"><div className="h-4 w-32 bg-slate-200 rounded" /></td>
    <td className="px-5 py-3.5"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
    <td className="px-5 py-3.5 hidden md:table-cell"><div className="h-4 w-20 bg-slate-50 rounded" /></td>
    <td className="px-5 py-3.5 hidden lg:table-cell"><div className="h-4 w-24 bg-slate-50 rounded" /></td>
    <td className="px-5 py-3.5 hidden lg:table-cell"><div className="h-4 w-16 bg-slate-50 rounded" /></td>
    <td className="px-5 py-3.5"><div className="h-6 w-20 bg-slate-50 rounded-full" /></td>
    <td className="px-5 py-3.5 hidden xl:table-cell"><div className="h-6 w-24 bg-slate-50 rounded-full" /></td>
    <td className="px-5 py-3.5 text-right"><div className="h-8 w-16 bg-slate-100 rounded-lg ml-auto" /></td>
  </tr>
)

const EventRow = memo(({ event, i, getStatusBadge }) => (
  <motion.tr
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

EventRow.displayName = 'EventRow'

const FILTER_OPTIONS = [
  { value: '', label: 'All Events' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

export default function EventHistoryPage() {
  const router = useRouter()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  async function loadHistory(pageNum = 1) {
    try {
      setLoading(true)
      const url = filter
        ? `/api/dean/events?filter=${filter}&page=${pageNum}&limit=20`
        : `/api/dean/events?page=${pageNum}&limit=20`
      const res = await fetch(url, { cache: 'no-store' })
      const json = await res.json()
      setEvents(Array.isArray(json.items) ? json.items : [])
      setHasMore(json.items?.length === 20)
      
      if (json.items?.length === 20) {
        router.prefetch(filter ? `/api/dean/events?filter=${filter}&page=${pageNum + 1}&limit=20` : `/api/dean/events?page=${pageNum + 1}&limit=20`)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory(page)
  }, [filter, page])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const handleRefresh = (payload) => {
      if (!payload?.scope || payload?.scope === 'dean') loadHistory(page)
    }
    socket.on('dashboard:refresh', handleRefresh)
    return () => socket.off('dashboard:refresh', handleRefresh)
  }, [page])

  const filtered = events.filter((e) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (e.title || '').toLowerCase().includes(q) ||
      (e.organizer || '').toLowerCase().includes(q) ||
      (e.department || '').toLowerCase().includes(q)
    )
  })

  const getStatusBadge = (event) => {
    const status = event.status || 'pending'
    if (status === 'approved' || status === 'published' || status === 'completed') {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          Fully Approved
        </span>
      )
    } else if (status === 'rejected') {
      return (
        <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
          Rejected
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
          In Review
        </span>
      )
    }
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
            <p className="text-sm text-slate-500 mt-1">Review your past decisions and event workflow logs.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={filter}
                onChange={(e) => { setFilter(e.target.value); setPage(1) }}
                className="pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 appearance-none bg-white min-w-[140px]"
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
                placeholder="Search history..."
                className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 w-60"
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
                <th className="px-5 py-3.5 text-left font-semibold text-slate-600">Outcome</th>
                <th className="px-5 py-3.5 text-left font-semibold text-slate-600 hidden xl:table-cell">Internal Status</th>
                <th className="px-5 py-3.5 text-right font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <EventRowSkeleton key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No events found.
                  </td>
                </tr>
              ) : (
                filtered.map((event, i) => (
                  <EventRow key={event._id} event={event} i={i} getStatusBadge={getStatusBadge} />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Page <span className="font-semibold text-slate-900">{page}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
