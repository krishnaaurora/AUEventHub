'use client'

import { useEffect, useState } from 'react'
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
      const res = await fetch('/api/registrar/stats', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
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
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <BarChart3 className="h-12 w-12 text-slate-200 mb-4" />
        <p className="text-slate-500 text-lg">Unable to load analytics data.</p>
        <button onClick={loadAnalytics} className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Event approval trends and university-wide statistics</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:translate-y-[-2px] transition-transform">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium text-slate-600">Total Events</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{analytics.totalEvents}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:translate-y-[-2px] transition-transform">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-medium text-slate-600">Approved</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{analytics.approvedEvents}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:translate-y-[-2px] transition-transform">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-5 w-5 text-rose-500" />
            <span className="text-sm font-medium text-slate-600">Rejected</span>
          </div>
          <p className="text-2xl font-bold text-rose-600">{analytics.rejectedEvents}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:translate-y-[-2px] transition-transform">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-violet-500" />
            <span className="text-sm font-medium text-slate-600">Avg Participation</span>
          </div>
          <p className="text-2xl font-bold text-violet-600">{analytics.averageAttendance}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-500" />
            Department Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.departmentStats)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 8)
              .map(([dept, count]) => {
                const percentage = Math.round((count / analytics.totalEvents) * 100)
                return (
                  <div key={dept} className="flex items-center justify-between group">
                    <span className="text-sm text-slate-600 truncate mr-2 group-hover:text-emerald-600 transition-colors">{dept}</span>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-900 min-w-[2rem] text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            Venue Utilization
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.venueStats)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 8)
              .map(([venue, count]) => {
                const percentage = Math.round((count / analytics.totalEvents) * 100)
                return (
                  <div key={venue} className="flex items-center justify-between group">
                    <span className="text-sm text-slate-600 truncate mr-2 group-hover:text-blue-600 transition-colors">{venue}</span>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-900 min-w-[2rem] text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-violet-500" />
            Monthly Event Trends
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.monthlyStats)
              .sort(([a], [b]) => new Date(a) - new Date(b))
              .slice(-6)
              .map(([month, count]) => {
                const max = Math.max(...Object.values(analytics.monthlyStats), 1)
                const percentage = Math.round((count / max) * 100)
                return (
                  <div key={month} className="flex items-center justify-between group">
                    <span className="text-sm text-slate-600 group-hover:text-violet-600 transition-colors">{month}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-violet-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-900 w-8 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Approval Status Breakdown
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100 group hover:bg-amber-100 transition-colors">
              <span className="text-sm font-semibold text-amber-800">Pending Review</span>
              <span className="text-2xl font-black text-amber-600">{analytics.pendingEvents}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100 group hover:bg-emerald-100 transition-colors">
              <span className="text-sm font-semibold text-emerald-800">Final Approved</span>
              <span className="text-2xl font-black text-emerald-600">{analytics.approvedEvents}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-rose-50 rounded-xl border border-rose-100 group hover:bg-rose-100 transition-colors">
              <span className="text-sm font-semibold text-rose-800">Rejected / Denied</span>
              <span className="text-2xl font-black text-rose-600">{analytics.rejectedEvents}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegistrarAnalyticsPage