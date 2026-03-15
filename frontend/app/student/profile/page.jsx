'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { User, Mail, Hash, BookOpen, GraduationCap, Building2 } from 'lucide-react'
import getSocket from '../../../lib/socket'

function getInitials(name) {
  return String(name || 'Student')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'ST'
}

export default function ProfilePage() {
  const [registrations, setRegistrations] = useState([])
  const [certificates, setCertificates] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { data: session, status } = useSession()
  const studentId = session?.user?.registrationId || session?.user?.id || ''
  const profile = {
    name: session?.user?.name || 'Student User',
    email: session?.user?.email || 'No email available',
    regId: session?.user?.registrationId || session?.user?.id || 'Not assigned',
    dept: session?.user?.department || 'Department not set',
    year: session?.user?.year || 'Year not set',
    avatar: session?.user?.avatar || '',
  }

  const fields = [
    { icon: User, label: 'Full Name', value: profile.name },
    { icon: Mail, label: 'Email', value: profile.email },
    { icon: Hash, label: 'Registration ID', value: profile.regId },
    { icon: Building2, label: 'Department', value: profile.dept },
    { icon: GraduationCap, label: 'Year', value: profile.year },
  ]

  useEffect(() => {
    let ignore = false

    async function loadProfileData() {
      if (status === 'loading') {
        return
      }

      if (!studentId) {
        setLoading(false)
        setRegistrations([])
        setCertificates([])
        setNotifications([])
        return
      }

      setLoading(true)
      setError('')
      try {
        const [registrationsRes, certificatesRes, notificationsRes] = await Promise.all([
          fetch(`/api/student/registrations?student_id=${encodeURIComponent(studentId)}`, { cache: 'no-store' }),
          fetch(`/api/student/certificates?student_id=${encodeURIComponent(studentId)}`, { cache: 'no-store' }),
          fetch(`/api/student/notifications?user_id=${encodeURIComponent(studentId)}`, { cache: 'no-store' }),
        ])

        const [registrationsJson, certificatesJson, notificationsJson] = await Promise.all([
          registrationsRes.json(),
          certificatesRes.json(),
          notificationsRes.json(),
        ])

        if (!registrationsRes.ok || !certificatesRes.ok || !notificationsRes.ok) {
          throw new Error('Failed to load profile activity.')
        }

        if (!ignore) {
          setRegistrations(Array.isArray(registrationsJson.items) ? registrationsJson.items : [])
          setCertificates(Array.isArray(certificatesJson.items) ? certificatesJson.items : [])
          setNotifications(Array.isArray(notificationsJson.items) ? notificationsJson.items : [])
        }
      } catch (err) {
        if (!ignore) {
          setError(err?.message || 'Failed to load profile activity.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadProfileData()

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

    const handleNotification = (payload) => {
      if (String(payload?.user_id || '') === String(studentId)) {
        setNotifications((prev) => [payload, ...prev.filter((item) => item.id !== payload.id)])
      }
    }

    const handleCertificateUpdated = (payload) => {
      if (String(payload?.student_id || '') === String(studentId)) {
        setCertificates((prev) => [payload, ...prev.filter((item) => item.id !== payload.id)])
      }
    }

    const handleBulkSync = () => {
      Promise.all([
        fetch(`/api/student/registrations?student_id=${encodeURIComponent(studentId)}`, { cache: 'no-store' }).then((res) => res.json()),
        fetch(`/api/student/certificates?student_id=${encodeURIComponent(studentId)}`, { cache: 'no-store' }).then((res) => res.json()),
        fetch(`/api/student/notifications?user_id=${encodeURIComponent(studentId)}`, { cache: 'no-store' }).then((res) => res.json()),
      ]).then(([registrationsJson, certificatesJson, notificationsJson]) => {
        setRegistrations(Array.isArray(registrationsJson.items) ? registrationsJson.items : [])
        setCertificates(Array.isArray(certificatesJson.items) ? certificatesJson.items : [])
        setNotifications(Array.isArray(notificationsJson.items) ? notificationsJson.items : [])
      }).catch(() => {})
    }

    socket.on('notification:new', handleNotification)
    socket.on('certificate:updated', handleCertificateUpdated)
    socket.on('bulk-sync:completed', handleBulkSync)

    return () => {
      socket.off('notification:new', handleNotification)
      socket.off('certificate:updated', handleCertificateUpdated)
      socket.off('bulk-sync:completed', handleBulkSync)
    }
  }, [studentId])

  const stats = useMemo(() => ([
    { label: 'Registered Events', value: registrations.length, bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-100' },
    { label: 'Certificates Earned', value: certificates.length, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
    { label: 'Notifications', value: notifications.length, bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },
    { label: 'Department', value: profile.dept.split(' ')[0], bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
  ]), [registrations.length, certificates.length, notifications.length])

  return (
    <div className="space-y-6 p-6 xl:p-8">
      {/* Profile Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-6 md:flex-row">
          <div className="relative">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name}
                className="h-24 w-24 rounded-2xl object-cover ring-4 ring-indigo-100 shadow-lg"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-indigo-100 text-2xl font-bold text-indigo-700 ring-4 ring-indigo-100 shadow-lg">
                {getInitials(profile.name)}
              </div>
            )}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <p className="text-sm text-slate-500">{profile.dept}</p>
            <p className="text-xs text-slate-400">{profile.regId} · {profile.year}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-2xl border ${s.border} ${s.bg} p-5 shadow-sm`}>
            <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Loading profile activity...
        </div>
      )}

      {/* Personal Info */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 border border-slate-200"><Icon className="h-4 w-4" /></span>
              <div>
                <p className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-slate-800">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Summary */}
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Recent Registrations</h2>
          <div className="space-y-3">
            {!loading && registrations.length === 0 && (
              <p className="text-sm text-slate-500">No registrations found.</p>
            )}
            {registrations.slice(0, 3).map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div>
                  <p className="text-sm font-semibold">{e.event_title}</p>
                  <p className="text-xs text-slate-500">{e.date || 'Date TBA'}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  e.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>{e.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Recent Certificates</h2>
          <div className="space-y-3">
            {!loading && certificates.length === 0 && (
              <p className="text-sm text-slate-500">No certificates found.</p>
            )}
            {certificates.slice(0, 3).map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div>
                  <p className="text-sm font-semibold">{c.event_title}</p>
                  <p className="text-xs text-slate-500">Participation Certificate</p>
                </div>
                <p className="text-xs text-slate-400">{new Date(c.issued_at).toLocaleDateString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
