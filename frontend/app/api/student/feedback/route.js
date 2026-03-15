import { NextResponse } from 'next/server'
import { ensureStudentEventCollections, getFeedbackCollection } from '../../_lib/db'

function toPositiveInt(value, fallback) {
  const num = Number.parseInt(value, 10)
  return Number.isFinite(num) && num > 0 ? num : fallback
}

export async function GET(request) {
  try {
    await ensureStudentEventCollections()
    const collection = await getFeedbackCollection()
    const { searchParams } = new URL(request.url)

    const eventId = String(searchParams.get('event_id') || '').trim()
    const studentId = String(searchParams.get('student_id') || '').trim()
    const limit = toPositiveInt(searchParams.get('limit'), 50)

    const query = {}
    if (eventId) {
      query.event_id = eventId
    }
    if (studentId) {
      query.student_id = studentId
    }

    const items = await collection.find(query).sort({ createdAt: -1 }).limit(limit).toArray()
    return NextResponse.json({ items })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch feedback.', detail: error.message },
      { status: 500 },
    )
  }
}

export async function POST(request) {
  try {
    await ensureStudentEventCollections()
    const collection = await getFeedbackCollection()
    const body = await request.json()

    const studentId = String(body.student_id || '').trim()
    const eventId = String(body.event_id || '').trim()
    const rating = Number(body.rating)
    const comment = String(body.comment || '').trim()

    if (!studentId || !eventId) {
      return NextResponse.json(
        { message: 'student_id and event_id are required.' },
        { status: 400 },
      )
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ message: 'rating must be between 1 and 5.' }, { status: 400 })
    }

    const result = await collection.insertOne({
      student_id: studentId,
      event_id: eventId,
      rating,
      comment,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json(
      { message: 'Feedback submitted successfully.', id: result.insertedId },
      { status: 201 },
    )
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to submit feedback.', detail: error.message },
      { status: 500 },
    )
  }
}
