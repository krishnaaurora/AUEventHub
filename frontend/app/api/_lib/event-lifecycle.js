import {
  ensureStudentEventCollections,
  getEventsCollection,
  getEventApprovalsCollection,
  getEventAiDataCollection,
  getEventReportsCollection,
  getNotificationsCollection,
} from './db.js'
import { ensureStudentTransactionTables, getPool } from './pg.js'

const ACTIVE_EVENT_STATUSES = ['published', 'completed']

function todayYmd() {
  return new Date().toISOString().slice(0, 10)
}

function parseYmd(value) {
  if (!value) return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

function resolveNextStatus(event, approval) {
  const status = String(event.status || '').trim().toLowerCase()

  if (status === 'draft') {
    if (event.submitted_for_approval || event.submitted_at || approval) {
      return 'pending_dean'
    }
    return status
  }

  if (status === 'pending' || status === 'pending_dean') {
    if (approval?.dean_status === 'approved') {
      return 'pending_registrar'
    }
    return 'pending_dean'
  }

  if (status === 'pending_registrar') {
    if (approval?.registrar_status === 'approved') {
      return 'pending_vc'
    }
    return status
  }

  if (status === 'pending_vc') {
    if (approval?.vc_status === 'approved') {
      return 'published'
    }
    return status
  }

  if (status === 'approved') {
    // Backward compatibility for legacy state naming.
    return 'published'
  }

  if (status === 'published') {
    const endDate = parseYmd(event.end_date || event.date)
    if (endDate) {
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      if (endDate < now) {
        return 'completed'
      }
    }
  }

  return status
}

async function upsertLifecycleNotification(notificationsCol, event, nextStatus) {
  const statusTitleMap = {
    pending_dean: 'Event Submitted',
    pending_registrar: 'Event Cleared by Dean',
    pending_vc: 'Event Cleared by Registrar',
    published: 'Event Published',
    completed: 'Event Completed',
  }

  const statusMessageMap = {
    pending_dean: `Event \"${event.title}\" moved to Dean review queue.`,
    pending_registrar: `Event \"${event.title}\" moved to Registrar review queue.`,
    pending_vc: `Event \"${event.title}\" moved to VC final review queue.`,
    published: `Event \"${event.title}\" is now published for students.`,
    completed: `Event \"${event.title}\" has been marked as completed.`,
  }

  if (!statusTitleMap[nextStatus]) return

  const doc = {
    user_id: event.organizer_id || 'all',
    role: 'system',
    title: statusTitleMap[nextStatus],
    message: statusMessageMap[nextStatus],
    type: 'event_lifecycle',
    event_id: String(event._id),
    is_read: false,
    created_at: new Date().toISOString(),
  }

  await notificationsCol.insertOne(doc)
}

async function upsertEventReports({ events, reportsCol, pool }) {
  if (!events.length) return { reportsUpserted: 0 }

  const eventIds = events.map((event) => String(event._id))

  const [registrations, attendance] = await Promise.all([
    pool.query(
      `SELECT event_id, COUNT(*)::int AS total
       FROM registrations
       WHERE event_id = ANY($1)
       GROUP BY event_id`,
      [eventIds],
    ),
    pool.query(
      `SELECT event_id, COUNT(*)::int AS total
       FROM attendance
       WHERE event_id = ANY($1) AND LOWER(status) = 'present'
       GROUP BY event_id`,
      [eventIds],
    ),
  ])

  const registrationsByEvent = new Map(
    registrations.rows.map((row) => [String(row.event_id), Number(row.total || 0)]),
  )
  const attendanceByEvent = new Map(
    attendance.rows.map((row) => [String(row.event_id), Number(row.total || 0)]),
  )

  let upserts = 0
  for (const event of events) {
    const id = String(event._id)
    const totalRegistrations = registrationsByEvent.get(id) || 0
    const totalAttendance = attendanceByEvent.get(id) || 0
    const attendanceRate =
      totalRegistrations > 0 ? Math.round((totalAttendance / totalRegistrations) * 100) : 0

    await reportsCol.updateOne(
      { event_id: id },
      {
        $set: {
          event_id: id,
          total_registrations: totalRegistrations,
          total_attendance: totalAttendance,
          attendance_rate: attendanceRate,
          top_department: event.department || 'N/A',
          feedback_score: Number(event.feedback_score || 0),
          generated_at: todayYmd(),
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )
    upserts += 1
  }

  return { reportsUpserted: upserts }
}

export async function runEventLifecycleAutomation() {
  await ensureStudentEventCollections()
  await ensureStudentTransactionTables()

  const eventsCol = await getEventsCollection()
  const approvalsCol = await getEventApprovalsCollection()
  const aiDataCol = await getEventAiDataCollection()
  const notificationsCol = await getNotificationsCollection()
  const reportsCol = await getEventReportsCollection()
  const pool = getPool()

  const lifecycleCandidates = await eventsCol
    .find({
      status: {
        $in: [
          'draft',
          'pending',
          'pending_dean',
          'pending_registrar',
          'pending_vc',
          'approved',
          'published',
        ],
      },
    })
    .toArray()

  const transitions = []

  for (const event of lifecycleCandidates) {
    const eventId = String(event._id)
    const approval = await approvalsCol.findOne({
      $or: [{ event_id: eventId }, { event_id: event._id }],
    })

    const currentStatus = String(event.status || '').trim().toLowerCase()
    const nextStatus = resolveNextStatus(event, approval)

    if (nextStatus === currentStatus) {
      continue
    }

    const update = {
      status: nextStatus,
      updatedAt: new Date(),
    }

    if (nextStatus === 'published' && !event.published_at) {
      update.published_at = new Date().toISOString()
    }

    if (nextStatus === 'completed') {
      update.completed_at = new Date().toISOString()
    }

    await eventsCol.updateOne({ _id: event._id }, { $set: update })

    await aiDataCol.updateOne(
      { event_id: eventId },
      {
        $set: {
          approval_stage: nextStatus,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          event_id: eventId,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )

    await upsertLifecycleNotification(notificationsCol, event, nextStatus)

    transitions.push({ event_id: eventId, from: currentStatus, to: nextStatus })
  }

  const activeEvents = await eventsCol.find({ status: { $in: ACTIVE_EVENT_STATUSES } }).toArray()
  const reportSummary = await upsertEventReports({ events: activeEvents, reportsCol, pool })

  const summary = {
    ok: true,
    transitioned: transitions.length,
    transitions,
    reportsUpserted: reportSummary.reportsUpserted,
  }

  await notificationsCol.insertOne({
    user_id: 'admin@aurora.edu.in',
    role: 'admin',
    title: 'Lifecycle Automation Run',
    message: `Lifecycle automation completed with ${summary.transitioned} transitions and ${summary.reportsUpserted} report updates.`,
    type: 'lifecycle_summary',
    event_id: null,
    is_read: false,
    created_at: new Date().toISOString(),
    meta: summary,
  })

  return summary
}
