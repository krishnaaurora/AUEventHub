'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  Loader2,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react'

function getPriorityColor(priority) {
  switch (priority) {
    case 'high': return 'border-rose-200 bg-rose-50'
    case 'medium': return 'border-amber-200 bg-amber-50'
    case 'low': return 'border-slate-200 bg-slate-50'
    default: return 'border-slate-200 bg-slate-50'
  }
}

function getPriorityIcon(priority) {
  switch (priority) {
    case 'high': return <AlertCircle className="h-4 w-4 text-rose-500" />
    case 'medium': return <Clock className="h-4 w-4 text-amber-500" />
    default: return <CheckCircle2 className="h-4 w-4 text-slate-400" />
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  async function loadNotifications() {
    try {
      const url = '/api/dean/notifications?limit=50'
      const res = await fetch(url, { cache: 'no-store' })
      const json = await res.json()
      setNotifications(Array.isArray(json.items) ? json.items : [])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadNotifications() }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Bell className="h-5 w-5 text-emerald-500" />
          Notifications
        </h1>
        <p className="text-sm text-slate-500 mt-1">Stay updated on event submissions and approvals.</p>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 shadow-sm text-center">
          <MessageSquare className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif, i) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`rounded-xl border p-4 ${getPriorityColor(notif.priority)} transition-colors`}
            >
              <div className="flex items-start gap-3">
                {getPriorityIcon(notif.priority)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">{notif.message}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {notif.created_at ? new Date(notif.created_at).toLocaleString() : '—'}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  notif.priority === 'high' ? 'bg-rose-100 text-rose-600'
                  : notif.priority === 'medium' ? 'bg-amber-100 text-amber-600'
                  : 'bg-slate-100 text-slate-500'
                }`}>
                  {notif.priority}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
