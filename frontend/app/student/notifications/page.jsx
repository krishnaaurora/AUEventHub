'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  Bell, Check, AlertCircle, Calendar, Award, Sparkles, RefreshCw,
} from 'lucide-react'
import getSocket from '../../../lib/socket'

const typeIcon = {
  reminder: Calendar,
  confirmation: Check,
  update: RefreshCw,
  certificate: Award,
  recommendation: Sparkles,
}

const typeColor = {
  reminder: 'bg-indigo-100 text-indigo-600',
  confirmation: 'bg-emerald-100 text-emerald-600',
  update: 'bg-amber-100 text-amber-600',
  certificate: 'bg-cyan-100 text-cyan-600',
  recommendation: 'bg-violet-100 text-violet-600',
}

export default function NotificationsPage() {
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('all')
  const [readIds, setReadIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { data: session, status } = useSession()
  const userId = session?.user?.registrationId || session?.user?.id || ''

  async function loadNotifications(activeUserId) {
    if (!activeUserId) {
      setLoading(false)
      setItems([])
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/student/notifications?user_id=${encodeURIComponent(activeUserId)}`, {
        cache: 'no-store',
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.message || 'Failed to load notifications.')
      }
      setItems(Array.isArray(json.items) ? json.items : [])
    } catch (err) {
      setError(err?.message || 'Failed to load notifications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'loading') {
      return undefined
    }

    loadNotifications(userId)

    if (!userId) {
      return undefined
    }

    const socket = getSocket()
    if (!socket) {
      return undefined
    }

    socket.emit('join:user', userId)

    const handleNotification = (payload) => {
      if (String(payload?.user_id || '') === String(userId)) {
        setItems((prev) => {
          const next = [payload, ...prev.filter((item) => item.id !== payload.id)]
          return next
        })
      }
    }

    const handleBulkSync = (payload) => {
      if (payload?.scope === 'student-transactions') {
        loadNotifications(userId)
      }
    }

    socket.on('notification:new', handleNotification)
    socket.on('bulk-sync:completed', handleBulkSync)

    return () => {
      socket.off('notification:new', handleNotification)
      socket.off('bulk-sync:completed', handleBulkSync)
    }
  }, [status, userId])

  const normalizedItems = useMemo(() => items.map((item) => ({
    ...item,
    title: item.message,
    detail: 'Student transaction update',
    type: item.priority === 'high' ? 'reminder' : item.priority === 'medium' ? 'update' : 'confirmation',
    time: new Date(item.created_at).toLocaleString('en-IN'),
    read: readIds.includes(item.id),
  })), [items, readIds])

  const unread = normalizedItems.filter((n) => !n.read).length
  const filtered = filter === 'all'
    ? normalizedItems
    : filter === 'unread'
      ? normalizedItems.filter((n) => !n.read)
      : normalizedItems.filter((n) => n.read)

  function markAllRead() {
    setReadIds(normalizedItems.map((n) => n.id))
  }

  function toggleRead(id) {
    setReadIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])
  }

  return (
    <div className="space-y-6 p-6 xl:p-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><Bell className="h-5 w-5" /></span>
            <div>
              <h1 className="text-2xl font-bold">Notifications</h1>
              <p className="text-sm text-slate-500">{unread} unread notification{unread !== 1 && 's'}</p>
            </div>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
              Mark all as read
            </button>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          {['all', 'unread', 'read'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-xs font-semibold capitalize transition-all ${
                filter === f ? 'bg-indigo-600 text-white' : 'border border-slate-200 text-slate-600 hover:border-indigo-300'
              }`}
            >{f}</button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Loading notifications...
        </div>
      )}

      <div className="space-y-3">
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Bell className="mx-auto h-10 w-10 mb-3" />
            <p className="text-lg font-semibold">No notifications</p>
          </div>
        )}
        {filtered.map((note, i) => {
          const Icon = typeIcon[note.type] || AlertCircle
          const color = typeColor[note.type] || 'bg-slate-100 text-slate-600'
          return (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => toggleRead(note.id)}
              className={`cursor-pointer rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${
                note.read ? 'border-slate-200 bg-white' : 'border-indigo-200 bg-indigo-50/40'
              }`}
            >
              <div className="flex items-start gap-4">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-semibold ${note.read ? 'text-slate-700' : 'text-slate-900'}`}>{note.title}</p>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        note.priority === 'high' ? 'bg-rose-100 text-rose-600'
                        : note.priority === 'medium' ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-500'
                      }`}>{note.priority}</span>
                      {!note.read && <span className="h-2 w-2 rounded-full bg-indigo-500" />}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">{note.detail}</p>
                  <p className="mt-2 text-[11px] text-slate-400">{note.time}</p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
