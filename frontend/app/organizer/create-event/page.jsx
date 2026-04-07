'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  X,
  CheckCircle2,
  Loader2,
} from 'lucide-react'

import EventMetadata from './components/EventMetadata'
import DateTimeSection from './components/DateTimeSection'
import EventDetails from './components/EventDetails'
import AITools from './components/AITools'

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

export default function CreateEventPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [form, setForm] = useState(EMPTY_FORM)
  const [descriptionGenerated, setDescriptionGenerated] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [posterProgress, setPosterProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  // AI states
  const [aiDescLoading, setAiDescLoading] = useState(false)
  const [clashLoading, setClashLoading] = useState(false)
  const [clashResult, setClashResult] = useState(null)
  const [letterLoading, setLetterLoading] = useState(false)
  const [letterResult, setLetterResult] = useState(null)
  const [isEditingLetter, setIsEditingLetter] = useState(false)
  
  // History states (local session only)
  const [descHistory, setDescHistory] = useState([])
  const [descIndex, setDescIndex] = useState(-1)
  const [descSource, setDescSource] = useState('')
  const [letterHistory, setLetterHistory] = useState([])
  const [letterIndex, setLetterIndex] = useState(-1)

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
      setError('Enter a title and category first.')
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
      if (!res.ok) throw new Error(json.message || 'Failed to generate')
      
      const newDesc = json.description
      setDescSource(json.source || '')
      // Prepend to history and jump to newest
      setDescHistory(prev => {
        const updated = [newDesc, ...prev].slice(0, 5)
        return updated
      })
      setDescIndex(0)  // Always show the newest draft first
      updateField('description', newDesc)
      setDescriptionGenerated(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setAiDescLoading(false)
    }
  }

  // Removal of auto-generate useEffect for AI Content
  // (Left empty to indicate removal)

  // â”€â”€â”€ Real-time Clash Detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!form.venue || !form.start_date || !form.start_time) return

    const timer = setTimeout(() => {
      handleClashDetection(true) // Silent/Automatic check
    }, 600)

    return () => clearTimeout(timer)
  }, [form.venue, form.start_date, form.start_time, form.end_time])

  async function handleClashDetection(isSilent = false) {
    if (!form.venue || !form.start_date || !form.start_time) {
      if (!isSilent) setError('Enter venue, start date, and start time to check clashes.')
      return
    }
    
    setClashLoading(true)
    if (!isSilent) setError('')
    
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
      
      if (json.hasClash && !isSilent) {
        window.alert(`Clash Detected!\n${json.message}`)
      }
    } catch (err) {
      if (!isSilent) setError(err.message)
    } finally {
      setClashLoading(false)
    }
  }

  async function handleApprovalLetter(isSilent = false) {
    if (!form.title || !form.category || !form.venue || !form.start_date) {
      if (!isSilent) setError('Fill in title, category, venue, and start date to generate letter.')
      return
    }
    setLetterLoading(true)
    if (!isSilent) {
      setError('')
      // Don't clear result, users want to see current while loading next
    }
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
      setLetterHistory(prev => [json.letter, ...prev].slice(0, 5))
      setLetterIndex(0) // Newest at 0
    } catch (err) {
      if (!isSilent) setError(err.message)
    } finally {
      setLetterLoading(false)
    }
  }

  const editorRef = useRef(null)

  function scrollEditor(direction) {
    if (editorRef.current) {
      const scrollAmount = 300
      editorRef.current.scrollBy({
        top: direction === 'down' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      })
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

    // Check clash during submission
    setSubmitting(true)
    try {
      const clashRes = await fetch('/api/organizer/clash-detection', {
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
      const clashJson = await clashRes.json()
      if (clashRes.ok && clashJson.hasClash) {
        setClashResult(clashJson)
        setError(clashJson.message)
        window.alert(`Event cannot be planned!\n${clashJson.message}`)
        setSubmitting(false)
        return
      }
    } catch (err) {
      console.error(err)
      // If clash detection fails, we proceed with creation but log it
    }
    try {
      const payload = {
        ...form,
        organizer: session?.user?.name || session?.user?.email || 'Unknown',
        organizer_id: session?.user?.registrationId || session?.user?.id || '',
        seats: Number(form.max_participants) || 100,
        max_participants: Number(form.max_participants) || 100,
        registered_count: 0,
        status: 'pending_dean',
      }

      const res = await fetch('/api/student/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Failed to create event')

      const eventId = String(json.id || '').trim()
      if (!eventId) {
        throw new Error('Event was created but no event ID was returned.')
      }

      const speakers = String(form.guest_speakers || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

      await Promise.all([
        fetch('/api/student/event-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_id: eventId,
            speakers,
            schedule: [],
            instructions: form.instructions,
          }),
        }),
        fetch('/api/organizer/event-ai-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_id: eventId,
            organizer_id: payload.organizer_id,
            organizer: payload.organizer,
            generated_description: form.description,
            description_source: descriptionGenerated ? 'ai' : 'manual',
            clash_result: clashResult,
            approval_letter: letterResult?.letter || '',
            approval_stage: 'pending_dean',
            inputs: {
              title: form.title,
              category: form.category,
              department: form.department,
              venue: form.venue,
              start_date: form.start_date,
              end_date: form.end_date,
              start_time: form.start_time,
              end_time: form.end_time,
              max_participants: form.max_participants,
            },
          }),
        }),
        fetch('/api/organizer/event-approvals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_id: eventId,
            dean_status: 'pending',
            registrar_status: 'pending',
            vc_status: 'pending',
            submitted_at: new Date().toISOString().slice(0, 10),
          }),
        }),
        fetch('/api/organizer/event-views', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_id: eventId,
            views: 0,
            registrations: 0,
          }),
        }),
      ])

      setSuccess('Event submitted for approval! Redirecting...')
      setTimeout(() => router.push('/organizer/my-events'), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">New Event</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Create Event</h1>
        <p className="mt-1 text-sm text-slate-500">
          Fill in the details below. Events are submitted for dean approval first.
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
        <EventMetadata form={form} updateField={updateField} />

        <DateTimeSection form={form} updateField={updateField} />

        <EventDetails
          form={form}
          updateField={updateField}
          descriptionGenerated={descriptionGenerated}
          aiDescLoading={aiDescLoading}
          handleGenerateDescription={handleGenerateDescription}
          descHistory={descHistory}
          descIndex={descIndex}
          descSource={descSource}
          posterProgress={posterProgress}
          isDragging={isDragging}
          handleFileDrop={handleFileDrop}
          handleFileSelect={handleFileSelect}
        />

        <AITools
          clashLoading={clashLoading}
          letterLoading={letterLoading}
          clashResult={clashResult}
          letterResult={letterResult}
          letterHistory={letterHistory}
          letterIndex={letterIndex}
          isEditingLetter={isEditingLetter}
          setLetterIndex={setLetterIndex}
          setLetterResult={setLetterResult}
          setIsEditingLetter={setIsEditingLetter}
          handleClashDetection={handleClashDetection}
          handleApprovalLetter={handleApprovalLetter}
        />

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition flex items-center gap-2"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? 'Submitting...' : 'Submit for Approval'}
          </button>
          <button
            type="button"
            onClick={() => setForm(EMPTY_FORM)}
            className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            Reset Form
          </button>
        </div>
      </form>
    </div>
  )
}
