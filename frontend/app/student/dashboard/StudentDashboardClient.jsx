'use client'

import { useState, useEffect, useMemo, memo, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarDays,
  Sparkles,
  TrendingUp,
  Users,
  MapPin,
  Clock,
  Radio,
  ShieldCheck,
  Key,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import getSocket from '@/lib/socket'

// Helper for date formatting - extracted for reuse
function formatDate(dateValue, timeValue, event) {
  const startDate = event?.start_date || dateValue
  const endDate = event?.end_date || ''
  const startTime = event?.start_time || timeValue
  const endTime = event?.end_time || ''

  if (!startDate) return 'Date TBA'

  const parsedStart = new Date(startDate)
  if (Number.isNaN(parsedStart.getTime())) {
    return startTime ? `${startDate} · ${startTime}` : startDate
  }

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
      try {
        return new Date(`2000-01-01T${t}`).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      } catch { return t }
    }
    timeDisplay = endTime && endTime !== startTime ? `${fmt(startTime)} – ${fmt(endTime)}` : fmt(startTime)
  }

  return timeDisplay ? `${dateDisplay} · ${timeDisplay}` : dateDisplay
}

// ✅ memo — Event Card for lists
const SmallEventCard = memo(({ event, variant = 'default' }) => {
  const bgColor = variant === 'violet' ? 'bg-violet-50 border-violet-200' : 
                  variant === 'amber' ? 'bg-amber-50 border-amber-200' :
                  variant === 'cyan' ? 'bg-cyan-50 border-cyan-200' : 'bg-slate-50 border-slate-200'
  
  return (
    <div
      className={`rounded-2xl border p-4 ${bgColor} hover:shadow-md transition-shadow group cursor-pointer`}
    >
      <div className="flex items-center justify-between">
        <p className={`font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors ${variant === 'amber' ? 'text-sm' : ''}`}>
          {event.title}
        </p>
        {variant === 'amber' && (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 whitespace-nowrap">
            score {event.score}
          </span>
        )}
      </div>
      <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-600">
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(event.date, event.time, event)}</span>
        {event.venue && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.venue}</span>}
      </div>
      {variant === 'amber' && event.reason && (
        <p className="mt-1 text-xs text-slate-600 italic">"{event.reason}"</p>
      )}
    </div>
  )
})

// ✅ Check-in Form component
const CheckInForm = memo(({ registrations, studentId, onCheckedIn }) => {
  const [selectedEventId, setSelectedEventId] = useState('')
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('idle') 
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (registrations.length > 0 && !selectedEventId) {
      setSelectedEventId(String(registrations[0].event_id || ''))
    }
  }, [registrations, selectedEventId])

  const handleCheckIn = useCallback(async () => {
    if (!selectedEventId || code.length !== 4) return
    setStatus('loading')
    setIsSubmitting(true)
    
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, eventId: selectedEventId, code }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setMessage(data.message)
        if (onCheckedIn) onCheckedIn()
      } else {
        setStatus('error')
        setMessage(data.message || 'Verification failed')
      }
    } catch {
      setStatus('error')
      setMessage('Network error while checking in')
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedEventId, code, studentId, onCheckedIn])

  if (status === 'success') {
    return (
      <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-6 flex flex-col items-center text-center">
        <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center mb-3">
          <CheckCircle2 className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-white font-bold">Checked In Successfully!</h3>
        <p className="text-emerald-400 text-xs mt-1">{message}</p>
        <button onClick={() => setStatus('idle')} className="mt-4 text-[10px] font-bold text-white/40 hover:text-white transition-colors uppercase tracking-[0.2em]">Check in for another event</button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Selected Event</p>
            <select 
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer"
            >
                {registrations.length === 0 ? (
                    <option value="" disabled className="bg-slate-900">No events registered</option>
                ) : (
                    registrations.map(reg => (
                        <option key={reg.id || reg.event_id} value={String(reg.event_id)} className="bg-slate-900 text-white">
                            {reg.event_title || 'Untitled Event'}
                        </option>
                    ))
                )}
            </select>
        </div>

        <div className="sm:w-32 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Enter Code</p>
            <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
                <input 
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="____"
                    className="w-full pl-8 pr-2 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-center font-black tracking-[0.4em] text-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none placeholder:text-slate-700 font-mono"
                />
            </div>
        </div>
      </div>

      {status === 'error' && (
          <div className="flex items-center gap-2 text-rose-400 text-[10px] font-bold bg-rose-500/5 px-3 py-2 rounded-lg border border-rose-500/10">
              <AlertCircle className="h-3 w-3" /> {message}
          </div>
      )}

      <button 
        onClick={handleCheckIn}
        disabled={isSubmitting || code.length !== 4 || !selectedEventId}
        className="w-full rounded-xl bg-indigo-600 px-6 py-4 text-sm font-black text-white hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-900/40 flex items-center justify-center gap-2"
      >
        {isSubmitting ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        {isSubmitting ? 'Validating...' : 'Validate & Mark Attendance'}
      </button>
    </div>
  )
})

export default function StudentDashboardClient({ 
  studentId, 
  initialEvents = [], 
  initialRegistrations = [], 
  initialCertificates = [], 
  initialTrending = [],
  initialRecommendations = [],
  initialNotifications = []
}) {
  const [newEventCount, setNewEventCount] = useState(0)
  const [registrations] = useState(initialRegistrations)
  const [events] = useState(initialEvents)

  useEffect(() => {
    if (!studentId) return

    const socket = getSocket()
    if (!socket) return

    socket.emit('join:user', studentId)

    socket.on('event:new', () => {
      setNewEventCount(prev => prev + 1)
    })

    return () => {
      socket.off('event:new')
    }
  }, [studentId])

  const { totalEvents, upcomingEvents, ongoingEvents, recommendedEventsByList } = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10)
    
    const nextEvents = events
      .filter((event) => (event.end_date || event.start_date || event.date || '') >= todayIso)
      .sort((a, b) => String(a.start_date || a.date).localeCompare(String(b.start_date || b.date)))

    const liveEvents = events
      .filter((event) => {
        const start = String(event.start_date || event.date || '')
        const end = String(event.end_date || event.start_date || event.date || '')
        return start <= todayIso && end >= todayIso
      })

    const recos = events.filter((e) => initialRecommendations.includes(String(e._id)))

    return {
      totalEvents: events.length,
      upcomingEvents: nextEvents.slice(0, 4),
      ongoingEvents: liveEvents.slice(0, 4),
      recommendedEventsByList: recos.slice(0, 4)
    }
  }, [events, initialRecommendations])

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Student Dashboard</h1>
        <p className="text-sm text-slate-500">Live data from your registered events and campus catalog</p>
        {newEventCount > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800">
            <Radio className="h-3.5 w-3.5" /> {newEventCount} new event{newEventCount !== 1 && 's'} added live
          </div>
        )}
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Total Events</p>
          <p className="mt-2 text-3xl font-bold text-indigo-800">{totalEvents}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Registrations</p>
          <p className="mt-2 text-3xl font-bold text-emerald-800">{registrations.length}</p>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">AI Recommended</p>
          <p className="mt-2 text-3xl font-bold text-violet-800">{recommendedEventsByList.length}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-3xl border border-slate-900 bg-slate-900 p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                <Radio className="h-5 w-5 text-indigo-400 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Live Event Check-in</h2>
                <p className="text-sm text-slate-400">Enter the 4-digit code shown by the organizer</p>
              </div>
            </div>

            <CheckInForm 
              registrations={registrations} 
              studentId={studentId} 
              onCheckedIn={() => {}} 
            />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-center items-center text-center space-y-4 hover:shadow-md transition-shadow">
           <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-emerald-500" />
           </div>
           <div>
              <h3 className="font-bold text-slate-900">Attendance Policy</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">
                Marking attendance is mandatory for certificate eligibility. Code rotates every 60 seconds.
              </p>
           </div>
           <Link href="/student/certificates" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest">
              View My Certificates →
           </Link>
        </div>
      </section>

    </div>
  )
}
