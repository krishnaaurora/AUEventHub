"use client"

import React, { useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSession, signIn } from 'next-auth/react'
import './Login.css'

export default function Login() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = React.useState('signin')
  const [form, setForm] = React.useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    registrationId: '',
    clubName: '',
  })
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')

  const isSignUp = mode === 'signup'
  const cardImage = isSignUp ? '/assets/register.png' : '/assets/login.png'

  const roles = ['Student', 'Organizer', 'Registrar', 'Dean', 'VC']

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (isSignUp) {
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match.')
        return
      }
      if (form.password.length < 6) {
        setError('Password must be at least 6 characters.')
        return
      }

      const roleNeedsRegId = form.role === 'student' || form.role === 'organizer'
      if (roleNeedsRegId && !form.registrationId.trim()) {
        setError('Registration ID is required for Student and Organizer.')
        return
      }
    }

    setLoading(true)
    
    startTransition(async () => {
      try {
        if (isSignUp) {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fullName: form.fullName,
              email: form.email,
              password: form.password,
              role: form.role,
              registrationId: form.registrationId,
              clubName: form.clubName,
            }),
          })

          const data = await res.json()
          if (!res.ok) {
            setError(data.message || 'Request failed.')
            setLoading(false)
            return
          }

          setSuccess('Account created successfully. You can login now.')
          setMode('signin')
          setForm((prev) => ({
            ...prev,
            password: '',
            confirmPassword: '',
            registrationId: '',
            clubName: '',
          }))
          setLoading(false)
          return
        }

        const signInResult = await signIn('credentials', {
          redirect: false,
          email: form.email,
          password: form.password,
        })

        if (!signInResult?.ok) {
          setError('Invalid email or password.')
          setLoading(false)
          return
        }

        const session = await getSession()
        const role = session?.user?.role
        const roleToPath = {
          admin: '/admin/dashboard',
          student: '/student/dashboard',
          organizer: '/organizer/dashboard',
          dean: '/dean/dashboard',
          registrar: '/registrar/dashboard',
          vc: '/vc/dashboard',
        }

        setSuccess('Login successful. Redirecting...')
        
        // Fast navigation
        const target = roleToPath[role] || '/'
        router.prefetch(target)
        router.push(target)
      } catch (err) {
        setError('Could not connect to server. Check database configuration.')
      } finally {
        setLoading(false)
      }
    })
  }

  return (
    <main className="auth-page">
      <section className={`auth-card ${isSignUp ? 'is-signup' : 'is-signin'}`}>
        <header className="auth-header" style={{ backgroundImage: `url(${cardImage})` }}>
          <div className="auth-header-overlay" />
          <div className="auth-brand">
            <div className="auth-brand-ring" />
            <p>Velocity</p>
          </div>

          <div className="auth-header-spacer" />
        </header>

        <div className="auth-body">
          <h1 className="auth-title">{isSignUp ? 'Create your account' : 'Welcome back'}</h1>

          {error && <p className="auth-message auth-message-error">{error}</p>}
          {success && <p className="auth-message auth-message-success">{success}</p>}

          <form className="auth-form" onSubmit={onSubmit}>
            {isSignUp && (
              <div className="auth-field">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Full Name"
                  value={form.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  required={isSignUp}
                />
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                required
              />
            </div>

            {isSignUp && (
              <div className="auth-field">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm Password"
                  value={form.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  required={isSignUp}
                />
              </div>
            )}

            {isSignUp && (
              <fieldset className="auth-roles">
                <legend>Role Selection</legend>
                <div className="auth-role-grid">
                  {roles.map((role) => (
                    <label key={role} className="auth-role-item">
                      <input
                        type="radio"
                        name="role"
                        value={role.toLowerCase()}
                        checked={form.role === role.toLowerCase()}
                        onChange={(e) => updateField('role', e.target.value)}
                      />
                      <span>{role}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {isSignUp && (form.role === 'student' || form.role === 'organizer') && (
              <div className="auth-field">
                <label htmlFor="registrationId">Registration ID</label>
                <input
                  id="registrationId"
                  type="text"
                  placeholder="Enter Registration ID"
                  value={form.registrationId}
                  onChange={(e) => updateField('registrationId', e.target.value)}
                  required
                />
              </div>
            )}

            {isSignUp && form.role === 'organizer' && (
              <div className="auth-field">
                <label htmlFor="clubName">Club Name (Optional)</label>
                <input
                  id="clubName"
                  type="text"
                  placeholder="Enter Club Name"
                  value={form.clubName}
                  onChange={(e) => updateField('clubName', e.target.value)}
                />
              </div>
            )}

            {!isSignUp && (
              <button type="button" className="auth-forgot-btn">
                Forgot password?
              </button>
            )}

            <button type="submit" className="auth-submit" disabled={loading || isPending}>
              {loading || isPending ? 'Optimizing...' : isSignUp ? 'Register' : 'Login'}
            </button>
          </form>

          {!isSignUp && (
            <div className="auth-admin-hint" role="note" aria-live="polite">
              <p className="auth-admin-hint-title">Admin Test Login</p>
              <p>
                Email: <strong>admin@aurora.edu.in</strong>
              </p>
              <p>
                Password: <strong>admin123</strong>
              </p>
            </div>
          )}

          <div className="auth-mode-switch">
            {isSignUp ? (
              <>
                Already have an account?
                <button type="button" onClick={() => setMode('signin')}>Login</button>
              </>
            ) : (
              <>
                New here?
                <button type="button" onClick={() => setMode('signup')}>Sign Up</button>
              </>
            )}
          </div>

          <p className="auth-terms">
            By using this software you agree to our terms and conditions, privacy policy and reusability rules.
          </p>

          <p className="auth-back-link">
            Return to <Link href="/">Landing Page</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
