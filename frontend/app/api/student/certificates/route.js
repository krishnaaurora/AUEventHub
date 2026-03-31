import { NextResponse } from 'next/server'
import { getEventsCollection } from '../../_lib/db'
import { ensureStudentTransactionTables, getPool } from '../../_lib/pg'
import { emitSocketEvent } from '../../../../server/socket'

export async function GET(request) {
  try {
    await ensureStudentTransactionTables()
    const pool = getPool()
    const { searchParams } = new URL(request.url)
    const studentId = String(searchParams.get('student_id') || '').trim()

    const result = studentId
      ? await pool.query(
          `SELECT id, student_id, event_id, certificate_url, issued_at
           FROM certificates
           WHERE student_id = $1
           ORDER BY issued_at DESC`,
          [studentId],
        )
      : await pool.query(
          `SELECT id, student_id, event_id, certificate_url, issued_at
           FROM certificates
           ORDER BY issued_at DESC`,
        )

    const rows = result.rows
    const eventIds = [...new Set(rows.map((item) => item.event_id).filter(Boolean))]
    const eventsCollection = await getEventsCollection()

    let eventDocs = []
    if (eventIds.length > 0) {
      const { ObjectId } = await import('mongodb')
      const objectIds = []
      const stringIds = []
      for (const id of eventIds) {
        if (ObjectId.isValid(id) && id.length === 24) {
          objectIds.push(new ObjectId(id))
          stringIds.push(id)
        } else {
          stringIds.push(id)
        }
      }
      eventDocs = await eventsCollection.find({
        $or: [{ _id: { $in: objectIds } }, { _id: { $in: stringIds } }]
      }).toArray()
    }

    const eventsById = Object.fromEntries(
      eventDocs.map((event) => [String(event._id), event]),
    )

    const items = rows.map((item) => {
      const event = eventsById[item.event_id]
      return {
        id: item.id,
        student_id: item.student_id,
        event_id: item.event_id,
        certificate_url: item.certificate_url,
        issued_at: item.issued_at,
        event_title: event?.title || item.event_id,
        organizer: event?.organizer || event?.organizer_name || 'Organizer TBA',
        date: event?.start_date || event?.date || null,
        category: event?.category || 'General',
        color: (event?.category || '').toLowerCase().includes('technical') ? 'indigo' 
               : (event?.category || '').toLowerCase().includes('cultural') ? 'violet' 
               : (event?.category || '').toLowerCase().includes('sports') ? 'emerald'
               : (event?.category || '').toLowerCase().includes('workshop') ? 'amber'
               : (event?.category || '').toLowerCase().includes('seminar') ? 'cyan' : 'rose',
        type: 'Participation Certificate',
      }
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('[STUDENT CERT GET]', error)
    return NextResponse.json(
      { message: 'Failed to fetch certificates.', detail: error.message },
      { status: 500 },
    )
  }
}


export async function POST(request) {
  try {
    await ensureStudentTransactionTables()
    const pool = getPool()
    const body = await request.json()

    const studentId = String(body.student_id || '').trim()
    const eventId = String(body.event_id || '').trim()
    const certificateUrl = String(body.certificate_url || '').trim()

    if (!studentId || !eventId || !certificateUrl) {
      return NextResponse.json(
        { message: 'student_id, event_id, and certificate_url are required.' },
        { status: 400 },
      )
    }

    const existing = await pool.query(
      `SELECT id FROM certificates WHERE student_id = $1 AND event_id = $2`,
      [studentId, eventId],
    )

    const result = await pool.query(
      `INSERT INTO certificates (student_id, event_id, certificate_url)
       VALUES ($1, $2, $3)
       ON CONFLICT (student_id, event_id)
       DO UPDATE SET certificate_url = EXCLUDED.certificate_url, issued_at = CURRENT_TIMESTAMP
       RETURNING id, student_id, event_id, certificate_url, issued_at`,
      [studentId, eventId, certificateUrl],
    )

    const eventsCollection = await getEventsCollection()
    const event = await eventsCollection.findOne({ _id: eventId })
    const payload = {
      ...result.rows[0],
      type: existing.rowCount > 0 ? 'updated' : 'created',
      event_title: event?.title || eventId,
      organizer: event?.organizer || 'Organizer TBA',
      date: event?.date || null,
      category: event?.category || 'General',
    }

    emitSocketEvent('certificate:updated', payload)
    emitSocketEvent('certificate:updated', payload, `user:${studentId}`)
    emitSocketEvent('dashboard:refresh', { scope: 'student', studentId, type: 'certificate-updated' }, `user:${studentId}`)

    return NextResponse.json({ item: payload }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to save certificate.', detail: error.message },
      { status: 500 },
    )
  }
}
