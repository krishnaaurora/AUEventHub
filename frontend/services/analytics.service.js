/**
 * analytics.service.js
 * Heavy analytics aggregation — all goes to Flask.
 */

const FLASK_URL = process.env.NEXT_PUBLIC_FLASK_URL || 'http://localhost:5000'

/**
 * Organizer analytics.
 * Flask: GET /api/analytics/organizer?organizer_id=...
 */
export async function getOrganizerAnalytics({ organizerId, organizer } = {}) {
  const params = new URLSearchParams()
  if (organizerId) params.set('organizer_id', organizerId)
  if (organizer)   params.set('organizer', organizer)
  const res = await fetch(`${FLASK_URL}/api/analytics/organizer?${params}`)
  if (!res.ok) throw new Error('Failed to fetch analytics')
  return res.json()
}

/**
 * Platform-wide analytics (admin).
 * Flask: GET /api/analytics/platform
 */
export async function getPlatformAnalytics() {
  const res = await fetch(`${FLASK_URL}/api/analytics/platform`)
  if (!res.ok) throw new Error('Failed to fetch platform analytics')
  return res.json()
}
