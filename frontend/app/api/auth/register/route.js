import { NextResponse } from 'next/server'
import { ensureAuthCollections, getUsersCollection } from '../../_lib/db'

const VALID_ROLES = new Set(['student', 'organizer', 'registrar', 'dean', 'vc'])

export async function POST(request) {
  try {
    const body = await request.json()
    const fullName = String(body.fullName || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    const role = String(body.role || '').trim().toLowerCase()
    const registrationId = String(body.registrationId || '').trim()
    const clubName = String(body.clubName || '').trim()
    const department = String(body.department || '').trim()
    const year = String(body.year || '').trim()
    const avatar = String(body.avatar || '').trim()

    if (!fullName || !email || !password || !role) {
      return NextResponse.json({ message: 'All fields are required.' }, { status: 400 })
    }

    if (!VALID_ROLES.has(role)) {
      return NextResponse.json({ message: 'Invalid role selection.' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters.' }, { status: 400 })
    }

    if ((role === 'student' || role === 'organizer') && !registrationId) {
      return NextResponse.json({ message: 'Registration ID is required for Student and Organizer.' }, { status: 400 })
    }

    await ensureAuthCollections()
    const usersCollection = await getUsersCollection()
    const existing = await usersCollection.findOne({ email })
    if (existing) {
      return NextResponse.json({ message: 'Email is already registered.' }, { status: 409 })
    }

    const inserted = await usersCollection.insertOne({
      fullName,
      email,
      password,
      role,
      accountStatus: 'active',
      registrationId: registrationId || null,
      clubName: clubName || null,
      department: department || (role === 'student' ? 'Computer Science & Engineering' : null),
      year: year || (role === 'student' ? '3rd Year' : null),
      avatar: avatar || '/assets/avatars/person1.png',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json(
      {
        message: 'Registration successful. Please log in.',
        user: {
          id: inserted.insertedId.toString(),
          fullName,
          email,
          role,
          accountStatus: 'active',
          registrationId: registrationId || null,
          clubName: clubName || null,
          department: department || (role === 'student' ? 'Computer Science & Engineering' : null),
          year: year || (role === 'student' ? '3rd Year' : null),
          avatar: avatar || '/assets/avatars/person1.png',
        },
      },
      { status: 201 },
    )
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json({ message: 'Email is already registered.' }, { status: 409 })
    }
    return NextResponse.json(
      { message: 'Unable to register right now.', detail: error.message },
      { status: 500 },
    )
  }
}
