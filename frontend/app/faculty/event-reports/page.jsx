'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

function Bar({ label, value, max }) {
  const width = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200">
        <div className="h-2 rounded-full bg-cyan-600" style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

function EventReportsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/faculty/reports', { cache: 'no-store' })
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
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    )
  }

  const attendanceSeries = data?.attendanceRateByEvent || []
  const departmentSeries = data?.departmentEngagement || []
  const trendSeries = data?.registrationTrends || []

  const maxAttendance = Math.max(1, ...attendanceSeries.map((item) => item.rate || 0))
  const maxDept = Math.max(1, ...departmentSeries.map((item) => item.participants || 0))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Event Reports</h1>
        <p className="mt-1 text-sm text-slate-600">Analyze attendance, registration trends, and department engagement.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Event Attendance Rate</h2>
          <div className="mt-4 space-y-3">
            {attendanceSeries.slice(0, 8).map((item) => (
              <Bar key={item.name} label={item.name} value={item.rate} max={maxAttendance} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Department Engagement</h2>
          <div className="mt-4 space-y-3">
            {departmentSeries.slice(0, 8).map((item) => (
              <Bar
                key={item.department}
                label={item.department}
                value={item.participants}
                max={maxDept}
              />
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Registration Trends</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-2 py-2">Month</th>
                <th className="px-2 py-2">Registrations</th>
                <th className="px-2 py-2">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {trendSeries.map((item) => (
                <tr key={item.month} className="border-t border-slate-100">
                  <td className="px-2 py-2 text-slate-700">{item.month}</td>
                  <td className="px-2 py-2 text-slate-700">{item.registrations}</td>
                  <td className="px-2 py-2 text-slate-700">{item.attendance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">AI Event Insights</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>Technical workshops show highest student engagement.</li>
            <li>Hackathons attract the most registrations.</li>
            <li>Average attendance rate across departments is 78%.</li>
            <li>Cultural events show lower participation from engineering departments.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">AI Event Performance Prediction</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>Upcoming AI Bootcamp expected participation: 200 students.</li>
            <li>Probability of full capacity: 82%.</li>
          </ul>
        </section>
      </div>
    </div>
  )
}

export default EventReportsPage
