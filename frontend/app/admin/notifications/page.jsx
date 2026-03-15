'use client'

import { useEffect, useState } from 'react'
import { Bell, Loader2, Clock } from 'lucide-react'

export default function AdminNotificationsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/admin/notifications', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setItems(data.items || [])
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
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Notifications</h1>
        <p className="mt-1 text-sm text-slate-600">Lifecycle alerts and system notifications for administrator review.</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No admin notifications available.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-red-100 p-2 text-red-700">
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{item.title || 'Notification'}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.message || 'No message.'}</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="h-3.5 w-3.5" />
                    {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
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
