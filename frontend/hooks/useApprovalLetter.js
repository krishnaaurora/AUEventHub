'use client'
/**
 * useApprovalLetter.js
 * Custom hook for approval letter generation via Flask.
 */
import { useState, useCallback } from 'react'
import { generateApprovalLetter } from '@/services/ai.service'

export function useApprovalLetter() {
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const generate = useCallback(async (payload) => {
    const required = ['title', 'category', 'venue', 'start_date']
    for (const field of required) {
      if (!payload[field]) {
        setError(`${field} is required to generate a letter.`)
        return null
      }
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await generateApprovalLetter(payload)
      setResult(data)
      return data
    } catch (err) {
      setError(err.message || 'Failed to generate letter')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { generate, result, loading, error }
}
