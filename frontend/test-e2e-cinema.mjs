import { MongoClient } from 'mongodb';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function runTest() {
  console.log('--- STARTING E2E DB FLOW TEST ---');

  // 1. CONNECT TO MONGO
  const mdbStr = process.env.MONGODB_URI;
  if (!mdbStr) throw new Error('No MONGODB_URI found in .env.local');

  const client = new MongoClient(mdbStr);
  await client.connect();
  const db = client.db('student_events');

  const eventsCol = db.collection('events');
  const detailsCol = db.collection('event_details');
  const approvalsCol = db.collection('event_approvals');

  // 2. CREATE EVENT IN MONGO
  const newEventId = "aucine" + Date.now().toString().slice(-8); // unique id
  const today = new Date();
  const tmr = new Date(today);
  tmr.setDate(tmr.getDate() + 1);

  const eventDoc = {
    _id: newEventId, // simplified string ID
    title: "Au Cinema: Screening of Interstellar",
    category: "Cultural",
    department: "Media",
    venue: "Main Auditorium",
    start_date: today.toISOString().slice(0, 10), // Ongoing right now
    end_date: tmr.toISOString().slice(0, 10), // Ongoing until tomorrow
    start_time: "18:00",
    end_time: "21:00",
    organizer_id: "org1",
    organizer: "Film Club",
    status: "approved", // Fully approved
    registered_count: 0,
    created_at: today.toISOString()
  };

  await eventsCol.insertOne(eventDoc);
  console.log('✅ Inserted "Au Cinema" event into MongoDB:', newEventId);

  // insert approval detail so it counts as approved in approvals col
  await approvalsCol.insertOne({
    event_id: newEventId,
    dean_status: 'approved',
    registrar_status: 'approved',
    vc_status: 'approved'
  });

  // 3. CONNECT TO POSTGRES
  const pgStr = process.env.DATABASE_URL;
  if (!pgStr) throw new Error('No DATABASE_URL found');

  const pool = new pg.Pool({
    connectionString: pgStr,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined
  });

  // 4. TEST POSTGRES REGISTRATION
  const studentId = "student-test-01";
  const ticketId = "TKT-" + Math.random().toString(36).substr(2, 9).toUpperCase();

  await pool.query(
    'INSERT INTO registrations (student_id, event_id, ticket_id) VALUES ($1, $2, $3)',
    [studentId, newEventId, ticketId]
  );
  console.log('✅ Inserted registration into PostgreSQL:', ticketId);

  // Update registered count in Mongo to reflect the registration
  await eventsCol.updateOne({ _id: newEventId }, { $inc: { registered_count: 1 } });

  // 5. TEST CHECK-IN (ATTENDANCE) IN POSTGRES
  await pool.query(
    'INSERT INTO attendance (student_id, event_id, status) VALUES ($1, $2, $3)',
    [studentId, newEventId, 'attended']
  );
  console.log('✅ Inserted attendance (Check-in) into PostgreSQL for student:', studentId);

  // 6. VERIFY EVERYTHING
  const verifyEvent = await eventsCol.findOne({ _id: newEventId });
  console.log('\n--- VERIFICATION ---');
  console.log('MongoDB Event Title:', verifyEvent?.title);
  console.log('MongoDB Event Status:', verifyEvent?.status);
  console.log('MongoDB Registered Count:', verifyEvent?.registered_count);

  const verifyReg = await pool.query('SELECT * FROM registrations WHERE event_id = $1', [newEventId]);
  console.log('PostgreSQL Registrations Count:', verifyReg.rowCount);
  console.log('PostgreSQL Sample Ticket:', verifyReg.rows[0]?.ticket_id);

  const verifyAtt = await pool.query('SELECT * FROM attendance WHERE event_id = $1', [newEventId]);
  console.log('PostgreSQL Attendance Count:', verifyAtt.rowCount);
  console.log('PostgreSQL Sample Attendance Status:', verifyAtt.rows[0]?.status);

  console.log('\n✅ END TO END FLOW SUCCESSFUL & SAVED');

  await client.close();
  await pool.end();
}

runTest().catch(console.error);
