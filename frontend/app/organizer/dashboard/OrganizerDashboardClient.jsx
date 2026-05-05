'use client'

import { useEffect, useState, useMemo, useCallback, memo } from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  TrendingUp,
  PlusSquare,
  BarChart3,
  QrCode,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import getSocket from '@/lib/socket'

const APPROVAL_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
}

function getApprovalProgress(item) {
  if (!item) return 'Dean pending'
  if (item.vc_status === 'approved') return 'VC approved'
  if (item.vc_status === 'rejected') return 'VC rejected'
  if (item.registrar_status === 'approved') return 'Registrar approved'
  if (item.registrar_status === 'rejected') return 'Registrar rejected'
  if (item.dean_status === 'approved') return 'Dean approved'
  if (item.dean_status === 'rejected') return 'Dean rejected'
  return 'Dean pending'
}

const statCards = [
  { key: 'total', label: 'Total EVENT', icon: CalendarDays, color: 'indigo' },
  { key: 'pending', label: 'Pending Approval', icon: Clock, color: 'amber' },
  { key: 'approved', label: 'Approved', icon: CheckCircle2, color: 'emerald' },
  { key: 'rejected', label: 'Rejected', icon: XCircle, color: 'rose' },
  { key: 'registrations', label: 'Total Registrations', icon: Users, color: 'violet' },
  { key: 'trendingScore', label: 'Trending Score', icon: Sparkles, color: 'indigo' },
]

const colorMap = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: 'bg-indigo-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'bg-amber-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'bg-emerald-100' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', icon: 'bg-rose-100' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', icon: 'bg-violet-100' },
}

const quickActions = [
  { label: 'Create EVENT', href: '/organizer/create-event', icon: PlusSquare, desc: 'Launch a new EVENT' },
  { label: 'View Analytics', href: '/organizer/analytics', icon: BarChart3, desc: 'See event insights' },
  { label: 'Scan Attendance', href: '/organizer/attendance', icon: QrCode, desc: 'Mark student attendance' },
]

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
  initialUpcoming, 
  organizerId, 
  organizerName 
}) {
  const [stats, setStats] = useState(initialStats)
  const [upcoming, setUpcoming] = useState(initialUpcoming)

  const reloadData = useCallback(async () => {
    // Rely on server-side refresh or manual reload for now
  }, [])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    socket.on('dashboard:refresh', (payload) => {
      if (payload?.scope === 'organizer') reloadData()
    })

    return () => socket.off('dashboard:refresh')
  }, [reloadData])

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Organizer Portal</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Welcome back{organizerName ? `, ${organizerName.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Here&apos;s your event overview at a glance.</p>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((card) => (
          <StatCard key={card.key} card={card} value={stats[card.key]} />
        ))}
      </div>

      <nav className="grid gap-4 sm:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.href} href={action.href}>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{action.label}</p>
                    <p className="text-xs text-slate-400">{action.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </div>
              </div>
            </Link>
          )
        })}
      </nav>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            Upcoming EVENT
          </h2>
          <Link href="/organizer/my-events" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View All
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-400 py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
            No upcoming events found. Create one!
          </p>
        ) : (
          <div className="space-y-4">
            {upcoming.map((event) => (
              <div
                key={event._id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-5 hover:bg-slate-100/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{event.title}</p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <CalendarDays className="h-3 w-3" /> {event.start_date || event.date} &middot; <Clock className="h-3 w-3" /> {event.start_time || event.time}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-600 uppercase tracking-widest border border-indigo-100">
                      {getApprovalProgress(event.approval)}
                    </span>
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-600 uppercase tracking-widest border border-violet-100">
                      Trending Score: {Number(event.views?.trending_score || 0)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Current Status</p>
                      <p className={`text-xs font-black uppercase tracking-widest ${
                        ['approved', 'published', 'completed'].includes(event.status)
                          ? 'text-emerald-600'
                          : event.status === 'rejected'
                            ? 'text-rose-600'
                            : 'text-amber-600'
                      }`}>
                        {event.status?.replace('_', ' ')}
                      </p>
                   </div>
                   <Link href={`/organizer/edit-event/${event._id}`} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                      <ArrowRight className="h-4 w-4" />
                   </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
