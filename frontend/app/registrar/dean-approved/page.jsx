'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  MapPin,
  Clock,
  Building2,
  User as UserIcon,
  Calendar,
  Users,
  Search,
  Filter,
} from 'lucide-react'

function DeanApprovedEventsPage() {
  const { data: session } = useSession()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')

  async function loadEvents() {
    try {
      const res = await fetch('/api/registrar/events?filter=pending&limit=100', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setEvents(data.items || [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const filteredEvents = events.filter(event => {
    const matchesSearch = !searchQuery ||
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.organizer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter = filter === 'all' ||
      (filter === 'today' && event.start_date === new Date().toISOString().split('T')[0]) ||
      (filter === 'thisWeek' && new Date(event.start_date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))

    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dean Approved Events</h1>
          <p className="text-sm text-slate-500 mt-1">Events approved by Dean, pending registrar verification</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search events by title, organizer, or venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          >
            <option value="all">All Events</option>
            <option value="today">Today</option>
            <option value="thisWeek">This Week</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-400 text-lg">No events found matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Event Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Organizer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Venue</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Start Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">End Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Start Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">End Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Expected Participants</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredEvents.map((event, index) => (
                  <motion.tr
                    key={event._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{event.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{event.organizer || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{event.department || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{event.venue || 'TBD'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{event.start_date || event.date || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{event.end_date || event.start_date || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{event.start_time || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{event.end_time || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{event.max_participants || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        Pending Registrar Approval
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/registrar/event/${event._id}`}>
                        <button className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 transition-colors">
                          <Eye className="h-3 w-3" />
                          View Details
                        </button>
                      </Link>
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

export default DeanApprovedEventsPage