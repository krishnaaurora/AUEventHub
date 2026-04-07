'use client'

import React, { memo, useEffect } from 'react'
import { X, MapPin, Clock, Users, Zap, Sparkles, Filter, Radio } from 'lucide-react'

// Helper for Google Calendar
function buildGoogleCalendarUrl(event) {
  const startDate = String(event.start_date || event.date || '').replace(/-/g, '')
  const endDate = String(event.end_date || event.start_date || event.date || '').replace(/-/g, '')
  const startTime = String(event.start_time || event.time || '').replace(':', '') + '00'
  const endTime = String(event.end_time || event.start_time || event.time || '').replace(':', '') + '00'
  const dates = `${startDate}T${startTime}/${endDate}T${endTime}`
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title || '',
    dates,
    details: event.description || '',
    location: event.venue || '',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

const EventDetailModal = memo(({ 
  event, 
  onClose, 
  onRegister, 
  isRegistered, 
  isRegistering 
}) => {
  useEffect(() => {
    if (event) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [event])

  if (!event) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] bg-white shadow-2xl flex flex-col overflow-hidden border border-white/20"
      >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-5 top-5 z-20 rounded-full bg-white/90 border border-slate-200 p-2 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-md backdrop-blur-md group"
          >
            <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>

          {/* Poster */}
          <div className="shrink-0 h-64 sm:h-72 w-full relative group">
            <img
              src={event.poster || '/assets/seminar.png'}
              alt={event.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={(e) => { e.target.onerror = null; e.target.src = '/assets/seminar.png' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
               <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight leading-tight [text-shadow:_0_2px_10px_rgba(0,0,0,0.5)]">{event.title}</h2>
               {event.category && (
                 <span className="mt-2 inline-block rounded-full bg-indigo-500/90 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg backdrop-blur-sm border border-white/20">
                   {event.category}
                 </span>
               )}
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-8 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
            <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-6">
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100"><MapPin className="h-4 w-4 text-indigo-500" />{event.venue}</span>
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100"><Clock className="h-4 w-4 text-indigo-500" />{event.dateTime || event.date}</span>
              {event.organizer && <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100"><Users className="h-4 w-4 text-indigo-500" />{event.organizer}</span>}
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">About the event</h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
                {event.description || 'No detailed description available for this event.'}
              </p>
            </div>

            {event.aiSummary && (
              <div className="rounded-3xl bg-cyan-50 border border-cyan-100 p-5 shadow-sm shadow-cyan-900/5 ring-1 ring-cyan-200/50">
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-700">
                  <Sparkles className="h-4 w-4 text-cyan-500 animate-pulse" /> AI Spotlight
                </p>
                <p className="mt-3 text-sm text-slate-700 leading-relaxed font-medium italic">{event.aiSummary}</p>
              </div>
            )}

            {/* Registration status */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onRegister(event)}
                disabled={isRegistering || isRegistered}
                className={`flex-[2] rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-all shadow-xl ${
                  isRegistered
                    ? 'bg-emerald-600 shadow-emerald-500/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'
                } disabled:cursor-not-allowed disabled:opacity-70`}
              >
                {isRegistered ? 'Successfully Registered ✓' : isRegistering ? 'Processing...' : 'Secure Your Seat Now'}
              </button>
              <a
                href={buildGoogleCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all text-center flex items-center justify-center gap-2"
              >
                <Filter className="h-4 w-4" /> + Calendar
              </a>
            </div>

            <div className="text-center pt-2">
               <button onClick={onClose} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Go back to catalog</button>
            </div>
          </div>
        </div>
      </div>
  )
})

EventDetailModal.displayName = 'EventDetailModal'

export default EventDetailModal
