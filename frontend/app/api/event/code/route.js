export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * Generates a 4-digit code based on the eventId and current time window.
 * The code changes every 60 seconds.
 */
function generateEventCode(eventId, timestamp) {
  const secret = process.env.EVENT_CODE_SECRET || 'au-event-secret-2026'
  const timeWindow = Math.floor(timestamp / 60000) // 1 minute window
  const hash = crypto
    .createHmac('sha256', secret)
    .update(`${eventId}-${timeWindow}`)
    .digest('hex')
  
  // Extract 4 digits from the hash
  const numeric = parseInt(hash.substring(0, 8), 16)
  return String(numeric % 10000).padStart(4, '0')
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json({ message: 'eventId is required' }, { status: 400 })
    }

    const now = Date.now()
    const currentCode = generateEventCode(eventId, now)
    
    // Calculate seconds remaining in the current minute window
    const secondsRemaining = 60 - (Math.floor(now / 1000) % 60)

    return NextResponse.json({
      code: currentCode,
      expiresIn: secondsRemaining,
      timestamp: now
    })
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}
