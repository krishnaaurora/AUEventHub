'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Users,
  TrendingUp,
  CalendarDays,
  CheckCircle2,
  Loader2,
  PieChart,
  Activity,
  Sparkles,
  GitBranch,
} from 'lucide-react'

function approvalStageLabel(item) {
  if (!item) return 'Dean pending'
  if (item.vc_status === 'approved') return 'Approved'
  if (item.vc_status === 'rejected') return 'VC rejected'
  if (item.registrar_status === 'approved') return 'VC pending'
  if (item.registrar_status === 'rejected') return 'Registrar rejected'
  if (item.dean_status === 'approved') return 'Registrar pending'
  if (item.dean_status === 'rejected') return 'Dean rejected'
  return 'Dean pending'
}

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const [events, setEvents] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [attendance, setAttendance] = useState([])
  const [aiItems, setAiItems] = useState([])
  const [feedbackItems, setFeedbackItems] = useState([])
  const [approvalItems, setApprovalItems] = useState([])
  const [viewItems, setViewItems] = useState([])
  const [loading, setLoading] = useState(true)

  const organizerId = session?.user?.registrationId || session?.user?.id || ''
  const organizerName = session?.user?.name || session?.user?.email || ''

  async function loadData() {
    try {
      const [eventsRes, regsRes, attRes] = await Promise.all([
        fetch('/api/student/events?limit=500', { cache: 'no-store' }),
        fetch('/api/student/registrations', { cache: 'no-store' }),
        fetch('/api/student/attendance', { cache: 'no-store' }),
      ])
      const eventsJson = await eventsRes.json()
      const regsJson = await regsRes.json()
      const attJson = await attRes.json()

      const allEvents = Array.isArray(eventsJson.items) ? eventsJson.items : []
      const myEvents = organizerId
        ? allEvents.filter((e) => String(e.organizer_id || '') === String(organizerId))
        : organizerName
          ? allEvents.filter((e) => e.organizer === organizerName)
          : allEvents
      setEvents(myEvents)

      const myEventIds = new Set(myEvents.map((e) => String(e._id)))
      setRegistrations(
        (Array.isArray(regsJson.items) ? regsJson.items : []).filter((r) =>
          myEventIds.has(String(r.event_id))
        )
      )
      setAttendance(
        (Array.isArray(attJson.items) ? attJson.items : []).filter((a) =>
          myEventIds.has(String(a.event_id))
        )
      )

      const eventIds = myEvents.map((item) => String(item._id)).filter(Boolean)
      if (eventIds.length > 0) {
        const [aiRes, feedbackRes, approvalsRes, viewsRes] = await Promise.all([
          fetch(`/api/organizer/event-ai-data?event_ids=${encodeURIComponent(eventIds.join(','))}`, { cache: 'no-store' }),
          fetch(`/api/organizer/event-feedback?event_ids=${encodeURIComponent(eventIds.join(','))}`, { cache: 'no-store' }),
          fetch(`/api/organizer/event-approvals?event_ids=${encodeURIComponent(eventIds.join(','))}`, { cache: 'no-store' }),
          fetch(`/api/organizer/event-views?event_ids=${encodeURIComponent(eventIds.join(','))}`, { cache: 'no-store' }),
        ])
        const aiJson = await aiRes.json()
        const feedbackJson = await feedbackRes.json()
        const approvalsJson = await approvalsRes.json()
        const viewsJson = await viewsRes.json()
        setAiItems(Array.isArray(aiJson.items) ? aiJson.items : [])
        setFeedbackItems(Array.isArray(feedbackJson.items) ? feedbackJson.items : [])
        setApprovalItems(Array.isArray(approvalsJson.items) ? approvalsJson.items : [])
        setViewItems(Array.isArray(viewsJson.items) ? viewsJson.items : [])
      } else {
        setAiItems([])
        setFeedbackItems([])
        setApprovalItems([])
        setViewItems([])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [organizerName])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  // Compute stats
  const totalEvents = events.length
  const approvedEvents = events.filter((e) => e.status === 'approved').length
  const totalRegs = registrations.length
  const totalPresent = attendance.filter((a) => a.status === 'present').length
  const attendanceRate = totalRegs > 0 ? Math.round((totalPresent / totalRegs) * 100) : 0
  const aiCoverage = totalEvents > 0 ? Math.round((aiItems.length / totalEvents) * 100) : 0
  const totalTrendingScore = viewItems.reduce((sum, item) => sum + Number(item.trending_score || 0), 0)
  const ratedFeedback = feedbackItems.filter((item) => Number.isFinite(Number(item.rating)) && Number(item.rating) > 0)
  const avgFeedbackRating = ratedFeedback.length > 0
    ? (ratedFeedback.reduce((sum, item) => sum + Number(item.rating), 0) / ratedFeedback.length).toFixed(1)
    : null
  const approvalMap = approvalItems.reduce((acc, item) => {
    acc[String(item.event_id)] = item
    return acc
  }, {})
  const viewMap = viewItems.reduce((acc, item) => {
    acc[String(item.event_id)] = item
    return acc
  }, {})

  // Category breakdown
  const categoryMap = {}
  events.forEach((e) => {
    const cat = e.category || 'Other'
    categoryMap[cat] = (categoryMap[cat] || 0) + 1
  })
  const categoryData = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])

  // Registration per event (top 5)
  const regsByEvent = {}
  registrations.forEach((r) => {
    regsByEvent[r.event_id] = (regsByEvent[r.event_id] || 0) + 1
  })
  const topEvents = events
    .map((e) => ({ ...e, regCount: regsByEvent[String(e._id)] || 0 }))
    .sort((a, b) => b.regCount - a.regCount)
    .slice(0, 5)

  // Monthly trend (registrations by month)
  const monthMap = {}
  registrations.forEach((r) => {
    if (r.registered_at) {
      const d = new Date(r.registered_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthMap[key] = (monthMap[key] || 0) + 1
    }
  })
  const monthData = Object.entries(monthMap).sort((a, b) => a[0].localeCompare(b[0]))

  const catColors = [
    'bg-indigo-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500',
    'bg-rose-500', 'bg-cyan-500', 'bg-orange-500', 'bg-pink-500',
  ]

  const summaryCards = [
    { label: 'Total Events', value: totalEvents, icon: CalendarDays, color: 'indigo' },
    { label: 'Approved', value: approvedEvents, icon: CheckCircle2, color: 'emerald' },
    { label: 'Registrations', value: totalRegs, icon: Users, color: 'violet' },
    { label: 'Attendance Rate', value: `${attendanceRate}%`, icon: Activity, color: 'amber' },
    { label: 'AI Coverage', value: `${aiCoverage}%`, icon: TrendingUp, color: 'indigo' },
    { label: 'Avg Feedback', value: avgFeedbackRating ? `${avgFeedbackRating}/5` : 'N/A', icon: Users, color: 'emerald' },
    { label: 'Trending Score', value: totalTrendingScore, icon: Sparkles, color: 'violet' },
  ]

  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Insights</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Overview of your event performance and engagement.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-7">
        {summaryCards.map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className={`h-9 w-9 rounded-xl ${colorMap[card.color].split(' ')[0]} flex items-center justify-center mb-3`}>
                <Icon className={`h-4 w-4 ${colorMap[card.color].split(' ')[1]}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{card.value}</p>
              <p className="text-xs text-slate-500 mt-1">{card.label}</p>
            </motion.div>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <PieChart className="h-5 w-5 text-indigo-500" />
            Events by Category
          </h2>
          {categoryData.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {categoryData.map(([cat, count], i) => {
                const pct = totalEvents > 0 ? Math.round((count / totalEvents) * 100) : 0
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-700 font-medium">{cat}</span>
                      <span className="text-slate-400">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        className={`h-full rounded-full ${catColors[i % catColors.length]}`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top Events */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            Top Events by Registrations
          </h2>
          {topEvents.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {topEvents.map((ev, i) => {
                const maxReg = topEvents[0]?.regCount || 1
                const pct = Math.round((ev.regCount / maxReg) * 100)
                return (
                  <div key={ev._id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-700 font-medium truncate mr-2">{ev.title}</span>
                      <span className="text-slate-400 whitespace-nowrap">{ev.regCount} regs</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        className="h-full rounded-full bg-violet-500"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            AI Readiness by Event
          </h2>
          {events.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No event data yet.</p>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 5).map((event) => {
                const aiItem = aiItems.find((item) => String(item.event_id) === String(event._id))
                const readiness = aiItem
                  ? [
                      Boolean(aiItem.generated_description),
                      Boolean(aiItem.clash_result),
                      Boolean(aiItem.approval_letter),
                    ].filter(Boolean).length
                  : 0
                const pct = Math.round((readiness / 3) * 100)
                return (
                  <div key={event._id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-700 font-medium truncate mr-2">{event.title}</span>
                      <span className="text-slate-400 whitespace-nowrap">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.4 }}
                        className="h-full rounded-full bg-indigo-500"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-indigo-500" />
            Recent Feedback Activity
          </h2>
          {feedbackItems.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No feedback recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {feedbackItems.slice(0, 5).map((item, index) => (
                <motion.div
                  key={`${item.event_id}-${item.createdAt || item.created_at || index}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-700">{item.feedback_type || 'feedback'}</p>
                    <span className="text-xs text-slate-400">{item.rating ? `${item.rating}/5` : 'No rating'}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{item.comment}</p>
                  <p className="mt-2 text-[11px] text-slate-400">Event ID: {item.event_id}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <GitBranch className="h-5 w-5 text-indigo-500" />
            Approval Chain by Event
          </h2>
          {events.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No approval data yet.</p>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 6).map((event) => {
                const approval = approvalMap[String(event._id)]
                return (
                  <div key={event._id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-700 truncate">{event.title}</p>
                      <span className="text-xs text-indigo-600 font-medium">{approvalStageLabel(approval)}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                      <span className="rounded-full bg-white px-2.5 py-1 text-center text-slate-600 border border-slate-200">
                        Dean: {approval?.dean_status || 'pending'}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-center text-slate-600 border border-slate-200">
                        Registrar: {approval?.registrar_status || 'pending'}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-center text-slate-600 border border-slate-200">
                        VC: {approval?.vc_status || 'pending'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            Trending Score by Event
          </h2>
          {events.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No trending data yet.</p>
          ) : (
            <div className="space-y-3">
              {events
                .map((event) => ({
                  ...event,
                  trendingScore: Number(viewMap[String(event._id)]?.trending_score || 0),
                  views: Number(viewMap[String(event._id)]?.views || 0),
                }))
                .sort((a, b) => b.trendingScore - a.trendingScore)
                .slice(0, 6)
                .map((event, i, arr) => {
                  const maxScore = arr[0]?.trendingScore || 1
                  const pct = Math.round((event.trendingScore / maxScore) * 100)
                  return (
                    <div key={event._id}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-700 font-medium truncate mr-2">{event.title}</span>
                        <span className="text-slate-400 whitespace-nowrap">{event.trendingScore}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: i * 0.05, duration: 0.4 }}
                          className="h-full rounded-full bg-violet-500"
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">views {event.views} + regs {(regsByEvent[String(event._id)] || 0)}</p>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-indigo-500" />
          Registration Trend (Monthly)
        </h2>
        {monthData.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No registration data yet.</p>
        ) : (
          <div className="flex items-end gap-2 h-40 mt-2">
            {monthData.map(([month, count]) => {
              const maxCount = Math.max(...monthData.map(([, c]) => c))
              const heightPct = maxCount > 0 ? (count / maxCount) * 100 : 0
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-500 font-medium">{count}</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-[40px] rounded-t-lg bg-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400">{month.slice(5)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
