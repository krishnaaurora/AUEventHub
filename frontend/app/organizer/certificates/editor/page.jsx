'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Draggable from 'react-draggable'
import { 
  ArrowLeft, Save, Upload, Info, 
  Type, Calendar, Award, Loader2, Sparkles, X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function CertificateEditorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get('eventId')

  const [templateImg, setTemplateImg] = useState('')
  const [positions, setPositions] = useState({
    name: { x: 400, y: 300, fontSize: 40 },
    event: { x: 400, y: 400, fontSize: 28 },
    date: { x: 400, y: 500, fontSize: 20 }
  })
  const [library, setLibrary] = useState([])
  const [showLibrary, setShowLibrary] = useState(false)
  const [activeElement, setActiveElement] = useState('name')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [eventTitle, setEventTitle] = useState('Certificate of Participation')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const containerRef = useRef(null)

  // Load existing template and library
  useEffect(() => {
    if (!eventId) {
      setError('No event selected. Redirecting...')
      setTimeout(() => router.back(), 2000)
      return
    }

    async function fetchData() {
      setLoading(true)
      try {
        // Load current template
        const res = await fetch(`/api/organizer/certificate-templates?eventId=${eventId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.image_url) setTemplateImg(data.image_url)
          if (data.settings) setPositions(data.settings)
        }

        // Load library
        const libRes = await fetch('/api/organizer/certificate-templates')
        if (libRes.ok) {
          const libData = await libRes.json()
          setLibrary(libData.items || [])
        }

        // Load event title
        const evRes = await fetch(`/api/student/events/${eventId}`)
        const evData = await evRes.json()
        if (evRes.ok && evData.title) setEventTitle(evData.title)

      } catch (err) {
        console.error('Failed to load data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [eventId, router])

  const handleApplyLibraryTemplate = (template) => {
    setTemplateImg(template.image_url)
    if (template.settings) setPositions(template.settings)
    setShowLibrary(false)
    setSuccess('Applied library template!')
    setTimeout(() => setSuccess(''), 2000)
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setTemplateImg(ev.target?.result)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!templateImg) {
      setError('Please upload a template image first')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/organizer/certificate-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          image_url: templateImg,
          template_name: eventTitle + ' Template',
          settings: positions
        })
      })
      if (res.ok) {
        setSuccess('Template saved to PostgreSQL library!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await res.json()
        setError(data.message || 'Failed to save template')
      }
    } catch (err) {
      setError('Network error saving template')
    } finally {
      setSaving(false)
    }
  }

  const trackPos = (field, e, data) => {
    setPositions(prev => ({
      ...prev,
      [field]: { ...prev[field], x: data.x, y: data.y }
    }))
    setActiveElement(field)
  }

  const updateFontSize = (size) => {
    setPositions(prev => ({
      ...prev,
      [activeElement]: { ...prev[activeElement], fontSize: parseInt(size) }
    }))
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-slate-500 font-semibold">Loading Template Editor...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-[100] shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all text-slate-500">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Certificate Template Editor</h1>
            <p className="text-xs text-slate-500">{eventTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AnimatePresence>
            {success && (
              <motion.span initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                {success}
              </motion.span>
            )}
            {error && (
              <motion.span initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100">
                {error}
              </motion.span>
            )}
          </AnimatePresence>
          <button 
            onClick={handleSave}
            disabled={saving || !templateImg}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-white px-6 py-2.5 text-sm transition-all disabled:opacity-50 shadow-md shadow-indigo-100"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save & Publish
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Controls */}
        <aside className="w-80 bg-white border-r border-slate-200 p-6 space-y-8 overflow-y-auto">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Template Basics</p>
            <input 
              type="file" 
              accept="image/*" 
              id="file-upload" 
              className="hidden" 
              onChange={handleImageUpload} 
            />
            <label 
              htmlFor="file-upload" 
              className="w-full flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-100 rounded-3xl p-8 hover:border-indigo-300 hover:bg-indigo-50 group transition-all cursor-pointer"
            >
              <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-white transition-all shadow-sm">
                <Upload className="h-6 w-6 text-slate-400 group-hover:text-indigo-600" />
              </div>
              <p className="text-sm font-semibold text-slate-500 text-center">
                {templateImg ? 'Change Template' : 'Upload PNG/JPG'}
              </p>
            </label>
          </div>

          <div className="space-y-4">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Dynamic Elements</p>
             <p className="text-xs text-slate-500 mb-4 bg-amber-50 p-3 rounded-2xl border border-amber-100 flex gap-2">
                <Info className="h-4 w-4 shrink-0 text-amber-600" />
                Select an element to resize or drag it.
             </p>

             {[
               { id: 'name', label: 'Student Name', icon: Type, color: 'text-indigo-600', bg: 'bg-indigo-50' },
               { id: 'event', label: 'Event Name', icon: Award, color: 'text-violet-600', bg: 'bg-violet-50' },
               { id: 'date', label: 'Issue Date', icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' }
             ].map(item => (
               <div 
                 key={item.id} 
                 onClick={() => setActiveElement(item.id)}
                 className={`rounded-2xl border ${activeElement === item.id ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-500/10' : 'border-slate-100 bg-white'} p-4 flex flex-col gap-3 shadow-sm cursor-pointer transition-all`}
               >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-xl ${item.bg} flex items-center justify-center ${item.color}`}>
                       <item.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                       <p className="text-sm font-bold text-slate-800">{item.label}</p>
                       <p className="text-[10px] text-slate-400 font-mono">X: {Math.round(positions[item.id].x)} Y: {Math.round(positions[item.id].y)}</p>
                    </div>
                  </div>

                  {activeElement === item.id && (
                    <div className="pt-2 border-t border-slate-100 mt-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Text Size</p>
                        <p className="text-[10px] font-black text-indigo-600">{positions[item.id].fontSize}px</p>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max="100" 
                        value={positions[item.id].fontSize}
                        onChange={(e) => updateFontSize(e.target.value)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
               </div>
             ))}
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Saved Templates</p>
            <button 
              onClick={() => setShowLibrary(true)}
              className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-600">
                  <Sparkles className="h-4 w-4" />
                </div>
                <p className="text-sm font-bold text-slate-600">Browse Library</p>
              </div>
              <span className="text-[10px] font-black bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">{library.length}</span>
            </button>
          </div>

          <div className="rounded-2xl bg-indigo-900 text-indigo-100 p-5 space-y-2 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2 opacity-10">
                <Sparkles className="h-10 w-10 text-white" />
             </div>
             <p className="text-xs font-black uppercase tracking-widest text-indigo-300">Pro Tip</p>
             <p className="text-xs leading-relaxed text-indigo-200">
                Persistence enabled: Templates are saved in PostgreSQL. Load designs instantly across any event in the hub.
             </p>
          </div>
        </aside>

        {/* Library Modal */}
        <AnimatePresence>
          {showLibrary && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
               <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 onClick={() => setShowLibrary(false)}
                 className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
               />
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95, y: 20 }}
                 className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
               >
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">Template Library</h2>
                      <p className="text-sm text-slate-500 font-medium">Re-use designs from previous successful events.</p>
                    </div>
                    <button onClick={() => setShowLibrary(false)} className="h-12 w-12 rounded-2xl bg-slate-50 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition-all text-slate-400">
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="p-8 overflow-y-auto grid grid-cols-2 gap-8 custom-scrollbar">
                    {library.length === 0 ? (
                      <div className="col-span-2 py-20 text-center flex flex-col items-center">
                        <Award className="h-20 w-20 text-slate-100 mb-4" />
                        <p className="text-slate-400 font-bold text-lg">Your library is empty</p>
                        <p className="text-slate-400 text-sm max-w-xs mx-auto">Save your current design to start building your university template collection.</p>
                      </div>
                    ) : (
                      library.map(template => (
                        <div 
                          key={template.id} 
                          className="group flex flex-col border border-slate-100 rounded-[2rem] overflow-hidden bg-white hover:shadow-[0_20px_50px_rgba(79,70,229,0.15)] hover:border-indigo-100 transition-all cursor-pointer" 
                          onClick={() => handleApplyLibraryTemplate(template)}
                        >
                          <div className="aspect-[1.41] bg-slate-50 relative overflow-hidden flex items-center justify-center">
                             <img src={template.image_url} alt={template.template_name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-1000" />
                             <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <p className="text-white font-black text-sm uppercase tracking-widest bg-indigo-600 px-8 py-3 rounded-2xl shadow-xl flex items-center gap-2">
                                  <Sparkles className="h-4 w-4" />
                                  Use Layout
                                </p>
                             </div>
                          </div>
                          <div className="p-6 flex items-center justify-between bg-white border-t border-slate-50">
                             <div>
                               <p className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">{template.template_name}</p>
                               <p className="text-xs text-slate-400 font-medium flex items-center gap-2">
                                 <Calendar className="h-3 w-3" />
                                 Created: {new Date(template.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                               </p>
                             </div>
                             <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                               <Award className="h-5 w-5" />
                             </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Editor Area */}
        <main className="flex-1 overflow-auto bg-slate-100 p-20 flex justify-center items-start min-h-0 relative custom-scrollbar">
          {!templateImg ? (
            <div className="w-full max-w-2xl text-center space-y-8 pt-20">
               <div className="relative inline-block">
                  <div className="h-40 w-40 rounded-[3rem] bg-white shadow-2xl flex items-center justify-center mx-auto border border-slate-100 relative z-10">
                     <Award className="h-16 w-16 text-slate-200" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 h-14 w-14 rounded-full bg-indigo-600 flex items-center justify-center border-4 border-slate-100 shadow-xl pulsate z-20">
                     <Upload className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-10 animate-pulse" />
               </div>
               <div>
                  <h2 className="text-3xl font-black text-slate-800">Design Your Certificate</h2>
                  <p className="text-slate-500 mt-4 max-w-md mx-auto text-lg leading-relaxed font-medium">Upload a high-resolution base image or choose from your school's existing template library below.</p>
               </div>

               <div className="flex flex-col items-center gap-6 mt-12 bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-xl">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Library Integration Portfolio</p>
                  <div className="flex items-center gap-4">
                    <label htmlFor="file-upload" className="px-10 py-4 rounded-3xl bg-indigo-600 text-white font-black hover:bg-indigo-700 hover:shadow-2xl hover:shadow-indigo-500/30 transition-all cursor-pointer flex items-center gap-3">
                      <Upload className="h-5 w-5" />
                      Upload New
                    </label>
                    <button onClick={() => setShowLibrary(true)} className="px-10 py-4 rounded-3xl bg-white border-2 border-slate-100 text-slate-600 font-extrabold hover:border-indigo-100 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center gap-3">
                      <Sparkles className="h-4 w-4" />
                      Template Library
                    </button>
                  </div>
               </div>
               
               <style jsx>{`
                  @keyframes pulsate {
                    0% { transform: scale(0.9); opacity: 0.9; }
                    50% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(0.9); opacity: 0.9; }
                  }
                  .pulsate { animation: pulsate 2s infinite ease-in-out; }
                  .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                  .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
               `}</style>
            </div>
          ) : (
            <div 
              ref={containerRef}
              className="relative shadow-[0_30px_70px_rgba(0,0,0,0.15)] border-[8px] border-white rounded-[0.5rem] bg-white select-none overflow-hidden scale-90"
              style={{ width: '1000px', height: '707px' }}
            >
               {/* Background Template */}
               <img src={templateImg} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />

               {/* Grid Overlay */}
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                    style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 0)', backgroundSize: '30px 30px' }} 
               />

               {/* Draggable Components */}
               <Draggable bounds="parent" position={positions.name} onDrag={(e, d) => trackPos('name', e, d)}>
                  <div 
                    onClick={() => setActiveElement('name')}
                    className={`absolute z-10 p-3 border-2 border-dashed ${activeElement === 'name' ? 'border-indigo-500 bg-indigo-50/20 ring-4 ring-indigo-500/10' : 'border-indigo-500/30 bg-indigo-50/5'} cursor-move transition-all group`}
                  >
                     <p className="font-black text-indigo-700 pointer-events-none whitespace-nowrap uppercase tracking-tighter" 
                        style={{ 
                          fontSize: `${positions.name.fontSize || 40}px`,
                          textShadow: '0 2px 4px rgba(0,0,0,0.1)' 
                        }}>
                        { 'Sample Student Name' }
                     </p>
                     <div className="absolute -top-3 left-0 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-t-lg shadow-lg">STUDENT NAME</div>
                  </div>
               </Draggable>

               <Draggable bounds="parent" position={positions.event} onDrag={(e, d) => trackPos('event', e, d)}>
                  <div 
                    onClick={() => setActiveElement('event')}
                    className={`absolute z-10 p-3 border-2 border-dashed ${activeElement === 'event' ? 'border-violet-500 bg-violet-50/20 ring-4 ring-violet-500/10' : 'border-violet-500/30 bg-violet-50/5'} cursor-move transition-all group`}
                  >
                     <p className="font-bold text-violet-700 pointer-events-none whitespace-nowrap uppercase" 
                        style={{ 
                          fontSize: `${positions.event.fontSize || 28}px`,
                          textShadow: '0 2px 4px rgba(0,0,0,0.1)' 
                        }}>
                        {eventTitle}
                     </p>
                     <div className="absolute -top-3 left-0 bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-t-lg shadow-lg">EVENT TITLE</div>
                  </div>
               </Draggable>

               <Draggable bounds="parent" position={positions.date} onDrag={(e, d) => trackPos('date', e, d)}>
                  <div 
                    onClick={() => setActiveElement('date')}
                    className={`absolute z-10 p-4 border-2 border-dashed ${activeElement === 'date' ? 'border-emerald-500 bg-emerald-50/20 ring-4 ring-emerald-500/10' : 'border-emerald-500/30 bg-emerald-50/5'} cursor-move transition-all group`}
                  >
                     <p className="font-bold text-emerald-700 pointer-events-none whitespace-nowrap"
                        style={{ fontSize: `${positions.date.fontSize || 20}px` }}>
                        {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                     </p>
                     <div className="absolute -top-3 left-0 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-t-lg shadow-lg">DATE</div>
                  </div>
               </Draggable>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
