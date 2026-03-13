'use client'

import { useEffect, useState } from 'react'
import { Loader2, Database } from 'lucide-react'

export default function AdminDbMonitorPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/admin/monitor/db', { cache: 'no-store' })
        if (res.ok) {
          const json = await res.json()
          setData(json)
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
        <h1 className="text-2xl font-bold text-slate-900">DB Monitoring</h1>
        <p className="mt-1 text-sm text-slate-600">Live status and record counts for MongoDB and PostgreSQL.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 inline-flex rounded-lg bg-red-50 p-2 text-red-700">
            <Database className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">MongoDB</h2>
          <p className="mt-1 text-sm text-slate-600">Status: {data?.mongo?.status || 'unknown'}</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>Users: {data?.mongo?.users || 0}</li>
            <li>Events: {data?.mongo?.events || 0}</li>
            <li>Event Details: {data?.mongo?.eventDetails || 0}</li>
            <li>Event AI Data: {data?.mongo?.eventAiData || 0}</li>
            <li>Event Approvals: {data?.mongo?.eventApprovals || 0}</li>
            <li>Event Views: {data?.mongo?.eventViews || 0}</li>
            <li>Event Trending: {data?.mongo?.eventTrending || 0}</li>
            <li>AI Recommendations: {data?.mongo?.aiRecommendations || 0}</li>
            <li>Event Feedback: {data?.mongo?.eventFeedback || 0}</li>
            <li>Event Reports: {data?.mongo?.eventReports || 0}</li>
            <li>Notifications: {data?.mongo?.notifications || 0}</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 inline-flex rounded-lg bg-red-50 p-2 text-red-700">
            <Database className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">PostgreSQL</h2>
          <p className="mt-1 text-sm text-slate-600">Status: {data?.postgres?.status || 'unknown'}</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>Registrations: {data?.postgres?.registrations || 0}</li>
            <li>Attendance: {data?.postgres?.attendance || 0}</li>
            <li>Certificates: {data?.postgres?.certificates || 0}</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
