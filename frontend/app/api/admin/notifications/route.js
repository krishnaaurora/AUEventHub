export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { ensureStudentEventCollections, getNotificationsCollection } from '../../_lib/db'
import { requireAdminAccess } from '../_lib/auth'

export async function GET() {
  try {
    const auth = await requireAdminAccess()
    if (auth.response) return auth.response

    await ensureStudentEventCollections()
    const notificationsCollection = await getNotificationsCollection()

    const notifications = await notificationsCollection
      .find({
        $or: [
          { role: 'admin' },
          { user_id: 'admin@aurora.edu.in' },
          { user_id: auth.session.user.email || '' },
          { user_id: 'all' },
        ],
      })
      .sort({ created_at: -1 })
      .limit(100)
      .toArray()

    return NextResponse.json({
      items: notifications.map((item) => ({
        ...item,
        _id: String(item._id),
      })),
    })
  } catch (error) {
    console.error('Admin notifications error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
