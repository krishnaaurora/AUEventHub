'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QrCode, Search, CheckCircle2, XCircle, User, Calendar, Loader2 } from 'lucide-react'

export default function OrganizerAttendancePage() {
  const [ticketId, setTicketId] = useState('')
  const [status, setStatus] = useState('idle') // idle, loading, success, error
  const [message, setMessage] = useState('')
  const [recentScan, setRecentScan] = useState(null)

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
    <div className="space-y-6 p-6 xl:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
            <QrCode className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">QR Scanner & Attendance</h1>
            <p className="text-sm text-slate-500">Scan student QR codes or enter Ticket IDs to verify entry</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Scanner Panel */}
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
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 ml-1">In production, this input automatically captures barcode scanner input</p>
              </div>
              
              <button 
                type="submit" 
                disabled={status === 'loading' || !ticketId.trim()}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
              >
                {status === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4" />
                )}
                Verify & Check In
              </button>
            </form>
          </div>

          {/* Web Scanner Placeholder */}
          <div className="bg-slate-50 p-6 border-t border-slate-100 flex flex-col items-center justify-center text-center">
            <div className="w-48 h-48 border-2 border-dashed border-indigo-200 rounded-2xl flex items-center justify-center bg-white relative overflow-hidden mb-4">
              <div className="absolute inset-x-0 h-0.5 bg-indigo-500/50 shadow-[0_0_8px_4px_rgba(99,102,241,0.4)] animate-[scan_2s_ease-in-out_infinite]" />
              <QrCode className="h-12 w-12 text-slate-200" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Camera Scanner Offline</p>
            <p className="text-xs text-slate-500 max-w-[200px] mt-1">Please use the manual entry field above to simulate scanning</p>
            
            <style jsx>{`
              @keyframes scan {
                0% { top: -10%; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { top: 110%; opacity: 0; }
              }
            `}</style>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.div 
                key="idle"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="rounded-3xl border border-slate-200 bg-slate-50/50 border-dashed p-8 text-center h-full flex flex-col items-center justify-center"
              >
                <QrCode className="h-12 w-12 text-slate-300 mb-3" />
                <h3 className="font-semibold text-slate-600">Ready to Scan</h3>
                <p className="text-sm text-slate-400 mt-1">Status and details will appear here</p>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <CheckCircle2 className="h-32 w-32 text-emerald-600" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-start gap-3 mb-6">
                    <div className="h-10 w-10 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 shadow-md shadow-emerald-200">
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-emerald-900">Valid Ticket</h3>
                      <p className="text-sm text-emerald-700">{message}</p>
                    </div>
                  </div>

                  {recentScan && (
                    <div className="space-y-3 bg-white/60 p-4 rounded-2xl border border-emerald-100">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-emerald-600" />
                        <div>
                          <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Student ID</p>
                          <p className="text-sm font-semibold text-slate-800 font-mono">{recentScan.student_id}</p>
                        </div>
                      </div>
                      <div className="h-px w-full bg-emerald-100" />
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-emerald-600" />
                        <div>
                          <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Event ID</p>
                          <p className="text-sm font-semibold text-slate-800 font-mono">{recentScan.event_id}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => { setStatus('idle'); setTicketId('') }}
                    className="mt-6 w-full py-2.5 rounded-xl bg-white text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition-colors border border-emerald-200"
                  >
                    Scan Next
                  </button>
                </div>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div 
                key="error"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <XCircle className="h-32 w-32 text-rose-600" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-start gap-3 mb-6">
                    <div className="h-10 w-10 bg-rose-500 rounded-full flex items-center justify-center shrink-0 shadow-md shadow-rose-200">
                      <XCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-rose-900">Invalid Ticket</h3>
                      <p className="text-sm text-rose-700">{message}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => { setStatus('idle'); setTicketId('') }}
                    className="mt-6 w-full py-2.5 rounded-xl bg-white text-rose-700 text-sm font-semibold hover:bg-rose-100 transition-colors border border-rose-200"
                  >
                    Try Again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}