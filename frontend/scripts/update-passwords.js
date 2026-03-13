import { MongoClient } from 'mongodb'

const uri = 'mongodb+srv://jaikrishna_7_mongo:Jai2005.7.@cluster0.zngygka.mongodb.net/'
const dbName = 'AUeventhub_db'

async function updatePasswords() {
  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(dbName)
  await db.collection('users').updateMany({}, { $set: { password: 'password123' } })
  console.log('Updated all passwords to password123')
  await client.close()
}

updatePasswords().catch(console.error)