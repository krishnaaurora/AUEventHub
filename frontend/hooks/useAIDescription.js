'use client'
/**
 * useAIDescription.js
 * Custom hook for AI event description generation via Flask.
 * Usage:
 *   const { generate, loading, error } = useAIDescription()
 *   const { description } = await generate({ title, category, department, venue })
 */
import { useState, useCallback } from 'react'
import { generateDescription } from '@/services/ai.service'

export function useAIDescription() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const generate = useCallback(async (params) => {
    if (!params.title || !params.category) {
      setError('Title and category are required.')
      return null
    }
    setLoading(true)
    setError('')
    try {
      return await generateDescription(params)
    } catch (err) {
      setError(err.message || 'Failed to generate description')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { generate, loading, error }
}
