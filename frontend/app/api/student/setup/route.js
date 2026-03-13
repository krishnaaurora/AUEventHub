import { NextResponse } from 'next/server'
import {
  ensureStudentEventCollections,
  getAiRecommendationsCollection,
  getEventApprovalsCollection,
  getEventDetailsCollection,
  getEventsCollection,
  getEventTrendingCollection,
  getEventViewsCollection,
  getFeedbackCollection,
} from '../../_lib/db'
import { emitSocketEvent } from '../../../../server/socket'

const seedEvents = [
  {
    _id: 'event123',
    title: 'AI Hackathon',
    category: 'Technical',
    venue: 'Main Auditorium',
    date: '2026-05-20',
    time: '10:00',
    organizer: 'CSE Department',
    description: 'AI Hackathon event',
    seats: 200,
    registered_count: 120,
    status: 'approved',
    poster: '/assets/hackthons.png',
  },
  {
    _id: 'event124',
    title: 'Cybersecurity Kickstart',
    category: 'Technical',
    venue: 'Tech Lab 2',
    date: '2026-05-24',
    time: '09:30',
    organizer: 'Cyber Club',
    description: 'Introductory cybersecurity workshop with live practical sessions.',
    seats: 120,
    registered_count: 74,
    status: 'approved',
    poster: '/assets/seminar.png',
  },
  {
    _id: 'event125',
    title: 'Cultural Night 2026',
    category: 'Cultural',
    venue: 'Open Air Theatre',
    date: '2026-05-28',
    time: '18:00',
    organizer: 'Cultural Committee',
    description: 'Flagship cultural evening with music, dance, and drama.',
    seats: 500,
    registered_count: 302,
    status: 'approved',
    poster: '/assets/galleryimage4.png',
  },
]

const seedEventDetails = [
  {
    event_id: 'event123',
    speakers: ['Dr Kumar'],
    schedule: [
      { time: '10:00', activity: 'Opening' },
      { time: '11:00', activity: 'Hackathon Start' },
    ],
    instructions: 'Bring laptop',
  },
  {
    event_id: 'event124',
    speakers: ['S. Raghav', 'K. Priya'],
    schedule: [
      { time: '09:30', activity: 'Security Basics' },
      { time: '10:30', activity: 'CTF Challenge' },
    ],
    instructions: 'Carry student ID and install Chrome browser',
  },
]

const seedAiRecommendations = {
  student_id: 'AU-2024-CS-145',
  recommended_events: ['event123', 'event124', 'event125'],
}

const seedTrending = [
  {
    event_id: 'event125',
    score: 422,
    trending_score: 422,
    reason: 'High registrations',
  },
  {
    event_id: 'event123',
    score: 240,
    trending_score: 240,
    reason: 'Strong technical engagement',
  },
  {
    event_id: 'event124',
    score: 164,
    trending_score: 164,
    reason: 'High student interest in security',
  },
]

const seedApprovals = [
  {
    event_id: 'event123',
    dean_status: 'approved',
    registrar_status: 'approved',
    vc_status: 'approved',
    submitted_at: '2026-03-12',
  },
  {
    event_id: 'event124',
    dean_status: 'approved',
    registrar_status: 'approved',
    vc_status: 'approved',
    submitted_at: '2026-03-12',
  },
  {
    event_id: 'event125',
    dean_status: 'approved',
    registrar_status: 'approved',
    vc_status: 'approved',
    submitted_at: '2026-03-12',
  },
]

const seedViews = [
  {
    event_id: 'event123',
    views: 120,
    registrations: 120,
    trending_score: 240,
  },
  {
    event_id: 'event124',
    views: 90,
    registrations: 74,
    trending_score: 164,
  },
  {
    event_id: 'event125',
    views: 120,
    registrations: 302,
    trending_score: 422,
  },
]

const seedFeedback = [
  {
    student_id: 'AU-2024-CS-145',
    event_id: 'event123',
    rating: 5,
    comment: 'Great event',
  },
]

export async function POST() {
  try {
    await ensureStudentEventCollections()

    const eventsCollection = await getEventsCollection()
    const detailsCollection = await getEventDetailsCollection()
    const recommendationsCollection = await getAiRecommendationsCollection()
    const trendingCollection = await getEventTrendingCollection()
    const approvalsCollection = await getEventApprovalsCollection()
    const viewsCollection = await getEventViewsCollection()
    const feedbackCollection = await getFeedbackCollection()

    const eventsCount = await eventsCollection.countDocuments({})
    const seeded = {
      events: 0,
      event_details: 0,
      ai_recommendations: 0,
      event_approvals: 0,
      event_views: 0,
      event_trending: 0,
      feedback: 0,
    }

    if (eventsCount === 0) {
      await eventsCollection.insertMany(
        seedEvents.map((item) => ({
          ...item,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      )
      seeded.events = seedEvents.length

      await detailsCollection.insertMany(
        seedEventDetails.map((item) => ({
          ...item,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      )
      seeded.event_details = seedEventDetails.length

      await recommendationsCollection.updateOne(
        { student_id: seedAiRecommendations.student_id },
        {
          $set: {
            ...seedAiRecommendations,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true },
      )
      seeded.ai_recommendations = 1

      await approvalsCollection.insertMany(
        seedApprovals.map((item) => ({
          ...item,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      )
      seeded.event_approvals = seedApprovals.length

      await viewsCollection.insertMany(
        seedViews.map((item) => ({
          ...item,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      )
      seeded.event_views = seedViews.length

      await trendingCollection.insertMany(
        seedTrending.map((item) => ({
          ...item,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      )
      seeded.event_trending = seedTrending.length

      await feedbackCollection.insertMany(
        seedFeedback.map((item) => ({
          ...item,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      )
      seeded.feedback = seedFeedback.length
    }

    emitSocketEvent('bulk-sync:completed', {
      scope: 'student-events',
      source: 'mongodb',
      collections: ['events', 'event_details', 'ai_recommendations', 'event_approvals', 'event_views', 'event_trending', 'feedback'],
      seeded,
    })
    emitSocketEvent('dashboard:refresh', {
      scope: 'student',
      type: 'bulk-sync',
      source: 'mongodb',
    })
    emitSocketEvent('dashboard:refresh', {
      scope: 'organizer',
      type: 'bulk-sync',
      source: 'mongodb',
    }, 'role:organizer')

    return NextResponse.json({
      ok: true,
      message: 'MongoDB student event collections are ready.',
      collections: ['events', 'event_details', 'ai_recommendations', 'event_approvals', 'event_views', 'event_trending', 'feedback'],
      seeded,
      note: eventsCount === 0
        ? 'Starter data inserted because collections were empty.'
        : 'Collections already had data. No seed data inserted.',
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to initialize MongoDB student event collections.',
        detail: error.message,
      },
      { status: 500 },
    )
  }
}
