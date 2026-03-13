'use client'
import React from 'react'
import Link from 'next/link'

const colorFor = (cat) => {
  switch (cat) {
    case 'Technical': return { bg: 'bg-blue-50', text: 'text-blue-600', badge: 'bg-blue-500' };
    case 'Cultural': return { bg: 'bg-purple-50', text: 'text-purple-600', badge: 'bg-purple-500' };
    case 'Sports': return { bg: 'bg-green-50', text: 'text-green-600', badge: 'bg-green-500' };
    case 'Workshop': return { bg: 'bg-orange-50', text: 'text-orange-600', badge: 'bg-orange-400' };
    default: return { bg: 'bg-gray-50', text: 'text-gray-600', badge: 'bg-gray-400' };
  }
}

function formatEventDate(event) {
  const startDate = event.start_date || event.date || ''
  const endDate = event.end_date || ''
  const startTime = event.start_time || event.time || ''
  const endTime = event.end_time || ''

  if (!startDate) return 'Date TBA'

  const opts = { day: '2-digit', month: 'short', year: 'numeric' }
  const parsedStart = new Date(startDate)
  if (Number.isNaN(parsedStart.getTime())) return startDate

  let dateStr = parsedStart.toLocaleDateString('en-IN', opts)
  if (endDate && endDate !== startDate) {
    const parsedEnd = new Date(endDate)
    if (!Number.isNaN(parsedEnd.getTime())) {
      dateStr = `${dateStr} – ${parsedEnd.toLocaleDateString('en-IN', opts)}`
    }
  }

  let timeStr = ''
  if (startTime) {
    const fmt = (t) => {
      try { return new Date(`2000-01-01T${t}`).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) } catch { return t }
    }
    timeStr = endTime && endTime !== startTime ? `${fmt(startTime)} – ${fmt(endTime)}` : fmt(startTime)
  }

  return timeStr ? `${dateStr} · ${timeStr}` : dateStr
}

export default function EventCard({ event }) {
  const c = colorFor(event.category)
  const displayDate = formatEventDate(event)
  return (
    <Link
      href={`/events/${event.id}`}
      className="block bg-white rounded-[1.25rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_20px_40px_rgba(99,102,241,0.08)] hover:border-indigo-100/50 transition-all duration-500 hover:-translate-y-1.5 group"
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs ${c.bg} ${c.text} shadow-sm border border-white/10 group-hover:scale-110 transition-transform duration-500 shrink-0`}>
          {event.category.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-slate-800 font-extrabold text-lg group-hover:text-indigo-600 transition-colors truncate tracking-tight">{event.title}</div>
          {event.venue && (
            <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
              <span className="opacity-60">📍</span> {event.venue}
            </div>
          )}
          <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
            <span className="opacity-60">📅</span> {displayDate}
          </div>
        </div>
        <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest text-white shadow-sm transition-all ${event.status === 'Open' || event.status === 'approved' ? 'bg-emerald-500' : 'bg-slate-300'}`}>
          {event.status}
        </span>
      </div>
    </Link>
  )
}
