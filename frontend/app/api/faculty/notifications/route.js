export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { ensureStudentTransactionTables, getPool } from '../../_lib/pg'
import { requireFacultyAccess } from '../_lib/auth'

export async function GET() {
  try {
    const auth = await requireFacultyAccess()
    if (auth.response) return auth.response

    await ensureStudentTransactionTables()
    const pool = getPool()

    const result = await pool.query(
      `SELECT id, user_id, message, priority, created_at
       FROM notifications
       WHERE user_id = $1 OR user_id = 'faculty' OR user_id = 'all'
       ORDER BY created_at DESC
       LIMIT 100`,
      [auth.session.user.id],
    )

    const notifications = result.rows.map((row) => ({
      id: row.id,
      title: 'Faculty Update',
      message: row.message,
      type: row.priority === 'high' ? 'alert' : 'info',
      read: false,
      created_at: row.created_at,
    }))

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Faculty notifications error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
