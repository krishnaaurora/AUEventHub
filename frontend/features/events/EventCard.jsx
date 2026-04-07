'use client'

import React, { memo } from 'react'
import { MapPin, Clock, Zap, Radio } from 'lucide-react'
import Image from 'next/image'

// ✅ memo — Event card for catalog list
const EventCard = memo(({ 
  event, 
  onOpenDetails, 
  onRegister, 
  isRegistering, 
  isRegistered 
}) => {
  return (
    <div
      className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg flex flex-col h-full"
    >
      <div className="relative overflow-hidden rounded-2xl shrink-0">
        <Image 
          src={event.poster || '/assets/seminar.png'} 
          alt={event.title} 
          width={400}
          height={300}
          className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        {event.badge && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-cyan-600 px-3 py-1 text-[10px] font-bold uppercase text-white shadow-lg backdrop-blur-sm bg-cyan-600/90">
            <Zap className="h-3 w-3" /> {event.badge}
          </span>
        )}
        {event.isLiveNew && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-bold uppercase text-white shadow-sm ring-2 ring-emerald-500/20">
            <Radio className="h-3 w-3 animate-pulse" /> New Live
          </span>
        )}
      </div>
      
      <div className="mt-4 flex-1 flex flex-col space-y-1.5">
        <div className="flex-1">
          <h3 className="text-base font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
            {event.title}
          </h3>
          <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            {event.venue || 'Venue TBA'}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            {event.dateTime || event.date}
          </p>
          {event.organizer && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
              Organized by {event.organizer}
            </p>
          )}
        </div>
        
        <div className="pt-2 flex items-center gap-2 flex-wrap">
          {event.category && (
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600 uppercase tracking-wider border border-indigo-100">
              {event.category}
            </span>
          )}
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
            {Number(event.registered_count || 0)} registered
          </span>
        </div>
      </div>
      
      <div className="mt-5 flex gap-2">
        <button 
          onClick={() => onOpenDetails(event)} 
          className="flex-1 rounded-full border border-slate-200 bg-white px-3 py-2.5 text-[11px] font-bold text-slate-700 uppercase tracking-widest hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm"
        >
          Details
        </button>
        <button
          onClick={() => onRegister(event)}
          disabled={isRegistering || isRegistered}
          className={`flex-1 rounded-full px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] text-white transition-all shadow-md ${
            isRegistered 
              ? 'bg-emerald-600 shadow-emerald-900/20' 
              : 'bg-slate-900 hover:bg-indigo-600 hover:shadow-indigo-900/20'
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {isRegistered ? 'Registered ✓' : isRegistering ? 'Wait...' : 'Register'}
        </button>
      </div>
    </div>
  )
})

EventCard.displayName = 'EventCard'

export default EventCard
