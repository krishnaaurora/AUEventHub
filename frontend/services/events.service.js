/**
 * events.service.js
 * All event-related API calls from the frontend.
 * Heavy queries → Flask. Simple CRUD → Next.js /api/ (thin proxy).
 */

const FLASK_URL = process.env.NEXT_PUBLIC_FLASK_URL || 'http://localhost:5000'

/**
 * Clash detection — heavy DB query, lives in Flask.
 * Flask: POST /api/events/clash-detection
 */
export async function checkClash({ venue, start_date, end_date, start_time, end_time }) {
  const res = await fetch(`${FLASK_URL}/api/events/clash-detection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ venue, start_date, end_date, start_time, end_time }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Clash detection failed')
  }
  return res.json() // { hasClash, message, suggestion, clashes[] }
}

/**
 * Venue schedule — Flask.
 * Flask: GET /api/events/venue-schedule?venue=...&date=...
 */
export async function getVenueSchedule(venue, date) {
  const params = new URLSearchParams({ venue, date })
  const res = await fetch(`${FLASK_URL}/api/events/venue-schedule?${params}`)
  if (!res.ok) throw new Error('Failed to fetch venue schedule')
  return res.json() // { items[] }
}

/* ── Thin Next.js proxy calls (simple CRUD) ─────────────────────────────── */

/**
 * List events from Next.js thin proxy.
 * Next.js: GET /api/student/events
 */
export async function listEvents(params = {}) {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`/api/student/events${qs ? `?${qs}` : ''}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch events')
  return res.json()
}

/**
 * Create event via Next.js thin proxy.
 * Next.js: POST /api/student/events
 */
export async function createEvent(payload) {
  const res = await fetch('/api/student/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Failed to create event')
  return data
}

/**
 * Update event via Next.js thin proxy.
 * Next.js: PUT /api/student/events
 */
export async function updateEvent(payload) {
  const res = await fetch('/api/student/events', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Failed to update event')
  return data
}
