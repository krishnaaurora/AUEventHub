import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { ensureAuthCollections, getUsersCollection } from '../../../_lib/db'
import { requireAdminAccess } from '../../_lib/auth'

const ALLOWED_ROLES = new Set(['student', 'organizer', 'faculty', 'dean', 'registrar', 'vc', 'admin'])
const ALLOWED_STATUSES = new Set(['active', 'suspended'])

export async function GET() {
  try {
    const auth = await requireAdminAccess()
    if (auth.response) return auth.response

    await ensureAuthCollections()
    const usersCollection = await getUsersCollection()

    const [totalUsers, roleDistribution, recentUsers] = await Promise.all([
      usersCollection.countDocuments({}),
      usersCollection
        .aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ])
        .toArray(),
      usersCollection.find({}).sort({ createdAt: -1 }).limit(12).toArray(),
    ])

    return NextResponse.json({
      totalUsers,
      roleDistribution,
      recentUsers: recentUsers.map((user) => ({
        _id: String(user._id),
        fullName: user.fullName || 'Unknown',
        email: user.email || 'N/A',
        role: user.role || 'N/A',
        accountStatus: user.accountStatus || 'active',
        department: user.department || 'N/A',
        createdAt: user.createdAt || null,
        suspendedAt: user.suspendedAt || null,
      })),
    })
  } catch (error) {
    console.error('Admin users monitor error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireAdminAccess()
    if (auth.response) return auth.response

    const body = await request.json()
    const userId = String(body.userId || '').trim()
    const action = String(body.action || '').trim()

    if (!userId || !ObjectId.isValid(userId)) {
      return NextResponse.json({ message: 'Valid userId is required.' }, { status: 400 })
    }

    await ensureAuthCollections()
    const usersCollection = await getUsersCollection()
    const targetObjectId = new ObjectId(userId)

    const targetUser = await usersCollection.findOne({ _id: targetObjectId })
    if (!targetUser) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 })
    }

    const actorId = String(auth.session?.user?.id || '')

    if (action === 'assign_role') {
      const nextRole = String(body.role || '').trim().toLowerCase()
      if (!ALLOWED_ROLES.has(nextRole)) {
        return NextResponse.json({ message: 'Invalid role.' }, { status: 400 })
      }

      if (actorId && actorId === userId && nextRole !== 'admin') {
        return NextResponse.json({ message: 'You cannot remove your own admin role.' }, { status: 400 })
      }

      await usersCollection.updateOne(
        { _id: targetObjectId },
        {
          $set: {
            role: nextRole,
            updatedAt: new Date(),
          },
        },
      )

      return NextResponse.json({
        message: `Role updated to ${nextRole}.`,
        user: {
          _id: userId,
          role: nextRole,
          accountStatus: targetUser.accountStatus || 'active',
        },
      })
    }

    if (action === 'set_status') {
      const nextStatus = String(body.status || '').trim().toLowerCase()
      if (!ALLOWED_STATUSES.has(nextStatus)) {
        return NextResponse.json({ message: 'Invalid status.' }, { status: 400 })
      }

      if (actorId && actorId === userId && nextStatus === 'suspended') {
        return NextResponse.json({ message: 'You cannot suspend your own account.' }, { status: 400 })
      }

      const isSuspended = nextStatus === 'suspended'
      await usersCollection.updateOne(
        { _id: targetObjectId },
        {
          $set: {
            accountStatus: nextStatus,
            updatedAt: new Date(),
            suspendedAt: isSuspended ? new Date() : null,
          },
        },
      )

      return NextResponse.json({
        message: isSuspended ? 'User suspended successfully.' : 'User activated successfully.',
        user: {
          _id: userId,
          role: targetUser.role || 'N/A',
          accountStatus: nextStatus,
        },
      })
    }

    return NextResponse.json({ message: 'Invalid action.' }, { status: 400 })
  } catch (error) {
    console.error('Admin users update error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
