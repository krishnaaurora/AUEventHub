import { NextResponse } from 'next/server'
import { requireRegistrarAccess } from '../_lib/auth'
import { ensureStudentTransactionTables, getPool } from '../../_lib/pg'

export async function GET() {
  try {
    const auth = await requireRegistrarAccess()
    if (auth.response) return auth.response

    await ensureStudentTransactionTables()
    const pool = getPool()

    // Get notifications for registrar (we'll use a generic approach since registrar notifications might be system-wide)
    const result = await pool.query(
      'SELECT id, message, priority, created_at, is_read FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      ['registrar_system'] // Using a system user ID for registrar notifications
    )

    const notifications = result.rows.map(row => ({
      id: row.id,
      message: row.message,
      priority: row.priority,
      created_at: row.created_at,
      read: !!row.is_read,
    }))

    const unreadCount = notifications.filter(n => !n.read).length

    return NextResponse.json({
      notifications,
      unreadCount,
    })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch registrar notifications.', detail: error.message },
      { status: 500 }
    )
  }
}