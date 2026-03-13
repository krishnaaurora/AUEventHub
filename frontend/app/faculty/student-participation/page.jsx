'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'

function StudentParticipationPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/faculty/participation', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setRows(data.items || [])
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) =>
      [row.studentName, row.department, row.studentId].join(' ').toLowerCase().includes(q),
    )
  }, [rows, query])

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Participation</h1>
          <p className="mt-1 text-sm text-slate-600">Review event registrations, attendance, and certificate outcomes.</p>
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search students or departments"
          className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Student Name</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Department</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Events Registered</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Events Attended</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Certificates Earned</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <tr key={row.studentId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-800">{row.studentName}</td>
                  <td className="px-4 py-3 text-slate-600">{row.department}</td>
                  <td className="px-4 py-3 text-slate-700">{row.eventsRegistered}</td>
                  <td className="px-4 py-3 text-slate-700">{row.eventsAttended}</td>
                  <td className="px-4 py-3 text-slate-700">{row.certificatesEarned}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100">
                        View Student Profile
                      </button>
                      <button className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100">
                        View Event History
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">AI Student Analysis</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>Students from the CSE department attend 45% more technical events.</li>
          <li>Workshops have the highest attendance retention rate.</li>
        </ul>
      </section>
    </div>
  )
}

export default StudentParticipationPage
