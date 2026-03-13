'use client'

import { useSession } from 'next-auth/react'
import { Shield, Mail, Building2 } from 'lucide-react'

export default function AdminProfilePage() {
  const { data: session } = useSession()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Profile</h1>
        <p className="mt-1 text-sm text-slate-600">Predefined administrator account used for system oversight.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-slate-100 p-4">
            <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500"><Shield className="h-4 w-4" /> Name</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{session?.user?.name || 'Aurora Admin'}</p>
          </div>
          <div className="rounded-lg bg-slate-100 p-4">
            <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500"><Mail className="h-4 w-4" /> Email</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{session?.user?.email || 'admin@aurora.edu.in'}</p>
          </div>
          <div className="rounded-lg bg-slate-100 p-4">
            <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500"><Building2 className="h-4 w-4" /> Department</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{session?.user?.department || 'Administration'}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
