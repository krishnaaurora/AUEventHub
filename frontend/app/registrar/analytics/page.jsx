'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  MapPin,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'

function RegistrarAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadAnalytics() {
    try {
      // Get events data for analytics
      const [approvedRes, rejectedRes, pendingRes] = await Promise.all([
        fetch('/api/registrar/events?filter=approved&limit=500', { cache: 'no-store' }),
        fetch('/api/registrar/events?filter=rejected&limit=500', { cache: 'no-store' }),
        fetch('/api/registrar/events?filter=pending&limit=500', { cache: 'no-store' }),
      ])

      if (approvedRes.ok && rejectedRes.ok && pendingRes.ok) {
        const approved = await approvedRes.json()
        const rejected = await rejectedRes.json()
        const pending = await pendingRes.json()

        const allEvents = [
          ...(approved.items || []),
          ...(rejected.items || []),
          ...(pending.items || [])
        ]

        // Calculate analytics
        const departmentStats = {}
        const venueStats = {}
        const monthlyStats = {}
        const approvalTrends = {}

        allEvents.forEach(event => {
          // Department distribution
          const dept = event.department || 'Unknown'
          departmentStats[dept] = (departmentStats[dept] || 0) + 1

          // Venue utilization
          const venue = event.venue || 'TBD'
          venueStats[venue] = (venueStats[venue] || 0) + 1

          // Monthly trends
          const date = event.created_at || event.start_date
          if (date) {
            const month = new Date(date).toLocaleString('default', { month: 'short', year: 'numeric' })
            monthlyStats[month] = (monthlyStats[month] || 0) + 1
          }

          // Approval trends
          const status = event.approval?.registrar_status || 'pending'
          approvalTrends[status] = (approvalTrends[status] || 0) + 1
        })

        // Calculate expected attendance
        const totalExpected = allEvents.reduce((sum, event) => {
          return sum + (parseInt(event.max_participants) || 0)
        }, 0)

        setAnalytics({
          totalEvents: allEvents.length,
          approvedEvents: approved.items?.length || 0,
          rejectedEvents: rejected.items?.length || 0,
          pendingEvents: pending.items?.length || 0,
          departmentStats,
          venueStats,
          monthlyStats,
          approvalTrends,
          totalExpectedAttendance: totalExpected,
          averageAttendance: Math.round(totalExpected / Math.max(allEvents.length, 1)),
        })
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 text-lg">Unable to load analytics data.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Event approval trends and statistics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium text-slate-600">Total Events</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{analytics.totalEvents}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-medium text-slate-600">Approved</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{analytics.approvedEvents}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-5 w-5 text-rose-500" />
            <span className="text-sm font-medium text-slate-600">Rejected</span>
          </div>
          <p className="text-2xl font-bold text-rose-600">{analytics.rejectedEvents}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-violet-500" />
            <span className="text-sm font-medium text-slate-600">Avg Attendance</span>
          </div>
          <p className="text-2xl font-bold text-violet-600">{analytics.averageAttendance}</p>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Department Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-500" />
            Department Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.departmentStats)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 8)
              .map(([dept, count]) => {
                const percentage = Math.round((count / analytics.totalEvents) * 100)
                return (
                  <div key={dept} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 truncate mr-2">{dept}</span>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-20 bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900 min-w-[2rem] text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                )
              })}
          </div>
        </motion.div>

        {/* Venue Utilization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            Venue Utilization
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.venueStats)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 8)
              .map(([venue, count]) => {
                const percentage = Math.round((count / analytics.totalEvents) * 100)
                return (
                  <div key={venue} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 truncate mr-2">{venue}</span>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-20 bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900 min-w-[2rem] text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                )
              })}
          </div>
        </motion.div>

        {/* Monthly Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-violet-500" />
            Monthly Event Trends
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.monthlyStats)
              .sort(([a], [b]) => new Date(a) - new Date(b))
              .slice(-6)
              .map(([month, count]) => (
                <div key={month} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{month}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-violet-500 h-2 rounded-full"
                        style={{ width: `${Math.min((count / Math.max(...Object.values(analytics.monthlyStats))) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-900 w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>

        {/* Approval Status Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Approval Status Breakdown
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
              <span className="text-sm font-medium text-amber-800">Pending Review</span>
              <span className="text-lg font-bold text-amber-600">{analytics.pendingEvents}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <span className="text-sm font-medium text-emerald-800">Approved</span>
              <span className="text-lg font-bold text-emerald-600">{analytics.approvedEvents}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-rose-50 rounded-lg">
              <span className="text-sm font-medium text-rose-800">Rejected</span>
              <span className="text-lg font-bold text-rose-600">{analytics.rejectedEvents}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default RegistrarAnalyticsPage