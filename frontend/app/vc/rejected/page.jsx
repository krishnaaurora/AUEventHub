'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Calendar,
  MapPin,
  Users,
  XCircle,
  Loader2,
  User,
  Building,
  AlertTriangle,
} from 'lucide-react'

function VCRejectedEventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  async function loadEvents() {
    try {
      const res = await fetch('/api/vc/events?filter=rejected&limit=100', { cache: 'no-store' })
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

  const filteredEvents = events.filter(event =>
    event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.organizer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.department?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <h1 className="text-2xl font-bold text-slate-900">Rejected Events</h1>
          <p className="text-sm text-slate-500 mt-1">Events rejected at final VC approval</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Events List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <XCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">
              {searchTerm ? 'No events match your search' : 'No rejected events yet'}
            </p>
          </div>
        ) : (
          filteredEvents.map((event, index) => (
            <motion.div
              key={event._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start gap-4">
                {/* Rejection Icon */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-rose-600" />
                  </div>
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {event.title}
                  </h3>

                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <User className="h-4 w-4" />
                      <span className="truncate">{event.organizer_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Building className="h-4 w-4" />
                      <span>{event.department}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(event.start_date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Rejection Reason */}
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-rose-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-rose-800 mb-1">
                          Rejection Reason
                        </h4>
                        <p className="text-sm text-rose-700">
                          {event.approval?.rejection_reason || 'No reason provided'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Event Stats */}
                  <div className="flex items-center gap-6 mt-4 text-sm text-slate-500">
                    <span>Expected: {event.max_participants} participants</span>
                    <span>Trending: {event.trending?.score || 0}</span>
                    <span>Views: {event.trending?.views || 0}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex-shrink-0">
                  <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-medium rounded-full">
                    Rejected
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  )
}

export default VCRejectedEventsPage