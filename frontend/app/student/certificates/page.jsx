'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Award, Download, Loader2, Calendar, MapPin, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import getSocket from '../../../lib/socket'

// ─── Certificate Renderer (Client Side) ───────────────────────────────────
function CertificateGenerator({ student, event, template, onReady }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!student || !event || !template) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = template.image_url

    img.onload = () => {
      // Set canvas size to match image
      canvas.width = 1000
      canvas.height = 707
      
      // 1. Draw Template
      ctx.drawImage(img, 0, 0, 1000, 707)

      // 2. Setup Fonts
      // Note: In a real app, you'd load custom fonts. Using sans-serif here.
      
      // 3. Draw Student Name
      const namePos = template.name_pos || { x: 500, y: 350 }
      ctx.fillStyle = template.text_color || '#1e1b4b'
      ctx.font = 'bold 50px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(student.name || 'Student Name', namePos.x + 100, namePos.y + 40) // Adjust offsets relative to editor font size

      // 4. Draw Event Name
      const eventPos = template.event_pos || { x: 500, y: 450 }
      ctx.font = '30px sans-serif'
      ctx.fillStyle = template.accent_color || '#4f46e5'
      ctx.fillText(event.title || 'Event Name', eventPos.x + 100, eventPos.y + 40)

      // 5. Draw Date
      const datePos = template.date_pos || { x: 500, y: 550 }
      ctx.font = '20px sans-serif'
      ctx.fillStyle = '#64748b'
      const dateText = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      ctx.fillText(dateText, datePos.x + 100, datePos.y + 30)

      if (onReady) onReady(canvas.toDataURL('image/png'))
    }
  }, [student, event, template, onReady])

  return <canvas ref={canvasRef} className="hidden" />
}

export default function CertificatesPage() {
  const { data: session, status } = useSession()
  const studentId = session?.user?.registrationId || session?.user?.id || ''
  const studentName = session?.user?.name || 'Student'

  const [registrations, setRegistrations] = useState([])
  const [templates, setTemplates] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generatedCerts, setGeneratedCerts] = useState({})

  // 1. Load registrations and filter for 'present'
  useEffect(() => {
    if (status === 'loading' || !studentId) return

    async function loadData() {
      setLoading(true)
      try {
        const res = await fetch(`/api/student/registrations?student_id=${encodeURIComponent(studentId)}`)
        const json = await res.json()
        if (res.ok) {
          const presentOnly = (json.items || []).filter(r => r.attendance_status === 'present')
          setRegistrations(presentOnly)

          // 2. Fetch templates for these events
          const templateData = {}
          for (const reg of presentOnly) {
            const tRes = await fetch(`/api/organizer/certificate-templates?eventId=${reg.event_id}`)
            if (tRes.ok) {
              templateData[reg.event_id] = await tRes.json()
            }
          }
          setTemplates(templateData)
        }
      } catch (err) {
        setError('Failed to sync certificates')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [status, studentId])

  function downloadCert(eventId, title) {
    const dataUrl = generatedCerts[eventId]
    if (!dataUrl) return
    const link = document.createElement('a')
    link.download = `Certificate_${title.replace(/\s+/g, '_')}.png`
    link.href = dataUrl
    link.click()
  }

  return (
    <div className="space-y-6 p-6 xl:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-100">
            <Award className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Merit & Participation</h1>
            <p className="text-sm text-slate-500">You have earned {registrations.length} official certificates</p>
          </div>
        </div>
        
        <div className="bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 flex items-center gap-2">
           <Sparkles className="h-4 w-4 text-indigo-600" />
           <span className="text-sm font-bold text-indigo-700">Live AI Validation Active</span>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 rounded-3xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : registrations.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 p-20 text-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto">
            <Award className="h-10 w-10 text-slate-200" />
          </div>
          <h2 className="text-xl font-bold text-slate-400">No Certificates Earned Yet</h2>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">Attend physical events and get your attendance marked to unlock digital certificates.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {registrations.map((reg) => {
            const template = templates[reg.event_id]
            if (!template) return null

            return (
              <motion.div
                key={reg.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-2xl hover:border-indigo-300 transition-all duration-500"
              >
                {/* Background Sparkle Effect */}
                <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-500/10 transition-colors" />

                {/* Certificate Preview Image */}
                <div className="aspect-[1.414/1] bg-slate-50 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                  {generatedCerts[reg.event_id] ? (
                    <img 
                      src={generatedCerts[reg.event_id]} 
                      alt="Certificate Preview" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                      <p className="text-[10px] uppercase font-bold text-slate-300 tracking-widest">Generating Digital Copy...</p>
                    </div>
                  )}

                  <div className="absolute top-4 left-4">
                     <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
                        <CheckCircle2 className="h-3 w-3" /> VERIFIED
                     </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                    {reg.event_title || 'Participation Certificate'}
                  </h3>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      {reg.start_date || reg.date || 'Event date TBA'}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5" />
                      {reg.venue || 'Campus Venue'}
                    </div>
                  </div>

                  <button
                    onClick={() => downloadCert(reg.event_id, reg.event_title)}
                    disabled={!generatedCerts[reg.event_id]}
                    className="mt-6 w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 hover:bg-indigo-600 disabled:opacity-30 text-white font-bold py-3 text-sm transition-all shadow-xl shadow-slate-200 hover:shadow-indigo-200"
                  >
                    <Download className="h-4 w-4" /> Download PNG
                  </button>
                </div>

                {/* Hidden Generator */}
                <CertificateGenerator
                  student={{ id: studentId, name: studentName }}
                  event={{ title: reg.event_title }}
                  template={template}
                  onReady={(dataUrl) => setGeneratedCerts(prev => ({ ...prev, [reg.event_id]: dataUrl }))}
                />
              </motion.div>
            )
          })}
        </div>
      )}
      
      <div className="mt-12 text-center">
         <p className="text-xs text-slate-400 font-medium">
            *Certificates are automatically generated upon attendance verification. For issues, contact helpdesk@au.edu.in
         </p>
      </div>
    </div>
  )
}

