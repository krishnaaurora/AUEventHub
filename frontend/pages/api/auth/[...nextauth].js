import _NextAuth from 'next-auth'
import _CredentialsProvider from 'next-auth/providers/credentials'
import { ensureAuthCollections, getUsersCollection } from '../../../app/api/_lib/db'

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
        console.log('--- [AUTH DEBUG] Authorize Start ---')
        console.log('Credentials:', { email: credentials?.email, passLen: credentials?.password?.length })

        if (!credentials?.email || !credentials?.password) {
          console.log('--- [AUTH DEBUG] Missing credentials ---')
          return null
        }

        try {
          await ensureAuthCollections()
          const usersCollection = await getUsersCollection()
          const user = await usersCollection.findOne({ email: credentials.email })

          if (!user) {
            console.log('--- [AUTH DEBUG] User not found in DB for email:', credentials.email)
            const allUsers = await usersCollection.find({}, { projection: { email: 1 } }).toArray()
            console.log('--- [AUTH DEBUG] Existing users in DB:', allUsers.map(u => u.email))
            return null
          }

          console.log('--- [AUTH DEBUG] User found:', { email: user.email, role: user.role })
          console.log('--- [AUTH DEBUG] Password check:', { match: credentials.password === user.password })

          if (credentials.password !== user.password) {
            console.log('--- [AUTH DEBUG] Password mismatch. Input:', credentials.password, 'Expected:', user.password)
            return null
          }

          if (String(user.accountStatus || 'active').toLowerCase() === 'suspended') {
            console.log('--- [AUTH DEBUG] User account suspended ---')
            return null
          }

          console.log('--- [AUTH DEBUG] Authentication Successful for:', user.email)
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
        } catch (error) {
          console.error('--- [AUTH DEBUG] Error in authorize ---', error)
          return null
        }
      }
    })
  ],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET || 'dev_nextauth_secret',
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

console.log('--- [AUTH INFO] Initializing NextAuth with secret:', process.env.NEXTAUTH_SECRET ? 'CONFIGURED' : 'USING FALLBACK')
export default NextAuth(authOptions)