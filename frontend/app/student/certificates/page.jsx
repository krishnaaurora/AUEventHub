'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Award, Download } from 'lucide-react'
import getSocket from '../../../lib/socket'

const colorMap = {
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-700' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700' },
  violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700' },
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { data: session, status } = useSession()
  const studentId = session?.user?.registrationId || session?.user?.id || ''

  useEffect(() => {
    let ignore = false

    async function loadCertificates() {
      if (status === 'loading') {
        return
      }

      if (!studentId) {
        setLoading(false)
        setCertificates([])
        return
      }

      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/student/certificates?student_id=${encodeURIComponent(studentId)}`, {
          cache: 'no-store',
        })
        const json = await res.json()
        if (!res.ok) {
          throw new Error(json?.message || 'Failed to load certificates.')
        }
        if (!ignore) {
          setCertificates(Array.isArray(json.items) ? json.items : [])
        }
      } catch (err) {
        if (!ignore) {
          setError(err?.message || 'Failed to load certificates.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadCertificates()

    return () => {
      ignore = true
    }
  }, [status, studentId])

  useEffect(() => {
    if (!studentId) {
      return undefined
    }

    const socket = getSocket()
    if (!socket) {
      return undefined
    }

    socket.emit('join:user', studentId)

    const handleCertificateUpdated = (payload) => {
      if (String(payload?.student_id || '') === String(studentId)) {
        setCertificates((prev) => [payload, ...prev.filter((item) => item.id !== payload.id)])
      }
    }

    const handleBulkSync = (payload) => {
      if (payload?.scope === 'student-transactions') {
        fetch(`/api/student/certificates?student_id=${encodeURIComponent(studentId)}`, {
          cache: 'no-store',
        })
          .then((res) => res.json())
          .then((json) => {
            setCertificates(Array.isArray(json.items) ? json.items : [])
          })
          .catch(() => {})
      }
    }

    socket.on('certificate:updated', handleCertificateUpdated)
    socket.on('bulk-sync:completed', handleBulkSync)

    return () => {
      socket.off('certificate:updated', handleCertificateUpdated)
      socket.off('bulk-sync:completed', handleBulkSync)
    }
  }, [studentId])

  return (
    <div className="space-y-6 p-6 xl:p-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Award className="h-5 w-5" /></span>
          <div>
            <h1 className="text-2xl font-bold">Certificates</h1>
            <p className="text-sm text-slate-500">{certificates.length} certificates earned</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Loading certificates...
        </div>
      )}

      {!loading && certificates.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Award className="mx-auto h-12 w-12 mb-3" />
          <p className="text-lg font-semibold">No certificates yet</p>
          <p className="text-sm">Complete events to earn certificates.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {certificates.map((cert, i) => {
            const colors = colorMap[cert.color] || colorMap.indigo
            return (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`rounded-2xl border ${colors.border} ${colors.bg} p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}
              >
                <div className="flex items-start justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.bg} ${colors.text}`}>
                    <Award className="h-5 w-5" />
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${colors.badge}`}>
                    {cert.type.includes('Achievement') ? 'Achievement' : cert.type.includes('Completion') ? 'Completion' : cert.type.includes('Recognition') ? 'Recognition' : 'Participation'}
                  </span>
                </div>
                <div className="mt-4 space-y-1">
                  <h3 className="text-base font-semibold text-slate-900">{cert.event_title}</h3>
                  <p className="text-xs text-slate-500">Participation Certificate</p>
                  <p className="text-xs text-slate-500">Event Date: {cert.date || 'Date TBA'}</p>
                  <p className="text-xs text-slate-500">Issued: {new Date(cert.issued_at).toLocaleDateString('en-IN')}</p>
                  <p className="text-xs text-slate-500">By: {cert.organizer}</p>
                </div>
                <a href={cert.certificate_url} target="_blank" rel="noreferrer" className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold transition-colors ${colors.border} ${colors.text} hover:bg-white`}>
                  <Download className="h-3.5 w-3.5" /> Download Certificate
                </a>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
