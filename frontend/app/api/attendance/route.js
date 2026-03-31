import { NextResponse } from 'next/server'
import { getPool, ensureStudentTransactionTables } from '../_lib/pg'
import crypto from 'crypto'

/**
 * Validates the event code by checking against both current and previous 60s windows
 * to avoid issues with students submitting at exactly the time window change.
 */
function validateEventCode(eventId, code) {
  const secret = process.env.EVENT_CODE_SECRET || 'au-event-secret-2026'
  const now = Date.now()
  const timeWindow = Math.floor(now / 60000)
  
  const generate = (window) => {
    const hash = crypto
      .createHmac('sha256', secret)
      .update(`${eventId}-${window}`)
      .digest('hex')
    return String(parseInt(hash.substring(0, 8), 16) % 10000).padStart(4, '0')
  }

  // Check current window and previous window (as buffer)
  return code === generate(timeWindow) || code === generate(timeWindow - 1)
}

export async function POST(request) {
  try {
    await ensureStudentTransactionTables()
    const pool = getPool()
    const body = await request.json()

    const { studentId, eventId, code } = body

    if (!studentId || !eventId || !code) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    // 1. Validate Code
    if (!validateEventCode(eventId, code)) {
      return NextResponse.json({ message: 'Invalid or expired event code' }, { status: 403 })
    }

    // 2. Prevent Duplicate Attendance
    const checkResult = await pool.query(
      'SELECT id FROM attendance WHERE student_id = $1 AND event_id = $2',
      [studentId, eventId]
    )

    if (checkResult.rowCount > 0) {
      return NextResponse.json({ message: 'Attendance already recorded for this event' }, { status: 409 })
    }

    // 3. Mark Attendance
    await pool.query(
      `INSERT INTO attendance (student_id, event_id, status, scanned_at)
       VALUES ($1, $2, 'present', NOW())`,
      [studentId, eventId]
    )

    // 4. Also mark in MongoDB registrations mirror if applicable (for UI status)
    try {
      const { getDb } = await import('../_lib/db')
      const db = await getDb()
      await db.collection('registrations').updateOne(
        { student_id: studentId, event_id: eventId },
        { $set: { attendance_status: 'present', scanned_at: new Date().toISOString() } }
      )
    } catch (mongoErr) {
      console.error('[ATTENDANCE] Mongo update error:', mongoErr.message)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Attendance recorded successfully. You are now eligible for the certificate!' 
    })
  } catch (error) {
    console.error('[ATTENDANCE] POST Trace:', error)
    return NextResponse.json({ message: 'Failed to record attendance', detail: error.message }, { status: 500 })
  }
}
