'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardCheck, Loader2, Calendar, User, Search, MapPin, Award } from 'lucide-react'

export default function StudentAttendancePage() {
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function loadAttendance() {
      try {
        const res = await fetch('/api/student/attendance', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setAttendance(data.items || [])
        }
      } catch {
        // Fallback silently if fetch fails
      } finally {
        setLoading(false)
      }
    }
    loadAttendance()
  }, [])

  const filteredItems = attendance.filter(item => {
    if (!searchQuery) return true
    return item.event_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           item.organizer?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Format timestamp nicely
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 xl:p-8">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg">
            <ClipboardCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Attendance</h1>
            <p className="text-sm text-slate-500">View your verified event attendance history</p>
          </div>
        </div>
      </div>

      {/* Stats and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm min-w-32 flex-1 sm:flex-none">
            <p className="text-xs text-slate-500 mb-1">Total Attended</p>
            <p className="text-2xl font-bold text-indigo-700">{attendance.filter(a => a.status === 'attended').length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm min-w-32 flex-1 sm:flex-none">
            <p className="text-xs text-slate-500 mb-1">Events Registered</p>
            <p className="text-2xl font-bold text-slate-800">{attendance.length}</p>
          </div>
        </div>

        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* Attendance List */}
      {filteredItems.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center bg-white">
          <ClipboardCheck className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-700">No attendance records found</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
            You don't have any verified attendance yet. When you check in at an event via QR scan, it will show up here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredItems.map((item, i) => (
              <motion.div
                key={item.ticket_id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
              >
                {/* Status banner */}
                <div className={`px-4 py-2 font-semibold text-xs flex justify-between items-center ${
                  item.status === 'attended' ? 'bg-emerald-50 text-emerald-700 border-b border-emerald-100' : 'bg-slate-50 text-slate-600 border-b border-slate-200'
                }`}>
                  <span className="flex items-center gap-1.5 uppercase tracking-wide">
                    {item.status === 'attended' ? '✅ Verified Attendee' : 'Pending Check-in'}
                  </span>
                  <span>{item.cert_eligible && <Award className="h-4 w-4 text-emerald-500" />}</span>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 leading-tight">
                    {item.event_title}
                  </h3>

                  <div className="space-y-2.5 text-xs text-slate-600 mb-4 mt-auto">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.organizer}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{item.event_date}</span>
                    </div>
                    <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
                      <ClipboardCheck className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-0.5">Scanned At</span>
                        <span>{formatDate(item.scanned_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
