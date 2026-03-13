'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardCheck,
  Eye,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  X,
  AlertCircle,
  MessageSquare,
} from 'lucide-react'
import getSocket from '../../../lib/socket'

export default function PendingApprovalsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [approveModal, setApproveModal] = useState(null)
  const [approveComment, setApproveComment] = useState('')
  const [commentError, setCommentError] = useState('')

  async function loadPending() {
    try {
      const res = await fetch('/api/dean/events?filter=pending', { cache: 'no-store' })
      const json = await res.json()
      setEvents(Array.isArray(json.items) ? json.items : [])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPending() }, [])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const handleRefresh = (payload) => {
      if (!payload?.scope || payload?.scope === 'dean') loadPending()
    }
    socket.on('dashboard:refresh', handleRefresh)
    return () => socket.off('dashboard:refresh', handleRefresh)
  }, [])

  async function handleApprove(eventId) {
    if (!approveComment.trim()) {
      setCommentError('Comment is required before approving.')
      return
    }
    setActionLoading(eventId)
    setCommentError('')
    try {
      const res = await fetch('/api/dean/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, action: 'approve', comment: approveComment }),
      })
      if (res.ok) {
        setApproveModal(null)
        setApproveComment('')
        loadPending()
      }
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(eventId) {
    if (!rejectReason.trim()) {
      setCommentError('Rejection reason is required.')
      return
    }
    setActionLoading(eventId)
    setCommentError('')
    try {
      const res = await fetch('/api/dean/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, action: 'reject', reason: rejectReason }),
      })
      if (res.ok) {
        setRejectModal(null)
        setRejectReason('')
        loadPending()
      }
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = events.filter((e) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (e.title || '').toLowerCase().includes(q) ||
      (e.organizer || '').toLowerCase().includes(q) ||
      (e.department || '').toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-amber-500" />
              Pending Approvals
            </h1>
            <p className="text-sm text-slate-500 mt-1">Events waiting for your review and approval.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events..."
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 w-64"
            />
          </div>
        </div>
      </div>

      {/* Mandatory comment notice */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700"><strong>Note:</strong> A comment is required before approving or rejecting any event.</p>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-3.5 text-left font-semibold text-slate-600">Event Name</th>
                <th className="px-5 py-3.5 text-left font-semibold text-slate-600">Organizer</th>
                <th className="px-5 py-3.5 text-left font-semibold text-slate-600 hidden md:table-cell">Department</th>
                <th className="px-5 py-3.5 text-left font-semibold text-slate-600 hidden lg:table-cell">Venue</th>
                <th className="px-5 py-3.5 text-left font-semibold text-slate-600 hidden lg:table-cell">Start Date</th>
                <th className="px-5 py-3.5 text-left font-semibold text-slate-600 hidden xl:table-cell">End Date</th>
                <th className="px-5 py-3.5 text-left font-semibold text-slate-600 hidden xl:table-cell">Submitted</th>
                <th className="px-5 py-3.5 text-left font-semibold text-slate-600">Status</th>
                <th className="px-5 py-3.5 text-right font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    No pending events found.
                  </td>
                </tr>
              ) : (
                filtered.map((event, i) => (
                  <motion.tr
                    key={event._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-medium text-slate-800 max-w-[200px] truncate">{event.title}</td>
                    <td className="px-5 py-3.5 text-slate-600">{event.organizer || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-600 hidden md:table-cell">{event.department || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-600 hidden lg:table-cell">{event.venue || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-600 hidden lg:table-cell">{event.start_date || event.date || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-600 hidden xl:table-cell">{event.end_date || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-600 hidden xl:table-cell">{event.approval?.submitted_at || event.created_at || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        Pending Dean Approval
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dean/event/${event._id}`}>
                          <button className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                        <button
                          onClick={() => { setApproveModal(event); setApproveComment(''); setCommentError('') }}
                          disabled={actionLoading === event._id}
                          className="rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => { setRejectModal(event); setCommentError('') }}
                          disabled={actionLoading === event._id}
                          className="rounded-lg bg-rose-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-rose-600 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
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
                <button onClick={() => { setApproveModal(null); setApproveComment('') }} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
              </div>
              <p className="text-sm text-slate-500 mb-4">Approving: <span className="font-semibold text-slate-700">{approveModal.title}</span></p>
              <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
                <MessageSquare className="h-4 w-4" /> Approval Comment <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
                rows={3}
                placeholder="e.g., Event details are complete and approved."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
              />
              {commentError && <p className="mt-1 text-xs text-rose-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{commentError}</p>}
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => { setApproveModal(null); setApproveComment('') }} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
                <button
                  onClick={() => handleApprove(approveModal._id)}
                  disabled={actionLoading === approveModal._id}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
                >
                  {actionLoading === approveModal._id ? 'Approving...' : 'Confirm Approval'}
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
                  onClick={() => { setRejectModal(null); setRejectReason('') }}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(rejectModal._id)}
                  disabled={actionLoading === rejectModal._id}
                  className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 transition-colors disabled:opacity-50"
                >
                  {actionLoading === rejectModal._id ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
