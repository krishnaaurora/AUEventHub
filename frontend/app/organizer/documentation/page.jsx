'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  FileText, Bot, Database, Sparkles, Mail, FileDown, 
  Brain, Users, Wand2, CheckCircle2, X, Send, 
  Bold, Italic, Underline, AlignLeft, AlignCenter, 
  AlignRight, AlignJustify, List, ListOrdered, 
  Heading1, Heading2, Type, Image as ImageIcon,
  Plus, Save, Layout, Table as TableIcon,
  ChevronRight, ChevronDown, Sparkle, Loader2, Download,
  MessageSquare, History, Languages, Search, Upload, File
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'

export default function DocumentationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get('eventId')

  // Editor State
  const [content, setContent] = useState('')
  const [activeTab, setActiveTab] = useState('editor') // editor, preview, history
  const [docTitle, setDocTitle] = useState('Event Report - ' + new Date().toLocaleDateString())
  
  // Event Data State
  const [eventStats, setEventStats] = useState(null)
  const editorRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (eventId) {
      fetchEventStats()
    }
  }, [eventId])

  const fetchEventStats = async () => {
    try {
      const res = await fetch(`/api/organizer/event-stats?eventId=${eventId}`)
      if (res.ok) {
        const data = await res.json()
        setEventStats(data)
      }
    } catch (err) {
      console.error('Failed to fetch stats', err)
    }
  }

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value)
  }

  const handleBotSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsGenerating(true)

    // AI Logic Simulation
    setTimeout(() => {
      let aiResponse = ""
      const stats = eventStats || { registrations: '245', attendance: '88%', attendedCount: 216, certificates: 180 }
      
      const lowerInput = input.toLowerCase()
      
      if (lowerInput.includes('registration') || lowerInput.includes('numbers')) {
        aiResponse = `I've retrieved the latest data. You have **${stats.registrations}** total registrations. Would you like me to insert a summary paragraph about participant demographics?`
      } else if (lowerInput.includes('attendance') || lowerInput.includes('analyze')) {
        aiResponse = `The attendance rate for this event is **${stats.attendance}** (${stats.attendedCount} students attended). This is a strong turnout! I can generate a comparison chart or a detailed attendance table for your report.`
      } else if (lowerInput.includes('report') || lowerInput.includes('generate')) {
        aiResponse = `Full report generation initiated. Based on the **${stats.registrations}** registrations and **${stats.attendance}** attendance, I recommend including an 'Executive Summary' and a 'Technical Outcome' section. Shall I proceed?`
      } else if (lowerInput.includes('summary')) {
        aiResponse = `Here is a quick summary: **${stats.registrations}** registrations, **${stats.attendance}** attendance, and **${stats.certificates}** certificates issued. I've drafted a concise summary section for you to insert.`
      } else {
        aiResponse = "I am ready to help. I can fetch live metrics, rewrite your paragraphs for better flow, or suggest new sections for your event documentation."
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }])
      setIsGenerating(false)
    }, 1200)
  }

  const insertSection = (type) => {
    let html = ""
    const stats = eventStats || { registrations: '245', attendance: '88%' }
    
    switch(type) {
      case 'Introduction':
        html = `<h2 class="text-xl font-bold mt-8 mb-4 border-b pb-2">1. Introduction</h2><p>This report documents the proceedings and outcomes of the event. With a total of <b>${stats.registrations}</b>, the event demonstrated strong interest from the student body.</p>`
        break
      case 'Detailed Analytics':
        html = `<h2 class="text-xl font-bold mt-8 mb-4 border-b pb-2">2. Detailed Analytics</h2><p>The attendance rate was recorded at <b>${stats.attendance}</b>. Engagement metrics indicate that the peak interaction occurred during the mid-session workshops.</p>`
        break
      case 'Conclusion':
        html = `<h2 class="text-xl font-bold mt-8 mb-4 border-b pb-2">3. Conclusion</h2><p>In conclusion, the event achieved its primary objectives. Future iterations should focus on scaling the registration capacity to meet the high demand observed this year.</p>`
        break
      default:
        html = `<p>New Section: ${type}</p>`
    }
    
    if (editorRef.current) {
      editorRef.current.innerHTML += html
      setContent(editorRef.current.innerHTML)
    }
  }

  const insertDataPoint = (label, value) => {
    const html = `<span class="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-lg border border-indigo-100 mx-1">${label}: ${value}</span>`
    if (editorRef.current) {
      document.execCommand('insertHTML', false, html)
    }
  }

  const applyTemplate = (name) => {
    let html = ""
    const stats = eventStats || { registrations: '245', attendance: '88%' }
    
    if (name === 'Workshop') {
      html = `
        <h1 class="text-3xl font-black mb-8">Workshop Completion Report</h1>
        <p><b>Event:</b> Workshop Series 2024</p>
        <p><b>Total Attendees:</b> ${stats.registrations}</p>
        <h2 class="text-xl font-bold mt-8 mb-4 border-b pb-2">Abstract</h2>
        <p>The workshop focused on technical skill development and hands-on practice.</p>
        <h2 class="text-xl font-bold mt-8 mb-4 border-b pb-2">Outcomes</h2>
        <ul><li>Skill acquisition verified</li><li>Positive student feedback</li></ul>
      `
    } else if (name === 'Hackathon') {
      html = `
        <h1 class="text-3xl font-black mb-8 text-indigo-600 text-center">Hackathon Event Report</h1>
        <div class="p-6 bg-slate-900 text-white rounded-3xl mb-8">
          <p class="text-center font-bold">Innovation Level: High</p>
          <p class="text-center text-sm">Total Teams: ${Math.floor(parseInt(stats.registrations)/4)}</p>
        </div>
        <h2 class="text-xl font-bold mt-8 mb-4 border-b pb-2">Winner Announcement</h2>
        <p>The winners were selected based on technical complexity and social impact.</p>
      `
    } else {
      html = `<h1 class="text-3xl font-black mb-8">${name} Report</h1><p>Start your detailed ${name} documentation here...</p>`
    }
    
    if (editorRef.current) {
      editorRef.current.innerHTML = html
      setContent(html)
    }
  }

  const handleExportPDF = () => {
    window.print()
  }

  const handleExportWord = () => {
    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${docTitle}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; }
          h1 { color: #1e293b; font-size: 24pt; font-weight: bold; }
          h2 { color: #334155; font-size: 18pt; font-weight: bold; border-bottom: 1pt solid #e2e8f0; }
          p { margin-bottom: 10pt; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1pt solid #cbd5e1; padding: 8pt; text-align: left; }
          .stat-badge { background: #eef2ff; color: #4338ca; font-weight: bold; padding: 2pt 5pt; border-radius: 4pt; }
        </style>
      </head>
      <body>`;
    const footer = "</body></html>";
    const content = editorRef.current.innerHTML;
    const sourceHTML = header + content + footer;
    
    const blob = new Blob([sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docTitle}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target.result
      if (editorRef.current) {
        editorRef.current.innerHTML = content
        setContent(content)
      }
    }
    
    if (file.type === 'text/html' || file.name.endsWith('.html')) {
      reader.readAsText(file)
    } else {
      // For plain text, wrap in p tags
      const textReader = new FileReader()
      textReader.onload = (event) => {
        const text = event.target.result
        const html = text.split('\n').map(line => `<p>${line}</p>`).join('')
        if (editorRef.current) {
          editorRef.current.innerHTML = html
          setContent(html)
        }
      }
      textReader.readAsText(file)
    }
  }

  const handleGmailShare = () => {
    const body = editorRef.current.innerText
    const mailto = `mailto:?subject=${encodeURIComponent(docTitle)}&body=${encodeURIComponent(body)}`
    window.location.href = mailto
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col h-screen overflow-hidden">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".html,.txt" 
        onChange={handleFileUpload} 
      />
      {/* Top Header / Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <input 
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="text-lg font-black text-slate-800 bg-transparent border-none focus:ring-0 p-0 leading-tight w-64"
            />
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auto-saved to Cloud</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl mr-4">
            <button 
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'editor' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Editor
            </button>
            <button 
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'preview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Preview
            </button>
          </div>

          {/* Tools & Templates Dropdown */}
          <div className="relative group mr-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-all">
              <Layout className="h-4 w-4 text-indigo-600" />
              Document Tools
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
            
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all z-[100] origin-top-right">
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 px-1">Base Templates</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'Workshop', icon: Layout, color: 'text-blue-600', bg: 'bg-blue-50' },
                      { name: 'Hackathon', icon: Sparkle, color: 'text-amber-600', bg: 'bg-amber-50' },
                      { name: 'Research', icon: Brain, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                      { name: 'Formal', icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' }
                    ].map((tmpl, i) => (
                      <button 
                        key={i}
                        onClick={() => applyTemplate(tmpl.name)}
                        className="flex flex-col items-center gap-2 p-2 rounded-xl border border-slate-50 hover:border-indigo-100 hover:bg-indigo-50 transition-all"
                      >
                        <div className={`h-8 w-8 rounded-lg ${tmpl.bg} ${tmpl.color} flex items-center justify-center`}>
                          <tmpl.icon className="h-4 w-4" />
                        </div>
                        <span className="text-[9px] font-black uppercase text-slate-500">{tmpl.name}</span>
                      </button>
                    ))}
                    
                    {/* Device Template Option */}
                    <button 
                      onClick={() => fileInputRef.current.click()}
                      className="col-span-2 flex items-center justify-center gap-3 p-3 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-400 transition-all group/btn"
                    >
                      <div className="h-8 w-8 rounded-lg bg-white text-indigo-600 flex items-center justify-center shadow-sm group-hover/btn:scale-110 transition-transform">
                        <Upload className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Import Template from Device</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <button onClick={handleGmailShare} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all">
            <Mail className="h-4 w-4" />
            Share
          </button>
          
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
              <Download className="h-4 w-4" />
              Export
              <ChevronDown className="h-3 w-3" />
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all z-[100] origin-top-right">
              <button 
                onClick={handleExportPDF}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all text-left"
              >
                <div className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <FileDown className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">Export as PDF</p>
                  <p className="text-[10px] text-slate-400">Best for sharing</p>
                </div>
              </button>
              <button 
                onClick={handleExportWord}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all text-left"
              >
                <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <File className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">Export as Word</p>
                  <p className="text-[10px] text-slate-400">Best for editing</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Data & Tools */}
        {/* Sidebar removed - Features moved to Document Tools dropdown in header */}

        {/* Editor Canvas */}
        <main className="flex-1 bg-slate-100 overflow-y-auto custom-scrollbar flex flex-col items-center py-8 px-4 print:p-0 print:bg-white relative">
          
          {/* MS Word Ribbon Toolbar (Not Sticky) */}
          <AnimatePresence>
            {activeTab === 'editor' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="relative mb-8 bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] rounded-full px-4 py-2 flex items-center gap-1 z-40 no-print"
              >
            <div className="flex items-center gap-1 px-3 border-r border-slate-100/50">
               <button onClick={() => execCommand('bold')} className="p-2.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-all"><Bold className="h-4 w-4" /></button>
               <button onClick={() => execCommand('italic')} className="p-2.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-all"><Italic className="h-4 w-4" /></button>
               <button onClick={() => execCommand('underline')} className="p-2.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-all"><Underline className="h-4 w-4" /></button>
            </div>
            <div className="flex items-center gap-1 px-3 border-r border-slate-100/50">
               <button onClick={() => execCommand('formatBlock', 'h1')} className="p-2.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-all"><Heading1 className="h-4 w-4" /></button>
               <button onClick={() => execCommand('formatBlock', 'h2')} className="p-2.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-all"><Heading2 className="h-4 w-4" /></button>
               <button onClick={() => execCommand('formatBlock', 'p')} className="p-2.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-all"><Type className="h-4 w-4" /></button>
            </div>
            <div className="flex items-center gap-1 px-3 border-r border-slate-100/50">
               <button onClick={() => execCommand('justifyLeft')} className="p-2.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-all"><AlignLeft className="h-4 w-4" /></button>
               <button onClick={() => execCommand('justifyCenter')} className="p-2.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-all"><AlignCenter className="h-4 w-4" /></button>
               <button onClick={() => execCommand('justifyRight')} className="p-2.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-all"><AlignRight className="h-4 w-4" /></button>
            </div>
            <div className="flex items-center gap-1 px-3 border-r border-slate-100/50">
               <button onClick={() => execCommand('insertUnorderedList')} className="p-2.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-all"><List className="h-4 w-4" /></button>
               <button onClick={() => execCommand('insertOrderedList')} className="p-2.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-all"><ListOrdered className="h-4 w-4" /></button>
            </div>
            <div className="flex items-center gap-1 px-3 border-r border-slate-100/50">
               <button className="p-2.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-all"><TableIcon className="h-4 w-4" /></button>
               <button className="p-2.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-all"><ImageIcon className="h-4 w-4" /></button>
            </div>
            <div className="flex items-center gap-2 pl-3">
               <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-black uppercase tracking-wider hover:bg-emerald-100 transition-all shadow-sm">
                 <Sparkles className="h-3.5 w-3.5" />
                 AI Rewrite
               </button>
            </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* A4 Paper Simulation */}
          <div className="a4-paper w-[210mm] min-h-[297mm] bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] p-[25mm] relative group print:shadow-none print:w-full print:min-h-0 print:p-0">
            {/* Header / Footer Guides (Hidden in print usually, but customizable) */}
            <div className="absolute top-8 left-[25mm] right-[25mm] border-b border-slate-100 pb-2 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity print:opacity-100">
              <p className="text-[10px] font-bold text-slate-400">Aurora Event Hub - Official Documentation</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{docTitle}</p>
            </div>

            {/* Editable Area */}
            <div 
              ref={editorRef}
              contentEditable={activeTab === 'editor'}
              onInput={(e) => setContent(e.currentTarget.innerHTML)}
              className={`outline-none min-h-[200mm] text-slate-800 leading-relaxed text-sm prose prose-slate max-w-none ${activeTab === 'preview' ? 'cursor-default' : ''}`}
              placeholder="Start writing your report here..."
            >
               <h1 className="text-3xl font-black mb-8">Event Completion Report</h1>
               <p className="mb-4">This document serves as the official post-event documentation for the event organized under Aurora University Event Hub.</p>
               
               <h2 className="text-xl font-bold mt-8 mb-4 border-b pb-2">1. Executive Summary</h2>
               <p>The event was successfully conducted with a high turnout and positive feedback from participants. Our data integration shows robust engagement across all sessions.</p>
               
               <div className="my-8 p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Key Metrics Overview</h3>
                 <table className="w-full text-left text-sm">
                   <thead>
                     <tr className="border-b border-slate-200">
                       <th className="py-2 text-slate-400 font-bold uppercase text-[10px]">Parameter</th>
                       <th className="py-2 text-slate-400 font-bold uppercase text-[10px]">Data Point</th>
                       <th className="py-2 text-slate-400 font-bold uppercase text-[10px]">Status</th>
                     </tr>
                   </thead>
                   <tbody>
                     <tr className="border-b border-slate-100">
                       <td className="py-3 font-bold">Total Registrations</td>
                       <td className="py-3 font-black text-indigo-600">245 Students</td>
                       <td className="py-3"><span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">Verified</span></td>
                     </tr>
                     <tr className="border-b border-slate-100">
                       <td className="py-3 font-bold">Attendance rate</td>
                       <td className="py-3 font-black text-indigo-600">88.4%</td>
                       <td className="py-3"><span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">Verified</span></td>
                     </tr>
                   </tbody>
                 </table>
               </div>

               <h2 className="text-xl font-bold mt-8 mb-4 border-b pb-2">2. Feedback & Outcomes</h2>
               <p>[Insert AI Generated Summary Here]</p>
            </div>

            <div className="absolute bottom-8 left-[25mm] right-[25mm] border-t border-slate-100 pt-2 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity print:opacity-100">
              <p className="text-[10px] font-bold text-slate-400">Page 1 of 1</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date().toDateString()}</p>
            </div>
          </div>
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        
        [contenteditable]:empty:before {
          content: attr(placeholder);
          color: #94a3b8;
          cursor: text;
        }

        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            background: white !important;
          }
          nav, header, aside, .floating-toolbar, button, .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            display: block !important;
            overflow: visible !important;
          }
          .a4-paper {
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 20mm !important;
            box-shadow: none !important;
            border: none !important;
            display: block !important;
          }
        }

        /* A4 Page Simulation Styles */
        main {
          scrollbar-gutter: stable;
        }

        /* Heading styles for contentEditable */
        [contenteditable] h1 { font-size: 2.25rem; font-weight: 900; margin-bottom: 2rem; color: #0f172a; }
        [contenteditable] h2 { font-size: 1.5rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.5rem; color: #1e293b; }
        [contenteditable] p { margin-bottom: 1rem; line-height: 1.7; }
        [contenteditable] ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 1rem; }
        [contenteditable] ol { list-style-type: decimal; margin-left: 1.5rem; margin-bottom: 1rem; }
        
        /* Pro Tip Highlight */
        .stat-badge {
          background: #eef2ff;
          color: #4338ca;
          font-weight: 700;
          padding: 0.2rem 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.875em;
        }
      `}</style>
    </div>
  )
}
