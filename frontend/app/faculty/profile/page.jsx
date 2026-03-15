'use client'

import { useSession } from 'next-auth/react'
import { User, Mail, Building2, ShieldCheck } from 'lucide-react'

function FacultyProfilePage() {
  const { data: session } = useSession()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-600">Faculty account details and system permissions.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-slate-100 p-4">
            <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
              <User className="h-4 w-4" /> Name
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">{session?.user?.name || 'Faculty User'}</p>
          </div>
          <div className="rounded-lg bg-slate-100 p-4">
            <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
              <Mail className="h-4 w-4" /> Email
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">{session?.user?.email || 'N/A'}</p>
          </div>
          <div className="rounded-lg bg-slate-100 p-4">
            <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
              <Building2 className="h-4 w-4" /> Department
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">{session?.user?.department || 'Faculty Department'}</p>
          </div>
          <div className="rounded-lg bg-slate-100 p-4">
            <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
              <ShieldCheck className="h-4 w-4" /> Role
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">FACULTY</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">System Rules</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>Faculty can view attendance and participation records.</li>
          <li>Faculty can monitor event engagement and analytics.</li>
          <li>Faculty cannot approve, reject, or edit event details.</li>
        </ul>
      </section>
    </div>
  )
}

export default FacultyProfilePage
