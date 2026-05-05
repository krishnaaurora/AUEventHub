import React, { useState, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useSWR from 'swr'
import { fetcher } from '../../lib/fetcher'

import {
  Calendar, ChevronLeft, ChevronRight, MapPin, Clock, Users, Building2, Loader2, Filter, GraduationCap
} from 'lucide-react'

const VENUES = ['All Venues', 'Auditorium', 'Seminar Hall', 'Conference Room', 'Main Hall', 'Lab Block']
const SCHOOLS = ['All Schools', 'SOE (School of Engineering)', 'SEM (School of Management)', 'SOI (School of Informatics)']

const STATUS_COLOR = {
  published: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  pending_vc: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-blue-100 text-blue-800 border-blue-200',
  rejected: 'bg-rose-100 text-rose-800 border-rose-200',
  pending_registrar: 'bg-violet-100 text-violet-800 border-violet-200',
  pending_dean: 'bg-orange-100 text-orange-800 border-orange-200',
  completed: 'bg-slate-100 text-slate-800 border-slate-200',
}

function getStatusLabel(status) {
  const map = {
    published: 'Published',
    pending_vc: 'Pending VC',
    approved: 'Approved',
    rejected: 'Rejected',
    pending_registrar: 'Pending Registrar',
    pending_dean: 'Pending Dean',
    completed: 'Completed',
  }
  return map[status] || status
}

const EventBadge = memo(({ event, onClick }) => {
  const colorClass = STATUS_COLOR[event.status] || STATUS_COLOR.approved
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(event); }}
      className={`w-full text-left px-2 py-1 rounded-md border text-[10px] sm:text-xs font-medium truncate mb-1 bg-opacity-70 hover:opacity-100 transition-opacity ${colorClass}`}
      title={`${event.title} — ${event.venue || 'Venue TBA'}`}
    >
      {event.start_time || ''} {event.title}
    </button>
  )
})
EventBadge.displayName = 'EventBadge'

const EventDetailPanel = memo(({ event, onClose }) => {
  if (!event) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
      >
        <div className="flex items-start justify-between mb-4 gap-4">
          <h3 className="font-bold text-slate-900 text-xl leading-tight">{event.title}</h3>
          <button onClick={onClose} className="rounded-full p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shrink-0">✕</button>
        </div>
        <span className={`inline-block px-3 py-1 mb-4 rounded-full text-xs font-bold border ${STATUS_COLOR[event.status] || STATUS_COLOR.approved}`}>
          {getStatusLabel(event.status)}
        </span>
        <div className="space-y-4 text-sm text-slate-700 bg-slate-50/50 rounded-xl p-5 border border-slate-100">
          {event.venue && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-indigo-400 shrink-0" />
              <span className="font-medium text-slate-800">{event.venue}</span>
            </div>
          )}
          {event.start_date && (
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-indigo-400 shrink-0" />
              <span>
                {new Date(event.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {event.end_date && event.end_date !== event.start_date && ` — ${new Date(event.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
              </span>
            </div>
          )}
          {(event.start_time || event.end_time) && (
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-indigo-400 shrink-0" />
              <span>{event.start_time || '—'}{event.end_time ? ` – ${event.end_time}` : ''}</span>
            </div>
          )}
          {event.max_participants && (
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-indigo-400 shrink-0" />
              <span>{event.max_participants} expected participants</span>
            </div>
          )}
          {event.department && (
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-indigo-400 shrink-0" />
              <span>{event.department}</span>
            </div>
          )}
          {event.organizer_name && (
            <div className="flex items-start gap-3 mt-2 pt-2 border-t border-slate-200">
              <span className="text-slate-400 shrink-0 text-xs mt-0.5">Organizer:</span>
              <span className="font-semibold text-slate-900">{event.organizer_name}</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
})
EventDetailPanel.displayName = 'EventDetailPanel'

export default function VenueSchedulePage({ role = 'dean' }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedVenue, setSelectedVenue] = useState('All Venues')
  const [selectedSchool, setSelectedSchool] = useState('All Schools')
  const [selectedEvent, setSelectedEvent] = useState(null)
  
  // view: 'day' | 'week' | 'month' | 'year'
  const [view, setView] = useState('month')

  const limit = 200

  const apiPath = role === 'vc' ? `/api/vc/events?limit=${limit}`
    : role === 'dean' ? `/api/dean/events?limit=${limit}`
    : `/api/registrar/events?limit=${limit}`

  const { data: eventsData, error, isLoading } = useSWR(apiPath, fetcher, { 
    revalidateOnFocus: false,
    dedupingInterval: 30000 
  })
  
  const events = Array.isArray(eventsData?.items) ? eventsData.items : []

  // Helpers for navigation
  const getWeekDays = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    const startOfWeek = new Date(d.setDate(diff))
    const days = []
    for (let i = 0; i < 7; i++) {
        days.push(new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i))
    }
    return days
  }

  const currentViewRange = useMemo(() => {
    let start, end;
    const y = currentDate.getFullYear()
    const m = currentDate.getMonth()
    const d = currentDate.getDate()

    if (view === 'day') {
       start = new Date(y, m, d)
       end = new Date(y, m, d, 23, 59, 59)
    } else if (view === 'week') {
       const wd = getWeekDays(currentDate)
       start = wd[0]
       start.setHours(0, 0, 0)
       end = wd[6]
       end.setHours(23, 59, 59)
    } else if (view === 'month') {
       start = new Date(y, m, 1)
       end = new Date(y, m + 1, 0, 23, 59, 59)
    } else {
       start = new Date(y, 0, 1)
       end = new Date(y, 11, 31, 23, 59, 59)
    }
    return { start, end }
  }, [currentDate, view])

  const filteredEvents = useMemo(() => {
    const venueLower = selectedVenue.toLowerCase()
    
    return events.filter(e => {
      if (!e.start_date) return false
      
      if (selectedVenue !== 'All Venues') {
        const venue = (e.venue || '').toLowerCase()
        if (!venue.includes(venueLower)) return false
      }
      
      if (selectedSchool !== 'All Schools') {
        const dept = (e.department || '').toLowerCase()
        if (selectedSchool.includes('SOE') && !dept.includes('engineering') && !dept.includes('computer')) return false
        if (selectedSchool.includes('SEM') && !dept.includes('management') && !dept.includes('business')) return false
        if (selectedSchool.includes('SOI') && !dept.includes('informatics') && !dept.includes('data')) return false
      }
      
      return true
    })
  }, [events, selectedVenue, selectedSchool])

  const sidebarEvents = useMemo(() => {
     // Using local ISO string safely
     const now = new Date()
     const nowStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
     
     const startV = `${currentViewRange.start.getFullYear()}-${String(currentViewRange.start.getMonth()+1).padStart(2,'0')}-${String(currentViewRange.start.getDate()).padStart(2,'0')}`
     const endV = `${currentViewRange.end.getFullYear()}-${String(currentViewRange.end.getMonth()+1).padStart(2,'0')}-${String(currentViewRange.end.getDate()).padStart(2,'0')}`
     
     const inRange = filteredEvents.filter(e => {
        const eStart = e.start_date.slice(0, 10)
        const eEnd = e.end_date?.slice(0, 10) || eStart
        return eStart <= endV && eEnd >= startV
     })

     const ongoing = []
     const upcoming = []
     const past = []

     inRange.forEach(e => {
        const eStart = e.start_date.slice(0, 10)
        const eEnd = e.end_date?.slice(0, 10) || eStart
        if (eStart <= nowStr && eEnd >= nowStr) {
           ongoing.push(e)
        } else if (eStart > nowStr) {
           upcoming.push(e)
        } else {
           past.push(e)
        }
     })

     upcoming.sort((a,b) => a.start_date.localeCompare(b.start_date))
     past.sort((a,b) => b.start_date.localeCompare(a.start_date))
     
     return { ongoing, upcoming, past }
  }, [filteredEvents, currentViewRange])

  // Navigation Handlers
  const navigatePrev = () => {
    const nextDate = new Date(currentDate)
    if (view === 'day') nextDate.setDate(nextDate.getDate() - 1)
    if (view === 'week') nextDate.setDate(nextDate.getDate() - 7)
    if (view === 'month') nextDate.setMonth(nextDate.getMonth() - 1)
    if (view === 'year') nextDate.setFullYear(nextDate.getFullYear() - 1)
    setCurrentDate(nextDate)
  }

  const navigateNext = () => {
    const nextDate = new Date(currentDate)
    if (view === 'day') nextDate.setDate(nextDate.getDate() + 1)
    if (view === 'week') nextDate.setDate(nextDate.getDate() + 7)
    if (view === 'month') nextDate.setMonth(nextDate.getMonth() + 1)
    if (view === 'year') nextDate.setFullYear(nextDate.getFullYear() + 1)
    setCurrentDate(nextDate)
  }

  const navigateToday = () => setCurrentDate(new Date())

  // View Helpers

  // Day View
  const renderDayView = () => {
    const dayObj = currentDate
    const dayStr = `${dayObj.getFullYear()}-${String(dayObj.getMonth()+1).padStart(2,'0')}-${String(dayObj.getDate()).padStart(2,'0')}`
    
    const dayEvents = filteredEvents.filter(e => {
        const start = e.start_date?.slice(0, 10)
        const end = e.end_date?.slice(0, 10) || start
        return start <= dayStr && end >= dayStr
    }).sort((a, b) => (a.start_time || '00:00').localeCompare(b.start_time || '00:00'))

    // Pre-calculate events by hour for performance
    const eventsByHour = {}
    dayEvents.forEach(e => {
      const hPrefix = (e.start_time || '00:').slice(0, 3)
      if (!eventsByHour[hPrefix]) eventsByHour[hPrefix] = []
      eventsByHour[hPrefix].push(e)
    })

    const hours = Array.from({length: 24}, (_, i) => i)

    return (
      <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="divide-y divide-slate-100 h-[700px] overflow-y-auto relative">
           {hours.map(h => {
             const hourPrefix = h.toString().padStart(2, '0') + ':'
             const evs = eventsByHour[hourPrefix] || []
             return (
               <div key={h} className="flex min-h-[80px] hover:bg-slate-50/50 transition-colors group">
                 <div className="w-24 border-r border-slate-100 p-3 flex flex-col justify-center items-end text-xs text-slate-500 font-semibold uppercase bg-slate-50/30">
                   {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h-12} PM`}
                 </div>
                 <div className="flex-1 p-3">
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {evs.map(ev => <EventBadge key={ev._id} event={ev} onClick={setSelectedEvent} />)}
                   </div>
                 </div>
               </div>
             )
           })}
        </div>
      </div>
    )
  }

  // Week View
  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate)
    
    // Pre-calculate events by day and hour for performance
    const eventsBySlot = {} // key: "dayStr-hourPrefix"
    filteredEvents.forEach(e => {
      const eStart = e.start_date?.slice(0, 10)
      const eEnd = e.end_date?.slice(0, 10) || eStart
      const hPrefix = (e.start_time || '00:').slice(0, 3)
      
      weekDays.forEach(d => {
        const dStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
        if (eStart <= dStr && eEnd >= dStr) {
          const key = `${dStr}-${hPrefix}`
          if (!eventsBySlot[key]) eventsBySlot[key] = []
          eventsBySlot[key].push(e)
        }
      })
    })
    
    return (
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50/80">
          <div className="p-2 border-r border-slate-200 shadow-sm z-10 w-20 md:w-full"></div>
          {weekDays.map((d, i) => {
             const today = new Date()
             const isToday = today.getDate() === d.getDate() && today.getMonth() === d.getMonth() && today.getFullYear() === d.getFullYear()
             return (
               <div key={i} className={`p-3 text-center border-r border-slate-100 flex flex-col items-center justify-center ${isToday ? 'bg-indigo-50/50' : ''}`}>
                  <p className={`text-[10px] sm:text-xs font-bold uppercase mb-1 ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}>{d.toLocaleDateString('en-IN', { weekday: 'short' })}</p>
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-sm sm:text-base ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-800'}`}>
                    {d.getDate()}
                  </div>
               </div>
             )
          })}
        </div>
        
        <div className="divide-y divide-slate-100 h-[650px] overflow-y-auto">
          {Array.from({length: 24}, (_, h) => {
             const hourPrefix = h.toString().padStart(2, '0') + ':'
             return (
                <div key={h} className="grid grid-cols-8 min-h-[70px] group">
                   <div className="p-2 text-right text-[10px] sm:text-xs text-slate-500 font-semibold uppercase bg-slate-50/30 border-r border-slate-200 flex flex-col justify-center">
                     {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h-12} PM`}
                   </div>
                   {weekDays.map((d, i) => {
                      const dayStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
                      const dayEvents = eventsBySlot[`${dayStr}-${hourPrefix}`] || []
                      return (
                         <div key={i} className="p-1.5 border-r border-slate-100 hover:bg-slate-50 transition flex flex-col gap-1">
                           {dayEvents.map(ev => <EventBadge key={ev._id} event={ev} onClick={setSelectedEvent} />)}
                         </div>
                      )
                   })}
                </div>
             )
          })}
        </div>
      </div>
    )
  }

  // Month View
  const renderMonthView = () => {
    const y = currentDate.getFullYear()
    const m = currentDate.getMonth()
    const firstDay = new Date(y, m, 1).getDay()
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    
    const eventsByDay = {}
    const monthStr = String(m + 1).padStart(2, '0')
    filteredEvents.forEach(e => {
       const start = e.start_date?.slice(0, 10)
       const end = e.end_date?.slice(0, 10) || start
       for (let day = 1; day <= daysInMonth; day++) {
         const d = `${y}-${monthStr}-${String(day).padStart(2, '0')}`
         if (start <= d && end >= d) {
           if (!eventsByDay[day]) eventsByDay[day] = []
           eventsByDay[day].push(e)
         }
       }
    })

    return (
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-black/5">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80">
           {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => (
              <div key={day} className="p-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">{day}</div>
           ))}
        </div>
        <div className="grid grid-cols-7 bg-slate-50/10">
           {Array.from({ length: firstDay }).map((_, i) => (
             <div key={`empty-${i}`} className="min-h-[120px] border-r border-b border-slate-200/60 bg-slate-100/40" />
           ))}
           {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dayEvents = eventsByDay[day] || []
              const today = new Date()
              const isToday = today.getDate() === day && today.getMonth() === m && today.getFullYear() === y
              
              return (
                 <div key={day} className={`min-h-[120px] border-r border-b border-slate-200/60 p-2 lg:p-3 transition-colors hover:bg-slate-50/80 ${isToday ? 'bg-indigo-50/20' : 'bg-white'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs sm:text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200' : 'text-slate-700'}`}>
                        {day}
                      </span>
                      {dayEvents.length > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium md:hidden">{dayEvents.length}</span>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {dayEvents.slice(0, 3).map((ev, idx) => (
                        <EventBadge key={ev._id || idx} event={ev} onClick={setSelectedEvent} />
                      ))}
                      {dayEvents.length > 3 && (
                        <button onClick={() => { setView('day'); setCurrentDate(new Date(y, m, day)) }} className="text-[10px] text-indigo-600 font-bold bg-indigo-50 rounded px-2 py-1 mt-1 hover:bg-indigo-100 transition truncate w-full text-left">
                          +{dayEvents.length - 3} more View
                        </button>
                      )}
                    </div>
                 </div>
              )
           })}
           {/* fill remaining days grid */}
           {Array.from({ length: (7 - ((firstDay + daysInMonth) % 7)) % 7 }).map((_, i) => (
             <div key={`end-empty-${i}`} className="min-h-[120px] border-r border-b border-slate-200/60 bg-slate-100/40" />
           ))}
        </div>
      </div>
    )
  }

  // Year View
  const renderYearView = () => {
    const y = currentDate.getFullYear()
    const months = Array.from({length: 12}, (_, m) => {
       const daysInMonth = new Date(y, m + 1, 0).getDate()
       const firstDay = new Date(y, m, 1).getDay()
       const name = new Date(y, m).toLocaleString('default', { month: 'long' })
       
       const mStr = String(m + 1).padStart(2, '0')
       let monthEvents = 0
       filteredEvents.forEach(e => {
          if (e.start_date?.startsWith(`${y}-${mStr}`)) monthEvents++
       })
       
       return { name, daysInMonth, firstDay, monthEvents, index: m }
    })

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
         {months.map(({name, daysInMonth, firstDay, monthEvents, index}) => (
            <div key={name} className="border border-slate-200 shadow-sm rounded-2xl bg-white p-5 hover:shadow-lg hover:border-indigo-300 cursor-pointer transition-all duration-300 group" onClick={() => { setView('month'); setCurrentDate(new Date(y, index, 1)) }}>
               <div className="flex justify-between items-center mb-4">
                 <h4 className="font-bold text-slate-800 text-lg group-hover:text-indigo-700 transition">{name}</h4>
                 {monthEvents > 0 && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full shadow-sm">{monthEvents} Events</span>}
               </div>
               <div className="grid grid-cols-7 gap-1.5 text-[10px] font-bold text-center mb-2 text-slate-400">
                 {['S','M','T','W','T','F','S'].map((d, i) => <div key={i} className="mb-1 border-b border-slate-100 pb-1">{d}</div>)}
               </div>
               <div className="grid grid-cols-7 gap-1.5">
                 {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                 {Array.from({ length: daysInMonth }).map((_, i) => {
                   const day = i + 1
                   const today = new Date()
                   const isToday = today.getDate() === day && today.getMonth() === index && today.getFullYear() === y
                   
                   return (
                     <div key={day} className={`w-7 h-7 mx-auto flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 bg-slate-50 group-hover:bg-indigo-50/50'}`}>
                        {day}
                     </div>
                   )
                 })}
               </div>
            </div>
         ))}
      </div>
    )
  }

  // Calculate Title for top Nav
  const getHeaderTitle = () => {
    if (view === 'year') return currentDate.getFullYear()
    if (view === 'month') return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
    if (view === 'week') {
       const wd = getWeekDays(currentDate)
       const first = wd[0]
       const last = wd[6]
       return `${first.toLocaleString('default', { month: 'short', day: 'numeric' })} – ${last.toLocaleString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    return currentDate.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
  if (error) return <div className="text-center py-20 text-rose-500 font-medium bg-rose-50 rounded-xl p-4 border border-rose-100">Failed to load schedule data.</div>

  return (
    <div className="space-y-8 pb-12">
      {/* Header and Filter Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
              <Calendar className="h-6 w-6" />
            </div>
            Venue Schedule
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Interactive timeline of university activities</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          
          <div className="flex items-center gap-2">
             <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden group hover:border-slate-300 transition focus-within:ring-2 ring-indigo-100">
                <div className="pl-3 pr-2 bg-slate-50/50 border-r border-slate-200 flex items-center justify-center text-indigo-600 h-9">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <select
                  value={selectedSchool}
                  onChange={e => setSelectedSchool(e.target.value)}
                  className="pl-3 pr-8 py-2 text-sm font-semibold bg-transparent text-slate-700 outline-none cursor-pointer hover:bg-slate-50 transition"
                  style={{ backgroundImage: `url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1rem', WebkitAppearance: 'none' }}
                >
                  {SCHOOLS.map(s => <option key={s}>{s}</option>)}
                </select>
             </div>

             <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden group hover:border-slate-300 transition focus-within:ring-2 ring-indigo-100">
                <div className="pl-3 pr-2 bg-slate-50/50 border-r border-slate-200 flex items-center justify-center text-emerald-600 h-9">
                  <MapPin className="h-4 w-4" />
                </div>
                <select
                  value={selectedVenue}
                  onChange={e => setSelectedVenue(e.target.value)}
                  className="pl-3 pr-8 py-2 text-sm font-semibold bg-transparent text-slate-700 outline-none cursor-pointer hover:bg-slate-50 transition"
                  style={{ backgroundImage: `url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1rem', WebkitAppearance: 'none' }}
                >
                  {VENUES.map(v => <option key={v}>{v}</option>)}
                </select>
             </div>
          </div>
        </div>
      </div>

      {/* Main Calendar Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-50/80 rounded-2xl p-2 border border-slate-200 shadow-sm overflow-x-auto gap-4">
         <div className="flex bg-slate-200/50 p-1.5 rounded-xl border border-slate-200/60 shrink-0">
             {['day', 'week', 'month', 'year'].map(v => (
               <button
                 key={v}
                 onClick={() => setView(v)}
                 className={`px-5 py-2 text-sm font-bold capitalize transition-all duration-200 min-w-[80px] text-center rounded-lg ${view === v ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}
               >
                 {v}
               </button>
             ))}
         </div>

         <div className="flex items-center gap-4 shrink-0 px-2">
            <button onClick={navigatePrev} className="p-2.5 text-slate-600 bg-white shadow-sm border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition active:scale-95"><ChevronLeft className="h-5 w-5" /></button>
            <h2 className="text-base font-black text-slate-800 min-w-[200px] text-center tracking-wide">
               {getHeaderTitle()}
            </h2>
            <button onClick={navigateNext} className="p-2.5 text-slate-600 bg-white shadow-sm border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition active:scale-95"><ChevronRight className="h-5 w-5" /></button>
            
            <div className="w-px h-8 bg-slate-300 mx-2 hidden lg:block" />
            <button onClick={navigateToday} className="px-5 py-2.5 bg-white shadow-sm border border-slate-200 hover:bg-slate-50 text-sm font-bold text-slate-700 hover:text-indigo-600 rounded-xl transition active:scale-95">Today</button>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[500px]">
         {/* Calendar */}
         <div className="lg:col-span-3">
           <div className="w-full">
             {view === 'day' && renderDayView()}
             {view === 'week' && renderWeekView()}
             {view === 'month' && renderMonthView()}
             {view === 'year' && renderYearView()}
           </div>
         </div>

         {/* Sidebar: Events List */}
         <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 Ongoing Events
              </h3>
              {sidebarEvents.ongoing.length === 0 ? (
                 <p className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl text-center border border-slate-100">No events happening today.</p>
              ) : (
                 <div className="space-y-3">
                    {sidebarEvents.ongoing.map(ev => (
                       <div key={ev._id} onClick={() => setSelectedEvent(ev)} className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 cursor-pointer transition">
                          <p className="text-sm font-semibold text-emerald-900">{ev.title}</p>
                          <p className="text-xs text-emerald-700 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3"/> {ev.venue || 'TBA'}</p>
                       </div>
                    ))}
                 </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                 <Calendar className="w-4 h-4 text-indigo-500" />
                 Upcoming in View
              </h3>
              {sidebarEvents.upcoming.length === 0 ? (
                 <p className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl text-center border border-slate-100">No upcoming events found.</p>
              ) : (
                 <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {sidebarEvents.upcoming.map(ev => (
                       <div key={ev._id} onClick={() => setSelectedEvent(ev)} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-sm cursor-pointer transition group">
                          <div className="bg-indigo-50 text-indigo-700 shrink-0 w-10 text-center rounded-lg py-1 border border-indigo-100/50">
                             <p className="text-[10px] font-bold uppercase leading-none">{new Date(ev.start_date).toLocaleString('default', { month: 'short' })}</p>
                             <p className="text-lg font-black leading-tight">{new Date(ev.start_date).getDate()}</p>
                          </div>
                          <div>
                             <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">{ev.title}</p>
                             <p className="text-[10px] text-slate-500 mt-1">{ev.start_time || ''}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              )}
            </div>
            
            {sidebarEvents.past.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                   <Clock className="w-4 h-4 text-slate-400" />
                   Past Events
                </h3>
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                   {sidebarEvents.past.map(ev => (
                      <div key={ev._id} onClick={() => setSelectedEvent(ev)} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition opacity-80 group">
                         <div className="bg-slate-100 text-slate-500 shrink-0 w-10 text-center rounded-lg py-1 border border-slate-200">
                            <p className="text-[10px] font-bold uppercase leading-none">{new Date(ev.start_date).toLocaleString('default', { month: 'short' })}</p>
                            <p className="text-lg font-black leading-tight">{new Date(ev.start_date).getDate()}</p>
                         </div>
                         <div>
                            <p className="text-sm font-semibold text-slate-600 line-clamp-1 group-hover:text-slate-800 transition-colors">{ev.title}</p>
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase font-bold mt-1 inline-block">Ended</span>
                         </div>
                      </div>
                   ))}
                </div>
              </div>
            )}
         </div>
      </div>

      <AnimatePresence>
        {selectedEvent && <EventDetailPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
      </AnimatePresence>
    </div>
  )
}
