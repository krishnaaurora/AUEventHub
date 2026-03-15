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
import { requireDeanSetupAccess } from '../_lib/auth'

export async function POST() {
  try {
    const auth = await requireDeanSetupAccess()
    if (auth.response) return auth.response

    await ensureStudentEventCollections()
    await ensureAuthCollections()

    const eventsCol = await getEventsCollection()
    const detailsCol = await getEventDetailsCollection()
    const approvalsCol = await getEventApprovalsCollection()
    const aiDataCol = await getEventAiDataCollection()
    const trendingCol = await getEventTrendingCollection()
    const usersCol = await getUsersCollection()

    // Ensure dean user exists
    const deanEmail = 'dean@aurora.edu.in'
    const existingDean = await usersCol.findOne({ email: deanEmail })
    if (!existingDean) {
      await usersCol.insertOne({
        fullName: 'Dr. Ramesh Kumar',
        email: deanEmail,
        password: 'Dean@123',
        role: 'dean',
        registrationId: 'AU-DEAN-001',
        department: 'Administration',
        avatar: '/assets/avatars/person1.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // Seed sample events pending dean approval
    const seedEvents = [
      {
        _id: 'dean_event_001',
        title: 'AI & Machine Learning Workshop',
        category: 'Workshop',
        department: 'Computer Science',
        venue: 'Seminar Hall A',
        start_date: '2026-03-20',
        end_date: '2026-03-20',
        start_time: '10:00',
        end_time: '16:00',
        description: 'An intensive workshop covering the latest trends in AI and ML.',
        organizer: 'Prof. Anita Sharma',
        organizer_id: 'AU-ORG-001',
        max_participants: 100,
        status: 'pending_dean',
        created_at: '2026-03-10',
        poster: '',
      },
      {
        _id: 'dean_event_002',
        title: 'Annual Cultural Fest - Aurora Nights',
        category: 'Cultural',
        department: 'All Departments',
        venue: 'Main Auditorium',
        start_date: '2026-04-05',
        end_date: '2026-04-07',
        start_time: '17:00',
        end_time: '22:00',
        description: 'Three-day cultural extravaganza featuring music, dance, and drama.',
        organizer: 'Cultural Club',
        organizer_id: 'AU-ORG-002',
        max_participants: 500,
        status: 'pending_dean',
        created_at: '2026-03-08',
        poster: '',
      },
      {
        _id: 'dean_event_003',
        title: 'National Hackathon 2026',
        category: 'Hackathon',
        department: 'Computer Science',
        venue: 'CS Lab Block',
        start_date: '2026-03-25',
        end_date: '2026-03-26',
        start_time: '09:00',
        end_time: '18:00',
        description: '24-hour national level hackathon with exciting prizes and industry mentors.',
        organizer: 'Tech Society',
        organizer_id: 'AU-ORG-003',
        max_participants: 200,
        status: 'pending_dean',
        created_at: '2026-03-09',
        poster: '',
      },
      {
        _id: 'dean_event_004',
        title: 'Guest Lecture: Future of Robotics',
        category: 'Guest Lecture',
        department: 'ECE',
        venue: 'Lecture Hall 3',
        start_date: '2026-03-18',
        end_date: '2026-03-18',
        start_time: '14:00',
        end_time: '16:00',
        description: 'A guest lecture by Dr. Vikram Rao on the advancements in robotics.',
        organizer: 'Dr. Meena Ravi',
        organizer_id: 'AU-ORG-004',
        max_participants: 150,
        status: 'pending_registrar',
        created_at: '2026-03-05',
        poster: '',
      },
      {
        _id: 'dean_event_005',
        title: 'Sports Day 2026',
        category: 'Sports',
        department: 'All Departments',
        venue: 'University Grounds',
        start_date: '2026-04-15',
        end_date: '2026-04-15',
        start_time: '08:00',
        end_time: '17:00',
        description: 'Annual sports day with track and field events, team competitions.',
        organizer: 'Sports Committee',
        organizer_id: 'AU-ORG-005',
        max_participants: 300,
        status: 'rejected',
        created_at: '2026-03-01',
        poster: '',
      },
    ]

    for (const event of seedEvents) {
      await eventsCol.updateOne(
        { _id: event._id },
        { $set: event, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      )
    }

    // Seed event details
    const seedDetails = [
      {
        event_id: 'dean_event_001',
        guest_speakers: 'Dr. Priya Nair (IIT Madras), Mr. Suresh K (Google AI)',
        instructions: 'Bring laptops with Python installed. Basic ML knowledge preferred.',
      },
      {
        event_id: 'dean_event_002',
        guest_speakers: 'Celebrity Judge Panel (TBA)',
        instructions: 'Participants must register through their department coordinators.',
      },
      {
        event_id: 'dean_event_003',
        guest_speakers: 'Industry mentors from Microsoft, Amazon, and Flipkart',
        instructions: 'Teams of 2-4 members. BYOD (Bring Your Own Device).',
      },
      {
        event_id: 'dean_event_004',
        guest_speakers: 'Dr. Vikram Rao (MIT Robotics Lab)',
        instructions: 'Open to all ECE and CSE students. Attendance is mandatory for ECE students.',
      },
      {
        event_id: 'dean_event_005',
        guest_speakers: 'Chief Guest: Sports Director, State University',
        instructions: 'Report to grounds by 7:30 AM. Wear college sports uniform.',
      },
    ]

    for (const detail of seedDetails) {
      await detailsCol.updateOne(
        { event_id: detail.event_id },
        { $set: { ...detail, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      )
    }

    // Seed approvals
    const seedApprovals = [
      {
        event_id: 'dean_event_001',
        dean_status: 'pending',
        registrar_status: 'pending',
        vc_status: 'pending',
        submitted_at: '2026-03-10',
      },
      {
        event_id: 'dean_event_002',
        dean_status: 'pending',
        registrar_status: 'pending',
        vc_status: 'pending',
        submitted_at: '2026-03-08',
      },
      {
        event_id: 'dean_event_003',
        dean_status: 'pending',
        registrar_status: 'pending',
        vc_status: 'pending',
        submitted_at: '2026-03-09',
      },
      {
        event_id: 'dean_event_004',
        dean_status: 'approved',
        registrar_status: 'pending',
        vc_status: 'pending',
        submitted_at: '2026-03-05',
        dean_reviewed_at: '2026-03-06T10:00:00.000Z',
      },
      {
        event_id: 'dean_event_005',
        dean_status: 'rejected',
        registrar_status: 'pending',
        vc_status: 'pending',
        submitted_at: '2026-03-01',
        dean_reviewed_at: '2026-03-02T14:00:00.000Z',
        dean_rejection_reason: 'Budget concerns and venue availability issues',
      },
    ]

    for (const approval of seedApprovals) {
      await approvalsCol.updateOne(
        { event_id: approval.event_id },
        { $set: { ...approval, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      )
    }

    // Seed AI data
    const seedAiData = [
      {
        event_id: 'dean_event_001',
        conflict_check: 'No venue conflicts detected',
        expected_participation: 'High',
        department_relevance: 'Computer Science — Highly Relevant',
        risk_level: 'Low',
        approval_stage: 'pending_dean',
      },
      {
        event_id: 'dean_event_002',
        conflict_check: 'No venue conflicts detected',
        expected_participation: 'Very High',
        department_relevance: 'All Departments — University-wide Event',
        risk_level: 'Medium',
        approval_stage: 'pending_dean',
      },
      {
        event_id: 'dean_event_003',
        conflict_check: 'Minor time overlap with Lab sessions on March 25',
        expected_participation: 'High',
        department_relevance: 'Computer Science — Core Event',
        risk_level: 'Low',
        approval_stage: 'pending_dean',
      },
      {
        event_id: 'dean_event_004',
        conflict_check: 'No conflicts detected',
        expected_participation: 'Moderate',
        department_relevance: 'ECE — Directly Relevant',
        risk_level: 'Low',
        approval_stage: 'pending_registrar',
      },
      {
        event_id: 'dean_event_005',
        conflict_check: 'Potential ground booking conflict with external event',
        expected_participation: 'High',
        department_relevance: 'All Departments',
        risk_level: 'High',
        approval_stage: 'rejected',
      },
    ]

    for (const ai of seedAiData) {
      await aiDataCol.updateOne(
        { event_id: ai.event_id },
        { $set: { ...ai, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      )
    }

    return NextResponse.json({
      message: 'Dean setup complete. 5 sample events seeded (3 pending, 1 approved, 1 rejected).',
    })
  } catch (error) {
    return NextResponse.json(
      { message: 'Dean setup failed.', detail: error.message },
      { status: 500 }
    )
  }
}
