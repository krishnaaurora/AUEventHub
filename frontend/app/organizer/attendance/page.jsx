'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QrCode, Search, CheckCircle2, XCircle, User, Calendar, Loader2, Clock, ShieldCheck, RefreshCw } from 'lucide-react'
import { useSession } from 'next-auth/react'

export default function OrganizerAttendancePage() {
  const { data: session } = useSession()
  const [ticketId, setTicketId] = useState('')
  const [status, setStatus] = useState('idle') // idle, loading, success, error
  const [message, setMessage] = useState('')
  const [recentScan, setRecentScan] = useState(null)
  
  // Dynamic Code State
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [events, setEvents] = useState([])
  const [eventCode, setEventCode] = useState('----')
  const [timeLeft, setTimeLeft] = useState(60)
  const [isSyncing, setIsSyncing] = useState(false)

  const organizerName = session?.user?.name || session?.user?.email || ''

  // Load events
  useEffect(() => {
    if (!organizerName) return
    fetch('/api/student/events?status=published&limit=100', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        const myEvents = Array.isArray(data.items) ? data.items.filter(e => e.organizer === organizerName || !organizerName) : []
        setEvents(myEvents)
        if (myEvents.length > 0 && !selectedEvent) setSelectedEvent(myEvents[0])
      })
  }, [organizerName])

  // Sync Code Logic
  const syncCode = useCallback(async () => {
    if (!selectedEvent) return
    setIsSyncing(true)
    try {
      const res = await fetch(`/api/event/code?eventId=${selectedEvent._id}`)
      const data = await res.json()
      if (res.ok) {
        setEventCode(data.code)
        setTimeLeft(data.expiresIn)
      }
    } catch (e) {
      console.error('Failed to sync code', e)
    } finally {
      setIsSyncing(false)
    }
  }, [selectedEvent])

  useEffect(() => {
    syncCode()
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          syncCode()
          return 60
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [syncCode])

  async function handleScan(e) {
    if (e) e.preventDefault()
    if (!ticketId.trim()) return

    setStatus('loading')
    setMessage('')
    setRecentScan(null)

    try {
      const res = await fetch('/api/organizer/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticketId.trim() })
      })
      const data = await res.json()
      
      if (res.ok) {
        setStatus('success')
        setMessage(data.message)
        setRecentScan(data.registration)
        setTicketId('')
      } else {
        setStatus('error')
        setMessage(data.message || 'Invalid ticket')
      }
    } catch {
      setStatus('error')
      setMessage('Failed to connect to scanner service')
    }
  }

  return (
    <div className="space-y-6 p-6 xl:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
            <QrCode className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Attendance Center</h1>
            <p className="text-sm text-slate-500">Manage entry via QR scanning or Dynamic Event Codes</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Active Event:</span>
           <select 
              value={selectedEvent?._id || ''} 
              onChange={(e) => setSelectedEvent(events.find(ev => ev._id === e.target.value))}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer min-w-[200px]"
           >
              {events.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
           </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Manual Entry & Scanner */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Manual Entry / Scanner</h2>
              <form onSubmit={handleScan} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Ticket ID</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={ticketId}
                      onChange={(e) => setTicketId(e.target.value)}
                      placeholder="Enter or scan TKT-..."
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 outline-none uppercase font-mono tracking-wider"
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={status === 'loading' || !ticketId.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-colors shadow-md shadow-indigo-100"
                >
                  {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Verify & Check In
                </button>
              </form>
            </div>
          </div>

          {/* Results Area */}
          <div className="min-h-[200px]">
            <AnimatePresence mode="wait">
              {status === 'idle' && (
                <motion.div 
                  key="idle"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="rounded-3xl border border-slate-200 bg-slate-50/50 border-dashed p-10 text-center h-full flex flex-col items-center justify-center"
                >
                  <Search className="h-12 w-12 text-slate-300 mb-3" />
                  <h3 className="font-semibold text-slate-600">Scan Results</h3>
                  <p className="text-sm text-slate-400 mt-1">Student details will appear here after verification</p>
                </motion.div>
              )}

              {status === 'success' && (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm relative overflow-hidden"
                >
                  <div className="flex items-start gap-3 mb-6 relative z-10">
                    <div className="h-10 w-10 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-emerald-900">Attendance Recorded</h3>
                      <p className="text-sm text-emerald-700">{message}</p>
                    </div>
                  </div>
                  {recentScan && (
                    <div className="bg-white/60 p-4 rounded-2xl border border-emerald-100 relative z-10 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider mb-1">Student ID</p>
                        <p className="text-sm font-bold text-slate-800 font-mono italic">{recentScan.student_id}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider mb-1">Ticket ID</p>
                        <p className="text-sm font-bold text-slate-800 font-mono italic">{recentScan.ticket_id}</p>
                      </div>
                    </div>
                  )}
                  <button onClick={() => setStatus('idle')} className="mt-6 w-full py-2.5 rounded-xl bg-white text-emerald-700 text-sm font-bold hover:bg-emerald-100 transition-colors border border-emerald-200">
                    Done
                  </button>
                </motion.div>
              )}

              {status === 'error' && (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm"
                >
                  <div className="flex items-start gap-3 mb-6">
                    <div className="h-10 w-10 bg-rose-500 rounded-full flex items-center justify-center shrink-0">
                      <XCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-rose-900">Verification Failed</h3>
                      <p className="text-sm text-rose-700">{message}</p>
                    </div>
                  </div>
                  <button onClick={() => setStatus('idle')} className="mt-6 w-full py-2.5 rounded-xl bg-white text-rose-700 text-sm font-bold hover:bg-rose-100 transition-colors border border-rose-200">
                    Close
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Dynamic Code Display */}
        <div className="lg:col-span-5">
          <div className="rounded-3xl border border-slate-200 bg-slate-900 text-white p-8 shadow-2xl relative overflow-hidden h-full flex flex-col justify-center">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500/10 rounded-full -ml-16 -mb-16 blur-3xl" />
            
            <div className="relative text-center space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">
                <Clock className="h-4 w-4" /> Live Check-in Code
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-4">Share this code with participants</p>
                <div className="flex justify-center gap-4">
                  {eventCode.split('').map((char, i) => (
                    <motion.div 
                      key={i + char}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="w-16 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl font-black text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                    >
                      {char}
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="relative h-16 w-16">
                  <svg className="h-16 w-16 transform -rotate-90">
                    <circle 
                      cx="32" cy="32" r="30" 
                      fill="transparent" 
                      stroke="rgba(255,255,255,0.05)" 
                      strokeWidth="4" 
                    />
                    <motion.circle 
                      cx="32" cy="32" r="30" 
                      fill="transparent" 
                      stroke="#6366f1" 
                      strokeWidth="4" 
                      strokeDasharray="188.4"
                      animate={{ strokeDashoffset: 188.4 * (1 - timeLeft / 60) }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-black">
                    {timeLeft}s
                  </div>
                </div>
                <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Auto-Rotating in {timeLeft}s</p>
              </div>

              <button 
                onClick={syncCode}
                disabled={isSyncing}
                className="mx-auto flex items-center gap-2 text-indigo-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
              >
                <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} /> Force Regenerate
              </button>

              <div className="pt-6 border-t border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  Code is valid for exactly 60 seconds
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  Time-based OTP verification active
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}