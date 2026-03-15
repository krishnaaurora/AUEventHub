'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Building2,
  BadgeCheck,
  Loader2,
  Save,
  Camera,
} from 'lucide-react'

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession()
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    department: '',
    clubName: '',
    avatar: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user?.email) {
        setLoading(false)
        return
      }
      try {
        const res = await fetch(
          `/api/auth/register?email=${encodeURIComponent(session.user.email)}`,
          { cache: 'no-store' }
        )
        const json = await res.json()
        if (res.ok && json.user) {
          setProfile({
            fullName: json.user.fullName || session.user.name || '',
            email: json.user.email || session.user.email || '',
            department: json.user.department || '',
            clubName: json.user.clubName || '',
            avatar: json.user.avatar || '',
          })
        } else {
          setProfile({
            fullName: session.user.name || '',
            email: session.user.email || '',
            department: '',
            clubName: '',
            avatar: session.user.avatar || '',
          })
        }
      } catch {
        setProfile({
          fullName: session.user.name || '',
          email: session.user.email || '',
          department: '',
          clubName: '',
          avatar: '',
        })
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [session])

  function updateField(field, value) {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          fullName: profile.fullName,
          department: profile.department,
          clubName: profile.clubName,
          avatar: profile.avatar,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Failed to update profile')
      setSuccess('Profile updated successfully!')
      if (updateSession) {
        updateSession({
          ...session,
          user: { ...session.user, name: profile.fullName, avatar: profile.avatar },
        })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  const initials = String(profile.fullName || 'OR')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Account</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your organizer profile.</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      )}
      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-5">
          <div className="relative">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt="Avatar"
                className="h-20 w-20 rounded-2xl object-cover border-2 border-slate-200"
              />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold">
                {initials}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white border border-slate-200 flex items-center justify-center">
              <Camera className="h-3 w-3 text-slate-400" />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Avatar URL</label>
            <input
              value={profile.avatar}
              onChange={(e) => updateField('avatar', e.target.value)}
              placeholder="/assets/avatars/person1.png"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Info Fields */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1">
              <User className="h-3.5 w-3.5 text-slate-400" />
              Full Name
            </label>
            <input
              value={profile.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              Email
            </label>
            <input
              value={profile.email}
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              Department
            </label>
            <input
              value={profile.department}
              onChange={(e) => updateField('department', e.target.value)}
              placeholder="e.g. Computer Science & Engineering"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1">
              <BadgeCheck className="h-3.5 w-3.5 text-slate-400" />
              Club / Organization Name
            </label>
            <input
              value={profile.clubName}
              onChange={(e) => updateField('clubName', e.target.value)}
              placeholder="e.g. Tech Club"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white transition"
            />
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={saving}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </motion.button>
      </form>
    </div>
  )
}
