'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  User,
  Building,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  TrendingUp,
  Eye,
  Star,
  AlertTriangle,
  Target,
  Zap,
} from 'lucide-react'

function VCEventDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  async function loadEvent() {
    try {
      const res = await fetch(`/api/vc/events/${params.id}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setEvent(data)
      } else {
        router.push('/vc/registrar-approved')
      }
    } catch {
      router.push('/vc/registrar-approved')
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove() {
    setApproving(true)
    try {
      const res = await fetch('/api/vc/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: params.id, action: 'approve' }),
      })

      if (res.ok) {
        router.push('/vc/registrar-approved')
      }
    } catch {
      // silently fail
    } finally {
      setApproving(false)
    }
  }

  async function handleReject() {
    if (!rejectionReason.trim()) return

    setRejecting(true)
    try {
      const res = await fetch('/api/vc/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: params.id,
          action: 'reject',
          rejectionReason: rejectionReason.trim()
        }),
      })

      if (res.ok) {
        setShowRejectModal(false)
        router.push('/vc/registrar-approved')
      }
    } catch {
      // silently fail
    } finally {
      setRejecting(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      loadEvent()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 text-lg">Event not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRejectModal(true)}
            className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors flex items-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            Reject Event
          </button>
          <button
            onClick={handleApprove}
            disabled={approving}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {approving ? 'Approving...' : 'Approve Event'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Event Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Poster/Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="aspect-video rounded-lg mb-4 overflow-hidden bg-slate-100">
              {event.poster ? (
                <img
                  src={event.poster}
                  alt={event.title}
                  className="h-full w-full object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src = '/assets/seminar.png' }}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
                  No poster uploaded
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{event.title}</h1>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {event.organizer || 'Unknown Organizer'}
              </span>
              <span className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                {event.department}
              </span>
            </div>
          </motion.div>

          {/* Event Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Event Details</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900">{event.venue}</p>
                    <p className="text-sm text-slate-500">Venue</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900">
                      {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-slate-500">Date Range</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900">
                      {event.start_time} - {event.end_time}
                    </p>
                    <p className="text-sm text-slate-500">Time</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900">{event.max_participants}</p>
                    <p className="text-sm text-slate-500">Maximum Participants</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900">{event.trending?.score || 0}</p>
                    <p className="text-sm text-slate-500">Trending Score</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900">{event.trending?.views || 0}</p>
                    <p className="text-sm text-slate-500">Views</p>
                  </div>
                </div>
              </div>
            </div>

            {event.details?.description && (
              <div className="mt-4">
                <h4 className="font-medium text-slate-900 mb-2">Description</h4>
                <p className="text-slate-600">{event.details.description}</p>
              </div>
            )}

            {event.details?.guest_speakers && (
              <div className="mt-4">
                <h4 className="font-medium text-slate-900 mb-2">Guest Speakers</h4>
                <p className="text-slate-600">{event.details.guest_speakers}</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Strategic Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-violet-500" />
              AI Strategic Event Analysis
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-violet-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-violet-600" />
                  <span className="text-sm font-medium text-violet-800">Expected Participation</span>
                </div>
                <p className="text-lg font-bold text-violet-900">
                  {event.ai_data?.expected_participation || event.max_participants}
                </p>
                <p className="text-xs text-violet-600">students predicted</p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Department Engagement</span>
                </div>
                <p className="text-sm font-medium text-blue-900">
                  {event.ai_data?.department_engagement || 'High'}
                </p>
                <p className="text-xs text-blue-600">Cross-department impact</p>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">Risk Level</span>
                </div>
                <p className="text-sm font-medium text-amber-900">
                  {event.ai_data?.risk_level || 'Low'}
                </p>
                <p className="text-xs text-amber-600">Operational risk assessment</p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-800">Predicted Popularity</span>
                </div>
                <p className="text-sm font-medium text-emerald-900">
                  {event.ai_data?.predicted_popularity || 'High'}
                </p>
                <p className="text-xs text-emerald-600">Based on historical data</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-800">Strategic Value</span>
                </div>
                <p className="text-sm font-medium text-slate-900">
                  {event.ai_data?.strategic_value || 'Strong student engagement'}
                </p>
                <p className="text-xs text-slate-600">University impact assessment</p>
              </div>
            </div>
          </motion.div>

          {/* Approval Chain */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Approval Chain</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <span className="text-sm font-medium text-emerald-800">Dean Approval</span>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <span className="text-sm font-medium text-emerald-800">Registrar Approval</span>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <span className="text-sm font-medium text-amber-800">VC Final Approval</span>
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Reject Event</h3>
            <p className="text-slate-600 mb-4">Please provide a reason for rejecting this event:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Budget limitations, scheduling conflict..."
              className="w-full p-3 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-rose-500"
              rows={4}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                {rejecting ? 'Rejecting...' : 'Reject Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VCEventDetailsPage