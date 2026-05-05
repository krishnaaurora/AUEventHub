'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Draggable from 'react-draggable'
import { 
  ArrowLeft, Save, Upload, Info, 
  Type, Calendar, Award, Loader2, Sparkles, X,
  Image as ImageIcon, Fingerprint, ChevronUp, ChevronDown, Move, Maximize2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function CertificateEditorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get('eventId')

  const [templateImg, setTemplateImg] = useState('')
  const [signatureImg, setSignatureImg] = useState('')
  const [logoImg, setLogoImg] = useState('')
  const [showGuides, setShowGuides] = useState(true)

  const defaultStyle = {
    fontSize: 30,
    fontFamily: 'serif',
    letterSpacing: 0,
    lineHeight: 1.2,
    fontWeight: '700',
    color: '#000000',
    shadow: false,
    outline: false,
    width: 150,
    height: 60
  }

  const [positions, setPositions] = useState({
    name: { ...defaultStyle, x: 400, y: 300, fontSize: 44, fontFamily: 'serif' },
    event: { ...defaultStyle, x: 400, y: 400, fontSize: 28, fontFamily: 'sans-serif' },
    date: { ...defaultStyle, x: 400, y: 500, fontSize: 20, fontFamily: 'serif' },
    id: { ...defaultStyle, x: 800, y: 50, fontSize: 12, fontFamily: 'monospace', fontWeight: '400' },
    signature: { x: 600, y: 550, width: 150, height: 80 },
    logo: { x: 100, y: 50, width: 100, height: 100 }
  })

  const [library, setLibrary] = useState([])
  const [showLibrary, setShowLibrary] = useState(false)
  const [activeElement, setActiveElement] = useState('name')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [eventTitle, setEventTitle] = useState('Certificate of Participation')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isResizing, setIsResizing] = useState(false)

  const containerRef = useRef(null)
  const elementsScrollRef = useRef(null)

  // Custom Resize Logic
  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e) => {
      if (!activeElement || !['logo', 'signature'].includes(activeElement)) return
      
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const x = (e.clientX - rect.left) / (rect.width / 1000)
      const y = (e.clientY - rect.top) / (rect.height / 707)

      const elementPos = positions[activeElement]
      const newWidth = Math.max(20, x - elementPos.x)
      const newHeight = Math.max(20, y - elementPos.y)

      setPositions(prev => ({
        ...prev,
        [activeElement]: { ...prev[activeElement], width: newWidth, height: newHeight }
      }))
    }

    const handleMouseUp = () => setIsResizing(false)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, activeElement, positions])

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
          if (data.settings) {
            setPositions(prev => ({
              ...prev,
              ...data.settings
            }))
          }
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
    if (template.settings) {
      setPositions(prev => ({
        ...prev,
        ...template.settings
      }))
    }
    setShowLibrary(false)
    setSuccess('Applied library template!')
    setTimeout(() => setSuccess(''), 2000)
  }

  const handleImageUpload = (e, type = 'template') => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result
      if (type === 'template') setTemplateImg(result)
      else if (type === 'signature') setSignatureImg(result)
      else if (type === 'logo') setLogoImg(result)
    }
    reader.readAsDataURL(file)
  }

  const scrollElements = (direction) => {
    if (elementsScrollRef.current) {
      const scrollAmount = direction === 'up' ? -100 : 100
      elementsScrollRef.current.scrollBy({ top: scrollAmount, behavior: 'smooth' })
    }
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

  const updateStyle = (field, key, value) => {
    setPositions(prev => ({
      ...prev,
      [field]: { ...prev[field], [key]: value }
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

          <div className="flex flex-col flex-1 min-h-0">
             <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Dynamic Elements</p>
                <div className="flex gap-1">
                  <button onClick={() => scrollElements('up')} className="p-1 rounded-md hover:bg-slate-100 text-slate-400"><ChevronUp className="h-4 w-4" /></button>
                  <button onClick={() => scrollElements('down')} className="p-1 rounded-md hover:bg-slate-100 text-slate-400"><ChevronDown className="h-4 w-4" /></button>
                </div>
             </div>
             
             <div 
               ref={elementsScrollRef}
               className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1"
             >
                {[
                  { id: 'name', label: 'Student Name', icon: Type, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { id: 'event', label: 'Event Name', icon: Award, color: 'text-violet-600', bg: 'bg-violet-50' },
                  { id: 'date', label: 'Issue Date', icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { id: 'id', label: 'Unique ID', icon: Fingerprint, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { id: 'logo', label: 'University Logo', icon: ImageIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { id: 'signature', label: 'Signature', icon: Sparkles, color: 'text-rose-600', bg: 'bg-rose-50' }
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
                          <p className="text-[10px] text-slate-400 font-mono">Pos: {Math.round(positions[item.id]?.x || 0)}, {Math.round(positions[item.id]?.y || 0)}</p>
                        </div>
                      </div>

                      {activeElement === item.id && (
                        <div className="pt-3 border-t border-slate-100 mt-1 space-y-4">
                          {/* Image specific controls */}
                          {(item.id === 'logo' || item.id === 'signature') ? (
                            <div className="space-y-3">
                              <input 
                                type="file" 
                                accept="image/*" 
                                id={`upload-${item.id}`} 
                                className="hidden" 
                                onChange={(e) => handleImageUpload(e, item.id)} 
                              />
                              <label htmlFor={`upload-${item.id}`} className="w-full py-2 flex items-center justify-center gap-2 border border-dashed border-slate-200 rounded-xl text-[10px] font-bold text-slate-500 hover:bg-slate-50 cursor-pointer">
                                <Upload className="h-3 w-3" /> Upload {item.label}
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <p className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-tighter">Width</p>
                                  <input type="number" value={positions[item.id]?.width || 100} onChange={(e) => updateStyle(item.id, 'width', parseInt(e.target.value))} className="w-full text-xs p-1.5 border border-slate-100 rounded-lg outline-none focus:border-indigo-300" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-tighter">Height</p>
                                  <input type="number" value={positions[item.id]?.height || 60} onChange={(e) => updateStyle(item.id, 'height', parseInt(e.target.value))} className="w-full text-xs p-1.5 border border-slate-100 rounded-lg outline-none focus:border-indigo-300" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Text specific controls */
                            <div className="space-y-4">
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase">Font Family</p>
                                </div>
                                <select 
                                  value={positions[item.id]?.fontFamily || 'serif'} 
                                  onChange={(e) => updateStyle(item.id, 'fontFamily', e.target.value)}
                                  className="w-full text-xs p-2 border border-slate-100 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                >
                                  <option value="'Playfair Display', serif">Playfair Display (Serif)</option>
                                  <option value="'Inter', sans-serif">Inter (Modern)</option>
                                  <option value="'Bookman Old Style', serif">Bookman Old Style</option>
                                  <option value="monospace">Monospace (Code)</option>
                                  <option value="'Dancing Script', cursive">Dancing Script (Cursive)</option>
                                </select>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Letter Spacing</p>
                                  <input type="number" value={positions[item.id]?.letterSpacing || 0} onChange={(e) => updateStyle(item.id, 'letterSpacing', parseFloat(e.target.value))} step="0.1" className="w-full text-xs p-1.5 border border-slate-100 rounded-lg outline-none focus:border-indigo-300" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Line Height</p>
                                  <input type="number" value={positions[item.id]?.lineHeight || 1.2} onChange={(e) => updateStyle(item.id, 'lineHeight', parseFloat(e.target.value))} step="0.1" className="w-full text-xs p-1.5 border border-slate-100 rounded-lg outline-none focus:border-indigo-300" />
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => updateStyle(item.id, 'shadow', !positions[item.id]?.shadow)}
                                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${positions[item.id]?.shadow ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400'}`}
                                >
                                  Shadow
                                </button>
                                <button 
                                  onClick={() => updateStyle(item.id, 'outline', !positions[item.id]?.outline)}
                                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${positions[item.id]?.outline ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400'}`}
                                >
                                  Outline
                                </button>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase">Text Size</p>
                                  <p className="text-[10px] font-black text-indigo-600">{positions[item.id]?.fontSize || 30}px</p>
                                </div>
                                <input 
                                  type="range" 
                                  min="8" 
                                  max="120" 
                                  value={positions[item.id]?.fontSize || 30}
                                  onChange={(e) => updateStyle(item.id, 'fontSize', parseInt(e.target.value))}
                                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                ))}
             </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Layout Tools</p>
              <button 
                onClick={() => setShowGuides(!showGuides)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${showGuides ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
              >
                {showGuides ? 'Guides On' : 'Guides Off'}
              </button>
            </div>
            
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

               {/* Safe Area / Margin Guides */}
               {showGuides && (
                 <div className="absolute inset-0 pointer-events-none border-[40px] border-indigo-500/5 z-0">
                    <div className="absolute inset-0 border border-dashed border-indigo-400/20" />
                    {/* Vertical Margin Lines */}
                    <div className="absolute left-[40px] top-0 bottom-0 border-l border-indigo-500/10" />
                    <div className="absolute right-[40px] top-0 bottom-0 border-r border-indigo-500/10" />
                    {/* Horizontal Margin Lines */}
                    <div className="absolute top-[40px] left-0 right-0 border-t border-indigo-500/10" />
                    <div className="absolute bottom-[40px] left-0 right-0 border-b border-indigo-500/10" />
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[8px] font-black text-indigo-400 uppercase tracking-widest">Printable Safe Area (40px Margin)</div>
                 </div>
               )}

               {/* Grid Overlay */}
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                    style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 0)', backgroundSize: '30px 30px' }} 
               />

               {/* Draggable Text Components */}
               {[
                 { id: 'name', label: 'STUDENT NAME', defaultText: 'Sample Student Name', color: 'text-indigo-700', activeColor: 'border-indigo-500' },
                 { id: 'event', label: 'EVENT TITLE', defaultText: eventTitle, color: 'text-violet-700', activeColor: 'border-violet-500' },
                 { id: 'date', label: 'DATE', defaultText: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }), color: 'text-emerald-700', activeColor: 'border-emerald-500' },
                 { id: 'id', label: 'UNIQUE ID', defaultText: 'CERT-2024-XXXX-XXXX', color: 'text-amber-700', activeColor: 'border-amber-500' }
               ].map(item => (
                 <Draggable key={item.id} bounds="parent" position={positions[item.id] || { x: 0, y: 0 }} onDrag={(e, d) => trackPos(item.id, e, d)}>
                    <div 
                      onClick={() => setActiveElement(item.id)}
                      className={`absolute z-10 p-2 border-2 border-dashed ${activeElement === item.id ? `${item.activeColor} bg-white/40 ring-4 ring-indigo-500/10` : 'border-slate-300/30 hover:border-slate-400'} cursor-move transition-all group`}
                    >
                       <p 
                          className={`font-black ${item.color} pointer-events-none whitespace-nowrap`} 
                          style={{ 
                            fontSize: `${positions[item.id]?.fontSize || 30}px`,
                            fontFamily: positions[item.id]?.fontFamily || 'serif',
                            letterSpacing: `${positions[item.id]?.letterSpacing || 0}em`,
                            lineHeight: positions[item.id]?.lineHeight || 1.2,
                            fontWeight: positions[item.id]?.fontWeight || '700',
                            textShadow: positions[item.id]?.shadow ? '2px 2px 4px rgba(0,0,0,0.2)' : 'none',
                            WebkitTextStroke: positions[item.id]?.outline ? '1px rgba(0,0,0,0.2)' : 'none'
                          }}>
                          { item.defaultText }
                       </p>
                       <div className={`absolute -top-3 left-0 ${item.activeColor.replace('border', 'bg')} text-white text-[8px] font-black px-1.5 py-0.5 rounded-t-md shadow-sm`}>{item.label}</div>
                    </div>
                 </Draggable>
               ))}

               {/* Draggable Images (Logo / Signature) */}
               {['logo', 'signature'].map(id => (
                 <Draggable key={id} bounds="parent" position={positions[id] || { x: 0, y: 0 }} onDrag={(e, d) => trackPos(id, e, d)}>
                    <div 
                      onClick={() => setActiveElement(id)}
                      className={`absolute z-10 p-1 border-2 border-dashed ${activeElement === id ? 'border-blue-500 bg-white/40' : 'border-slate-300/30'} cursor-move transition-all flex items-center justify-center`}
                      style={{ width: positions[id]?.width || 100, height: positions[id]?.height || 60 }}
                    >
                       {(id === 'logo' ? logoImg : signatureImg) ? (
                         <img 
                           src={id === 'logo' ? logoImg : signatureImg} 
                           alt={id} 
                           className="max-w-full max-h-full object-contain pointer-events-none" 
                         />
                       ) : (
                         <div className="flex flex-col items-center gap-1 text-slate-300">
                           <ImageIcon className="h-5 w-5" />
                           <p className="text-[8px] font-black uppercase">{id}</p>
                         </div>
                       )}
                       <div className={`absolute -top-3 left-0 ${id === 'logo' ? 'bg-blue-600' : 'bg-rose-600'} text-white text-[8px] font-black px-1.5 py-0.5 rounded-t-md shadow-sm uppercase`}>{id}</div>
                       
                       {activeElement === id && (
                         <div 
                           onMouseDown={(e) => {
                             e.stopPropagation()
                             setIsResizing(true)
                           }}
                           className="absolute -bottom-2 -right-2 bg-white rounded-full shadow-lg p-1.5 border border-slate-100 cursor-nwse-resize hover:bg-indigo-600 hover:text-white transition-colors z-50"
                         >
                           <Maximize2 className="h-3 w-3" />
                         </div>
                       )}
                    </div>
                 </Draggable>
               ))}

               <style jsx global>{`
                  @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Inter:wght@400;700;900&family=Playfair+Display:wght@700;900&display=swap');
               `}</style>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
