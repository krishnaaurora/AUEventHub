import { MongoClient } from 'mongodb'

const uri = 'mongodb+srv://jaikrishna_7_mongo:Jai2005.7.@cluster0.zngygka.mongodb.net/'
const dbName = 'AUeventhub_db'

async function createEvent() {
  const client = new MongoClient(uri)
  await client.connect()

  try {
    const db = client.db(dbName)

    // Get organizer
    const users = db.collection('users')
    const organizer = await users.findOne({ email: 'organizer@aurora.edu.in' })
    if (!organizer) {
      console.error('Organizer not found')
      return
    }

    const eventId = 'event_aucinema_' + Date.now()

    // Create event
    const events = db.collection('events')
    const eventData = {
      _id: eventId,
      title: 'Au Cinema',
      category: 'Cultural',
      department: 'All Departments',
      venue: 'Main Auditorium',
      start_date: '2026-03-20',
      end_date: '2026-03-20',
      start_time: '18:00',
      end_time: '21:00',
      organizer: 'John Organizer',
      organizer_id: organizer._id.toString(),
      seats: 200,
      max_participants: 200,
      registered_count: 0,
      status: 'pending_dean',
      created_at: new Date().toISOString().split('T')[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await events.insertOne(eventData)
    console.log('Event created:', eventId)

    // Create event details
    const eventDetails = db.collection('event_details')
    await eventDetails.insertOne({
      event_id: eventId,
      speakers: ['Film Director John Doe'],
      schedule: [],
      instructions: 'Bring your student ID. Seating is first come first served.',
    })

    // Create AI data
    const eventAiData = db.collection('event_ai_data')
    await eventAiData.insertOne({
      event_id: eventId,
      organizer_id: organizer._id.toString(),
      organizer: 'John Organizer',
      generated_description: 'An exciting cinema event showcasing student films and documentaries.',
      description_source: 'manual',
      clash_result: null,
      approval_letter: '',
      approval_stage: 'pending_dean',
      inputs: {
        title: 'Au Cinema',
        category: 'Cultural',
        department: 'All Departments',
        venue: 'Main Auditorium',
        start_date: '2026-03-20',
        end_date: '2026-03-20',
        start_time: '18:00',
        end_time: '21:00',
        max_participants: '200',
      },
    })

    // Create approvals
    const eventApprovals = db.collection('event_approvals')
    await eventApprovals.insertOne({
      event_id: eventId,
      dean_status: 'pending',
      registrar_status: 'pending',
      vc_status: 'pending',
      submitted_at: new Date().toISOString().split('T')[0],
    })

    // Create views
    const eventViews = db.collection('event_views')
    await eventViews.insertOne({
      event_id: eventId,
      views: 0,
      registrations: 0,
    })

    console.log('All event data created successfully')

  } finally {
    await client.close()
  }
}

createEvent().catch(console.error)