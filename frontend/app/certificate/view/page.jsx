'use client'

import { useSearchParams } from 'next/navigation'
import { Award, Download, Share2, ArrowLeft, Printer } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'

export default function CertificateViewPage() {
  const searchParams = useSearchParams()
  const certRef = useRef(null)
  const [mounted, setMounted] = useState(false)

  // Extract from URL
  const student = searchParams.get('student_id') || 'Student'
  const event = searchParams.get('event_title') || 'Event Participation'
  const date = searchParams.get('event_date') || ''
  const venue = searchParams.get('event_venue') || ''
  const org = searchParams.get('org_name') || 'AUEventHub'
  const heading = searchParams.get('heading') || 'CERTIFICATE'
  const body = searchParams.get('body_text') || 'has successfully participated in and completed'
  const signatory = searchParams.get('signatory') || 'Event Organizer'
  const templateImg = searchParams.get('template')
  
  // Design tokens
  const bgColor = searchParams.get('bg_color') || '#0f172a'
  const accentColor = searchParams.get('accent_color') || '#6366f1'
  const textColor = searchParams.get('text_color') || '#ffffff'

  useEffect(() => {
    setMounted(true)
  }, [])

  function handlePrint() {
    window.print()
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: `Certificate - ${event}`,
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4 sm:px-6">
      {/* Controls - ignored in print */}
      <div className="max-w-4xl w-full flex items-center justify-between mb-8 print:hidden">
        <button 
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Share2 className="h-4 w-4" /> Share
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-md"
          >
            <Printer className="h-4 w-4" /> Save / Print
          </button>
        </div>
      </div>

      {/* Certificate Frame */}
      <div
        ref={certRef}
        className="certificate-canvas relative w-full max-w-4xl rounded-[2rem] overflow-hidden shadow-2xl print:shadow-none print:m-0 print:w-full"
        style={{ 
          background: bgColor, 
          aspectRatio: '1.414 / 1',
          padding: '6%' 
        }}
      >
        {/* Decorative background image */}
        {templateImg && templateImg !== 'default' && (
          <img 
            src={templateImg} 
            alt="Template" 
            className="absolute inset-0 w-full h-full object-cover opacity-25"
          />
        )}

        {/* Dynamic watermark pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden select-none">
          <div className="absolute top-0 left-0 w-full h-full flex flex-wrap gap-20 p-10 transform -rotate-12 scale-150">
            {Array.from({ length: 40 }).map((_, i) => (
              <span key={i} className="text-4xl font-black text-white whitespace-nowrap uppercase tracking-tighter">
                {org}
              </span>
            ))}
          </div>
        </div>

        {/* Elegant border */}
        <div 
          className="absolute inset-6 pointer-events-none rounded-[1.5rem]" 
          style={{ border: `3px solid ${accentColor}44` }}
        />
        <div 
          className="absolute inset-10 pointer-events-none rounded-[1rem]" 
          style={{ border: `1px solid ${accentColor}22` }}
        />

        {/* Content Layout */}
        <div className="relative h-full flex flex-col items-center justify-center text-center gap-2 sm:gap-4">
          
          {/* Badge Icon */}
          <div 
            className="h-16 w-16 sm:h-24 sm:w-24 rounded-full flex items-center justify-center shadow-2xl mb-2"
            style={{ 
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)`,
                boxShadow: `0 20px 40px -10px ${accentColor}50`
            }}
          >
            <Award className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
          </div>

          {/* Org Name */}
          <p 
            className="text-[10px] sm:text-xs font-black uppercase tracking-[0.5em] mb-1"
            style={{ color: accentColor }}
          >
            {org} — OFFICIAL RECOGNITION
          </p>

          {/* Main Heading */}
          <h1 
            className="text-4xl sm:text-6xl font-black tracking-tighter mb-1"
            style={{ color: textColor }}
          >
            {heading}
          </h1>

          <div className="w-20 h-1 rounded-full mb-4" style={{ background: `${accentColor}44` }} />

          <p className="text-sm sm:text-lg mb-2" style={{ color: `${textColor}aa` }}>
            This is to certify that
          </p>

          <h2 
            className="text-3xl sm:text-5xl font-extrabold px-12 py-3 rounded-2xl mb-2"
            style={{ 
              color: textColor, 
              background: `${accentColor}15`,
              border: `1px solid ${accentColor}30`
            }}
          >
            {student}
          </h2>

          <p className="text-sm sm:text-lg max-w-lg leading-relaxed" style={{ color: `${textColor}cc` }}>
            {body}
          </p>

          <h3 
            className="text-2xl sm:text-3xl font-black mt-2"
            style={{ color: accentColor }}
          >
            {event}
          </h3>

          <div className="flex items-center gap-4 mt-2">
            {date && (
                <p className="text-xs sm:text-sm font-medium" style={{ color: `${textColor}77` }}>
                    Held on <span className="font-bold" style={{ color: textColor }}>{date}</span>
                </p>
            )}
            {venue && (
                <>
                <div className="w-1 h-1 rounded-full bg-slate-600" />
                <p className="text-xs sm:text-sm font-medium" style={{ color: `${textColor}77` }}>
                    At <span className="font-bold" style={{ color: textColor }}>{venue}</span>
                </p>
                </>
            )}
          </div>

          <div className="mt-8 sm:mt-12 flex gap-12 sm:gap-24">
            <div className="flex flex-col items-center">
              <div className="w-32 sm:w-48 h-px mb-2" style={{ background: `${textColor}33` }} />
                <p className="text-xs sm:text-sm font-bold" style={{ color: textColor }}>{signatory}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: `${textColor}44` }}>Authorized Signatory</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-32 sm:w-48 h-px mb-2" style={{ background: `${textColor}33` }} />
                <p className="text-xs sm:text-sm font-bold" style={{ color: textColor }}>University Dean</p>
                <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: `${textColor}44` }}>Academic Affairs</p>
            </div>
          </div>

        </div>

        {/* Global classes for print */}
        <style jsx global>{`
          @media print {
            body { 
              background: white !important; 
              padding: 0 !important; 
              margin: 0 !important; 
            }
            .certificate-canvas {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              height: 100% !important;
              border-radius: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              zoom: 1; /* Adjust if needed */
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}</style>
      </div>

      <div className="mt-8 text-center print:hidden">
        <p className="text-sm text-slate-400">
           This is an electronically generated certificate and does not require a physical signature.
        </p>
        <p className="text-xs text-indigo-400 mt-1 font-bold">
            Verified by AUEventHub Blockchain Ledger
        </p>
      </div>

    </div>
  )
}
