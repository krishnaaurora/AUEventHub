// Script to insert and approve an event for testing the full approval flow
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb+srv://AUeventmanager:Jai2005@cluster0.zngygka.mongodb.net/?appName=Cluster0';
const dbName = 'ai_eventmang';

async function main() {
  const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
  try {
    await client.connect();
    const db = client.db(dbName);
    const events = db.collection('events');
    const approvals = db.collection('event_approvals');

    // 1. Insert event as organizer
    const event = {
      title: 'AMARTIN 2026',
      category: 'Cultural',
      venue: 'Main Auditorium',
      start_date: '2026-04-01',
      end_date: '2026-04-01',
      start_time: '10:00',
      end_time: '18:00',
      organizer: 'Dummy Organizer',
      organizer_id: 'org-dummy',
      description: 'Annual Martin Festival Dummy',
      seats: 500,
      max_participants: 500,
      registered_count: 0,
      status: 'pending',
      department: 'Cultural',
      created_at: new Date().toISOString().slice(0, 10),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await events.insertOne(event);
    const eventId = result.insertedId;
    console.log('Inserted event with ID:', eventId);

    // 2. Approve as Dean
    await approvals.insertOne({
      event_id: eventId,
      dean_status: 'approved',
      registrar_status: 'pending',
      vc_status: 'pending',
      submitted_at: new Date(),
    });
    await events.updateOne({ _id: eventId }, { $set: { status: 'dean_approved' } });
    console.log('Dean approved event.');

    // 3. Approve as Registrar
    await approvals.updateOne({ event_id: eventId }, { $set: { registrar_status: 'approved' } });
    await events.updateOne({ _id: eventId }, { $set: { status: 'registrar_approved' } });
    console.log('Registrar approved event.');

    // 4. Approve as VC
    await approvals.updateOne({ event_id: eventId }, { $set: { vc_status: 'approved' } });
    await events.updateOne({ _id: eventId }, { $set: { status: 'approved' } });
    console.log('VC approved event.');

    // 5. Check if event is visible to students
    const approvedEvent = await events.findOne({ _id: eventId, status: 'approved' });
    if (approvedEvent) {
      console.log('Event is now visible to students:', approvedEvent.title);
    } else {
      console.log('Event is NOT visible to students.');
    }
  } finally {
    await client.close();
  }
}

main().catch(console.error);
