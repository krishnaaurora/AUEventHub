'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import {
  User,
  Mail,
  Phone,
  Building,
  Save,
  Loader2,
  CheckCircle2,
  Crown,
} from 'lucide-react'

function VCProfilePage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Vice Chancellor Office',
    role: 'Vice Chancellor',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function loadProfile() {
    try {
      // In a real app, this would fetch from an API
      // For now, we'll use session data
      if (session?.user) {
        setProfile({
          name: session.user.name || '',
          email: session.user.email || '',
          phone: '', // Would come from user profile API
          department: 'Vice Chancellor Office',
          role: 'Vice Chancellor',
        })
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  async function saveProfile() {
    setSaving(true)
    try {
      // In a real app, this would save to an API
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [session])

  const handleInputChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown className="h-10 w-10 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Vice Chancellor Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account information</p>
      </div>

      {/* Profile Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={profile.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="email"
                value={profile.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Department
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={profile.department}
                readOnly
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Role (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Role
            </label>
            <div className="relative">
              <Crown className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-emerald-600" />
              <input
                type="text"
                value={profile.role}
                readOnly
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg bg-emerald-50 text-emerald-700 cursor-not-allowed font-medium"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : saved ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Account Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Crown className="h-5 w-5 text-emerald-600" />
          Account Information
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Account Created</span>
            <span className="text-slate-900">
              {session?.user?.createdAt ? new Date(session.user.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Last Login</span>
            <span className="text-slate-900">
              {new Date().toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Account Status</span>
            <span className="text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Active
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Approval Authority</span>
            <span className="text-emerald-600 font-medium">Final Approval</span>
          </div>
        </div>
      </motion.div>

      {/* VC Responsibilities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-slate-900 mb-4">VC Responsibilities</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-slate-900">Approval Authority</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Final event approval</li>
              <li>• University-wide event oversight</li>
              <li>• Strategic event validation</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-slate-900">Monitoring</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Event performance analytics</li>
              <li>• Student participation trends</li>
              <li>• Department engagement metrics</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default VCProfilePage