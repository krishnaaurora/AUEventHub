import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'
import { getUsersCollection, ensureAuthCollections } from '../../_lib/db'

export async function POST(request) {
  try {
    const body = await request.json()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 })
    }

    await ensureAuthCollections()
    const usersCollection = await getUsersCollection()

    const user = await usersCollection.findOne({ email })
    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 })
    }

    if (password !== user.password) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 })
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET || 'dev_secret_change_me',
      { expiresIn: '7d' },
    )

    return NextResponse.json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 })
  }
}
