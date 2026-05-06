export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { ensureStudentTransactionTables, getPool } from '../../_lib/pg'
import { getDb } from '../../_lib/db'
import { emitSocketEvent } from '../../../../server/socket'

// GET /api/organizer/certificates?event_id=xxx
// Returns all registrations+attendance for an event + which ones have certificates
export async function GET(request) {
  try {
    await ensureStudentTransactionTables()
    const pool = getPool()
    const { searchParams } = new URL(request.url)
    const eventId = String(searchParams.get('event_id') || '').trim()

    if (!eventId) {
      return NextResponse.json({ message: 'event_id is required' }, { status: 400 })
    }

    // All registrations for the event
    const regsResult = await pool.query(
      `SELECT r.id, r.student_id, r.event_id, r.ticket_id, r.registered_at, r.status,
              a.status AS attendance_status, a.scanned_at,
              c.id AS cert_id, c.certificate_url, c.issued_at
       FROM registrations r
       LEFT JOIN attendance a ON a.student_id = r.student_id AND a.event_id = r.event_id
       LEFT JOIN certificates c ON c.student_id = r.student_id AND c.event_id = r.event_id
       WHERE r.event_id = $1
       ORDER BY r.registered_at DESC`,
      [eventId]
    )

    return NextResponse.json({ participants: regsResult.rows })
  } catch (error) {
    console.error('[CERT GET]', error)
    return NextResponse.json({ message: 'Failed to fetch participants', detail: error.message }, { status: 500 })
  }
}

// POST /api/organizer/certificates
// Issues certificates to selected students
export async function POST(request) {
  try {
    await ensureStudentTransactionTables()
    const pool = getPool()
    const body = await request.json()

    const { event_id, student_ids, template_url, template_fields } = body

    if (!event_id || !Array.isArray(student_ids) || student_ids.length === 0) {
      return NextResponse.json({ message: 'event_id and student_ids[] are required' }, { status: 400 })
    }

    // Fetch event details from MongoDB for the certificate
    const db = await getDb()
    const { ObjectId } = await import('mongodb')
    let event = null
    try {
      const eventOid = ObjectId.isValid(event_id) ? new ObjectId(event_id) : null
      event = eventOid
        ? await db.collection('events').findOne({ _id: eventOid })
        : await db.collection('events').findOne({ _id: event_id })
    } catch { /* ignore */ }

    const eventTitle = event?.title || 'Event'
    const eventDate = event?.start_date || event?.date || new Date().toISOString().slice(0, 10)
    const eventVenue = event?.venue || ''

    const issued = []
    const skipped = []

    for (const studentId of student_ids) {
      try {
        // Build certificate URL — encodes all details into a query string so
        // the /student/certificates page can render the certificate dynamically
        const certParams = new URLSearchParams({
          student_id: studentId,
          event_id,
          event_title: eventTitle,
          event_date: eventDate,
          event_venue: eventVenue,
          template: template_url || 'default',
          ...(template_fields || {}),
        })
        const certUrl = `/certificate/view?${certParams.toString()}`

        await pool.query(
          `INSERT INTO certificates (student_id, event_id, certificate_url, issued_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (student_id, event_id) DO UPDATE SET certificate_url = EXCLUDED.certificate_url, issued_at = NOW()`,
          [studentId, event_id, certUrl]
        )

        // Also store in MongoDB for cross-portal visibility
        try {
          await db.collection('certificates').updateOne(
            { student_id: studentId, event_id },
            {
              $set: {
                student_id: studentId,
                event_id,
                event_title: eventTitle,
                event_date: eventDate,
                certificate_url: certUrl,
                template_url: template_url || 'default',
                issued_at: new Date().toISOString(),
              }
            },
            { upsert: true }
          )
        } catch { /* non-critical */ }

        issued.push(studentId)
      } catch (err) {
        console.error('[CERT ISSUE] Failed for student:', studentId, err.message)
        skipped.push(studentId)
      }
    }

    // Notify students via socket
    for (const studentId of issued) {
      emitSocketEvent('notification:new', {
        type: 'certificate_issued',
        title: 'Certificate Issued!',
        message: `Your certificate for "${eventTitle}" is ready to download.`,
        event_id,
        created_at: new Date().toISOString(),
      }, `user:${studentId}`)
    }

    emitSocketEvent('dashboard:refresh', { scope: 'student' }, 'role:student')

    return NextResponse.json({
      message: `Certificates issued to ${issued.length} student(s)`,
      issued,
      skipped,
    })
  } catch (error) {
    console.error('[CERT POST]', error)
    return NextResponse.json({ message: 'Failed to issue certificates', detail: error.message }, { status: 500 })
  }
}

// DELETE /api/organizer/certificates?student_id=x&event_id=y  — revoke a certificate
export async function DELETE(request) {
  try {
    await ensureStudentTransactionTables()
    const pool = getPool()
    const { searchParams } = new URL(request.url)
    const studentId = String(searchParams.get('student_id') || '').trim()
    const eventId = String(searchParams.get('event_id') || '').trim()

    if (!studentId || !eventId) {
      return NextResponse.json({ message: 'student_id and event_id required' }, { status: 400 })
    }

    await pool.query(
      'DELETE FROM certificates WHERE student_id = $1 AND event_id = $2',
      [studentId, eventId]
    )

    return NextResponse.json({ message: 'Certificate revoked' })
  } catch (error) {
    return NextResponse.json({ message: 'Failed to revoke certificate', detail: error.message }, { status: 500 })
  }
}
