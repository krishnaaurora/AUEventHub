'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { motion } from 'framer-motion'
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
  Loader2,
  Sparkles,
} from 'lucide-react'
import getSocket from '../../../lib/socket'

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
  { key: 'total', label: 'Total Events', icon: CalendarDays, color: 'indigo' },
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
  { label: 'Create Event', href: '/organizer/create-event', icon: PlusSquare, desc: 'Launch a new event' },
  { label: 'View Analytics', href: '/organizer/analytics', icon: BarChart3, desc: 'See event insights' },
  { label: 'Scan Attendance', href: '/organizer/attendance', icon: QrCode, desc: 'Mark student attendance' },
]

export default function OrganizerDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, registrations: 0, trendingScore: 0 })
  const [upcoming, setUpcoming] = useState([])
  const [approvalMap, setApprovalMap] = useState({})
  const [viewsMap, setViewsMap] = useState({})
  const [loading, setLoading] = useState(true)

  const organizerId = session?.user?.registrationId || session?.user?.id || ''
  const organizerName = session?.user?.name || session?.user?.email || ''

  async function loadDashboard() {
    try {
      const eventsRes = await fetch('/api/student/events?limit=200', { cache: 'no-store' })
      const eventsJson = await eventsRes.json()
      const allEvents = Array.isArray(eventsJson.items) ? eventsJson.items : []

      const myEvents = organizerId
        ? allEvents.filter((e) => String(e.organizer_id || '') === String(organizerId))
        : organizerName
          ? allEvents.filter((e) => e.organizer === organizerName)
          : allEvents

      const myEventIds = myEvents.map((e) => String(e._id)).filter(Boolean)

      let nextApprovalMap = {}
      let nextViewsMap = {}
      if (myEventIds.length > 0) {
        const [approvalsRes, viewsRes] = await Promise.all([
          fetch(`/api/organizer/event-approvals?event_ids=${encodeURIComponent(myEventIds.join(','))}`, { cache: 'no-store' }),
          fetch(`/api/organizer/event-views?event_ids=${encodeURIComponent(myEventIds.join(','))}`, { cache: 'no-store' }),
        ])

        const approvalsJson = await approvalsRes.json()
        const viewsJson = await viewsRes.json()

        nextApprovalMap = Array.isArray(approvalsJson.items)
          ? approvalsJson.items.reduce((acc, item) => {
              acc[String(item.event_id)] = item
              return acc
            }, {})
          : {}

        nextViewsMap = Array.isArray(viewsJson.items)
          ? viewsJson.items.reduce((acc, item) => {
              acc[String(item.event_id)] = item
              return acc
            }, {})
          : {}
      }

      setApprovalMap(nextApprovalMap)
      setViewsMap(nextViewsMap)

      const total = myEvents.length
      const pending = myEvents.filter((e) =>
        ['pending_dean', 'pending_registrar', 'pending_vc', 'pending'].includes(e.status)
      ).length
      const approved = myEvents.filter((e) => ['approved', 'published'].includes(e.status)).length
      const rejected = myEvents.filter((e) => e.status === 'rejected').length

      const regRes = await fetch('/api/student/registrations', { cache: 'no-store' })
      const regJson = await regRes.json()
      const allRegs = Array.isArray(regJson.items) ? regJson.items : []
      const myEventIdSet = new Set(myEventIds)
      const registrations = allRegs.filter((r) => myEventIdSet.has(String(r.event_id))).length
      const trendingScore = Object.values(nextViewsMap).reduce(
        (sum, item) => sum + Number(item.trending_score || 0),
        0,
      )

      setStats({ total, pending, approved, rejected, registrations, trendingScore })

      const now = new Date().toISOString().slice(0, 10)
      const upcomingEvents = myEvents
        .filter((e) => (e.start_date || e.date || '') >= now)
        .sort((a, b) => (a.start_date || a.date || '').localeCompare(b.start_date || b.date || ''))
        .map((event) => ({
          ...event,
          approval: nextApprovalMap[String(event._id)] || null,
          views: nextViewsMap[String(event._id)] || null,
        }))
        .slice(0, 5)

      setUpcoming(upcomingEvents)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [organizerName])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleRefresh = (payload) => {
      if (payload?.scope === 'organizer') loadDashboard()
    }
    socket.on('dashboard:refresh', handleRefresh)
    socket.on('event:new', loadDashboard)
    return () => {
      socket.off('dashboard:refresh', handleRefresh)
      socket.off('event:new', loadDashboard)
    }
  }, [organizerName])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Organizer Portal</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Welcome back{organizerName ? `, ${organizerName.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Here&apos;s your event overview at a glance.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((card, i) => {
          const c = colorMap[card.color]
          const Icon = card.icon
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-2xl border border-slate-200 ${c.bg} p-5 shadow-sm`}
            >
              <div className={`h-9 w-9 rounded-xl ${c.icon} flex items-center justify-center mb-3`}>
                <Icon className={`h-4 w-4 ${c.text}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats[card.key]}</p>
              <p className="text-xs text-slate-500 mt-1">{card.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
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
      </div>

      {/* Upcoming Events */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            Upcoming Events
          </h2>
          <Link href="/organizer/my-events" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View All
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">No upcoming events found. Create one!</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((event) => (
              <div
                key={event._id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{event.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {event.start_date || event.date} &middot; {event.start_time || event.time} &middot; {event.venue}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span className="rounded-full bg-indigo-50 px-2 py-1 font-medium text-indigo-600">
                      {getApprovalProgress(event.approval)}
                    </span>
                    <span className="rounded-full bg-violet-50 px-2 py-1 font-medium text-violet-600">
                      Trending {Number(event.views?.trending_score || 0)}
                    </span>
                    {event.approval && (
                      <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-600">
                        D {APPROVAL_LABELS[event.approval.dean_status] || event.approval.dean_status} · R {APPROVAL_LABELS[event.approval.registrar_status] || event.approval.registrar_status} · V {APPROVAL_LABELS[event.approval.vc_status] || event.approval.vc_status}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`ml-3 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                    ['approved', 'published', 'completed'].includes(event.status)
                      ? 'bg-emerald-100 text-emerald-700'
                      : event.status === 'rejected'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {event.status?.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
