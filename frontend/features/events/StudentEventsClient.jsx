'use client'

import React, { useEffect, useMemo, useState, useCallback, memo } from 'react'
import Image from 'next/image'
import { Search, MapPin, Clock, Users, Zap, Sparkles, X, Filter, Radio } from 'lucide-react'
import dynamic from 'next/dynamic'
import getSocket from '@/lib/socket'
import EventCard from '@/features/events/EventCard'

const EventDetailModal = dynamic(() => import('@/features/events/EventDetailModal'), {
  ssr: false,
})

const categories = ['All', 'Technical', 'Hackathons', 'Workshops', 'Cultural', 'Sports', 'Seminars']

function formatDateTime(event) {
  const startDate = String(event.start_date || event.date || '').trim()
  const endDate = String(event.end_date || '').trim()
  const startTime = String(event.start_time || event.time || '').trim()
  const endTime = String(event.end_time || '').trim()

  if (!startDate) return 'Date TBA'
  const parsedStart = new Date(startDate)
  if (Number.isNaN(parsedStart.getTime())) return startTime ? `${startDate} · ${startTime}` : startDate

  const opts = { day: '2-digit', month: 'short', year: 'numeric' }
  const startText = parsedStart.toLocaleDateString('en-IN', opts)
  let dateDisplay = startText
  if (endDate && endDate !== startDate) {
    const parsedEnd = new Date(endDate)
    if (!Number.isNaN(parsedEnd.getTime())) {
      dateDisplay = `${startText} – ${parsedEnd.toLocaleDateString('en-IN', opts)}`
    }
  }

  let timeDisplay = ''
  if (startTime) {
    const fmt = (t) => {
      try { return new Date(`2000-01-01T${t}`).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) } catch { return t }
    }
    timeDisplay = endTime && endTime !== startTime ? `${fmt(startTime)} – ${fmt(endTime)}` : fmt(startTime)
  }
  return timeDisplay ? `${dateDisplay} · ${timeDisplay}` : dateDisplay
}

export default function StudentEventsClient({ 
  studentId, 
  initialEvents = [], 
  initialRecommendations = [], 
  initialRegistrations = [],
  initialQuery = ''
}) {
  const [query, setQuery] = useState(initialQuery)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [events, setEvents] = useState(initialEvents)
  const [recommendationIds, setRecommendationIds] = useState(initialRecommendations)
  const [registeredEventIds, setRegisteredEventIds] = useState(initialRegistrations)
  const [liveEventIds, setLiveEventIds] = useState([])
  const [newEventCount, setNewEventCount] = useState(0)
  
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [registeringEventId, setRegisteringEventId] = useState(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  // Synchronization with socket.io
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    socket.on('event:new', (event) => {
        if (event.status !== 'published') return
        setEvents(prev => prev.some(e => String(e._id) === String(event._id)) ? prev : [event, ...prev])
        setLiveEventIds(prev => [String(event._id), ...prev].slice(0, 5))
        setNewEventCount(prev => prev + 1)
    })

    socket.on('registration:changed', (payload) => {
       const eventId = String(payload?.event_id)
       if (String(payload?.student_id) === String(studentId)) {
          setRegisteredEventIds(prev => payload.type === 'deleted' ? prev.filter(id => id !== eventId) : [...prev, eventId])
       }
       setEvents(prev => prev.map(e => String(e._id) === eventId ? {...e, registered_count: Math.max(0, (e.registered_count || 0) + (payload.type === 'deleted' ? -1 : 1))} : e))
    })

    return () => {
        socket.off('event:new')
        socket.off('registration:changed')
    }
  }, [studentId])

  const filtered = useMemo(() => {
    let result = events.map(e => ({
      ...e,
      id: String(e._id),
      dateTime: formatDateTime(e),
      badge: recommendationIds.includes(String(e._id)) ? 'AI Recommended' : null,
      isLiveNew: liveEventIds.includes(String(e._id))
    }))
    
    if (selectedCategory !== 'All') result = result.filter(e => e.category === selectedCategory)
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(e => 
        e.title?.toLowerCase().includes(q) || 
        e.venue?.toLowerCase().includes(q) || 
        e.category?.toLowerCase().includes(q)
      )
    }
    return result
  }, [events, query, selectedCategory, recommendationIds, liveEventIds])

  const handleRegister = useCallback(async (event) => {
     if (!studentId) return setError('No session found')
     const eventId = String(event._id)
     setRegisteringEventId(eventId)
     try {
        const res = await fetch('/api/student/registrations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: studentId, event_id: eventId })
        })
        const data = await res.json()
        if (res.ok) setNotice(data.message)
        else setError(data.message)
     } catch { setError('Connection error') }
     finally { setRegisteringEventId(null) }
  }, [studentId])

  return (
    <div className="space-y-6 p-6 xl:p-8">
      {/* Search Header */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Campus Catalog</h1>
        <p className="text-sm text-slate-500">Discover hacking, tech, sports, and cultural events.</p>
        
        {newEventCount > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
               <Radio className="h-4 w-4 animate-pulse" /> {newEventCount} new events arrived live
            </div>
            <button onClick={() => setNewEventCount(0)} className="text-xs font-bold text-emerald-600 uppercase border border-emerald-200 px-3 py-1 rounded-full hover:bg-emerald-100 transition-colors">Clear</button>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, venue, or department..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-5 py-3 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100/50 transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedCategory === cat ? 'bg-slate-900 text-white shadow-lg' : 'border border-slate-200 text-slate-500 hover:border-indigo-300'
                }`}
              >{cat}</button>
            ))}
          </div>
        </div>
      </section>

      {/* Notice/Error */}
      {(error || notice) && (
        <div className={`rounded-2xl p-4 text-xs font-bold border ${error ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
          {error || notice}
        </div>
      )}

      {/* Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full py-20 text-center opacity-40">
            <Filter className="h-10 w-10 mx-auto mb-3" />
            <p className="font-bold uppercase tracking-widest text-sm">No events found matching filters</p>
          </div>
        ) : (
          filtered.map(event => (
            <EventCard 
               key={event.id}
               event={event}
               onOpenDetails={setSelectedEvent}
               onRegister={handleRegister}
               isRegistering={registeringEventId === event.id}
               isRegistered={registeredEventIds.includes(event.id)}
            />
          ))
        )}
      </div>

      <EventDetailModal 
        event={selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
        onRegister={handleRegister}
        isRegistered={selectedEvent && registeredEventIds.includes(String(selectedEvent._id))}
        isRegistering={selectedEvent && registeringEventId === String(selectedEvent._id)}
      />
    </div>
  )
}
