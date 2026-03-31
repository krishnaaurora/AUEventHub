'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Search,
  Calendar,
  MapPin,
  Users,
  Eye,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  Building,
  AlertCircle,
  X,
  MessageSquare,
} from 'lucide-react'

function ApprovalModal({ event, onClose, onSubmit, action }) {
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!comment.trim()) {
      setError('Comment is mandatory before taking action.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onSubmit({ eventId: event._id, action, comment: comment.trim() })
      onClose()
    } catch (err) {
      setError(err.message || 'Action failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold ${action === 'approve' ? 'text-emerald-700' : 'text-rose-700'}`}>
            {action === 'approve' ? '✅ Approve Event' : '❌ Reject Event'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          Event: <span className="font-semibold text-slate-800">{event.title}</span>
        </p>

        <div className="mb-4">
          <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
            <MessageSquare className="h-4 w-4" />
            Comment <span className="text-rose-500">*</span>
            <span className="text-xs text-slate-400 font-normal ml-1">(required)</span>
          </label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            placeholder={action === 'approve'
              ? 'e.g., Event details are complete and approved for implementation.'
              : 'e.g., Event conflicts with existing venue booking on the same date.'
            }
            className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 resize-none ${
              error
                ? 'border-rose-300 focus:ring-rose-200'
                : action === 'approve'
                  ? 'border-slate-200 focus:ring-emerald-200'
                  : 'border-slate-200 focus:ring-rose-200'
            }`}
          />
          {error && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600">
              <AlertCircle className="h-3 w-3" />{error}
            </p>
          )}
        </div>

        {action === 'reject' && (
          <div className="mb-4 flex flex-wrap gap-2">
            {['Venue conflict', 'Incomplete details', 'Budget concerns', 'Schedule overlap', 'Policy violation'].map(r => (
              <button
                key={r}
                onClick={() => setComment(r)}
                className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs text-rose-700 hover:bg-rose-100 transition-colors"
              >
                {r}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`rounded-xl px-5 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
              action === 'approve'
                ? 'bg-emerald-500 hover:bg-emerald-600'
                : 'bg-rose-500 hover:bg-rose-600'
            }`}
          >
            {loading ? 'Processing…' : action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function VCRegistrarApprovedPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [modal, setModal] = useState(null) // { event, action }
  const [toast, setToast] = useState(null)

  async function loadEvents() {
    try {
      const res = await fetch('/api/vc/events?filter=pending&limit=100', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setEvents(data.items || [])
      }
    } catch { /* silently fail */ }
    finally { setLoading(false) }
  }

  useEffect(() => { loadEvents() }, [])

  async function handleAction({ eventId, action, comment }) {
    const res = await fetch('/api/vc/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        action,
        rejectionReason: action === 'reject' ? comment : undefined,
        comment,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Action failed')
    setToast({ type: action, message: action === 'approve' ? 'Event approved and published!' : 'Event rejected.' })
    setTimeout(() => setToast(null), 3000)
    loadEvents()
  }

  const filteredEvents = events.filter(event =>
    event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.organizer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.department?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-[300] rounded-xl px-5 py-3 shadow-lg text-white text-sm font-semibold ${toast.type === 'approve' ? 'bg-emerald-500' : 'bg-rose-500'}`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Registrar Approved Events</h1>
          <p className="text-sm text-slate-500 mt-1">Events awaiting final VC approval — add a comment before approving or rejecting</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Mandatory comment info */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700">
          <strong>Note:</strong> A comment is mandatory before approving or rejecting any event. This is recorded in the audit log.
        </p>
      </div>

      {/* Events list */}
      {filteredEvents.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <CheckCircle2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">{searchTerm ? 'No events match your search' : 'No events pending VC approval'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event, index) => (
            <motion.div
              key={event._id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-base">{event.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                    {event.organizer && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />{event.organizer}
                      </span>
                    )}
                    {event.department && (
                      <span className="flex items-center gap-1">
                        <Building className="h-3 w-3" />{event.department}
                      </span>
                    )}
                    {event.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{event.venue}
                      </span>
                    )}
                    {event.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />{new Date(event.start_date).toLocaleDateString()}
                        {event.end_date && ` — ${new Date(event.end_date).toLocaleDateString()}`}
                      </span>
                    )}
                    {event.max_participants && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />{event.max_participants} seats
                      </span>
                    )}
                  </div>

                  {/* Approval chain status */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      ✓ Dean Approved
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      ✓ Registrar Approved
                    </span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      ⏳ Pending VC Approval
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/vc/event/${event._id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Eye className="h-4 w-4" /> View
                  </Link>
                  <button
                    onClick={() => setModal({ event, action: 'approve' })}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </button>
                  <button
                    onClick={() => setModal({ event, action: 'reject' })}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-600 transition-colors"
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Approval/Rejection Modal */}
      <AnimatePresence>
        {modal && (
          <ApprovalModal
            event={modal.event}
            action={modal.action}
            onClose={() => setModal(null)}
            onSubmit={handleAction}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default VCRegistrarApprovedPage