'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import RegistrarApprovedClient from './RegistrarApprovedClient'

export default function RegistrarApprovedEventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  async function loadEvents() {
    try {
      const res = await fetch('/api/registrar/events?filter=approved&limit=100', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setEvents(data.items || [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return <RegistrarApprovedClient initialEvents={events} />
}