'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  Loader2,
  Calendar,
  User,
  MapPin,
} from 'lucide-react'

function RegistrarNotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  async function loadNotifications() {
    try {
      const res = await fetch('/api/registrar/notifications', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(notificationId) {
    try {
      const res = await fetch('/api/registrar/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, action: 'read' }),
      })
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        )
      }
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true
    if (filter === 'unread') return !notification.read
    if (filter === 'read') return notification.read
    return notification.type === filter
  })

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_event':
        return <Calendar className="h-5 w-5 text-blue-500" />
      case 'approval_reminder':
        return <AlertCircle className="h-5 w-5 text-amber-500" />
      case 'status_update':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      case 'system':
        return <Info className="h-5 w-5 text-slate-500" />
      default:
        return <Bell className="h-5 w-5 text-slate-500" />
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'new_event':
        return 'border-blue-200 bg-blue-50'
      case 'approval_reminder':
        return 'border-amber-200 bg-amber-50'
      case 'status_update':
        return 'border-emerald-200 bg-emerald-50'
      case 'system':
        return 'border-slate-200 bg-slate-50'
      default:
        return 'border-slate-200 bg-slate-50'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">Stay updated with event approvals and system alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Notifications</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
            <option value="new_event">New Events</option>
            <option value="approval_reminder">Approval Reminders</option>
            <option value="status_update">Status Updates</option>
            <option value="system">System Alerts</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No notifications found</p>
            <p className="text-slate-400 text-sm">You're all caught up!</p>
          </div>
        ) : (
          filteredNotifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-xl border p-4 shadow-sm transition-all duration-200 hover:shadow-md ${
                getNotificationColor(notification.type)
              } ${!notification.read ? 'ring-2 ring-emerald-200' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-slate-900 mb-1">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-slate-600 mb-2">
                        {notification.message}
                      </p>
                      {notification.eventDetails && (
                        <div className="bg-white/50 rounded-lg p-3 mb-2">
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {notification.eventDetails.organizer}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {notification.eventDetails.venue}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(notification.eventDetails.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        {new Date(notification.created_at).toLocaleString()}
                      </div>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="ml-4 px-3 py-1 text-xs bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors"
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {notifications.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{notifications.length}</p>
            <p className="text-sm text-slate-500">Total</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {notifications.filter(n => n.read).length}
            </p>
            <p className="text-sm text-slate-500">Read</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">
              {notifications.filter(n => !n.read).length}
            </p>
            <p className="text-sm text-slate-500">Unread</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {notifications.filter(n => n.type === 'new_event').length}
            </p>
            <p className="text-sm text-slate-500">New Events</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default RegistrarNotificationsPage