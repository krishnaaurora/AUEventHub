import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../pages/api/auth/[...nextauth]'

function isStudentRole(role) {
  return role === 'student' || role === 'admin'
}

export async function requireStudentAccess() {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role

  if (!session || !isStudentRole(role)) {
    return {
      response: NextResponse.json({ message: 'Unauthorized student access.' }, { status: 401 }),
    }
  }

  return { session, role }
}
