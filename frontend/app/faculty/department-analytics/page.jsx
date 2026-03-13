'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

function DepartmentAnalyticsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/faculty/department-analytics', { cache: 'no-store' })
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
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    )
  }

  const maxParticipants = Math.max(1, ...items.map((item) => item.participants || 0))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Department Analytics</h1>
        <p className="mt-1 text-sm text-slate-600">Compare event activity and participation performance by department.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Participation Per Department</h2>
        <div className="mt-4 space-y-3">
          {items.map((item) => {
            const width = Math.round(((item.participants || 0) / maxParticipants) * 100)
            return (
              <div key={item.department} className="space-y-1">
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span>{item.department}</span>
                  <span>{item.participants} participants</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${width}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {items.slice(0, 3).map((item) => (
          <div key={item.department} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="font-semibold text-slate-900">{item.department}</h3>
            <p className="mt-2 text-sm text-slate-600">Events: {item.events}</p>
            <p className="text-sm text-slate-600">Participants: {item.participants}</p>
            <p className="text-sm text-slate-600">Attendance: {item.attendance}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Example Snapshot</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>CSE Department -&gt; 320 participants</li>
          <li>IT Department -&gt; 240 participants</li>
          <li>ECE Department -&gt; 180 participants</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">AI Department Engagement Analysis</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>CSE and IT lead in technical event participation.</li>
          <li>Interdisciplinary events produce stronger attendance distribution.</li>
          <li>Departments with mentorship cells show better attendance consistency.</li>
        </ul>
      </section>
    </div>
  )
}

export default DepartmentAnalyticsPage
