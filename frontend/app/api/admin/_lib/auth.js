import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../pages/api/auth/[...nextauth]'

export async function requireAdminAccess() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) }
    }

    if (session.user.role !== 'admin') {
      return { response: NextResponse.json({ message: 'Access denied. Admin role required.' }, { status: 403 }) }
    }

    return { session }
  } catch (error) {
    console.error('Admin auth error:', error)
    return { response: NextResponse.json({ message: 'Authentication error' }, { status: 500 }) }
  }
}
