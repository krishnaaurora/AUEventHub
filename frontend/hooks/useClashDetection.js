'use client'
/**
 * useClashDetection.js
 * Custom hook that wraps the Flask clash detection service.
 * Usage:
 *   const { check, result, loading, error } = useClashDetection()
 *   await check({ venue, start_date, start_time, end_date, end_time })
 */
import { useState, useCallback } from 'react'
import { checkClash } from '@/services/events.service'

export function useClashDetection() {
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const check = useCallback(async (params) => {
    if (!params.venue || !params.start_date || !params.start_time) {
      setError('Venue, start date, and start time are required.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await checkClash(params)
      setResult(data)
      return data
    } catch (err) {
      setError(err.message || 'Clash detection failed')
    } finally {
      setLoading(false)
    }
  }, [])

  return { check, result, loading, error }
}
