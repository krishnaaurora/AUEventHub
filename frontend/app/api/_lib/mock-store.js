import 'mingo/init/system'
import { Aggregator, Query } from 'mingo'
import { ObjectId } from 'mongodb'

const DEMO_USERS = [
  {
    _id: '507f1f77bcf86cd799439011',
    fullName: 'Aurora Admin',
    email: 'admin@aurora.edu.in',
    password: 'admin123',
    role: 'admin',
    accountStatus: 'active',
    registrationId: 'ADMIN-0001',
    clubName: null,
    department: 'Administration',
    year: null,
    avatar: '/assets/avatars/person1.png',
    createdAt: '2026-03-01T09:00:00.000Z',
    updatedAt: '2026-03-01T09:00:00.000Z',
  },
  {
    _id: '507f1f77bcf86cd799439012',
    fullName: 'Demo Student',
    email: 'student@aurora.edu.in',
    password: 'Student@123',
    role: 'student',
    accountStatus: 'active',
    registrationId: 'AU-0001',
    clubName: null,
    department: 'Computer Science & Engineering',
    year: '3rd Year',
    avatar: '/assets/avatars/person1.png',
    createdAt: '2026-03-01T09:05:00.000Z',
    updatedAt: '2026-03-01T09:05:00.000Z',
  },
  {
    _id: '507f1f77bcf86cd799439013',
    fullName: 'Demo Organizer',
    email: 'organizer@aurora.edu.in',
    password: 'Organizer@123',
    role: 'organizer',
    accountStatus: 'active',
    registrationId: 'ORG-0001',
    clubName: 'Innovation Club',
    department: 'Computer Science & Engineering',
    year: null,
    avatar: '/assets/avatars/person1.png',
    createdAt: '2026-03-01T09:10:00.000Z',
    updatedAt: '2026-03-01T09:10:00.000Z',
  },
  {
    _id: '507f1f77bcf86cd799439014',
    fullName: 'Faculty Reviewer',
    email: 'faculty@aurora.edu.in',
    password: 'Faculty@123',
    role: 'faculty',
    accountStatus: 'active',
    registrationId: 'FAC-0001',
    clubName: null,
    department: 'Computer Science & Engineering',
    year: null,
    avatar: '/assets/avatars/person1.png',
    createdAt: '2026-03-01T09:15:00.000Z',
    updatedAt: '2026-03-01T09:15:00.000Z',
  },
  {
    _id: '507f1f77bcf86cd799439015',
    fullName: 'Dean Reviewer',
    email: 'dean@aurora.edu.in',
    password: 'Dean@123',
    role: 'dean',
    accountStatus: 'active',
    registrationId: 'DEAN-0001',
    clubName: null,
    department: 'Academic Affairs',
    year: null,
    avatar: '/assets/avatars/person1.png',
    createdAt: '2026-03-01T09:20:00.000Z',
    updatedAt: '2026-03-01T09:20:00.000Z',
  },
  {
    _id: '507f1f77bcf86cd799439016',
    fullName: 'Registrar Reviewer',
    email: 'registrar@aurora.edu.in',
    password: 'Registrar@123',
    role: 'registrar',
    accountStatus: 'active',
    registrationId: 'REG-0001',
    clubName: null,
    department: 'Administration',
    year: null,
    avatar: '/assets/avatars/person1.png',
    createdAt: '2026-03-01T09:25:00.000Z',
    updatedAt: '2026-03-01T09:25:00.000Z',
  },
  {
    _id: '507f1f77bcf86cd799439017',
    fullName: 'Vice Chancellor',
    email: 'vc@aurora.edu.in',
    password: 'VC@123',
    role: 'vc',
    accountStatus: 'active',
    registrationId: 'VC-0001',
    clubName: null,
    department: 'Executive Office',
    year: null,
    avatar: '/assets/avatars/person1.png',
    createdAt: '2026-03-01T09:30:00.000Z',
    updatedAt: '2026-03-01T09:30:00.000Z',
  },
]

const DEMO_EVENTS = [
  {
    _id: 'event123',
    title: 'AI Hackathon',
    category: 'Technical',
    venue: 'Main Auditorium',
    start_date: '2026-05-20',
    end_date: '2026-05-20',
    start_time: '10:00',
    end_time: '17:00',
    date: '2026-05-20',
    time: '10:00',
    organizer: 'CSE Department',
    organizer_name: 'Innovation Club',
    organizer_id: 'ORG-0001',
    department: 'Computer Science & Engineering',
    description: 'Collaborative AI hackathon with mentors and live judging.',
    seats: 200,
    max_participants: 200,
    registered_count: 120,
    status: 'published',
    poster: '/assets/hackthons.png',
    created_at: '2026-03-10',
    createdAt: '2026-03-10T10:00:00.000Z',
    updatedAt: '2026-03-14T10:00:00.000Z',
  },
  {
    _id: 'event124',
    title: 'Cybersecurity Kickstart',
    category: 'Technical',
    venue: 'Tech Lab 2',
    start_date: '2026-05-24',
    end_date: '2026-05-24',
    start_time: '09:30',
    end_time: '13:00',
    date: '2026-05-24',
    time: '09:30',
    organizer: 'Cyber Club',
    organizer_name: 'Cyber Club',
    organizer_id: 'ORG-0001',
    department: 'Information Technology',
    description: 'Workshop on security basics, CTF drills, and SOC practices.',
    seats: 120,
    max_participants: 120,
    registered_count: 74,
    status: 'approved',
    poster: '/assets/seminar.png',
    created_at: '2026-03-10',
    createdAt: '2026-03-10T10:30:00.000Z',
    updatedAt: '2026-03-14T10:30:00.000Z',
  },
  {
    _id: 'event125',
    title: 'Cultural Night 2026',
    category: 'Cultural',
    venue: 'Open Air Theatre',
    start_date: '2026-05-28',
    end_date: '2026-05-28',
    start_time: '18:00',
    end_time: '21:00',
    date: '2026-05-28',
    time: '18:00',
    organizer: 'Cultural Committee',
    organizer_name: 'Cultural Committee',
    organizer_id: 'ORG-0001',
    department: 'Humanities',
    description: 'Flagship cultural evening with music, dance, and theatre acts.',
    seats: 500,
    max_participants: 500,
    registered_count: 302,
    status: 'completed',
    poster: '/assets/galleryimage4.png',
    created_at: '2026-03-11',
    createdAt: '2026-03-11T08:00:00.000Z',
    updatedAt: '2026-03-14T08:00:00.000Z',
  },
  {
    _id: 'event126',
    title: 'Research Colloquium',
    category: 'Academic',
    venue: 'Seminar Hall 1',
    start_date: '2026-06-02',
    end_date: '2026-06-02',
    start_time: '11:00',
    end_time: '15:00',
    date: '2026-06-02',
    time: '11:00',
    organizer: 'ECE Department',
    organizer_name: 'ECE Department',
    organizer_id: 'ORG-0001',
    department: 'Electronics & Communication',
    description: 'Faculty and student paper presentations with panel review.',
    seats: 150,
    max_participants: 150,
    registered_count: 41,
    status: 'pending_dean',
    poster: '/assets/seminar.png',
    created_at: '2026-03-12',
    createdAt: '2026-03-12T11:00:00.000Z',
    updatedAt: '2026-03-14T11:00:00.000Z',
  },
  {
    _id: 'event127',
    title: 'Startup Pitch Day',
    category: 'Entrepreneurship',
    venue: 'Innovation Hub',
    start_date: '2026-06-10',
    end_date: '2026-06-10',
    start_time: '09:00',
    end_time: '14:00',
    date: '2026-06-10',
    time: '09:00',
    organizer: 'Entrepreneurship Cell',
    organizer_name: 'E-Cell',
    organizer_id: 'ORG-0001',
    department: 'Management',
    description: 'Student startup showcase and investor simulation day.',
    seats: 180,
    max_participants: 180,
    registered_count: 59,
    status: 'pending_registrar',
    poster: '/assets/hackthons.png',
    created_at: '2026-03-13',
    createdAt: '2026-03-13T09:30:00.000Z',
    updatedAt: '2026-03-14T09:30:00.000Z',
  },
  {
    _id: 'event128',
    title: 'Tech Expo 2026',
    category: 'Technical',
    venue: 'Convention Center',
    start_date: '2026-06-18',
    end_date: '2026-06-19',
    start_time: '10:00',
    end_time: '17:00',
    date: '2026-06-18',
    time: '10:00',
    organizer: 'Engineering Association',
    organizer_name: 'Engineering Association',
    organizer_id: 'ORG-0001',
    department: 'Mechanical Engineering',
    description: 'Two-day expo for prototypes, robotics, and project showcases.',
    seats: 350,
    max_participants: 350,
    registered_count: 144,
    status: 'pending_vc',
    poster: '/assets/galleryimage4.png',
    created_at: '2026-03-14',
    createdAt: '2026-03-14T12:00:00.000Z',
    updatedAt: '2026-03-14T12:00:00.000Z',
  },
]

const DEMO_EVENT_DETAILS = [
  {
    event_id: 'event123',
    speakers: ['Dr Kumar'],
    schedule: [
      { time: '10:00', activity: 'Opening' },
      { time: '11:00', activity: 'Hackathon Start' },
    ],
    instructions: 'Bring your laptop and ID card.',
    createdAt: '2026-03-10T10:00:00.000Z',
    updatedAt: '2026-03-10T10:00:00.000Z',
  },
  {
    event_id: 'event124',
    speakers: ['S. Raghav', 'K. Priya'],
    schedule: [
      { time: '09:30', activity: 'Security Basics' },
      { time: '10:30', activity: 'CTF Challenge' },
    ],
    instructions: 'Carry student ID and install Chrome browser.',
    createdAt: '2026-03-10T10:30:00.000Z',
    updatedAt: '2026-03-10T10:30:00.000Z',
  },
  {
    event_id: 'event128',
    speakers: ['Prof. Meera', 'Industry Panel'],
    schedule: [
      { time: '10:00', activity: 'Expo Opening' },
      { time: '12:00', activity: 'Prototype Review' },
    ],
    instructions: 'Set up stalls by 09:00 AM.',
    createdAt: '2026-03-14T12:00:00.000Z',
    updatedAt: '2026-03-14T12:00:00.000Z',
  },
]

const DEMO_APPROVALS = [
  { event_id: 'event123', dean_status: 'approved', registrar_status: 'approved', vc_status: 'approved', submitted_at: '2026-03-12', updatedAt: '2026-03-14T10:00:00.000Z' },
  { event_id: 'event124', dean_status: 'approved', registrar_status: 'approved', vc_status: 'approved', submitted_at: '2026-03-12', updatedAt: '2026-03-14T10:30:00.000Z' },
  { event_id: 'event125', dean_status: 'approved', registrar_status: 'approved', vc_status: 'approved', submitted_at: '2026-03-12', updatedAt: '2026-03-14T08:00:00.000Z' },
  { event_id: 'event126', dean_status: 'pending', registrar_status: 'pending', vc_status: 'pending', submitted_at: '2026-03-13', updatedAt: '2026-03-14T11:00:00.000Z' },
  { event_id: 'event127', dean_status: 'approved', registrar_status: 'pending', vc_status: 'pending', submitted_at: '2026-03-13', updatedAt: '2026-03-14T09:30:00.000Z' },
  { event_id: 'event128', dean_status: 'approved', registrar_status: 'approved', vc_status: 'pending', submitted_at: '2026-03-14', updatedAt: '2026-03-14T12:00:00.000Z' },
]

const DEMO_EVENT_AI_DATA = [
  { event_id: 'event123', organizer: 'CSE Department', organizer_id: 'ORG-0001', approval_stage: 'published', summary: 'Top engagement expected from CSE students.', createdAt: '2026-03-10T10:00:00.000Z', updatedAt: '2026-03-14T10:00:00.000Z' },
  { event_id: 'event127', organizer: 'Entrepreneurship Cell', organizer_id: 'ORG-0001', approval_stage: 'pending_registrar', summary: 'Pitch flow optimized for 12 teams.', createdAt: '2026-03-13T09:30:00.000Z', updatedAt: '2026-03-14T09:30:00.000Z' },
  { event_id: 'event128', organizer: 'Engineering Association', organizer_id: 'ORG-0001', approval_stage: 'pending_vc', summary: 'VC approval pending before public release.', createdAt: '2026-03-14T12:00:00.000Z', updatedAt: '2026-03-14T12:00:00.000Z' },
]

const DEMO_EVENT_VIEWS = [
  { event_id: 'event123', views: 120, registrations: 120, trending_score: 240, createdAt: '2026-03-10T10:00:00.000Z', updatedAt: '2026-03-14T10:00:00.000Z' },
  { event_id: 'event124', views: 90, registrations: 74, trending_score: 164, createdAt: '2026-03-10T10:30:00.000Z', updatedAt: '2026-03-14T10:30:00.000Z' },
  { event_id: 'event125', views: 120, registrations: 302, trending_score: 422, createdAt: '2026-03-11T08:00:00.000Z', updatedAt: '2026-03-14T08:00:00.000Z' },
  { event_id: 'event128', views: 140, registrations: 144, trending_score: 284, createdAt: '2026-03-14T12:00:00.000Z', updatedAt: '2026-03-14T12:00:00.000Z' },
]

const DEMO_EVENT_TRENDING = [
  { event_id: 'event125', score: 422, trending_score: 422, reason: 'High registrations' },
  { event_id: 'event128', score: 284, trending_score: 284, reason: 'Strong expo interest' },
  { event_id: 'event123', score: 240, trending_score: 240, reason: 'Strong technical engagement' },
  { event_id: 'event124', score: 164, trending_score: 164, reason: 'High student interest in security' },
]

const DEMO_FEEDBACK = [
  { _id: 'fbk-001', student_id: 'AU-0001', event_id: 'event123', rating: 5, comment: 'Great event', createdAt: '2026-03-14T13:00:00.000Z' },
  { _id: 'fbk-002', student_id: 'AU-0001', event_id: 'event125', rating: 4, comment: 'Loved the performances', createdAt: '2026-03-14T14:00:00.000Z' },
]

const DEMO_AI_RECOMMENDATIONS = [
  { student_id: 'AU-0001', recommended_events: ['event123', 'event124', 'event125'], updatedAt: '2026-03-14T10:00:00.000Z', createdAt: '2026-03-14T10:00:00.000Z' },
]

const DEMO_NOTIFICATIONS = [
  {
    _id: 'notif-001',
    user_id: 'ADMIN-0001',
    role: 'admin',
    title: 'Lifecycle Automation Run',
    message: 'Lifecycle automation completed with 3 transitions.',
    type: 'lifecycle_summary',
    is_read: false,
    created_at: '2026-03-15T08:00:00.000Z',
    meta: { transitioned: 3, reportsUpserted: 2 },
  },
  {
    _id: 'notif-002',
    user_id: 'AU-0001',
    role: 'student',
    title: 'Registration confirmed',
    message: 'Ticket for AI Hackathon is ready.',
    type: 'info',
    event_id: 'event123',
    priority: 'medium',
    is_read: false,
    created_at: '2026-03-15T08:10:00.000Z',
  },
]

const DEMO_EVENT_REPORTS = [
  {
    _id: 'report-001',
    event_id: 'event123',
    top_department: 'Computer Science & Engineering',
    generated_at: '2026-03-15T07:30:00.000Z',
  },
  {
    _id: 'report-002',
    event_id: 'event125',
    top_department: 'Humanities',
    generated_at: '2026-03-15T07:45:00.000Z',
  },
]

export const DEMO_SQL_SEED = {
  registrations: [
    ['AU-0001', 'event123', 'TKT-INIT-EVT123-000001', JSON.stringify({ ticketId: 'TKT-INIT-EVT123-000001', studentId: 'AU-0001', eventId: 'event123' }), 'confirmed'],
    ['AU-0001', 'event125', 'TKT-INIT-EVT125-000002', JSON.stringify({ ticketId: 'TKT-INIT-EVT125-000002', studentId: 'AU-0001', eventId: 'event125' }), 'confirmed'],
  ],
  attendance: [
    ['AU-0001', 'event123', 'present'],
  ],
  certificates: [
    ['AU-0001', 'event123', 'https://example.com/certificates/event123-demo.pdf'],
  ],
  notifications: [
    ['AU-0001', 'Registration confirmed for AI Hackathon. Ticket TKT-INIT-EVT123-000001 is ready.', 'medium'],
    ['AU-0001', 'Certificate issued for AI Hackathon.', 'low'],
  ],
}

function cloneValue(value) {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value)
  }
  return JSON.parse(JSON.stringify(value))
}

function normalizeValue(value) {
  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue)
  }

  if (value && typeof value === 'object') {
    if (typeof value.toHexString === 'function' || value?._bsontype === 'ObjectId') {
      return value.toString()
    }

    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, normalizeValue(inner)]))
  }

  return value
}

function sortDocs(items, sortSpec = {}) {
  const entries = Object.entries(sortSpec)
  if (entries.length === 0) {
    return items
  }

  return [...items].sort((left, right) => {
    for (const [field, direction] of entries) {
      const leftValue = normalizeValue(left?.[field])
      const rightValue = normalizeValue(right?.[field])
      if (leftValue === rightValue) {
        continue
      }
      if (leftValue == null) {
        return 1
      }
      if (rightValue == null) {
        return -1
      }
      if (leftValue > rightValue) {
        return direction < 0 ? -1 : 1
      }
      if (leftValue < rightValue) {
        return direction < 0 ? 1 : -1
      }
    }
    return 0
  })
}

function setByPath(target, path, value) {
  const parts = String(path).split('.')
  let ref = target
  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index]
    if (!ref[key] || typeof ref[key] !== 'object') {
      ref[key] = {}
    }
    ref = ref[key]
  }
  ref[parts[parts.length - 1]] = value
}

function getLiteralFilterShape(filter = {}) {
  const output = {}
  for (const [key, value] of Object.entries(filter)) {
    if (key.startsWith('$')) {
      continue
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const containsOperator = Object.keys(value).some((innerKey) => innerKey.startsWith('$'))
      if (containsOperator) {
        continue
      }
    }
    output[key] = normalizeValue(value)
  }
  return output
}

class MockCursor {
  constructor(items) {
    this.items = [...items]
  }

  sort(sortSpec) {
    this.items = sortDocs(this.items, sortSpec)
    return this
  }

  skip(amount = 0) {
    this.items = this.items.slice(amount)
    return this
  }

  limit(amount = 0) {
    if (amount > 0) {
      this.items = this.items.slice(0, amount)
    }
    return this
  }

  async toArray() {
    return cloneValue(this.items)
  }
}

function createMockCollection(name, store) {
  if (!store[name]) {
    store[name] = []
  }

  function getMatchedItems(filter = {}) {
    const matcher = new Query(normalizeValue(filter))
    return store[name].filter((item) => matcher.test(normalizeValue(item)))
  }

  return {
    find(filter = {}) {
      return new MockCursor(getMatchedItems(filter))
    },

    async findOne(filter = {}, options = {}) {
      let items = getMatchedItems(filter)
      if (options.sort) {
        items = sortDocs(items, options.sort)
      }
      return cloneValue(items[0] || null)
    },

    async countDocuments(filter = {}) {
      return getMatchedItems(filter).length
    },

    async insertOne(document) {
      const next = normalizeValue(cloneValue(document))
      next._id = next._id ? String(next._id) : new ObjectId().toString()
      store[name].push(next)
      return { insertedId: next._id }
    },

    async insertMany(documents) {
      const insertedIds = {}
      documents.forEach((document, index) => {
        const next = normalizeValue(cloneValue(document))
        next._id = next._id ? String(next._id) : new ObjectId().toString()
        store[name].push(next)
        insertedIds[index] = next._id
      })
      return { insertedCount: documents.length, insertedIds }
    },

    async updateOne(filter, update = {}, options = {}) {
      const current = getMatchedItems(filter)[0]
      if (current) {
        if (update.$set) {
          for (const [key, value] of Object.entries(update.$set)) {
            setByPath(current, key, normalizeValue(value))
          }
        }
        if (update.$inc) {
          for (const [key, value] of Object.entries(update.$inc)) {
            const currentValue = Number(current[key] || 0)
            current[key] = currentValue + Number(value || 0)
          }
        }
        return { matchedCount: 1, modifiedCount: 1 }
      }

      if (!options.upsert) {
        return { matchedCount: 0, modifiedCount: 0 }
      }

      const next = {
        ...getLiteralFilterShape(filter),
        ...(update.$setOnInsert ? normalizeValue(update.$setOnInsert) : {}),
        ...(update.$set ? normalizeValue(update.$set) : {}),
      }
      next._id = next._id ? String(next._id) : new ObjectId().toString()
      store[name].push(next)
      return { matchedCount: 0, modifiedCount: 0, upsertedId: next._id }
    },

    aggregate(pipeline = []) {
      const aggregator = new Aggregator(normalizeValue(pipeline), {
        collectionResolver: (collectionName) => normalizeValue(store[collectionName] || []),
      })
      const result = aggregator.run(normalizeValue(store[name] || []))
      return new MockCursor(result)
    },

    async createIndex() {
      return `${name}_mock_index`
    },
  }
}

function createMockMongoDatabase(store) {
  return {
    async command() {
      return { ok: 1 }
    },

    listCollections() {
      return {
        async toArray() {
          return Object.keys(store).map((name) => ({ name }))
        },
      }
    },

    async createCollection(name) {
      if (!store[name]) {
        store[name] = []
      }
      return createMockCollection(name, store)
    },

    collection(name) {
      return createMockCollection(name, store)
    },
  }
}

export function getMockMongoDatabase() {
  if (!globalThis.__aiEventMangMockMongoStore) {
    globalThis.__aiEventMangMockMongoStore = {
      users: cloneValue(DEMO_USERS),
      events: cloneValue(DEMO_EVENTS),
      event_details: cloneValue(DEMO_EVENT_DETAILS),
      event_approvals: cloneValue(DEMO_APPROVALS),
      event_views: cloneValue(DEMO_EVENT_VIEWS),
      ai_recommendations: cloneValue(DEMO_AI_RECOMMENDATIONS),
      event_trending: cloneValue(DEMO_EVENT_TRENDING),
      event_feedback: cloneValue(DEMO_FEEDBACK),
      event_ai_data: cloneValue(DEMO_EVENT_AI_DATA),
      notifications: cloneValue(DEMO_NOTIFICATIONS),
      event_reports: cloneValue(DEMO_EVENT_REPORTS),
    }
  }

  return createMockMongoDatabase(globalThis.__aiEventMangMockMongoStore)
}

export const MOCK_DB_MODE = !process.env.MONGODB_URI