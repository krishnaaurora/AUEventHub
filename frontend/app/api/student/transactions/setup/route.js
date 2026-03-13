import { NextResponse } from 'next/server'
import { ensureStudentTransactionTables, getPool } from '../../../_lib/pg'
import { emitSocketEvent } from '../../../../../server/socket'

const seedRegistrations = [
  ['AU-2024-CS-145', 'event123', 'TKT-INIT-EVT123-000001'],
  ['AU-2024-CS-145', 'event125', 'TKT-INIT-EVT125-000002'],
]

const seedAttendance = [
  ['AU-2024-CS-145', 'event123', 'present'],
]

const seedCertificates = [
  ['AU-2024-CS-145', 'event123', 'https://example.com/certificates/event123-lalitha.pdf'],
]

const seedNotifications = [
  ['AU-2024-CS-145', 'Registration confirmed for AI Hackathon. Ticket TKT-INIT-EVT123-000001 is ready.', 'medium'],
  ['AU-2024-CS-145', 'Certificate issued for AI Hackathon.', 'low'],
  ['AU-2024-CS-145', 'Attendance marked present for AI Hackathon.', 'medium'],
]

export async function POST() {
  try {
    await ensureStudentTransactionTables()
    const pool = getPool()

    const counts = {
      registrations: 0,
      attendance: 0,
      certificates: 0,
      notifications: 0,
    }

    const registrationCountResult = await pool.query('SELECT COUNT(*)::int AS count FROM registrations')
    if (registrationCountResult.rows[0].count === 0) {
      for (const row of seedRegistrations) {
        await pool.query(
          `INSERT INTO registrations (student_id, event_id, ticket_id)
           VALUES ($1, $2, $3)
           ON CONFLICT (student_id, event_id) DO NOTHING`,
          row,
        )
      }
      counts.registrations = seedRegistrations.length
    }

    const attendanceCountResult = await pool.query('SELECT COUNT(*)::int AS count FROM attendance')
    if (attendanceCountResult.rows[0].count === 0) {
      for (const row of seedAttendance) {
        await pool.query(
          `INSERT INTO attendance (student_id, event_id, status)
           VALUES ($1, $2, $3)
           ON CONFLICT (student_id, event_id)
           DO UPDATE SET status = EXCLUDED.status, scanned_at = CURRENT_TIMESTAMP`,
          row,
        )
      }
      counts.attendance = seedAttendance.length
    }

    const certificateCountResult = await pool.query('SELECT COUNT(*)::int AS count FROM certificates')
    if (certificateCountResult.rows[0].count === 0) {
      for (const row of seedCertificates) {
        await pool.query(
          `INSERT INTO certificates (student_id, event_id, certificate_url)
           VALUES ($1, $2, $3)
           ON CONFLICT (student_id, event_id)
           DO UPDATE SET certificate_url = EXCLUDED.certificate_url, issued_at = CURRENT_TIMESTAMP`,
          row,
        )
      }
      counts.certificates = seedCertificates.length
    }

    const notificationCountResult = await pool.query('SELECT COUNT(*)::int AS count FROM notifications')
    if (notificationCountResult.rows[0].count === 0) {
      for (const row of seedNotifications) {
        await pool.query(
          `INSERT INTO notifications (user_id, message, priority)
           VALUES ($1, $2, $3)`,
          row,
        )
      }
      counts.notifications = seedNotifications.length
    }

    emitSocketEvent('bulk-sync:completed', {
      scope: 'student-transactions',
      source: 'postgresql',
      tables: ['registrations', 'attendance', 'certificates', 'notifications'],
      seeded: counts,
    })
    emitSocketEvent('dashboard:refresh', {
      scope: 'student',
      type: 'bulk-sync',
      source: 'postgresql',
    })
    emitSocketEvent('dashboard:refresh', {
      scope: 'organizer',
      type: 'bulk-sync',
      source: 'postgresql',
    }, 'role:organizer')

    return NextResponse.json({
      ok: true,
      message: 'PostgreSQL student transaction tables are ready.',
      tables: ['registrations', 'attendance', 'certificates', 'notifications'],
      seeded: counts,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to initialize PostgreSQL student transaction tables.',
        detail: error.message,
      },
      { status: 500 },
    )
  }
}
