'use client'

import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Building2,
  Shield,
  BadgeCheck,
} from 'lucide-react'

export default function ProfilePage() {
  const { data: session } = useSession()

  const name = session?.user?.name || 'Dean'
  const email = session?.user?.email || '—'
  const role = session?.user?.role || 'dean'
  const regId = session?.user?.registrationId || '—'
  const avatar = session?.user?.avatar || ''
  const department = session?.user?.department || 'Administration'

  function getInitials(n) {
    return String(n)
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'DN'
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <User className="h-5 w-5 text-emerald-500" />
          Profile
        </h1>
        <p className="text-sm text-slate-500 mt-1">Your account information.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
      >
        <div className="h-28 bg-gradient-to-r from-emerald-500 to-teal-500" />
        <div className="px-6 pb-6">
          <div className="-mt-12 mb-4">
            {avatar ? (
              <img src={avatar} alt={name} className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white shadow-lg" />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-emerald-100 ring-4 ring-white shadow-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-emerald-700">{getInitials(name)}</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
              <User className="h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Full Name</p>
                <p className="text-sm font-semibold text-slate-800">{name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
              <Mail className="h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Email</p>
                <p className="text-sm font-semibold text-slate-800">{email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
              <Shield className="h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Role</p>
                <p className="text-sm font-semibold text-slate-800 capitalize">{role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
              <BadgeCheck className="h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Registration ID</p>
                <p className="text-sm font-semibold text-slate-800">{regId}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
              <Building2 className="h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Department</p>
                <p className="text-sm font-semibold text-slate-800">{department}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
