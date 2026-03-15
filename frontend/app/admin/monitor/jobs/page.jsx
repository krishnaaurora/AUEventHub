'use client'

import { useEffect, useState } from 'react'
import { Loader2, Clock4 } from 'lucide-react'

export default function AdminJobsMonitorPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/admin/monitor/jobs', { cache: 'no-store' })
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
        <h1 className="text-2xl font-bold text-slate-900">Job Monitoring</h1>
        <p className="mt-1 text-sm text-slate-600">Monitor lifecycle cron runs and latest generated event reports.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Configured Cron Schedules</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {(data?.cronSchedules || []).map((item) => (
            <li key={item} className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 mr-2 mb-2">
              <Clock4 className="h-4 w-4" /> {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Lifecycle Runs</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-2 py-2">Time</th>
                <th className="px-2 py-2">Message</th>
                <th className="px-2 py-2">Transitions</th>
                <th className="px-2 py-2">Reports Upserted</th>
              </tr>
            </thead>
            <tbody>
              {(data?.lifecycleRuns || []).map((run) => (
                <tr key={run._id} className="border-b border-slate-100">
                  <td className="px-2 py-2 text-slate-700">{run.created_at ? new Date(run.created_at).toLocaleString() : 'N/A'}</td>
                  <td className="px-2 py-2 text-slate-700">{run.message || run.title || 'N/A'}</td>
                  <td className="px-2 py-2 text-slate-700">{run.meta?.transitioned || 0}</td>
                  <td className="px-2 py-2 text-slate-700">{run.meta?.reportsUpserted || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Latest Event Reports</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-2 py-2">Event ID</th>
                <th className="px-2 py-2">Registrations</th>
                <th className="px-2 py-2">Attendance</th>
                <th className="px-2 py-2">Rate</th>
                <th className="px-2 py-2">Generated At</th>
              </tr>
            </thead>
            <tbody>
              {(data?.latestReports || []).map((item) => (
                <tr key={item._id} className="border-b border-slate-100">
                  <td className="px-2 py-2 text-slate-700">{item.event_id}</td>
                  <td className="px-2 py-2 text-slate-700">{item.total_registrations}</td>
                  <td className="px-2 py-2 text-slate-700">{item.total_attendance}</td>
                  <td className="px-2 py-2 text-slate-700">{item.attendance_rate}%</td>
                  <td className="px-2 py-2 text-slate-700">{item.generated_at || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
