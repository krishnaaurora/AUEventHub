'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  CalendarDays,
  ArrowRight,
  Loader2,
  Eye,
  MapPin,
  Clock,
  Building2,
  User as UserIcon,
  Sparkles,
  X,
} from 'lucide-react'
import getSocket from '../../../lib/socket'

const statCards = [
  { key: 'pending', label: 'EVENT Waiting for Verification', icon: ClipboardCheck, color: 'amber' },
  { key: 'approved', label: 'Registrar Approved EVENT', icon: CheckCircle2, color: 'emerald' },
  { key: 'rejected', label: 'Rejected EVENT', icon: XCircle, color: 'rose' },
  { key: 'thisMonth', label: 'EVENT This Month', icon: CalendarDays, color: 'indigo' },
]

const colorMap = {
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'bg-amber-100', border: 'border-amber-200' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'bg-emerald-100', border: 'border-emerald-200' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', icon: 'bg-rose-100', border: 'border-rose-200' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: 'bg-indigo-100', border: 'border-indigo-200' },
}

function RegistrarDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, thisMonth: 0 })
  const [recentEvents, setRecentEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const registrarName = session?.user?.name || 'Registrar'

  async function loadDashboard() {
    try {
      const [statsRes, eventsRes] = await Promise.all([
        fetch('/api/registrar/stats', { cache: 'no-store' }),
        fetch('/api/registrar/events?filter=pending&limit=6', { cache: 'no-store' }),
      ])
      const statsJson = await statsRes.json()
      const eventsJson = await eventsRes.json()

      setStats({
        pending: statsJson.pending || 0,
        approved: statsJson.approved || 0,
        rejected: statsJson.rejected || 0,
        thisMonth: statsJson.thisMonth || 0,
      })
      setRecentEvents(Array.isArray(eventsJson.items) ? eventsJson.items : [])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const handleRefresh = (payload) => {
      if (!payload?.scope || payload?.scope === 'registrar') loadDashboard()
    }
    socket.on('dashboard:refresh', handleRefresh)
    socket.on('event:new', loadDashboard)
    return () => {
      socket.off('dashboard:refresh', handleRefresh)
      socket.off('event:new', loadDashboard)
    }
  }, [])

  async function handleApprove(eventId) {
    setActionLoading(eventId)
    try {
      const res = await fetch('/api/registrar/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, action: 'approve' }),
      })
      if (res.ok) loadDashboard()
    } catch {
      // silently fail
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(eventId) {
    setActionLoading(eventId)
    try {
      const res = await fetch('/api/registrar/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, action: 'reject', reason: rejectReason }),
      })
      if (res.ok) {
        setRejectModal(null)
        setRejectReason('')
        loadDashboard()
      }
    } catch {
      // silently fail
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

  return (
    <div className="space-y-6">


      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => {
          const c = colorMap[card.color]
          const Icon = card.icon
          return (
            <div
              key={card.key}
              className={`rounded-2xl border ${c.border} ${c.bg} p-5 shadow-sm transition-all hover:shadow-md cursor-default`}
            >
              <div className={`h-10 w-10 rounded-xl ${c.icon} flex items-center justify-center mb-3`}>
                <Icon className={`h-5 w-5 ${c.text}`} />
              </div>
              <p className="text-3xl font-bold text-slate-900">{stats[card.key]}</p>
              <p className="text-xs text-slate-500 mt-1">{card.label}</p>
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-500" />
            Recent EVENT for Verification
          </h2>
          <Link href="/registrar/dean-approved" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentEvents.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">No pending events for verification.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentEvents.map((event) => (
              <div
                key={event._id}
                className="rounded-xl border border-slate-100 bg-slate-50 p-5 hover:shadow-md hover:border-emerald-200 transition-all group"
              >
                <h3 className="text-sm font-bold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">{event.title}</h3>
                <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                    <span>{event.organizer || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>{event.department || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{event.venue || 'TBD'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{event.start_date || event.date} — {event.end_date || event.start_date || event.date}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Link href={`/registrar/event/${event._id}`}>
                    <button className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                      <Eye className="h-3 w-3" /> View
                    </button>
                  </Link>
                  <button
                    onClick={() => handleApprove(event._id)}
                    disabled={!!actionLoading}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === event._id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectModal(event._id)}
                    disabled={!!actionLoading}
                    className="flex items-center gap-1.5 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-600 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="h-3 w-3" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {rejectModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-opacity duration-200"
          onClick={() => { setRejectModal(null); setRejectReason('') }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-transform duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Reject Event</h3>
              <button onClick={() => { setRejectModal(null); setRejectReason('') }} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Rejecting event for logistics verification.
            </p>
            <label className="block text-sm font-medium text-slate-700 mb-2">Reason for Rejection</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g., Venue conflict, Infrastructure not available, Schedule overlap..."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300"
            />
            <div className="flex flex-wrap gap-2 mt-3 mb-4">
              {['Venue conflict', 'Infrastructure not available', 'Schedule overlap', 'Resource constraints'].map((r) => (
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
                disabled={!rejectReason.trim()}
                className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 transition-colors disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RegistrarDashboard

