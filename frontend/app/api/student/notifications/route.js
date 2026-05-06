export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { ensureStudentTransactionTables, getPool } from '../../_lib/pg'
import { emitSocketEvent } from '../../../../server/socket'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    await ensureStudentTransactionTables()
    const pool = getPool()
    
    // Force current user ID
    const userId = session.user.registrationId || session.user.id

    const result = await pool.query(
      `SELECT id, user_id, message, priority, created_at, is_read 
       FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [String(userId)],
    )

    return NextResponse.json({ items: result.rows })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch notifications.', detail: error.message },
      { status: 500 },
    )
  }
}

export async function POST(request) {
  try {
    await ensureStudentTransactionTables()
    const pool = getPool()
    const body = await request.json()

    const userId = String(body.user_id || '').trim()
    const message = String(body.message || '').trim()
    const priority = String(body.priority || 'medium').trim().toLowerCase()

    if (!userId || !message) {
      return NextResponse.json(
        { message: 'user_id and message are required.' },
        { status: 400 },
      )
    }

    const result = await pool.query(
      `INSERT INTO notifications (user_id, message, priority)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, message, priority, created_at`,
      [userId, message, priority],
    )

    emitSocketEvent('notification:new', result.rows[0], `user:${userId}`)
    emitSocketEvent('dashboard:refresh', { scope: 'student', studentId: userId }, `user:${userId}`)

    return NextResponse.json({ item: result.rows[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to create notification.', detail: error.message },
      { status: 500 },
    )
  }
}
