import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../pages/api/auth/[...nextauth]'

function isOrganizerRole(role) {
  return role === 'organizer' || role === 'admin'
}

export async function requireOrganizerAccess() {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role

  if (!session || !isOrganizerRole(role)) {
    return {
      response: NextResponse.json({ message: 'Unauthorized organizer access.' }, { status: 401 }),
    }
  }

  return { session, role }
}
