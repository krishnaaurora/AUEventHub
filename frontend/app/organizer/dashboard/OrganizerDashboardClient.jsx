'use client'

import { useState, memo } from 'react'
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Sparkles,
} from 'lucide-react'
import MyEventsTable from '../components/MyEventsTable'

const statCards = [
  { key: 'total', label: 'Total EVENT', icon: CalendarDays, color: 'indigo' },
  { key: 'pending', label: 'Pending Approval', icon: Clock, color: 'amber' },
  { key: 'approved', label: 'Approved', icon: CheckCircle2, color: 'emerald' },
  { key: 'rejected', label: 'Rejected', icon: XCircle, color: 'rose' },
]

const colorMap = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: 'bg-indigo-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'bg-amber-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'bg-emerald-100' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', icon: 'bg-rose-100' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', icon: 'bg-violet-100' },
}

const StatCard = memo(function StatCard({ card, value }) {
  const c = colorMap[card.color]
  const Icon = card.icon
  return (
    <div
      className={`rounded-2xl border border-slate-200 ${c.bg} p-5 shadow-sm hover:shadow-md transition-all`}
    >
      <div className={`h-9 w-9 rounded-xl ${c.icon} flex items-center justify-center mb-3`}>
        <Icon className={`h-4 w-4 ${c.text}`} />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{card.label}</p>
    </div>
  )
})

export default function OrganizerDashboardClient({ 
  initialStats, 
  organizerId, 
  organizerName 
}) {
  const [stats, setStats] = useState(initialStats)

  return (
    <div className="space-y-6">


      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.key} card={card} value={stats[card.key]} />
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <MyEventsTable 
          organizerId={organizerId} 
          organizerName={organizerName} 
          onStatsUpdate={setStats}
        />
      </div>
    </div>
  )
}
