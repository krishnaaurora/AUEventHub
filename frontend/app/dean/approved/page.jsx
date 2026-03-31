'use client'

import { useEffect, useState, useMemo, memo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Eye,
  Loader2,
  Search,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import getSocket from '../../../lib/socket'

const EventRowSkeleton = () => (
  <tr className="border-b border-slate-50 animate-pulse">
    <td className="px-5 py-3.5"><div className="h-4 w-32 bg-slate-200 rounded" /></td>
    <td className="px-5 py-3.5"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
    <td className="px-5 py-3.5 hidden md:table-cell"><div className="h-4 w-20 bg-slate-50 rounded" /></td>
    <td className="px-5 py-3.5 hidden lg:table-cell"><div className="h-4 w-24 bg-slate-50 rounded" /></td>
    <td className="px-5 py-3.5 hidden lg:table-cell"><div className="h-4 w-16 bg-slate-50 rounded" /></td>
    <td className="px-5 py-3.5"><div className="h-6 w-28 bg-emerald-50 rounded-full" /></td>
    <td className="px-5 py-3.5 text-right"><div className="h-8 w-16 bg-slate-100 rounded-lg ml-auto" /></td>
  </tr>
)

const EventRow = memo(({ event, i }) => {
  const nextStatus = event.status === 'pending_registrar'
    ? 'Pending Registrar Approval'
    : event.status === 'pending_vc'
      ? 'Pending VC Approval'
      : event.status === 'published'
        ? 'Published & Live'
        : event.status === 'approved'
          ? 'Fully Approved'
          : event.status?.replace(/_/g, ' ')
          
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: i * 0.03 }}
      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
    >
      <td className="px-5 py-3.5 font-medium text-slate-800 max-w-[200px] truncate">{event.title}</td>
      <td className="px-5 py-3.5 text-slate-600">{event.organizer || '—'}</td>
      <td className="px-5 py-3.5 text-slate-600 hidden md:table-cell">{event.department || '—'}</td>
      <td className="px-5 py-3.5 text-slate-600 hidden lg:table-cell">{event.venue || '—'}</td>
      <td className="px-5 py-3.5 text-slate-600 hidden lg:table-cell">{event.start_date || event.date || '—'}</td>
      <td className="px-5 py-3.5">
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          {nextStatus}
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
  )
})

EventRow.displayName = 'EventRow'

export default function ApprovedEventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  async function loadApproved(pageNum = 1) {
    try {
      setLoading(true)
      const res = await fetch(`/api/dean/events?filter=approved&page=${pageNum}&limit=20`, { cache: 'no-store' })
      const json = await res.json()
      setEvents(Array.isArray(json.items) ? json.items : [])
      setHasMore(json.items?.length === 20)
      
      // Step 8: Preload next page
      if (json.items?.length === 20) {
        router.prefetch(`/api/dean/events?filter=approved&page=${pageNum + 1}&limit=20`)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadApproved(page) }, [page])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const handleRefresh = (payload) => {
      if (!payload?.scope || payload?.scope === 'dean') loadApproved()
    }
    socket.on('dashboard:refresh', handleRefresh)
    return () => socket.off('dashboard:refresh', handleRefresh)
  }, [])

  const filtered = events.filter((e) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (e.title || '').toLowerCase().includes(q) ||
      (e.organizer || '').toLowerCase().includes(q) ||
      (e.department || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Approved Events
            </h1>
            <p className="text-sm text-slate-500 mt-1">Events you have approved. These are pending further review.</p>
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
                <th className="px-5 py-3.5 text-left font-semibold text-slate-600 hidden md:table-cell">Department</th>
                <th className="px-5 py-3.5 text-left font-semibold text-slate-600 hidden lg:table-cell">Venue</th>
                <th className="px-5 py-3.5 text-left font-semibold text-slate-600 hidden lg:table-cell">Start Date</th>
                <th className="px-5 py-3.5 text-left font-semibold text-slate-600">Status</th>
                <th className="px-5 py-3.5 text-right font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <EventRowSkeleton key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No approved events found.
                  </td>
                </tr>
              ) : (
                filtered.map((event, i) => (
                  <EventRow key={event._id} event={event} i={i} />
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
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
