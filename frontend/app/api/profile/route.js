export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getUsersCollection } from '../_lib/db'
import { ObjectId } from 'mongodb'

// GET /api/profile?user_id=... or from session
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const users = await getUsersCollection()
    let user
    if (userId) {
      user = await users.findOne({ _id: ObjectId.isValid(userId) ? new ObjectId(userId) : userId })
    } else {
      // TODO: get user from session/cookie
      return NextResponse.json({ message: 'User ID required.' }, { status: 400 })
    }
    if (!user) return NextResponse.json({ message: 'User not found.' }, { status: 404 })
    // Hide sensitive fields
    delete user.password
    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch profile.', detail: error.message }, { status: 500 })
  }
}

// PATCH /api/profile (update profile fields)
export async function PATCH(request) {
  try {
    const body = await request.json()
    const { user_id, ...update } = body
    if (!user_id) return NextResponse.json({ message: 'user_id required.' }, { status: 400 })
    const users = await getUsersCollection()
    const filter = { _id: ObjectId.isValid(user_id) ? new ObjectId(user_id) : user_id }
    // Remove fields that should not be updated directly
    delete update._id
    delete update.email // Email change should be separate
    delete update.password // Password change should be separate
    const result = await users.updateOne(filter, { $set: update })
    if (result.matchedCount === 0) return NextResponse.json({ message: 'User not found.' }, { status: 404 })
    return NextResponse.json({ message: 'Profile updated.' })
  } catch (error) {
    return NextResponse.json({ message: 'Failed to update profile.', detail: error.message }, { status: 500 })
  }
}

// POST /api/profile/photo (upload profile image) - stub
export async function POST(request) {
  return NextResponse.json({ message: 'Photo upload not implemented.' }, { status: 501 })
}
