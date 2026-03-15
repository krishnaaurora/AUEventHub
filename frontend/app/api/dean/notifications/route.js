import { NextResponse } from 'next/server'
import { ensureStudentTransactionTables, getPool } from '../../_lib/pg'
import { getSessionIdentifiers, requireDeanAccess } from '../_lib/auth'

function toPositiveInt(value, fallback) {
  const num = Number.parseInt(value, 10)
  return Number.isFinite(num) && num > 0 ? num : fallback
}

export async function GET(request) {
  try {
    const auth = await requireDeanAccess()
    if (auth.response) return auth.response

    await ensureStudentTransactionTables()
    const pool = getPool()
    const { searchParams } = new URL(request.url)
    const userId = String(searchParams.get('user_id') || '').trim()
    const limit = toPositiveInt(searchParams.get('limit'), 50)

    let result
    if (userId) {
      const allowedIds = getSessionIdentifiers(auth.session)
      if (auth.role !== 'admin' && !allowedIds.has(userId)) {
        return NextResponse.json(
          { message: 'Forbidden notification scope.' },
          { status: 403 }
        )
      }

      result = await pool.query(
        'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
        [userId, limit]
      )
    } else {
      // For dean role, show event workflow updates and urgent alerts.
      result = await pool.query(
        "SELECT * FROM notifications WHERE priority = 'high' OR message ILIKE '%event%' OR message ILIKE '%approval%' ORDER BY created_at DESC LIMIT $1",
        [limit]
      )
    }

    return NextResponse.json({ items: result.rows })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch notifications.', detail: error.message },
      { status: 500 }
    )
  }
}
