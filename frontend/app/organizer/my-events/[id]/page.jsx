'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Users,
  Sparkles,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Star,
  Loader2,
  Send,
  ChevronDown,
  ChevronUp,
  Info,
  GitBranch,
} from 'lucide-react'

const APPROVAL_STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
}

const statusStyles = {
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  published: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-rose-100 text-rose-700 border-rose-200',
  pending_dean: 'bg-amber-100 text-amber-800 border-amber-200',
  pending_registrar: 'bg-orange-100 text-orange-700 border-orange-200',
  pending_vc: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
}

const APPROVAL_STAGES = [
  { key: 'pending_dean', label: 'Dean' },
  { key: 'pending_registrar', label: 'Registrar' },
  { key: 'pending_vc', label: 'VC' },
  { key: 'approved', label: 'Approved' },
]

function ApprovalTimeline({ status }) {
  const stageIndex = APPROVAL_STAGES.findIndex((s) => s.key === status)
  const isApproved = status === 'approved'
  const isCompleted = status === 'completed'
  const isRejected = status === 'rejected'

  return (
    <div className="flex items-center gap-0 mt-4">
      {APPROVAL_STAGES.map((stage, i) => {
        const done = isApproved || isCompleted ? true : i < stageIndex
        const current = !isApproved && !isCompleted && !isRejected && i === stageIndex
        const rejected = isRejected && i === stageIndex
        return (
          <div key={stage.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                  ${done ? 'bg-emerald-500 border-emerald-500 text-white' : ''}
                  ${current ? 'bg-amber-400 border-amber-400 text-white animate-pulse' : ''}
                  ${rejected ? 'bg-rose-500 border-rose-500 text-white' : ''}
                  ${!done && !current && !rejected ? 'bg-white border-slate-200 text-slate-400' : ''}
                `}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : rejected ? <XCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`mt-1 text-[10px] font-semibold ${done ? 'text-emerald-600' : current ? 'text-amber-600' : rejected ? 'text-rose-500' : 'text-slate-400'}`}>
                {stage.label}
              </span>
            </div>
            {i < APPROVAL_STAGES.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 mb-4 rounded ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n === value ? 0 : n)}
          className="focus:outline-none"
        >
          <Star
            className={`h-5 w-5 transition-colors ${n <= (hovered || value) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-1 text-xs text-slate-500">{value}/5</span>
      )}
    </div>
  )
}

export default function OrganizerEventDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const eventId = params?.id ? String(params.id) : ''

  const [event, setEvent] = useState(null)
  const [eventDetails, setEventDetails] = useState(null)
  const [aiData, setAiData] = useState(null)
  const [approvalData, setApprovalData] = useState(null)
  const [viewData, setViewData] = useState(null)
  const [feedbackItems, setFeedbackItems] = useState([])
  const [loading, setLoading] = useState(true)

  // Note form state
  const [noteComment, setNoteComment] = useState('')
  const [noteRating, setNoteRating] = useState(0)
  const [submittingNote, setSubmittingNote] = useState(false)
  const [noteSuccess, setNoteSuccess] = useState(false)

  // Collapsible sections
  const [showLetter, setShowLetter] = useState(false)
  const [showDescription, setShowDescription] = useState(false)
  const [showInputs, setShowInputs] = useState(false)

  const organizerId = session?.user?.registrationId || session?.user?.id || ''
  const organizerName = session?.user?.name || session?.user?.email || ''

  async function loadAll() {
    if (!eventId) return
    setLoading(true)
    try {
      const [eventsRes, detailsRes, aiRes, approvalsRes, viewsRes, feedbackRes] = await Promise.all([
        fetch(`/api/student/events?limit=500`, { cache: 'no-store' }),
        fetch(`/api/student/event-details?event_id=${encodeURIComponent(eventId)}`, { cache: 'no-store' }),
        fetch(`/api/organizer/event-ai-data?event_id=${encodeURIComponent(eventId)}`, { cache: 'no-store' }),
        fetch(`/api/organizer/event-approvals?event_id=${encodeURIComponent(eventId)}`, { cache: 'no-store' }),
        fetch(`/api/organizer/event-views?event_id=${encodeURIComponent(eventId)}`, { cache: 'no-store' }),
        fetch(`/api/organizer/event-feedback?event_id=${encodeURIComponent(eventId)}&limit=100`, { cache: 'no-store' }),
      ])

      const eventsJson = await eventsRes.json()
      const allEvents = Array.isArray(eventsJson.items) ? eventsJson.items : []
      const found = allEvents.find((e) => String(e._id) === eventId)
      setEvent(found || null)

      if (detailsRes.ok) {
        const det = await detailsRes.json()
        setEventDetails(det)
      }

      if (aiRes.ok) {
        const aiJson = await aiRes.json()
        setAiData(Array.isArray(aiJson.items) && aiJson.items.length > 0 ? aiJson.items[0] : null)
      }

      if (approvalsRes.ok) {
        const approvalsJson = await approvalsRes.json()
        setApprovalData(Array.isArray(approvalsJson.items) && approvalsJson.items.length > 0 ? approvalsJson.items[0] : null)
      }

      if (viewsRes.ok) {
        const viewsJson = await viewsRes.json()
        setViewData(Array.isArray(viewsJson.items) && viewsJson.items.length > 0 ? viewsJson.items[0] : null)
      }

      if (feedbackRes.ok) {
        const fbJson = await feedbackRes.json()
        setFeedbackItems(Array.isArray(fbJson.items) ? fbJson.items : [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [eventId])

  async function handleSubmitNote(e) {
    e.preventDefault()
    if (!noteComment.trim()) return
    setSubmittingNote(true)
    setNoteSuccess(false)
    try {
      const res = await fetch('/api/organizer/event-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          organizer_id: organizerId,
          author_name: organizerName,
          feedback_type: 'organizer_note',
          comment: noteComment.trim(),
          rating: noteRating > 0 ? noteRating : null,
        }),
      })
      if (res.ok) {
        setNoteComment('')
        setNoteRating(0)
        setNoteSuccess(true)
        await loadAll()
        setTimeout(() => setNoteSuccess(false), 3000)
      }
    } catch {
      // ignore
    } finally {
      setSubmittingNote(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="space-y-4">
        <Link href="/organizer/my-events" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition">
          <ArrowLeft className="h-4 w-4" /> Back to My Events
        </Link>
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-10 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-rose-400 mb-2" />
          <p className="text-sm text-rose-700 font-medium">Event not found or you do not have access.</p>
        </div>
      </div>
    )
  }

  const avgRating = feedbackItems.filter((f) => f.rating > 0).length > 0
    ? (feedbackItems.filter((f) => f.rating > 0).reduce((s, f) => s + Number(f.rating), 0) /
       feedbackItems.filter((f) => f.rating > 0).length).toFixed(1)
    : null

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <Link
        href="/organizer/my-events"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to My Events
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Event Details</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{event.title}</h1>
            <p className="mt-1 text-sm text-slate-500">{event.category} · {event.department}</p>
          </div>
          <span
            className={`self-start inline-block text-xs font-bold px-3 py-1.5 rounded-full border ${statusStyles[event.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}
          >
            {event.status?.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Approval timeline */}
        {!['cancelled', 'rejected'].includes(event.status) && (
          <div className="mt-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Approval Progress</p>
            <ApprovalTimeline status={event.status} />
          </div>
        )}
        {event.status === 'rejected' && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">
            <XCircle className="h-4 w-4 flex-shrink-0" />
            This event was rejected. You may need to revise and resubmit.
          </div>
        )}
      </motion.div>

      {/* Core Info Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: MapPin, label: 'Venue', value: event.venue || '–' },
          { icon: Calendar, label: 'Dates', value: event.start_date ? `${event.start_date}${event.end_date && event.end_date !== event.start_date ? ` – ${event.end_date}` : ''}` : event.date || '–' },
          { icon: Clock, label: 'Time', value: event.start_time ? `${event.start_time}${event.end_time ? ` – ${event.end_time}` : ''}` : event.time || '–' },
          { icon: Users, label: 'Registrations', value: `${event.registered_count || 0} / ${event.seats || event.max_participants || '–'}` },
          { icon: Sparkles, label: 'Trending Score', value: Number(viewData?.trending_score || 0) },
          { icon: Users, label: 'Views', value: Number(viewData?.views || 0) },
          { icon: GitBranch, label: 'Dean Stage', value: approvalData?.dean_status || 'pending' },
          { icon: GitBranch, label: 'Registrar / VC', value: `${approvalData?.registrar_status || 'pending'} / ${approvalData?.vc_status || 'pending'}` },
        ].map(({ icon: Icon, label, value }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-4 w-4 text-indigo-400" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
            </div>
            <p className="text-sm font-semibold text-slate-800">{value}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-indigo-400" /> Approval &amp; Trending Snapshot
        </h2>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approval Chain</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ['Dean', approvalData?.dean_status || 'pending'],
                ['Registrar', approvalData?.registrar_status || 'pending'],
                ['VC', approvalData?.vc_status || 'pending'],
              ].map(([label, status]) => (
                <span
                  key={label}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${APPROVAL_STATUS_STYLES[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}
                >
                  {label}: {status}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-400">Submitted: {approvalData?.submitted_at || 'N/A'}</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trending Inputs</p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-slate-400">Views</p>
                <p className="text-lg font-bold text-slate-800">{Number(viewData?.views || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Registrations</p>
                <p className="text-lg font-bold text-slate-800">{Number(viewData?.registrations || event.registered_count || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Score</p>
                <p className="text-lg font-bold text-violet-600">{Number(viewData?.trending_score || 0)}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">Formula: views + registrations</p>
          </div>
        </div>
      </motion.div>

      {/* Speakers & Schedule */}
      {eventDetails && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-400" /> Speakers &amp; Schedule
          </h2>
          {eventDetails.speakers?.length > 0 ? (
            <ul className="space-y-2 mb-4">
              {eventDetails.speakers.map((spk, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-2.5">
                  <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {String(spk.name || 'S')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{spk.name || 'Unknown'}</p>
                    {spk.role && <p className="text-xs text-slate-500">{spk.role}</p>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400 mb-4">No speakers listed.</p>
          )}
          {eventDetails.schedule?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Schedule</p>
              <ul className="space-y-1.5">
                {eventDetails.schedule.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="text-xs text-slate-400 w-16 flex-shrink-0">{item.time || `${i + 1}.`}</span>
                    <span>{item.activity || item.title || item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {eventDetails.instructions && (
            <div className="mt-4 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700">
              <p className="font-semibold mb-1">Instructions</p>
              <p className="whitespace-pre-wrap">{eventDetails.instructions}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* AI Data */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm"
      >
        <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-500" /> AI &amp; Submission Data
        </h2>

        {!aiData ? (
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-6 text-center text-sm text-slate-400">
            <Info className="mx-auto h-5 w-5 mb-2 text-slate-300" />
            No AI data recorded for this event yet. AI tools are used when creating an event.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status chips */}
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border
                ${aiData.description_source === 'ai' ? 'bg-violet-100 text-violet-700 border-violet-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                <Sparkles className="h-3 w-3" />
                Description: {aiData.description_source === 'ai' ? 'AI Generated' : 'Manual / Saved'}
              </span>
              {aiData.clash_result && (
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border
                  ${aiData.clash_result.hasClash ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                  {aiData.clash_result.hasClash ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                  {aiData.clash_result.hasClash ? `Venue clash: ${aiData.clash_result.clashCount || '?'} conflict(s)` : 'No venue clash'}
                </span>
              )}
              {aiData.approval_stage && (
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border bg-indigo-50 text-indigo-700 border-indigo-200">
                  Stage: {aiData.approval_stage.replace(/_/g, ' ')}
                </span>
              )}
            </div>

            {/* Generated description */}
            {aiData.generated_description && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowDescription((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hover:text-indigo-600 transition"
                >
                  {showDescription ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {showDescription ? 'Hide' : 'Show'} AI Description
                </button>
                {showDescription && (
                  <div className="mt-2 rounded-xl bg-violet-50 border border-violet-100 px-4 py-3 text-sm text-violet-900 whitespace-pre-wrap">
                    {aiData.generated_description}
                  </div>
                )}
              </div>
            )}

            {/* Approval letter */}
            {aiData.approval_letter && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowLetter((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hover:text-indigo-600 transition"
                >
                  <FileText className="h-3.5 w-3.5" />
                  {showLetter ? 'Hide' : 'Show'} Approval Letter
                  {showLetter ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                {showLetter && (
                  <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200 px-5 py-4 text-sm text-slate-700 font-mono whitespace-pre-wrap leading-relaxed">
                    {aiData.approval_letter}
                  </div>
                )}
              </div>
            )}

            {/* Venue clash details */}
            {aiData.clash_result?.hasClash && aiData.clash_result?.clashes?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Conflicting Events</p>
                <ul className="space-y-1.5">
                  {aiData.clash_result.clashes.map((c, i) => (
                    <li key={i} className="rounded-lg bg-rose-50 border border-rose-100 px-3 py-2 text-xs text-rose-700">
                      <span className="font-semibold">{c.title || c.event_id}</span>
                      {c.start_date && <span className="ml-2 opacity-70">{c.start_date} {c.start_time}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Form inputs snapshot */}
            {aiData.inputs && Object.keys(aiData.inputs).length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowInputs((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hover:text-indigo-600 transition"
                >
                  {showInputs ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {showInputs ? 'Hide' : 'Show'} Submission Snapshot
                </button>
                {showInputs && (
                  <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 rounded-xl bg-slate-50 border border-slate-100 p-4 text-sm">
                    {Object.entries(aiData.inputs).map(([k, v]) => (
                      <div key={k} className="col-span-1">
                        <dt className="text-xs text-slate-400 capitalize">{k.replace(/_/g, ' ')}</dt>
                        <dd className="font-medium text-slate-700 mt-0.5 break-words">{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Feedback History */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-indigo-400" /> Feedback &amp; Notes
          </h2>
          {avgRating && (
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold text-slate-700">{avgRating}</span>
              <span className="text-xs text-slate-400">avg · {feedbackItems.filter((f) => f.rating > 0).length} rated</span>
            </div>
          )}
        </div>

        {/* Add note form */}
        <form onSubmit={handleSubmitNote} className="mb-6 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
          <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Add Organizer Note</p>
          <textarea
            value={noteComment}
            onChange={(e) => setNoteComment(e.target.value)}
            placeholder="Write a note about this event..."
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 transition resize-none"
          />
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs text-slate-500 mb-1">Optional rating</p>
              <StarRating value={noteRating} onChange={setNoteRating} />
            </div>
            <button
              type="submit"
              disabled={submittingNote || !noteComment.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 transition"
            >
              {submittingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submittingNote ? 'Saving…' : 'Save Note'}
            </button>
          </div>
          {noteSuccess && (
            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Note saved successfully!
            </p>
          )}
        </form>

        {/* Existing feedback list */}
        {feedbackItems.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-4">No feedback or notes yet.</p>
        ) : (
          <ul className="space-y-3">
            {feedbackItems.map((item, i) => (
              <motion.li
                key={item._id || i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
                      ${item.feedback_type === 'organizer_note' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-600'}`}>
                      {item.feedback_type?.replace(/_/g, ' ') || 'note'}
                    </span>
                    {item.author_name && (
                      <span className="text-xs text-slate-500">{item.author_name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.rating > 0 && (
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`h-3 w-3 ${n <= item.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                          />
                        ))}
                      </div>
                    )}
                    <span className="text-xs text-slate-400">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString()
                        : item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : ''}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.comment}</p>
              </motion.li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  )
}
