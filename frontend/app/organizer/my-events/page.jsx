'use client'

import { useSession } from 'next-auth/react'
import MyEventsTable from '../components/MyEventsTable'

export default function MyEventsPage() {
  const { data: session } = useSession()

  const organizerId = session?.user?.registrationId || session?.user?.id || ''
  const organizerName = session?.user?.name || session?.user?.email || ''

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">EVENT Management</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">My EVENT</h1>
        <p className="mt-1 text-sm text-slate-500">Track all your EVENT and their approval status.</p>
      </div>

      <MyEventsTable organizerId={organizerId} organizerName={organizerName} />
    </div>
  )
}
