import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../pages/api/auth/[...nextauth]'

export async function requireRegistrarAccess() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) }
    }

    if (session.user.role !== 'registrar') {
      return { response: NextResponse.json({ message: 'Access denied. Registrar role required.' }, { status: 403 }) }
    }

    return { user: session.user }
  } catch (error) {
    return { response: NextResponse.json({ message: 'Authentication error' }, { status: 500 }) }
  }
}