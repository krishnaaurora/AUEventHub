import { MongoClient } from 'mongodb'

const uri = 'mongodb+srv://jaikrishna_7_mongo:Jai2005.7.@cluster0.zngygka.mongodb.net/'
const dbName = 'AUeventhub_db'

async function fixStatus() {
  const client = new MongoClient(uri)
  await client.connect()

  try {
    const db = client.db(dbName)
    const events = db.collection('events')
    await events.updateOne({ _id: 'event_aucinema_1773398702108' }, { $set: { status: 'approved' } })
    console.log('Updated status to approved')
  } finally {
    await client.close()
  }
}

fixStatus().catch(console.error)