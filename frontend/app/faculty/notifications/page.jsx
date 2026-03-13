'use client'

import { useEffect, useState } from 'react'
import { Bell, CalendarClock, Loader2 } from 'lucide-react'

function NotificationsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/faculty/notifications', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setItems(data.notifications || [])
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <p className="mt-1 text-sm text-slate-600">New event schedules, attendance updates, and participation alerts.</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No notifications available.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 rounded-lg p-2 ${
                    item.type === 'alert' ? 'bg-rose-100 text-rose-700' : 'bg-cyan-100 text-cyan-700'
                  }`}
                >
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default NotificationsPage
