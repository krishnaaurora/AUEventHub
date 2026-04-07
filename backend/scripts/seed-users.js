import 'dotenv/config'
import { MongoClient } from 'mongodb'

const uri = 'mongodb+srv://jaikrishna_7_mongo:Jai2005.7.@cluster0.zngygka.mongodb.net/'
const dbName = 'AUeventhub_db'

async function seedUsers() {
  const client = new MongoClient(uri)
  await client.connect()

  try {
    const db = client.db(dbName)
    const users = db.collection('users')

    const usersToInsert = [
      {
        fullName: 'John Organizer',
        email: 'organizer@aurora.edu.in',
        password: 'password123',
        role: 'organizer',
        accountStatus: 'active',
        registrationId: 'ORG001',
        department: null,
        year: null,
        avatar: '/assets/avatars/person1.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        fullName: 'Jane Registrar',
        email: 'registrar@aurora.edu.in',
        password: 'password123',
        role: 'registrar',
        accountStatus: 'active',
        registrationId: null,
        department: null,
        year: null,
        avatar: '/assets/avatars/person2.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        fullName: 'Bob Dean',
        email: 'dean@aurora.edu.in',
        password: 'password123',
        role: 'dean',
        accountStatus: 'active',
        registrationId: null,
        department: null,
        year: null,
        avatar: '/assets/avatars/person3.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        fullName: 'Alice VC',
        email: 'vc@aurora.edu.in',
        password: 'password123',
        role: 'vc',
        accountStatus: 'active',
        registrationId: null,
        department: null,
        year: null,
        avatar: '/assets/avatars/person4.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        fullName: 'Student One',
        email: 'student@aurora.edu.in',
        password: 'password123',
        role: 'student',
        accountStatus: 'active',
        registrationId: 'STU001',
        department: 'Computer Science & Engineering',
        year: '3rd Year',
        avatar: '/assets/avatars/person5.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    for (const user of usersToInsert) {
      const existing = await users.findOne({ email: user.email })
      if (!existing) {
        await users.insertOne(user)
        console.log(`Inserted ${user.email}`)
      } else {
        console.log(`${user.email} already exists`)
      }
    }

    console.log('Seeding complete')
  } finally {
    await client.close()
  }
}

seedUsers().catch(console.error)