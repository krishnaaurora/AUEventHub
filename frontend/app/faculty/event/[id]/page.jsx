'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Calendar, Building2, MapPin, Users, ArrowLeft, User2 } from 'lucide-react'

function FacultyEventDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEvent() {
      try {
        const res = await fetch(`/api/faculty/events/${params.id}`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setEvent(data)
        }
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      loadEvent()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
        Event not found.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{event.title}</h1>
        <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
          <p className="flex items-center gap-2"><User2 className="h-4 w-4" /> Organizer: {event.organizer_name || 'N/A'}</p>
          <p className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Department: {event.department || 'N/A'}</p>
          <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Venue: {event.venue || 'N/A'}</p>
          <p className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {event.start_date} to {event.end_date}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Event Description</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">{event.details?.description || 'No description available.'}</p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-slate-100 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Guest Speakers</p>
            <p className="mt-1 text-sm text-slate-800">{event.details?.guest_speakers || 'Not specified'}</p>
          </div>
          <div className="rounded-lg bg-slate-100 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Instructions</p>
            <p className="mt-1 text-sm text-slate-800">{event.details?.instructions || 'No instructions provided'}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Registrations</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{event.stats?.totalRegistrations || 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Attendance</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{event.stats?.totalAttendance || 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Participation Rate</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{event.stats?.participationRate || 0}%</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Faculty Access Rules</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>Faculty can monitor event progress and student attendance.</li>
          <li>Faculty can review participation and analytics only.</li>
          <li>Faculty cannot edit, approve, or reject event details.</li>
        </ul>
      </section>
    </div>
  )
}

export default FacultyEventDetailsPage
