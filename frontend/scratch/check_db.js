import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'ai_eventmang';

async function testConnection() {
  console.log('--- DB TEST START ---');
  console.log('URI:', uri ? 'Configured' : 'MISSING');
  console.log('DB Name:', dbName);

  if (!uri) {
    console.log('ERROR: MONGODB_URI is missing in .env.local');
    return;
  }

  const client = new MongoClient(uri);

  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully!');

    const db = client.db(dbName);
    const usersCollection = db.collection('users');
    
    console.log('Fetching users...');
    const users = await usersCollection.find({}, { projection: { password: 1, email: 1, role: 1 } }).toArray();
    
    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
      console.log(`- ${u.email} (${u.role}): ${u.password}`);
    });

  } catch (err) {
    console.error('Connection failed:', err.message);
  } finally {
    await client.close();
    console.log('--- DB TEST END ---');
  }
}

testConnection();
