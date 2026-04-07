'use client'

import { useEffect, useState } from 'react'
import { Loader2, PlayCircle, RefreshCcw, Database, ArrowRightLeft } from 'lucide-react'

export default function AdminDashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState('')

  async function loadSummary() {
    try {
      const res = await fetch('/api/admin/lifecycle', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } finally {
      setLoading(false)
    }
  }

  async function runLifecycle() {
    setRunning(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/lifecycle', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setMessage(json.message || 'Failed to run lifecycle automation.')
        return
      }
      setMessage(`Lifecycle run completed: ${json.transitioned} transitions, ${json.reportsUpserted} reports updated.`)
      await loadSummary()
    } finally {
      setRunning(false)
    }
  }

  useEffect(() => {
    loadSummary()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  const latestRun = data?.latestRun
  const statusSummary = data?.eventStatusSummary || []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Manually trigger lifecycle automation and monitor the latest execution summary.</p>
        </div>

        <button
          onClick={runLifecycle}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
          {running ? 'Running...' : 'Run Lifecycle Now'}
        </button>
      </div>

      {message && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 inline-flex rounded-lg bg-red-50 p-2 text-red-700">
            <ArrowRightLeft className="h-5 w-5" />
          </div>
          <p className="text-sm text-slate-500">Last Transitions</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{latestRun?.transitioned || 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 inline-flex rounded-lg bg-red-50 p-2 text-red-700">
            <Database className="h-5 w-5" />
          </div>
          <p className="text-sm text-slate-500">Event Reports</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{data?.reportsCount || 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 inline-flex rounded-lg bg-red-50 p-2 text-red-700">
            <RefreshCcw className="h-5 w-5" />
          </div>
          <p className="text-sm text-slate-500">Reports Updated Last Run</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{latestRun?.reportsUpserted || 0}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Latest Lifecycle Summary</h2>
        <p className="mt-1 text-sm text-slate-500">
          {data?.latestRunCreatedAt ? `Last run at ${new Date(data.latestRunCreatedAt).toLocaleString()}` : 'No lifecycle runs recorded yet.'}
        </p>

        {latestRun?.transitions?.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-2 py-2">Event ID</th>
                  <th className="px-2 py-2">From</th>
                  <th className="px-2 py-2">To</th>
                </tr>
              </thead>
              <tbody>
                {latestRun.transitions.map((item) => (
                  <tr key={`${item.event_id}-${item.from}-${item.to}`} className="border-b border-slate-100">
                    <td className="px-2 py-2 text-slate-700">{item.event_id}</td>
                    <td className="px-2 py-2 text-slate-700">{item.from}</td>
                    <td className="px-2 py-2 text-slate-900">{item.to}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-600">No event transitions were needed in the latest run.</p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Current Event Status Summary</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {statusSummary.map((item) => (
            <div key={item._id || 'unknown'} className="rounded-lg bg-slate-100 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{item._id || 'unknown'}</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{item.count}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Official System Credentials */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">System Access Credentials</h2>
        <p className="mt-1 text-sm text-slate-500 mb-4">
          The following core administration accounts are officially provisioned in the database.
        </p>
        
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-900">Role</th>
                <th className="px-4 py-3 font-medium text-slate-900">Official Login Email</th>
                <th className="px-4 py-3 font-medium text-slate-900">Default Password</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-3 w-1/4"><span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">Vice Chancellor</span></td>
                <td className="px-4 py-3 text-slate-600 font-mono">vicechancellor@aurora.edu.in</td>
                <td className="px-4 py-3 text-slate-600 font-mono">vicechancellor123</td>
              </tr>
              <tr>
                <td className="px-4 py-3 w-1/4"><span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">Dean</span></td>
                <td className="px-4 py-3 text-slate-600 font-mono">dean@aurora.edu.in</td>
                <td className="px-4 py-3 text-slate-600 font-mono">dean123</td>
              </tr>
              <tr>
                <td className="px-4 py-3 w-1/4"><span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-700/10">Registrar</span></td>
                <td className="px-4 py-3 text-slate-600 font-mono">register@aurora.edu.in</td>
                <td className="px-4 py-3 text-slate-600 font-mono">register123</td>
              </tr>
              <tr>
                <td className="px-4 py-3 w-1/4"><span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-700/10">Administrator</span></td>
                <td className="px-4 py-3 text-slate-600 font-mono">admin@aurora.edu.in</td>
                <td className="px-4 py-3 text-slate-600 font-mono">admin123</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
