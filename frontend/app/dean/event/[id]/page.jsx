'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  MapPin,
  Clock,
  Building2,
  User as UserIcon,
  Calendar,
  Users,
  FileText,
  Mic2,
  AlertTriangle,
  Brain,
  Shield,
  TrendingUp,
  Target,
  X,
  ImageIcon,
} from 'lucide-react'

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [actionResult, setActionResult] = useState(null)

  async function loadEvent() {
    try {
      const res = await fetch(`/api/dean/events?event_id=${encodeURIComponent(eventId)}`, { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadEvent() }, [eventId])

  async function handleApprove() {
    setActionLoading('approve')
    try {
      const res = await fetch('/api/dean/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, action: 'approve' }),
      })
      const json = await res.json()
      if (res.ok) {
        setActionResult({ type: 'success', message: json.message })
        loadEvent()
      } else {
        setActionResult({ type: 'error', message: json.message })
      }
    } catch {
      setActionResult({ type: 'error', message: 'Failed to approve event.' })
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      setActionResult({ type: 'error', message: 'Please provide a reason for rejection.' })
      return
    }
    setActionLoading('reject')
    try {
      const res = await fetch('/api/dean/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, action: 'reject', reason: rejectReason }),
      })
      const json = await res.json()
      if (res.ok) {
        setRejectModal(false)
        setRejectReason('')
        setActionResult({ type: 'success', message: json.message })
        loadEvent()
      } else {
        setActionResult({ type: 'error', message: json.message })
      }
    } catch {
      setActionResult({ type: 'error', message: 'Failed to reject event.' })
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (!data?.event) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 text-lg">Event not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-emerald-600 hover:text-emerald-700 text-sm font-medium">
          Go Back
        </button>
      </div>
    )
  }

  const { event, detail, approval, aiData, trending } = data
  const isPending = ['pending_dean', 'pending'].includes(event.status)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Action Result Banner */}
      <AnimatePresence>
        {actionResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`rounded-xl p-4 text-sm font-medium flex items-center justify-between ${
              actionResult.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            <span>{actionResult.message}</span>
            <button onClick={() => setActionResult(null)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Poster + Header */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {event.poster ? (
          <div className="h-56 bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center">
            <img src={event.poster} alt={event.title} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="h-40 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-emerald-200" />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{event.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <UserIcon className="h-4 w-4 text-slate-400" />
                  {event.organizer || 'Unknown Organizer'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  {event.department || 'N/A'}
                </span>
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
                event.status === 'approved'
                  ? 'bg-emerald-100 text-emerald-700'
                  : event.status === 'rejected'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-amber-100 text-amber-700'
              }`}
            >
              {event.status?.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Event Details Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-800">Event Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Venue</p>
                <p className="font-medium text-slate-700">{event.venue || 'TBD'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Start Date</p>
                <p className="font-medium text-slate-700">{event.start_date || event.date || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs text-slate-400">End Date</p>
                <p className="font-medium text-slate-700">{event.end_date || event.start_date || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Time</p>
                <p className="font-medium text-slate-700">{event.start_time || '—'} — {event.end_time || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Max Participants</p>
                <p className="font-medium text-slate-700">{event.max_participants || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-800">Description & Details</h2>
          <div className="space-y-3 text-sm">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-emerald-500" />
                <p className="text-xs text-slate-400">Event Description</p>
              </div>
              <p className="text-slate-700 leading-relaxed">{event.description || 'No description provided.'}</p>
            </div>
            {detail?.guest_speakers && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Mic2 className="h-4 w-4 text-emerald-500" />
                  <p className="text-xs text-slate-400">Guest Speakers</p>
                </div>
                <p className="text-slate-700">{detail.guest_speakers}</p>
              </div>
            )}
            {detail?.instructions && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-emerald-500" />
                  <p className="text-xs text-slate-400">Event Instructions</p>
                </div>
                <p className="text-slate-700">{detail.instructions}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Event Analysis */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-5">
          <Brain className="h-5 w-5 text-emerald-600" />
          AI Event Analysis
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Conflict Check</p>
            </div>
            <p className="text-sm font-medium text-slate-800">
              {aiData?.conflict_check || aiData?.clash_result?.message || 'No conflicts detected'}
            </p>
          </div>
          <div className="rounded-xl bg-white border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Expected Participation</p>
            </div>
            <p className="text-sm font-medium text-slate-800">
              {aiData?.expected_participation || 'Moderate'}
            </p>
          </div>
          <div className="rounded-xl bg-white border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-violet-500" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Department Relevance</p>
            </div>
            <p className="text-sm font-medium text-slate-800">
              {aiData?.department_relevance || event.department || 'General'}
            </p>
          </div>
          <div className="rounded-xl bg-white border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`h-4 w-4 ${
                (aiData?.risk_level || '').toLowerCase() === 'high' ? 'text-rose-500'
                : (aiData?.risk_level || '').toLowerCase() === 'medium' ? 'text-amber-500'
                : 'text-emerald-500'
              }`} />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Risk Level</p>
            </div>
            <p className={`text-sm font-bold ${
              (aiData?.risk_level || '').toLowerCase() === 'high' ? 'text-rose-600'
              : (aiData?.risk_level || '').toLowerCase() === 'medium' ? 'text-amber-600'
              : 'text-emerald-600'
            }`}>
              {aiData?.risk_level || 'Low'}
            </p>
          </div>
          <div className="rounded-xl bg-white border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Trending Score</p>
            </div>
            <p className="text-sm font-medium text-slate-800">
              {trending?.trending_score || trending?.score || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Approval Status */}
      {approval && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-4">Approval Chain</h2>
          <div className="flex items-center gap-4 flex-wrap">
            {[
              { label: 'Dean', status: approval.dean_status },
              { label: 'Registrar', status: approval.registrar_status },
              { label: 'VC', status: approval.vc_status },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                {i > 0 && <div className="w-8 h-0.5 bg-slate-200" />}
                <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  step.status === 'approved' ? 'bg-emerald-100 text-emerald-700'
                  : step.status === 'rejected' ? 'bg-rose-100 text-rose-700'
                  : 'bg-slate-100 text-slate-500'
                }`}>
                  {step.status === 'approved' ? <CheckCircle2 className="h-3.5 w-3.5" />
                   : step.status === 'rejected' ? <XCircle className="h-3.5 w-3.5" />
                   : <Clock className="h-3.5 w-3.5" />}
                  {step.label}: {step.status || 'pending'}
                </div>
              </div>
            ))}
          </div>
          {approval.dean_rejection_reason && (
            <div className="mt-4 rounded-xl bg-rose-50 border border-rose-100 p-3">
              <p className="text-xs font-semibold text-rose-600">Rejection Reason</p>
              <p className="text-sm text-rose-700 mt-1">{approval.dean_rejection_reason}</p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {isPending && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-wrap items-center gap-4">
          <button
            onClick={handleApprove}
            disabled={!!actionLoading}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 shadow-sm"
          >
            {actionLoading === 'approve' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Approve Event
          </button>
          <button
            onClick={() => setRejectModal(true)}
            disabled={!!actionLoading}
            className="flex items-center gap-2 rounded-xl bg-rose-500 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-600 transition-colors disabled:opacity-50 shadow-sm"
          >
            <XCircle className="h-4 w-4" />
            Reject Event
          </button>
        </div>
      )}

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => { setRejectModal(false); setRejectReason('') }}
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
                <button onClick={() => { setRejectModal(false); setRejectReason('') }} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Rejecting: <span className="font-semibold text-slate-700">{event.title}</span>
              </p>
              <label className="block text-sm font-medium text-slate-700 mb-2">Reason for Rejection</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="e.g., Venue conflict, Incomplete event details, Budget concerns..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300"
              />
              <div className="flex flex-wrap gap-2 mt-3 mb-4">
                {['Venue conflict', 'Incomplete event details', 'Budget concerns', 'Schedule overlap'].map((r) => (
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
                  onClick={() => { setRejectModal(false); setRejectReason('') }}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading === 'reject'}
                  className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'reject' ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
