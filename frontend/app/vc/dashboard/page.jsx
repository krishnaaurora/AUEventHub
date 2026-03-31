'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  TrendingUp,
  Calendar,
  Loader2,
  Eye,
  UserCheck,
} from 'lucide-react'
import Link from 'next/link'

function VCDashboardPage() {
  const [stats, setStats] = useState(null)
  const [recentEvents, setRecentEvents] = useState([])
  const [loading, setLoading] = useState(true)

  async function loadDashboardData() {
    try {
      const [statsRes, eventsRes] = await Promise.all([
        fetch('/api/vc/stats', { cache: 'no-store' }),
        fetch('/api/vc/events?filter=pending&limit=5', { cache: 'no-store' }),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setRecentEvents(eventsData.items || [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">VC Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Final approval and oversight of university events</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-medium text-slate-600">Pending Approval</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats?.pendingEvents || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Awaiting final review</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-medium text-slate-600">Published Events</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{stats?.publishedEvents || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Live to students</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-5 w-5 text-rose-500" />
            <span className="text-sm font-medium text-slate-600">Rejected Events</span>
          </div>
          <p className="text-2xl font-bold text-rose-600">{stats?.rejectedEvents || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Final review</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-violet-500" />
            <span className="text-sm font-medium text-slate-600">Total Registrations</span>
          </div>
          <p className="text-2xl font-bold text-violet-600">{stats?.totalRegistrations || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Across all events</p>
        </motion.div>
      </div>

      {/* Recent Events */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          Events Awaiting Final Approval
        </h3>

        {recentEvents.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No events pending final approval</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentEvents.map((event, index) => (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900">{event.title}</h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <UserCheck className="h-3 w-3" />
                      {event.organizer || 'Unknown Organizer'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(event.start_date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {event.max_participants} expected
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                    Pending VC Approval
                  </span>
                  <Link href={`/vc/event/${event._id}`} className="px-4 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors">
                    Review
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid md:grid-cols-3 gap-4"
      >
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
          <Eye className="h-8 w-8 text-blue-500 mx-auto mb-2" />
          <h4 className="font-medium text-slate-900 mb-1">Monitor Events</h4>
          <p className="text-sm text-slate-500">Track published event performance</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
          <TrendingUp className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
          <h4 className="font-medium text-slate-900 mb-1">View Analytics</h4>
          <p className="text-sm text-slate-500">University-wide event insights</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
          <CheckCircle2 className="h-8 w-8 text-violet-500 mx-auto mb-2" />
          <h4 className="font-medium text-slate-900 mb-1">Final Approvals</h4>
          <p className="text-sm text-slate-500">Complete the approval chain</p>
        </div>
      </motion.div>
    </div>
  )
}

export default VCDashboardPage
