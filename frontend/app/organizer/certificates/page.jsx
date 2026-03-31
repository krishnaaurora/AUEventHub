'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Award, Search, CheckSquare, Square, Users, Upload, Eye,
  Send, Loader2, ChevronDown, CheckCircle2, AlertCircle,
  Image as ImageIcon, X, Download, Filter, RefreshCw, Sparkles
} from 'lucide-react'

// ─── Certificate Preview ───────────────────────────────────────────────────
function CertPreview({ template, student, event, onClose }) {
  const bgColor = template?.bg_color || '#1e293b'
  const accentColor = template?.accent_color || '#6366f1'
  const textColor = template?.text_color || '#ffffff'

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 cursor-pointer"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative max-w-3xl w-full cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 backdrop-blur-md hover:bg-white/20 hover:text-white transition-all shadow-lg border border-white/10"
        >
          <X className="h-4 w-4" /> Close Preview
        </button>


        {/* Certificate Canvas */}
        <div
          className="relative w-full rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: bgColor, aspectRatio: '1.414 / 1', padding: '6%' }}
        >
          {/* Inner "X" button for quick close */}
          <button
            onClick={onClose}
            className="absolute right-6 top-6 z-10 rounded-full bg-black/20 p-2 text-white/40 backdrop-blur-md hover:bg-black/40 hover:text-white transition-all"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Background image if provided */}
          {template?.image_url && (
            <img
              src={template.image_url}
              alt="Template"
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
          )}

          {/* Border decoration */}
          <div
            className="absolute inset-4 pointer-events-none"
            style={{ border: `3px solid ${accentColor}50`, borderRadius: '12px' }}
          />

          <div className="relative h-full flex flex-col items-center justify-center gap-3 text-center">
            {/* Logo / badge */}
            <div
              className="h-14 w-14 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: accentColor }}
            >
              <Award className="h-7 w-7 text-white" />
            </div>

            <p
              className="text-xs font-bold uppercase tracking-[0.4em]"
              style={{ color: accentColor }}
            >
              {template?.org_name || 'AUEventHub'} — Certificate of Participation
            </p>

            <h1
              className="text-4xl font-extrabold leading-tight mt-1"
              style={{ color: textColor }}
            >
              {template?.heading || 'CERTIFICATE'}
            </h1>

            <p className="text-sm" style={{ color: `${textColor}99` }}>
              This is to certify that
            </p>

            <p
              className="text-2xl font-bold mt-1 px-6 py-1 rounded-lg"
              style={{ color: textColor, background: `${accentColor}22`, border: `1px solid ${accentColor}44` }}
            >
              {student?.student_id || '{{Student Name}}'}
            </p>

            <p className="text-sm max-w-sm" style={{ color: `${textColor}cc` }}>
              {template?.body_text || 'has successfully participated in and completed'}
            </p>

            <p
              className="text-xl font-bold"
              style={{ color: accentColor }}
            >
              {event?.title || '{{Event Name}}'}
            </p>

            {event?.start_date && (
              <p className="text-xs" style={{ color: `${textColor}77` }}>
                Held on {event.start_date}{event?.venue ? ` at ${event.venue}` : ''}
              </p>
            )}

            <div className="mt-4 flex gap-12">
              <div className="flex flex-col items-center gap-1">
                <div className="h-px w-28" style={{ background: accentColor }} />
                <p className="text-xs" style={{ color: `${textColor}88` }}>
                  {template?.signatory || 'Event Organizer'}
                </p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="h-px w-28" style={{ background: accentColor }} />
                <p className="text-xs" style={{ color: `${textColor}88` }}>Director / Dean</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function CertificatesPage() {
  const { data: session } = useSession()
  const organizerName = session?.user?.name || session?.user?.email || ''

  // State
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [participants, setParticipants] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [attendanceOnly, setAttendanceOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [issuing, setIssuing] = useState(false)
  const [toast, setToast] = useState(null)
  const [previewStudent, setPreviewStudent] = useState(null)

  // Template state
  const [template, setTemplate] = useState({
    image_url: '',
    org_name: 'AUEventHub',
    heading: 'CERTIFICATE',
    body_text: 'has successfully participated in and completed',
    signatory: 'Event Organizer',
    bg_color: '#0f172a',
    accent_color: '#6366f1',
    text_color: '#ffffff',
  })
  const [templateTab, setTemplateTab] = useState(false)
  const fileRef = useRef(null)

  // Load organizer's events
  useEffect(() => {
    if (!organizerName) return
    fetch('/api/student/events?status=published&limit=500', { cache: 'no-store' })
      .then(r => r.json())
      .then(json => {
        const all = Array.isArray(json.items) ? json.items : []
        setEvents(all.filter(e => e.organizer === organizerName || !organizerName))
      })
      .catch(() => {})
  }, [organizerName])

  // Load participants when event selected
  async function loadParticipants(eventId) {
    setLoading(true)
    setParticipants([])
    setSelected(new Set())
    try {
      const res = await fetch(`/api/organizer/certificates?event_id=${encodeURIComponent(eventId)}`, { cache: 'no-store' })
      const json = await res.json()
      if (res.ok) {
        setParticipants(Array.isArray(json.participants) ? json.participants : [])
      }
    } catch { }
    finally { setLoading(false) }
  }

  function selectEvent(event) {
    setSelectedEvent(event)
    loadParticipants(String(event._id))
  }

  // Filter participants
  const filtered = participants.filter(p => {
    if (attendanceOnly && p.attendance_status !== 'present') return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return p.student_id?.toLowerCase().includes(q) || p.ticket_id?.toLowerCase().includes(q)
    }
    return true
  })

  function toggleSelect(studentId) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(studentId)) next.delete(studentId)
      else next.add(studentId)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(filtered.map(p => p.student_id)))
  }

  function deselectAll() {
    setSelected(new Set())
  }

  function selectAttended() {
    setSelected(new Set(filtered.filter(p => p.attendance_status === 'present').map(p => p.student_id)))
  }

  // Handle template image upload (converts to data URL)
  function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setTemplate(prev => ({ ...prev, image_url: ev.target.result }))
    reader.readAsDataURL(file)
  }

  // Issue certificates
  async function issueCertificates() {
    if (selected.size === 0) {
      showToast('Select at least one participant', 'error')
      return
    }
    setIssuing(true)
    try {
      const res = await fetch('/api/organizer/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: String(selectedEvent._id),
          student_ids: [...selected],
          template_url: template.image_url || 'default',
          template_fields: {
            org_name: template.org_name,
            heading: template.heading,
            body_text: template.body_text,
            signatory: template.signatory,
            bg_color: template.bg_color,
            accent_color: template.accent_color,
            text_color: template.text_color,
          },
        }),
      })
      const json = await res.json()
      if (res.ok) {
        showToast(`✅ Certificates issued to ${json.issued?.length} student(s)`, 'success')
        loadParticipants(String(selectedEvent._id))
        setSelected(new Set())
      } else {
        showToast(json.message || 'Failed to issue certificates', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    } finally {
      setIssuing(false)
    }
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  return (
    <div className="space-y-6 p-6 xl:p-8">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-[300] flex items-center gap-2 rounded-2xl shadow-xl px-5 py-3 text-sm font-semibold text-white ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview modal */}
      <AnimatePresence>
        {previewStudent && (
          <CertPreview
            template={template}
            student={previewStudent}
            event={selectedEvent}
            onClose={() => setPreviewStudent(null)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Award className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Certificate Manager</h1>
            <p className="text-sm text-slate-500">Issue and manage participation certificates for your events</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left panel — event selector + template */}
        <div className="space-y-4">
          {/* Event Selector */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Select Event</p>
            {events.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No published events found</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {events.map(ev => (
                  <button
                    key={String(ev._id)}
                    onClick={() => selectEvent(ev)}
                    className={`w-full text-left rounded-xl px-4 py-3 text-sm transition-all border ${
                      String(selectedEvent?._id) === String(ev._id)
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700'
                    }`}
                  >
                    <p className="font-semibold truncate">{ev.title}</p>
                    <p className={`text-[11px] mt-0.5 ${String(selectedEvent?._id) === String(ev._id) ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {ev.start_date || ev.date} · {ev.venue || 'Venue TBA'}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Template Designer */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <button
              onClick={() => setTemplateTab(t => !t)}
              className="w-full flex items-center justify-between px-5 py-4 text-sm font-bold text-slate-800 hover:bg-slate-50"
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-indigo-500" />
                Certificate Template
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${templateTab ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {templateTab && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-5 pt-0 space-y-4 border-t border-slate-100">
                    {/* Background image upload */}
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-2">Background Image</p>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        {template.image_url ? 'Change Image' : 'Upload Template Image'}
                      </button>
                      {template.image_url && (
                        <img src={template.image_url} alt="template" className="mt-2 h-16 w-full object-cover rounded-lg" />
                      )}
                    </div>

                    {/* Color pickers */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Background', key: 'bg_color' },
                        { label: 'Accent', key: 'accent_color' },
                        { label: 'Text', key: 'text_color' },
                      ].map(({ label, key }) => (
                        <div key={key}>
                          <p className="text-[10px] text-slate-500 mb-1">{label}</p>
                          <input
                            type="color"
                            value={template[key]}
                            onChange={e => setTemplate(prev => ({ ...prev, [key]: e.target.value }))}
                            className="h-8 w-full rounded-lg border border-slate-200 cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Text fields */}
                    {[
                      { label: 'Org Name', key: 'org_name', placeholder: 'AUEventHub' },
                      { label: 'Heading', key: 'heading', placeholder: 'CERTIFICATE' },
                      { label: 'Body Text', key: 'body_text', placeholder: 'has participated in...' },
                      { label: 'Signatory', key: 'signatory', placeholder: 'Event Organizer' },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <p className="text-[10px] font-semibold text-slate-500 mb-1">{label}</p>
                        <input
                          value={template[key]}
                          onChange={e => setTemplate(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
                        />
                      </div>
                    ))}

                    {/* Preview button */}
                    {selectedEvent && (
                      <button
                        onClick={() => setPreviewStudent({ student_id: 'Sample Student' })}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                      >
                        <Eye className="h-4 w-4" /> Preview Certificate
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right panel — participants */}
        <div className="xl:col-span-2 space-y-4">
          {!selectedEvent ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
              <Award className="mx-auto h-12 w-12 text-slate-200 mb-3" />
              <p className="text-slate-400 font-medium">Select an event to manage certificates</p>
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by student ID or ticket..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setAttendanceOnly(v => !v)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all border ${attendanceOnly ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200 text-slate-600 hover:border-emerald-300'}`}
                  >
                    <Filter className="h-3.5 w-3.5" />
                    Attended Only
                  </button>
                  <button 
                    onClick={selectAttended} 
                    className="flex items-center gap-1.5 rounded-xl bg-amber-500 text-white px-4 py-2 text-xs font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/10"
                  >
                    <CheckSquare className="h-3.5 w-3.5" />
                    Select All Present
                  </button>
                  <button onClick={selectAll} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                    All
                  </button>
                  <button onClick={deselectAll} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                    None
                  </button>
                  <button
                    onClick={() => loadParticipants(String(selectedEvent._id))}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Stats bar */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Registered', value: participants.length, color: 'bg-indigo-50 text-indigo-700' },
                  { label: 'Attended', value: participants.filter(p => p.attendance_status === 'present').length, color: 'bg-emerald-50 text-emerald-700' },
                  { label: 'Cert Issued', value: participants.filter(p => p.cert_id).length, color: 'bg-amber-50 text-amber-700' },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`rounded-xl ${color} p-4 text-center`}>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs font-medium mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Participant list */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {loading ? (
                  <div className="p-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mx-auto" />
                    <p className="text-sm text-slate-400 mt-2">Loading participants...</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="p-12 text-center">
                    <Users className="mx-auto h-10 w-10 text-slate-200 mb-2" />
                    <p className="text-sm text-slate-400">
                      {participants.length === 0 ? 'No registrations for this event yet.' : 'No participants match your filters.'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {/* Table header */}
                    <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">
                      <div className="col-span-1 flex items-center justify-center">
                        <button 
                          onClick={() => {
                            if (selected.size === filtered.length && filtered.length > 0) deselectAll()
                            else selectAll()
                          }}
                          className="h-5 w-5 rounded border border-slate-300 flex items-center justify-center bg-white hover:border-indigo-500 transition-colors"
                        >
                          {selected.size === filtered.length && filtered.length > 0 ? (
                            <CheckSquare className="h-4 w-4 text-indigo-600" />
                          ) : selected.size > 0 ? (
                            <div className="h-2 w-2 bg-indigo-400 rounded-sm" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-200" />
                          )}
                        </button>
                      </div>
                      <div className="col-span-4">Student Profile</div>
                      <div className="col-span-3">Ticket / Reference</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2 text-right pr-4">Certificate</div>
                    </div>

                    {filtered.map((p, i) => {
                      const isSelected = selected.has(p.student_id)
                      const hasCert = !!p.cert_id
                      const attended = p.attendance_status === 'present'

                      return (
                        <motion.div
                          key={p.id || p.student_id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className={`grid grid-cols-12 gap-2 items-center px-5 py-4 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50/50'}`}
                          onClick={() => toggleSelect(p.student_id)}
                        >
                          {/* Checkbox */}
                          <div className="col-span-1">
                            {isSelected
                              ? <CheckSquare className="h-5 w-5 text-indigo-600" />
                              : <Square className="h-5 w-5 text-slate-300" />}
                          </div>

                          {/* Student ID */}
                          <div className="col-span-4">
                            <p className="text-sm font-semibold text-slate-800 truncate">{p.student_id}</p>
                            <p className="text-[11px] text-slate-400">
                              {p.registered_at ? new Date(p.registered_at).toLocaleDateString('en-IN') : '—'}
                            </p>
                          </div>

                          {/* Ticket */}
                          <div className="col-span-3">
                            <p className="font-mono text-xs text-slate-500 truncate">{p.ticket_id}</p>
                          </div>

                          {/* Attendance */}
                          <div className="col-span-2">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${attended ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              {attended ? '✓ Present' : 'Absent'}
                            </span>
                          </div>

                          {/* Certificate status */}
                          <div className="col-span-2 flex items-center gap-1">
                            {hasCert ? (
                              <div className="flex items-center gap-1.5">
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Issued</span>
                                <a
                                  href={p.certificate_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="text-slate-400 hover:text-indigo-600"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </a>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400">—</span>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Issue button */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-sm text-slate-600">
                  <span className="font-bold text-indigo-700">{selected.size}</span> participant{selected.size !== 1 ? 's' : ''} selected
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => selected.size > 0 && setPreviewStudent({ student_id: [...selected][0] })}
                    disabled={selected.size === 0}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    <Eye className="h-4 w-4" /> Preview
                  </button>
          <div className="flex items-center gap-3">
          {selectedEvent && (
             <Link 
               href={`/organizer/certificates/editor?eventId=${selectedEvent._id}`}
               className="flex items-center gap-2 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 px-5 py-2.5 text-sm font-bold transition-all border border-violet-100"
             >
                <Sparkles className="h-4 w-4" /> Open Visual Designer
             </Link>
          )}
          <button
            onClick={issueCertificates}
            disabled={issuing || selected.size === 0}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 disabled:opacity-50"
          >
            {issuing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
            Bulk Issue ({selected.size})
          </button>
        </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
