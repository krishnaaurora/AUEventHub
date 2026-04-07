'use client'

import { useEffect, useState } from 'react'
import {
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  TrendingUp,
  Calendar,
  Loader2,
  Eye,
  UserCheck,
  Check,
  ChevronDown,
  X,
  MessageSquare
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

function VCDashboardPage() {
  const [stats, setStats] = useState(null)
  const [recentEvents, setRecentEvents] = useState([])
  const [loading, setLoading] = useState(true)

  // Expand state for stepper
  const [expandedId, setExpandedId] = useState(null)
  
  // Action state
  const [approveModal, setApproveModal] = useState(null)
  const [approveComment, setApproveComment] = useState('')
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  async function loadDashboardData() {
    try {
      const [statsRes, eventsRes] = await Promise.all([
        fetch('/api/vc/stats', { cache: 'no-store' }),
        fetch('/api/vc/events?filter=pending&limit=10', { cache: 'no-store' }),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setRecentEvents(eventsData.items || [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function handleApprove(event) {
    if (!approveComment.trim()) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/vc/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event._id, action: 'approve', comment: approveComment }),
      })
      if (res.ok) {
        setApproveModal(null)
        setApproveComment('')
        loadDashboardData()
      }
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject(event) {
    if (!rejectReason.trim()) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/vc/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event._id, action: 'reject', rejectionReason: rejectReason }),
      })
      if (res.ok) {
        setRejectModal(null)
        setRejectReason('')
        loadDashboardData()
      }
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">VC Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Final approval and oversight of university events</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-medium text-slate-600">Pending Approval</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats?.pendingEvents || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Awaiting final review</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-medium text-slate-600">Published Events</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{stats?.publishedEvents || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Live to students</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-5 w-5 text-rose-500" />
            <span className="text-sm font-medium text-slate-600">Rejected Events</span>
          </div>
          <p className="text-2xl font-bold text-rose-600">{stats?.rejectedEvents || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Final review</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-violet-500" />
            <span className="text-sm font-medium text-slate-600">Total Registrations</span>
          </div>
          <p className="text-2xl font-bold text-violet-600">{stats?.totalRegistrations || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Across all events</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          Events Awaiting Final Approval
        </h3>

        {recentEvents.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No events pending final approval</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentEvents.map((event) => (
              <div
                key={event._id}
                className="border border-slate-200 rounded-lg hover:shadow-md transition-all bg-white overflow-hidden group"
                onMouseEnter={() => setExpandedId(event._id)}
                onMouseLeave={() => setExpandedId(null)}
              >
                <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === event._id ? null : event._id)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-slate-900 group-hover:text-emerald-700 transition-colors">{event.title}</h4>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expandedId === event._id ? 'rotate-180' : ''}`} />
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3" />
                        {event.organizer || 'Unknown Organizer'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(event.start_date || event.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {event.max_participants || 0} expected
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                      Pending VC Approval
                    </span>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === event._id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100 bg-slate-50 overflow-hidden"
                    >
                      <div className="p-5">
                        {/* Stepper */}
                        <div className="mb-6 relative">
                          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-2/3" />
                          </div>
                          <div className="relative flex justify-between">
                            <div className="flex flex-col items-center">
                              <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center border-4 border-slate-50 shadow-sm relative z-10">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                              <span className="text-xs font-medium text-emerald-700 mt-2">Dean</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center border-4 border-slate-50 shadow-sm relative z-10">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                              <span className="text-xs font-medium text-emerald-700 mt-2">Registrar</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="h-8 w-8 rounded-full bg-white border-2 border-amber-500 flex items-center justify-center border-4 border-slate-50 shadow-sm relative z-10">
                                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                              </div>
                              <span className="text-xs font-bold text-amber-600 mt-2">VC (You)</span>
                            </div>
                          </div>
                        </div>

                        {/* Inline Actions */}
                        <div className="flex items-center gap-3">
                          <Link href={`/vc/event/${event._id}`} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                            <Eye className="h-4 w-4" />
                            Full Details
                          </Link>
                          <div className="flex-1" />
                          <button
                            onClick={() => setRejectModal(event)}
                            className="px-4 py-2 bg-white border border-rose-200 text-rose-600 text-sm font-medium rounded-lg hover:bg-rose-50 hover:border-rose-300 transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => setApproveModal(event)}
                            className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors shadow-sm"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center transform hover:scale-[1.02] transition-transform cursor-pointer">
          <Eye className="h-8 w-8 text-blue-500 mx-auto mb-2" />
          <h4 className="font-medium text-slate-900 mb-1">Monitor Events</h4>
          <p className="text-sm text-slate-500">Track published event performance</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center transform hover:scale-[1.02] transition-transform cursor-pointer">
          <TrendingUp className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
          <h4 className="font-medium text-slate-900 mb-1">View Analytics</h4>
          <p className="text-sm text-slate-500">University-wide event insights</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center transform hover:scale-[1.02] transition-transform cursor-pointer">
          <CheckCircle2 className="h-8 w-8 text-violet-500 mx-auto mb-2" />
          <h4 className="font-medium text-slate-900 mb-1">Final Approvals</h4>
          <p className="text-sm text-slate-500">Complete the approval chain</p>
        </div>
      </div>

      {/* Approve Modal */}
      <AnimatePresence>
        {approveModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => { setApproveModal(null); setApproveComment('') }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-emerald-700">✅ Approve Event</h3>
                <button onClick={() => { setApproveModal(null); setApproveComment('') }} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Approving: <span className="font-semibold text-slate-700">{approveModal.title}</span>
              </p>
              <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
                <MessageSquare className="h-4 w-4" /> Approval Comment <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
                rows={3}
                placeholder="e.g., Confirmed alignment. Approved."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => { setApproveModal(null); setApproveComment('') }}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApprove(approveModal)}
                  disabled={!approveComment.trim() || actionLoading}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Approving...' : 'Confirm Approval'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => { setRejectModal(null); setRejectReason('') }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Reject Event</h3>
                <button onClick={() => { setRejectModal(null); setRejectReason('') }} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Rejecting: <span className="font-semibold text-slate-700">{rejectModal.title}</span>
              </p>
              <label className="block text-sm font-medium text-slate-700 mb-2">Reason for Rejection</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="e.g., Missing paperwork, Unapproved budget..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300"
              />
              <div className="flex flex-wrap gap-2 mt-3 mb-4">
                {['Missing paperwork', 'Unapproved budget', 'Inappropriate timing', 'Other'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRejectReason(r)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                  >
                    {r}
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setRejectModal(null); setRejectReason('') }}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(rejectModal)}
                  disabled={!rejectReason.trim() || actionLoading}
                  className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

export default VCDashboardPage

