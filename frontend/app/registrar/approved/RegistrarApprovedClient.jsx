'use client'

import { useState, useMemo, memo, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Eye,
  MapPin,
  Clock,
  Building2,
  User as UserIcon,
  Calendar,
  Search,
} from 'lucide-react'

// ✅ memo — card only re-renders when its own event data changes
const ApprovedEventCard = memo(function ApprovedEventCard({ event, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-xl border border-slate-100 bg-white p-5 hover:shadow-md hover:border-emerald-200 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-800 line-clamp-2">{event.title}</h3>
        <span
          className={`shrink-0 rounded-full text-xs px-2 py-1 font-medium ${
            event.status === 'pending_vc'
              ? 'bg-amber-100 text-amber-700'
              : event.status === 'rejected'
              ? 'bg-rose-100 text-rose-700'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {event.status === 'pending_vc'
            ? 'Pending VC'
            : event.status === 'rejected'
            ? 'VC Rejected'
            : 'VC Approved'}
        </span>
      </div>

      <div className="space-y-2 text-xs text-slate-500 mb-4">
        <div className="flex items-center gap-2">
          <UserIcon className="h-3.5 w-3.5 text-slate-400" />
          <span>{event.organizer || 'Unknown'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-slate-400" />
          <span>{event.department || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          <span>{event.venue || 'TBD'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>{event.start_date || event.date}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>
            {event.start_time || '—'} — {event.end_time || '—'}
          </span>
        </div>
      </div>

      <Link href={`/registrar/event/${event._id}`}>
        <button className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-600 transition-colors">
          <Eye className="h-3 w-3" />
          View Details
        </button>
      </Link>
    </motion.div>
  )
})

// ✅ Client shell — only search state lives here, events come pre-loaded from server
export default function RegistrarApprovedClient({ initialEvents }) {
  const [searchQuery, setSearchQuery] = useState('')

  // ✅ useMemo — avoid re-filtering on every unrelated render
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return initialEvents
    const q = searchQuery.toLowerCase()
    return initialEvents.filter(
      (event) =>
        event.title?.toLowerCase().includes(q) ||
        event.organizer?.toLowerCase().includes(q) ||
        event.venue?.toLowerCase().includes(q)
    )
  }, [initialEvents, searchQuery])

  // ✅ useCallback — stable reference so child inputs don't re-render on parent state change
  const handleSearch = useCallback((e) => {
    setSearchQuery(e.target.value)
  }, [])

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Registrar Events</h1>
          <p className="text-sm text-slate-500 mt-1">
            Events approved by registrar, pending VC final approval
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search events..."
          value={searchQuery}
          onChange={handleSearch}
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">No approved events found.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event, index) => (
            <ApprovedEventCard key={event._id} event={event} index={index} />
          ))}
        </div>
      )}
    </div>
  )
}
