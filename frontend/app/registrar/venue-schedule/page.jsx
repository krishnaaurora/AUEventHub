'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  MapPin,
  Clock,
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'

function VenueSchedulePage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedVenue, setSelectedVenue] = useState('all')

  async function loadEvents() {
    try {
      // Get all events that are approved or pending
      const res = await fetch('/api/registrar/events?filter=approved&limit=200', { cache: 'no-store' })
      const approvedRes = await fetch('/api/registrar/events?filter=pending&limit=200', { cache: 'no-store' })

      if (res.ok && approvedRes.ok) {
        const approvedData = await res.json()
        const pendingData = await approvedRes.json()
        const allEvents = [...(approvedData.items || []), ...(pendingData.items || [])]

        // Group by venue and date
        const venueEvents = {}
        allEvents.forEach(event => {
          const venue = event.venue || 'TBD'
          if (!venueEvents[venue]) {
            venueEvents[venue] = {}
          }

          const date = event.start_date || event.date
          if (date) {
            if (!venueEvents[venue][date]) {
              venueEvents[venue][date] = []
            }
            venueEvents[venue][date].push(event)
          }
        })

        setEvents(venueEvents)
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

  const venues = Object.keys(events)
  const currentMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

  const calendarDays = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1))
  }

  const getEventsForDate = (venue, day) => {
    if (!day) return []
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events[venue]?.[dateStr] || []
  }

  const filteredVenues = selectedVenue === 'all' ? venues : [selectedVenue]

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
          <h1 className="text-2xl font-bold text-slate-900">Venue Schedule</h1>
          <p className="text-sm text-slate-500 mt-1">Calendar view of events by venue</p>
        </div>
      </div>

      {/* Venue Filter */}
      <div className="flex gap-4">
        <select
          value={selectedVenue}
          onChange={(e) => setSelectedVenue(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        >
          <option value="all">All Venues</option>
          {venues.map(venue => (
            <option key={venue} value={venue}>{venue}</option>
          ))}
        </select>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateMonth(-1)}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        <h2 className="text-lg font-semibold text-slate-900">{currentMonth}</h2>
        <button
          onClick={() => navigateMonth(1)}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Venue Calendars */}
      <div className="grid gap-6 lg:grid-cols-2">
        {filteredVenues.map(venue => (
          <motion.div
            key={venue}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-emerald-500" />
              <h3 className="text-lg font-semibold text-slate-900">{venue}</h3>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-xs font-medium text-slate-500">
                  {day}
                </div>
              ))}

              {calendarDays.map((day, index) => {
                const dayEvents = getEventsForDate(venue, day)
                const hasEvents = dayEvents.length > 0

                return (
                  <div
                    key={index}
                    className={`min-h-[60px] p-1 border border-slate-100 rounded-lg ${
                      hasEvents ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-medium text-slate-600 mb-1">
                      {day || ''}
                    </div>
                    {hasEvents && (
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 2).map(event => (
                          <div
                            key={event._id}
                            className="text-xs bg-emerald-100 text-emerald-800 rounded px-1 py-0.5 truncate"
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-emerald-600 font-medium">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Events List for Current Month */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-700">Events this month:</h4>
              {Object.entries(events[venue] || {}).filter(([date]) => {
                const eventDate = new Date(date)
                return eventDate.getMonth() === currentDate.getMonth() &&
                       eventDate.getFullYear() === currentDate.getFullYear()
              }).length === 0 ? (
                <p className="text-sm text-slate-400">No events scheduled</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {Object.entries(events[venue] || {})
                    .filter(([date]) => {
                      const eventDate = new Date(date)
                      return eventDate.getMonth() === currentDate.getMonth() &&
                             eventDate.getFullYear() === currentDate.getFullYear()
                    })
                    .sort(([a], [b]) => new Date(a) - new Date(b))
                    .map(([date, dayEvents]) => (
                      <div key={date} className="space-y-1">
                        <div className="text-xs font-medium text-slate-600 flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {new Date(date).toLocaleDateString()}
                        </div>
                        {dayEvents.map(event => (
                          <div key={event._id} className="flex items-center justify-between bg-slate-50 rounded-lg p-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">{event.title}</p>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Clock className="h-3 w-3" />
                                {event.start_time || 'TBD'} - {event.end_time || 'TBD'}
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              event.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                              event.status === 'pending_registrar' ? 'bg-amber-100 text-amber-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {event.status?.replace(/_/g, ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default VenueSchedulePage