import { NextResponse } from 'next/server'
import {
  ensureOrganizerEventCollections,
  getEventAiDataCollection,
  getEventApprovalsCollection,
  getEventDetailsCollection,
  getEventsCollection,
  getEventViewsCollection,
  getFeedbackCollection,
} from '../../_lib/db'

const seedEvent = {
  _id: 'event123',
  title: 'AI Hackathon',
  category: 'Technical',
  department: 'CSE',
  venue: 'Main Auditorium',
  start_date: '2026-05-20',
  end_date: '2026-05-21',
  start_time: '10:00',
  end_time: '18:00',
  organizer_id: 'org123',
  organizer: 'CSE Department',
  status: 'approved',
  registered_count: 120,
  created_at: '2026-03-12',
}

export async function POST() {
  try {
    await ensureOrganizerEventCollections()

    const eventsCollection = await getEventsCollection()
    const eventDetailsCollection = await getEventDetailsCollection()
    const eventAiDataCollection = await getEventAiDataCollection()
    const eventApprovalsCollection = await getEventApprovalsCollection()
    const eventViewsCollection = await getEventViewsCollection()
    const feedbackCollection = await getFeedbackCollection()

    const seeded = {
      events: 0,
      event_details: 0,
      event_ai_data: 0,
      event_approvals: 0,
      event_views: 0,
      event_feedback: 0,
    }

    const existingEvent = await eventsCollection.findOne({ _id: seedEvent._id })
    if (!existingEvent) {
      await eventsCollection.insertOne({
        ...seedEvent,
        createdAt: new Date('2026-03-12T00:00:00Z'),
        updatedAt: new Date('2026-03-12T00:00:00Z'),
      })
      seeded.events = 1
    }

    const existingDetails = await eventDetailsCollection.findOne({ event_id: seedEvent._id })
    if (!existingDetails) {
      await eventDetailsCollection.insertOne({
        event_id: seedEvent._id,
        speakers: ['Dr Kumar'],
        schedule: [
          { time: '10:00', activity: 'Opening keynote' },
          { time: '11:00', activity: 'Hackathon kickoff' },
        ],
        instructions: 'Bring your laptop and student ID.',
        createdAt: new Date('2026-03-12T00:00:00Z'),
        updatedAt: new Date('2026-03-12T00:00:00Z'),
      })
      seeded.event_details = 1
    }

    const existingAiData = await eventAiDataCollection.findOne({ event_id: seedEvent._id })
    if (!existingAiData) {
      await eventAiDataCollection.insertOne({
        event_id: seedEvent._id,
        organizer_id: seedEvent.organizer_id,
        organizer: seedEvent.organizer,
        generated_description: 'Join us for AI Hackathon, a technical event designed to help students build practical AI solutions.',
        description_source: 'seed',
        clash_result: { hasClash: false, message: 'No scheduling conflicts found.' },
        approval_letter: 'Sample approval letter generated for AI Hackathon.',
        createdAt: new Date('2026-03-12T00:00:00Z'),
        updatedAt: new Date('2026-03-12T00:00:00Z'),
      })
      seeded.event_ai_data = 1
    }

    const existingApproval = await eventApprovalsCollection.findOne({ event_id: seedEvent._id })
    if (!existingApproval) {
      await eventApprovalsCollection.insertOne({
        event_id: seedEvent._id,
        dean_status: 'approved',
        registrar_status: 'approved',
        vc_status: 'approved',
        submitted_at: '2026-03-12',
        createdAt: new Date('2026-03-12T00:00:00Z'),
        updatedAt: new Date('2026-03-12T00:00:00Z'),
      })
      seeded.event_approvals = 1
    }

    const existingViews = await eventViewsCollection.findOne({ event_id: seedEvent._id })
    if (!existingViews) {
      await eventViewsCollection.insertOne({
        event_id: seedEvent._id,
        views: 120,
        registrations: Number(seedEvent.registered_count || 0),
        trending_score: 120 + Number(seedEvent.registered_count || 0),
        createdAt: new Date('2026-03-12T00:00:00Z'),
        updatedAt: new Date('2026-03-12T00:00:00Z'),
      })
      seeded.event_views = 1
    }

    const feedbackCount = await feedbackCollection.countDocuments({ event_id: seedEvent._id })
    if (feedbackCount === 0) {
      await feedbackCollection.insertMany([
        {
          event_id: seedEvent._id,
          organizer_id: seedEvent.organizer_id,
          author_name: 'Organizer Seed',
          feedback_type: 'organizer_note',
          comment: 'Initial organizer setup complete. Ready for approval workflow.',
          created_at: '2026-03-12',
          createdAt: new Date('2026-03-12T00:00:00Z'),
          updatedAt: new Date('2026-03-12T00:00:00Z'),
        },
      ])
      seeded.event_feedback = 1
    }

    return NextResponse.json({
      ok: true,
      message: 'Organizer MongoDB collections are ready.',
      collections: ['events', 'event_details', 'event_ai_data', 'event_approvals', 'event_views', 'event_feedback'],
      seeded,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: 'Failed to initialize organizer MongoDB collections.', detail: error.message },
      { status: 500 },
    )
  }
}