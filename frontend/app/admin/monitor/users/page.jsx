'use client'

import { useEffect, useState } from 'react'
import { Loader2, Users } from 'lucide-react'

export default function AdminUsersMonitorPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState('')
  const [message, setMessage] = useState('')

  async function loadData() {
    try {
      const res = await fetch('/api/admin/monitor/users', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        await loadData()
      } finally {
        setLoading(false)
      }
    }

    bootstrap()
  }, [])

  async function updateUserRole(userId, role) {
    setActionLoadingId(userId)
    setMessage('')
    try {
      const res = await fetch('/api/admin/monitor/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'assign_role', role }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMessage(json?.message || 'Failed to update role.')
        return
      }
      setMessage(json?.message || 'Role updated successfully.')
      await loadData()
    } finally {
      setActionLoadingId('')
    }
  }

  async function toggleUserStatus(user) {
    const nextStatus = user.accountStatus === 'suspended' ? 'active' : 'suspended'
    setActionLoadingId(user._id)
    setMessage('')
    try {
      const res = await fetch('/api/admin/monitor/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, action: 'set_status', status: nextStatus }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMessage(json?.message || 'Failed to update user status.')
        return
      }
      setMessage(json?.message || 'User status updated successfully.')
      await loadData()
    } finally {
      setActionLoadingId('')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Monitoring</h1>
        <p className="mt-1 text-sm text-slate-600">Track users by role and inspect recently created accounts.</p>
        {message ? <p className="mt-2 text-sm text-red-700">{message}</p> : null}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 inline-flex rounded-lg bg-red-50 p-2 text-red-700">
          <Users className="h-5 w-5" />
        </div>
        <p className="text-sm text-slate-500">Total Users</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{data?.totalUsers || 0}</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Role Distribution</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.roleDistribution || []).map((role) => (
            <div key={role._id || 'unknown'} className="rounded-lg bg-slate-100 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{role._id || 'unknown'}</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{role.count}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Recent Users</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Role</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Department</th>
                <th className="px-2 py-2">Created</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentUsers || []).map((user) => (
                <tr key={user._id} className="border-b border-slate-100">
                  <td className="px-2 py-2 text-slate-700">{user.fullName}</td>
                  <td className="px-2 py-2 text-slate-700">{user.email}</td>
                  <td className="px-2 py-2 text-slate-700">
                    <select
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                      value={user.role || 'student'}
                      disabled={actionLoadingId === user._id}
                      onChange={(event) => updateUserRole(user._id, event.target.value)}
                    >
                      <option value="student">student</option>
                      <option value="organizer">organizer</option>
                      <option value="faculty">faculty</option>
                      <option value="dean">dean</option>
                      <option value="registrar">registrar</option>
                      <option value="vc">vc</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-2 py-2 text-slate-700">{user.accountStatus || 'active'}</td>
                  <td className="px-2 py-2 text-slate-700">{user.department}</td>
                  <td className="px-2 py-2 text-slate-700">{user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}</td>
                  <td className="px-2 py-2 text-slate-700">
                    <button
                      type="button"
                      className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={actionLoadingId === user._id}
                      onClick={() => toggleUserStatus(user)}
                    >
                      {actionLoadingId === user._id
                        ? 'Saving...'
                        : user.accountStatus === 'suspended'
                          ? 'Activate'
                          : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
