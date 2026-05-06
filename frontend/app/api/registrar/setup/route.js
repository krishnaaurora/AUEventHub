export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import {
  ensureStudentEventCollections,
  ensureAuthCollections,
  getEventsCollection,
  getEventDetailsCollection,
  getEventApprovalsCollection,
  getEventAiDataCollection,
  getEventTrendingCollection,
  getUsersCollection,
} from '../../_lib/db'
import { requireRegistrarAccess } from '../_lib/auth'

export async function POST() {
  try {
    const auth = await requireRegistrarAccess()
    if (auth.response) return auth.response

    await ensureStudentEventCollections()
    await ensureAuthCollections()

    const eventsCol = await getEventsCollection()
    const detailsCol = await getEventDetailsCollection()
    const approvalsCol = await getEventApprovalsCollection()
    const aiDataCol = await getEventAiDataCollection()
    const trendingCol = await getEventTrendingCollection()
    const usersCol = await getUsersCollection()

    // Ensure registrar user exists
    const registrarEmail = 'registrar@aurora.edu.in'
    const existingRegistrar = await usersCol.findOne({ email: registrarEmail })
    if (!existingRegistrar) {
      await usersCol.insertOne({
        fullName: 'Dr. Priya Sharma',
        email: registrarEmail,
        password: 'Registrar@123',
        role: 'registrar',
        registrationId: 'AU-REG-001',
        department: 'Administration',
        avatar: '/assets/avatars/person1.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    return NextResponse.json({
      message: 'Registrar setup completed successfully.',
      collections: ['events', 'event_details', 'event_approvals', 'event_ai_data', 'event_trending', 'users']
    })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to setup registrar.', detail: error.message },
      { status: 500 }
    )
  }
}