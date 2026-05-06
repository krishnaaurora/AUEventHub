export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { ensureStudentEventCollections, getAiRecommendationsCollection } from '../../_lib/db'
import { emitSocketEvent } from '../../../../server/socket'

export async function GET(request) {
  try {
    await ensureStudentEventCollections()
    const collection = await getAiRecommendationsCollection()
    const { searchParams } = new URL(request.url)
    const studentId = String(searchParams.get('student_id') || '').trim()

    if (!studentId) {
      return NextResponse.json({ message: 'student_id is required.' }, { status: 400 })
    }

    const item = await collection.findOne({ student_id: studentId })
    return NextResponse.json(item || { student_id: studentId, recommended_events: [] })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch AI recommendations.', detail: error.message },
      { status: 500 },
    )
  }
}

export async function POST(request) {
  try {
    await ensureStudentEventCollections()
    const collection = await getAiRecommendationsCollection()
    const body = await request.json()

    const studentId = String(body.student_id || '').trim()
    const recommendedEvents = Array.isArray(body.recommended_events)
      ? body.recommended_events.map((id) => String(id).trim()).filter(Boolean)
      : []

    if (!studentId) {
      return NextResponse.json({ message: 'student_id is required.' }, { status: 400 })
    }

    await collection.updateOne(
      { student_id: studentId },
      {
        $set: {
          student_id: studentId,
          recommended_events: recommendedEvents,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )

    const payload = {
      student_id: studentId,
      recommended_events: recommendedEvents,
      updatedAt: new Date(),
    }

    emitSocketEvent('ai-recommendations:updated', payload)
    emitSocketEvent('ai-recommendations:updated', payload, `user:${studentId}`)

    return NextResponse.json({ message: 'AI recommendations saved.', item: payload }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to save AI recommendations.', detail: error.message },
      { status: 500 },
    )
  }
}
