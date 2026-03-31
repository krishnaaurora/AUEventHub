import { NextResponse } from 'next/server'
import { ensureStudentTransactionTables, getPool } from '../../_lib/pg'
import { requireVCAccess } from '../_lib/auth'

export async function GET() {
  try {
    const auth = await requireVCAccess()
    if (auth.response) return auth.response

    await ensureStudentTransactionTables()
    const pool = getPool()

    // Get notifications for VC (system-wide notifications)
    const result = await pool.query(`
      SELECT
        n.id,
        n.type,
        n.title,
        n.message,
        n.event_id,
        n.created_at,
        n.is_read
      FROM notifications n
      WHERE n.user_id = $1 OR n.type IN ('system', 'approval_reminder')
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [auth.session.user.id])

    const notifications = result.rows.map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      event_id: row.event_id,
      created_at: row.created_at,
      read: !!row.is_read,
    }))

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('VC notifications error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireVCAccess()
    if (auth.response) return auth.response

    const { notificationId, action } = await request.json()

    if (!notificationId || action !== 'read') {
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
    }

    await ensureStudentTransactionTables()
    const pool = getPool()

    // Mark notification as read
    await pool.query(`
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1 AND (user_id = $2 OR type IN ('system', 'approval_reminder'))
    `, [notificationId, auth.session.user.id])

    return NextResponse.json({ message: 'Notification marked as read' })
  } catch (error) {
    console.error('VC notification update error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}