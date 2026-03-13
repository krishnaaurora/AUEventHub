'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  Users,
  Loader2,
  Trash2,
  Info,
} from 'lucide-react'
import getSocket from '../../../lib/socket'

const priorityStyles = {
  high: 'border-rose-200 bg-rose-50',
  medium: 'border-amber-200 bg-amber-50',
  low: 'border-slate-200 bg-slate-50',
}

const priorityDot = {
  high: 'bg-rose-500',
  medium: 'bg-amber-500',
  low: 'bg-slate-400',
}

const iconMap = {
  approved: { icon: CheckCircle2, color: 'text-emerald-500' },
  rejected: { icon: XCircle, color: 'text-rose-500' },
  registration: { icon: Users, color: 'text-indigo-500' },
  reminder: { icon: Clock, color: 'text-amber-500' },
  default: { icon: Info, color: 'text-slate-500' },
}

function getNotificationType(message) {
  const lower = (message || '').toLowerCase()
  if (lower.includes('approved')) return 'approved'
  if (lower.includes('rejected')) return 'rejected'
  if (lower.includes('register')) return 'registration'
  if (lower.includes('reminder') || lower.includes('upcoming')) return 'reminder'
  return 'default'
}

export default function NotificationsPage() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const userId = session?.user?.registrationId || session?.user?.id || ''

  async function loadNotifications() {
    if (!userId) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch(`/api/student/notifications?user_id=${encodeURIComponent(userId)}`, {
        cache: 'no-store',
      })
      const json = await res.json()
      if (res.ok) {
        setNotifications(Array.isArray(json.items) ? json.items : [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [userId])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const handler = () => loadNotifications()
    socket.on('notification:new', handler)
    socket.on('dashboard:refresh', handler)
    return () => {
      socket.off('notification:new', handler)
      socket.off('dashboard:refresh', handler)
    }
  }, [userId])

  async function handleDelete(id) {
    try {
      const res = await fetch('/api/student/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      }
    } catch {
      // ignore
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
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Updates</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Notifications</h1>
        <p className="mt-1 text-sm text-slate-500">
          {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
        </p>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <Bell className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No notifications yet. You&apos;ll be notified about event approvals and registrations.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif, i) => {
            const type = getNotificationType(notif.message)
            const { icon: Icon, color } = iconMap[type]
            const priority = notif.priority || 'medium'
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`rounded-2xl border p-5 shadow-sm ${priorityStyles[priority] || priorityStyles.medium}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm flex-shrink-0 mt-0.5">
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800">{notif.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="h-3 w-3" />
                        {notif.created_at
                          ? new Date(notif.created_at).toLocaleString('en-IN')
                          : '–'}
                      </span>
                      <span className={`h-1.5 w-1.5 rounded-full ${priorityDot[priority]}`} />
                      <span className="text-xs text-slate-400 capitalize">{priority}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(notif.id)}
                    className="rounded-lg p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition flex-shrink-0"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
