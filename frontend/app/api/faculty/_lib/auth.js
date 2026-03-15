import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../pages/api/auth/[...nextauth]'

export async function requireFacultyAccess() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) }
    }

    if (session.user.role !== 'faculty') {
      return {
        response: NextResponse.json(
          { message: 'Access denied. Faculty role required.' },
          { status: 403 },
        ),
      }
    }

    return { session }
  } catch (error) {
    console.error('Faculty auth error:', error)
    return { response: NextResponse.json({ message: 'Authentication error' }, { status: 500 }) }
  }
}
