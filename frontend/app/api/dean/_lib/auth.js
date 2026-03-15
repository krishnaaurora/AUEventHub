import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../pages/api/auth/[...nextauth]'

function isDeanRole(role) {
  return role === 'dean' || role === 'admin'
}

export async function requireDeanAccess() {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role

  if (!session || !isDeanRole(role)) {
    return {
      response: NextResponse.json({ message: 'Unauthorized dean access.' }, { status: 401 }),
    }
  }

  return { session, role }
}

export async function requireDeanSetupAccess() {
  if (process.env.NODE_ENV !== 'production') {
    return { allow: true, mode: 'development' }
  }

  const auth = await requireDeanAccess()
  if (auth.response) return auth
  return { allow: true, mode: 'protected' }
}

export function getSessionIdentifiers(session) {
  return new Set(
    [session?.user?.id, session?.user?.registrationId]
      .map((value) => String(value || '').trim())
      .filter(Boolean)
  )
}