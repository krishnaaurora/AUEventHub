'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Building,
  MapPin,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  PieChart,
  Activity,
} from 'lucide-react'

function VCAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadAnalytics() {
    try {
      // Get comprehensive analytics data
      const [eventsRes, statsRes] = await Promise.all([
        fetch('/api/vc/events?filter=all&limit=1000', { cache: 'no-store' }),
        fetch('/api/vc/stats', { cache: 'no-store' }),
      ])

      if (eventsRes.ok && statsRes.ok) {
        const events = await eventsRes.json()
        const stats = await statsRes.json()

        // Process analytics data
        const allEvents = events.items || []

        // Department distribution
        const departmentStats = {}
        allEvents.forEach(event => {
          const dept = event.department || 'Unknown'
          departmentStats[dept] = (departmentStats[dept] || 0) + 1
        })

        // Venue utilization
        const venueStats = {}
        allEvents.forEach(event => {
          const venue = event.venue || 'TBD'
          venueStats[venue] = (venueStats[venue] || 0) + 1
        })

        // Monthly trends
        const monthlyStats = {}
        allEvents.forEach(event => {
          const date = event.created_at || event.start_date
          if (date) {
            const month = new Date(date).toLocaleString('default', { month: 'short', year: 'numeric' })
            monthlyStats[month] = (monthlyStats[month] || 0) + 1
          }
        })

        // Approval status breakdown
        const approvalStats = {
          pending: allEvents.filter(e => e.approval?.vc_status === 'pending').length,
          approved: allEvents.filter(e => e.approval?.vc_status === 'approved').length,
          rejected: allEvents.filter(e => e.approval?.vc_status === 'rejected').length,
        }

        // Event popularity by trending score
        const popularityStats = {
          high: allEvents.filter(e => (e.trending?.score || 0) >= 80).length,
          medium: allEvents.filter(e => (e.trending?.score || 0) >= 50 && (e.trending?.score || 0) < 80).length,
          low: allEvents.filter(e => (e.trending?.score || 0) < 50).length,
        }

        // Calculate participation metrics
        const totalExpected = allEvents.reduce((sum, event) => sum + (parseInt(event.max_participants) || 0), 0)
        const avgParticipation = Math.round(totalExpected / Math.max(allEvents.length, 1))

        setAnalytics({
          totalEvents: allEvents.length,
          departmentStats,
          venueStats,
          monthlyStats,
          approvalStats,
          popularityStats,
          totalExpectedParticipation: totalExpected,
          averageParticipation: avgParticipation,
          totalRegistrations: stats.totalRegistrations || 0,
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
        <h1 className="text-2xl font-bold text-slate-900">University Event Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Comprehensive insights into event management and student engagement</p>
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
            <span className="text-sm font-medium text-slate-600">Published</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{analytics.approvalStats.approved}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-violet-500" />
            <span className="text-sm font-medium text-slate-600">Total Registrations</span>
          </div>
          <p className="text-2xl font-bold text-violet-600">{analytics.totalRegistrations}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-medium text-slate-600">Avg Participation</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{analytics.averageParticipation}</p>
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
            <Building className="h-5 w-5 text-emerald-500" />
            Events by Department
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
            <Activity className="h-5 w-5 text-violet-500" />
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
            <PieChart className="h-5 w-5 text-slate-500" />
            Approval Status Breakdown
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
              <span className="text-sm font-medium text-amber-800">Pending VC Review</span>
              <span className="text-lg font-bold text-amber-600">{analytics.approvalStats.pending}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <span className="text-sm font-medium text-emerald-800">Published & Live</span>
              <span className="text-lg font-bold text-emerald-600">{analytics.approvalStats.approved}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-rose-50 rounded-lg">
              <span className="text-sm font-medium text-rose-800">Rejected</span>
              <span className="text-lg font-bold text-rose-600">{analytics.approvalStats.rejected}</span>
            </div>
          </div>
        </motion.div>

        {/* Event Popularity Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Event Popularity Distribution
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <span className="text-sm font-medium text-emerald-800">High Popularity (80+)</span>
              <span className="text-lg font-bold text-emerald-600">{analytics.popularityStats.high}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-800">Medium Popularity (50-79)</span>
              <span className="text-lg font-bold text-blue-600">{analytics.popularityStats.medium}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium text-slate-800">Low Popularity (&lt;50)</span>
              <span className="text-lg font-bold text-slate-600">{analytics.popularityStats.low}</span>
            </div>
          </div>
        </motion.div>

        {/* Participation Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-500" />
            Participation Metrics
          </h3>
          <div className="space-y-4">
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <p className="text-3xl font-bold text-indigo-600 mb-1">
                {analytics.totalExpectedParticipation.toLocaleString()}
              </p>
              <p className="text-sm text-indigo-600">Total Expected Participants</p>
            </div>
            <div className="text-center p-4 bg-violet-50 rounded-lg">
              <p className="text-3xl font-bold text-violet-600 mb-1">
                {analytics.averageParticipation}
              </p>
              <p className="text-sm text-violet-600">Average per Event</p>
            </div>
            <div className="text-center p-4 bg-teal-50 rounded-lg">
              <p className="text-3xl font-bold text-teal-600 mb-1">
                {analytics.totalRegistrations.toLocaleString()}
              </p>
              <p className="text-sm text-teal-600">Actual Registrations</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default VCAnalyticsPage