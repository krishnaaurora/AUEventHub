export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getPool, ensureStudentTransactionTables } from '../../_lib/pg'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json({ message: 'eventId is required' }, { status: 400 })
    }

    await ensureStudentTransactionTables()
    const pool = getPool()

    // 1. Get Registration Count
    const regRes = await pool.query(
      'SELECT COUNT(*) FROM registrations WHERE event_id = $1',
      [eventId]
    )
    const registrations = parseInt(regRes.rows[0].count)

    // 2. Get Attendance Count
    const attRes = await pool.query(
      'SELECT COUNT(*) FROM attendance WHERE event_id = $1 AND status = $2',
      [eventId, 'attended']
    )
    const attended = parseInt(attRes.rows[0].count)

    // 3. Get Issued Certificates
    const certRes = await pool.query(
      'SELECT COUNT(*) FROM certificates WHERE event_id = $1',
      [eventId]
    )
    const certificates = parseInt(certRes.rows[0].count)

    // 4. Calculate Attendance Rate
    const attendanceRate = registrations > 0 
      ? Math.round((attended / registrations) * 100) + '%' 
      : '0%'

    return NextResponse.json({
      registrations: registrations + (registrations === 1 ? ' Student' : ' Students'),
      attendance: attendanceRate,
      attendedCount: attended,
      certificates: certificates,
      revenue: `₹${registrations * 100}` // Mock revenue calculation
    })

  } catch (error) {
    console.error('[EVENT STATS API]', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
