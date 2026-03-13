'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Search,
  Calendar,
  MapPin,
  Users,
  TrendingUp,
  Eye,
  BarChart3,
  Loader2,
  User,
  Building,
} from 'lucide-react'

function VCPublishedEventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  async function loadEvents() {
    try {
      const res = await fetch('/api/vc/events?filter=approved&limit=100', { cache: 'no-store' })
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
          <h1 className="text-2xl font-bold text-slate-900">Published Events</h1>
          <p className="text-sm text-slate-500 mt-1">Events approved and live to students</p>
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

      {/* Events Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredEvents.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-slate-500">
              {searchTerm ? 'No events match your search' : 'No published events yet'}
            </div>
          </div>
        ) : (
          filteredEvents.map((event, index) => (
            <motion.div
              key={event._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Event Poster Placeholder */}
              <div className="aspect-video bg-slate-100 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-slate-400 text-sm">Event Poster</span>
              </div>

              {/* Event Info */}
              <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
                {event.title}
              </h3>

              <div className="space-y-2 mb-4">
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

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-slate-900">
                    {event.max_participants}
                  </div>
                  <div className="text-xs text-slate-500">Expected</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-slate-900">
                    {event.trending?.score || 0}
                  </div>
                  <div className="text-xs text-slate-500">Trending</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-slate-900">
                    {event.trending?.views || 0}
                  </div>
                  <div className="text-xs text-slate-500">Views</div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                  Published & Live
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={`/vc/event/${event._id}`}
                  className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </Link>
                <button className="px-3 py-2 bg-slate-500 text-white text-sm rounded-lg hover:bg-slate-600 transition-colors flex items-center justify-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </button>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  )
}

export default VCPublishedEventsPage