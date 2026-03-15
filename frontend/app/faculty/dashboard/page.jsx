'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Users, ClipboardCheck, Building2, Loader2 } from 'lucide-react'

const cards = [
  {
    key: 'totalEventsThisMonth',
    title: 'Total Events This Month',
    icon: CalendarDays,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
  },
  {
    key: 'totalStudentsParticipating',
    title: 'Total Students Participating',
    icon: Users,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    key: 'averageAttendanceRate',
    title: 'Average Attendance Rate',
    icon: ClipboardCheck,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    suffix: '%',
  },
  {
    key: 'mostActiveDepartment',
    title: 'Most Active Department',
    icon: Building2,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
]

function FacultyDashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/faculty/stats', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setStats(data)
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
        <h1 className="text-2xl font-bold text-slate-900">Faculty Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Monitor event participation, attendance, and engagement across departments.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => {
          const Icon = card.icon
          const value = stats?.[card.key] ?? 0
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className={`mb-3 inline-flex rounded-lg p-2 ${card.bg}`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <p className="text-sm text-slate-500">{card.title}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {value}
                {card.suffix || ''}
              </p>
            </motion.div>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">AI Event Insights</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>Technical workshops show highest student engagement.</li>
            <li>Hackathons attract the most registrations.</li>
            <li>Average attendance rate across departments is 78%.</li>
            <li>Cultural events have lower participation from engineering departments.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">AI Prediction</h2>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p>Upcoming AI Bootcamp expected participation: 200 students.</p>
            <p>Probability of full capacity: 82%.</p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default FacultyDashboardPage
