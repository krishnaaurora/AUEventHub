'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  Clock,
  MapPin,
  Upload,
  Wand2,
  ShieldCheck,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  X,
  Pencil,
  Plus,
  Image as ImageIcon,
} from 'lucide-react'

const CATEGORIES = [
  'Technical',
  'Cultural',
  'Sports',
  'Workshop',
  'Seminar',
  'Hackathon',
  'Guest Lecture',
  'Other',
]

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Information Technology',
  'Biotechnology',
  'MBA',
  'All Departments',
]

const EMPTY_FORM = {
  title: '',
  category: '',
  department: '',
  venue: '',
  start_date: '',
  end_date: '',
  start_time: '',
  end_time: '',
  max_participants: '',
  description: '',
  guest_speakers: '',
  instructions: '',
  poster: '',
}

export default function EditEventPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { id } = useParams()
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [descriptionGenerated, setDescriptionGenerated] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // AI states
  const [aiDescLoading, setAiDescLoading] = useState(false)
  const [clashLoading, setClashLoading] = useState(false)
  const [clashResult, setClashResult] = useState(null)
  const [letterLoading, setLetterLoading] = useState(false)
  const [letterResult, setLetterResult] = useState(null)
  const [posterProgress, setPosterProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/dean/events?event_id=${id}`)
        const data = await res.json()
        if (res.ok) {
          const e = data.event
          setForm({
            title: e.title || '',
            category: e.category || '',
            department: e.department || '',
            venue: e.venue || '',
            start_date: e.start_date || '',
            end_date: e.end_date || '',
            start_time: e.start_time || '',
            end_time: e.end_time || '',
            max_participants: e.max_participants || '',
            description: e.description || '',
            guest_speakers: data.detail?.guest_speakers?.join(', ') || '',
            instructions: data.detail?.instructions || '',
            poster: e.poster || '',
          })
          if (data.aiData) {
            setClashResult(data.aiData.clash_result)
          }
        } else {
          setError('Failed to fetch event data.')
        }
      } catch (err) {
        setError('An error occurred while loading the event.')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchEvent()
  }, [id])

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleFileDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleFileSelect(e) {
    const file = e.target.files[0]
    if (file) handleFile(file)
  }

  function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB.')
      return
    }

    const reader = new FileReader()
    reader.onloadstart = () => setPosterProgress(10)
    reader.onprogress = (e) => {
      if (e.lengthComputable) setPosterProgress(Math.round((e.loaded / e.total) * 90))
    }
    reader.onload = () => {
      updateField('poster', reader.result)
      setPosterProgress(100)
      setTimeout(() => setPosterProgress(0), 1000)
    }
    reader.readAsDataURL(file)
  }

  async function handleGenerateDescription() {
    if (!form.title || !form.category) {
      setError('Enter a title and category to generate a description.')
      return
    }
    setAiDescLoading(true)
    setError('')
    try {
      const res = await fetch('/api/organizer/ai-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          department: form.department,
          venue: form.venue,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Failed to generate description')
      updateField('description', json.description)
      setDescriptionGenerated(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setAiDescLoading(false)
    }
  }

  async function handleClashDetection() {
    if (!form.venue || !form.start_date || !form.start_time) {
      setError('Enter venue, start date, and start time to check clashes.')
      return
    }
    setClashLoading(true)
    setError('')
    setClashResult(null)
    try {
      const res = await fetch('/api/organizer/clash-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venue: form.venue,
          start_date: form.start_date,
          end_date: form.end_date || form.start_date,
          start_time: form.start_time,
          end_time: form.end_time || form.start_time,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Clash detection failed')
      setClashResult(json)
    } catch (err) {
      setError(err.message)
    } finally {
      setClashLoading(false)
    }
  }

  async function handleApprovalLetter() {
    if (!form.title || !form.category || !form.venue || !form.start_date) {
      setError('Fill in title, category, venue, and start date to generate letter.')
      return
    }
    setLetterLoading(true)
    setError('')
    setLetterResult(null)
    try {
      const res = await fetch('/api/organizer/approval-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          department: form.department,
          venue: form.venue,
          start_date: form.start_date,
          end_date: form.end_date,
          start_time: form.start_time,
          end_time: form.end_time,
          organizer: session?.user?.name || '',
          description: form.description,
          max_participants: form.max_participants,
          guest_speakers: form.guest_speakers,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Failed to generate letter')
      setLetterResult(json)
    } catch (err) {
      setError(err.message)
    } finally {
      setLetterLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.title || !form.category || !form.venue || !form.start_date || !form.start_time || !form.description) {
      setError('Please fill all required fields.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        id,
        ...form,
        max_participants: Number(form.max_participants) || 100,
      }

      const res = await fetch('/api/student/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Failed to update event')

      await Promise.all([
        fetch('/api/student/event-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_id: id,
            speakers: String(form.guest_speakers).split(',').map(s => s.trim()).filter(Boolean),
            instructions: form.instructions,
          }),
        }),
        fetch('/api/organizer/event-ai-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_id: id,
            clash_result: clashResult,
            approval_letter: letterResult?.letter || '',
            inputs: form
          }),
        }),
      ])

      setSuccess('Event updated successfully! Redirecting...')
      setTimeout(() => router.push('/organizer/my-events'), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Event Editor</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Edit Event</h1>
        <p className="mt-1 text-sm text-slate-500">
          Modify your event details. Some fields may trigger a re-approval.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-800">Basic Information</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Event Title <span className="text-rose-500">*</span>
              </label>
              <input
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g. AI Hackathon 2025"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => updateField('category', e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white transition"
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
              <select
                value={form.department}
                onChange={(e) => updateField('department', e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white transition"
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Venue <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={form.venue}
                  onChange={(e) => updateField('venue', e.target.value)}
                  placeholder="e.g. Main Auditorium"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-800">Date & Time</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => updateField('start_date', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => updateField('end_date', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Start Time <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => updateField('start_time', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
              <div className="relative">
                <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => updateField('end_time', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-800">Event Details</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Max Participants</label>
            <input
              type="number"
              min="1"
              value={form.max_participants}
              onChange={(e) => updateField('max_participants', e.target.value)}
              placeholder="e.g. 100"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white transition sm:max-w-xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">
                Description <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={aiDescLoading}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
              >
                {aiDescLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                {aiDescLoading ? 'Generating...' : 'AI Generate'}
              </button>
            </div>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Describe what the event is about..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white transition resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Guest Speakers</label>
            <input
              value={form.guest_speakers}
              onChange={(e) => updateField('guest_speakers', e.target.value)}
              placeholder="e.g. Dr. Smith, Prof. Sharma"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Instructions for Participants</label>
            <textarea
              rows={3}
              value={form.instructions}
              onChange={(e) => updateField('instructions', e.target.value)}
              placeholder="Any special instructions..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white transition resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Event Poster</label>
            {form.poster ? (
              <div className="relative group rounded-2xl border border-slate-200 bg-slate-50 p-2 overflow-hidden aspect-[16/9] max-w-lg">
                <img src={form.poster} alt="Poster Preview" className="h-full w-full object-cover rounded-xl" />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                  <button
                    type="button"
                    onClick={() => updateField('poster', '')}
                    className="rounded-xl bg-white/20 px-4 py-2 text-xs font-semibold text-white hover:bg-white/30 backdrop-blur-md border border-white/20 transition flex items-center gap-2"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Change Poster
                  </button>
                  <button 
                    type="button" 
                    onClick={() => updateField('poster', '')}
                    className="rounded-xl bg-rose-500/80 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 transition flex items-center gap-2"
                  >
                    <X className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-all cursor-pointer hover:bg-slate-50 relative ${
                  isDragging ? 'border-indigo-400 bg-indigo-50/50 scale-[0.99]' : 'border-slate-300'
                }`}
                onClick={() => document.getElementById('poster-input').click()}
              >
                <input
                  id="poster-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">Drag and drop your poster</p>
                <p className="text-xs text-slate-400 mt-1">or click to browse from device (JPG, PNG, max 2MB)</p>
                
                {posterProgress > 0 && (
                  <div className="absolute bottom-4 left-4 right-4 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${posterProgress}%` }} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition flex items-center gap-2"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? 'Updating...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
