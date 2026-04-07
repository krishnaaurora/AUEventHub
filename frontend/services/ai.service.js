/**
 * ai.service.js
 * All AI-related API calls from the frontend.
 * Points to Flask backend — NOT Next.js /api/
 *
 * Usage:
 *   import { generateDescription } from '@/services/ai.service'
 *   const result = await generateDescription({ title, category, venue })
 */

const FLASK_URL = process.env.NEXT_PUBLIC_FLASK_URL || 'http://localhost:5000'

/**
 * Generate an AI event description.
 * Flask: POST /api/ai/description
 */
export async function generateDescription({ title, category, department = '', venue = '' }) {
  const res = await fetch(`${FLASK_URL}/api/ai/description`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, category, department, venue }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to generate description')
  }
  return res.json() // { description, source, style }
}

/**
 * Generate a formal approval request letter.
 * Flask: POST /api/ai/approval-letter
 */
export async function generateApprovalLetter(payload) {
  const res = await fetch(`${FLASK_URL}/api/ai/approval-letter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to generate letter')
  }
  return res.json() // { letter, source }
}

/**
 * Chat with RIYA AI assistant.
 * Flask: POST /api/ai/chat
 */
export async function chatWithRiya(message) {
  const res = await fetch(`${FLASK_URL}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })
  if (!res.ok) {
    return { reply: "I'm having trouble connecting right now. Please try again later." }
  }
  return res.json() // { reply, source }
}
