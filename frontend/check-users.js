import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: '.env.local' })

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB

async function checkUsers() {
  if (!uri) {
    console.error('No MONGODB_URI found in .env.local')
    return
  }

  const client = new MongoClient(uri)
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    const db = client.db(dbName)
    const users = await db.collection('users').find({}).toArray()
    
    console.log(`Found ${users.length} users in database: ${dbName}`)
    users.forEach(u => {
      console.log(`- Email: ${u.email}, Password: ${u.password}, Role: ${u.role}`)
    })
  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await client.close()
  }
}

checkUsers()
