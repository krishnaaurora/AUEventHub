'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'

function StudentAttendancePage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    async function loadAttendance() {
      try {
        const res = await fetch('/api/faculty/attendance', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setRows(data.items || [])
        }
      } finally {
        setLoading(false)
      }
    }

    loadAttendance()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) =>
      [row.studentName, row.studentId, row.department, row.eventName]
        .join(' ')
        .toLowerCase()
        .includes(q),
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
          <h1 className="text-2xl font-bold text-slate-900">Attendance Monitoring</h1>
          <p className="mt-1 text-sm text-slate-600">Attendance is automatically captured through QR scanning.</p>
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search students or events"
          className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Student Name</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Student ID</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Department</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Event Name</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Attendance Status</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Check-in Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-800">{row.studentName}</td>
                  <td className="px-4 py-3 text-slate-600">{row.studentId}</td>
                  <td className="px-4 py-3 text-slate-600">{row.department}</td>
                  <td className="px-4 py-3 text-slate-600">{row.eventName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        row.attendanceStatus === 'Present'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {row.attendanceStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.checkInTime ? new Date(row.checkInTime).toLocaleString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default StudentAttendancePage
