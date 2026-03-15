import _NextAuth from 'next-auth'
import _CredentialsProvider from 'next-auth/providers/credentials'
import clientPromise from '../../../lib/mongodb'

// ESM/CJS interop: unwrap .default if needed (happens when "type":"module" is set)
const NextAuth = _NextAuth.default ?? _NextAuth
const CredentialsProvider = _CredentialsProvider.default ?? _CredentialsProvider

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const client = await clientPromise
        const db = client.db(process.env.MONGODB_DB || 'AUeventhub_db')

        const user = await db.collection('users').findOne({ email: credentials.email })

        if (!user || credentials.password !== user.password) return null
        if (String(user.accountStatus || 'active').toLowerCase() === 'suspended') return null

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.fullName,
          role: user.role,
          registrationId: user.registrationId,
          clubName: user.clubName,
          department: user.department,
          year: user.year,
          avatar: user.avatar,
        }
      }
    })
  ],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.registrationId = user.registrationId
        token.clubName = user.clubName
        token.department = user.department
        token.year = user.year
        token.avatar = user.avatar
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role
        session.user.registrationId = token.registrationId
        session.user.clubName = token.clubName
        session.user.department = token.department
        session.user.year = token.year
        session.user.avatar = token.avatar
      }
      return session
    }
  },
  pages: {
    signIn: '/login'
  }
}

export default NextAuth(authOptions)