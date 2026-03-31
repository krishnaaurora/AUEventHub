import { NextResponse } from 'next/server'
import { getUsersCollection } from '../_lib/db'
import { ObjectId } from 'mongodb'
import { writeFile } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // optional: increase if needed for large uploads

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const userId = formData.get('user_id')
    if (!file || !userId) {
      return NextResponse.json({ message: 'file and user_id required.' }, { status: 400 })
    }
    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `profile_${userId}_${Date.now()}.${ext}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    const filePath = path.join(uploadDir, fileName)
    await writeFile(filePath, buffer)
    const imageUrl = `/uploads/${fileName}`
    // Update user profile_image in MongoDB
    const users = await getUsersCollection()
    await users.updateOne(
      { _id: ObjectId.isValid(userId) ? new ObjectId(userId) : userId },
      { $set: { profile_image: imageUrl } }
    )
    return NextResponse.json({ imageUrl })
  } catch (error) {
    return NextResponse.json({ message: 'Failed to upload image.', detail: error.message }, { status: 500 })
  }
}
