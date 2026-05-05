export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import {
  ensureStudentEventCollections,
  getEventsCollection,
  getEventApprovalsCollection,
} from '../../_lib/db'
import { ensureStudentTransactionTables, getPool } from '../../_lib/pg'
import { requireVCAccess } from '../_lib/auth'

export async function GET() {
  try {
    const auth = await requireVCAccess()
    if (auth.response) return auth.response

    await ensureStudentEventCollections()
    await ensureStudentTransactionTables()

    const eventsCollection = await getEventsCollection()
    const approvalsCollection = await getEventApprovalsCollection()
    const pool = getPool()

    // Get VC approval statistics
    const [
      pendingEvents,
      publishedEvents,
      rejectedEvents,
      totalRegistrations,
    ] = await Promise.all([
      // Events pending VC approval (approved by dean and registrar)
      approvalsCollection.countDocuments({
        dean_status: 'approved',
        registrar_status: 'approved',
        vc_status: 'pending'
      }),

      // Events published by VC
      approvalsCollection.countDocuments({
        vc_status: 'approved'
      }),

      // Events rejected by VC
      approvalsCollection.countDocuments({
        vc_status: 'rejected'
      }),

      // Total registrations across all published events
      pool.query(`
        SELECT COUNT(*)::int as count 
        FROM registrations 
        WHERE status = 'confirmed'
      `).then(result => result.rows[0]?.count || 0)
    ])

    return NextResponse.json({
      pendingEvents,
      publishedEvents,
      rejectedEvents,
      totalRegistrations,
    })
  } catch (error) {
    console.error('VC stats error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}