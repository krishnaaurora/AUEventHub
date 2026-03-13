'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Shield,
  PlayCircle,
  User,
  LogOut,
  Menu,
  Search,
  Bell,
  Users,
  Database,
  Clock4,
  ChevronsLeft,
  ChevronsRight,
  CalendarDays,
  X,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: PlayCircle },
  { name: 'Notifications', href: '/admin/notifications', icon: Bell },
  { name: 'User Monitoring', href: '/admin/monitor/users', icon: Users },
  { name: 'DB Monitoring', href: '/admin/monitor/db', icon: Database },
  { name: 'Job Monitoring', href: '/admin/monitor/jobs', icon: Clock4 },
  { name: 'Venue Schedule', href: '/admin/venue-schedule', icon: CalendarDays },
  { name: 'Profile', href: '/admin/profile', icon: User },
]

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user?.role !== 'admin') router.push('/login')
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-red-500" />
      </div>
    )
  }

  if (!session || session.user?.role !== 'admin') return null

  return (
    <div className="min-h-screen bg-slate-50">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 ${isCollapsed ? 'w-20' : 'w-72'} border-r border-slate-200 bg-white transition-all duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white">
                <Shield className="h-5 w-5" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">Aurora Hub</p>
                  <p className="text-xs text-slate-500">Admin Console</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!isCollapsed && (
                <button onClick={() => setIsCollapsed(true)} className="hidden lg:flex h-7 w-7 items-center justify-center rounded hover:bg-slate-100 text-slate-400">
                  <ChevronsLeft className="h-4 w-4" />
                </button>
              )}
              {isCollapsed && (
                <button onClick={() => setIsCollapsed(false)} className="hidden lg:flex h-7 w-7 items-center justify-center rounded hover:bg-slate-100 text-slate-400">
                  <ChevronsRight className="h-4 w-4" />
                </button>
              )}
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname?.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} rounded-lg py-2.5 text-sm transition-colors ${
                    isActive ? 'bg-red-50 text-red-700' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && item.name}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-slate-200 p-3">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className={`flex w-full items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} rounded-lg py-2.5 text-sm text-slate-700 hover:bg-slate-100`}
              title={isCollapsed ? 'Logout' : undefined}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!isCollapsed && 'Logout'}
            </button>
          </div>
        </div>
      </aside>

      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <button
              type="button"
              className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="relative hidden max-w-md flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search users, events, statuses..."
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
              />
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white">
                <Shield className="h-4 w-4" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{session.user.name || 'Admin'}</p>
                <p className="text-xs text-slate-500">ADMIN</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
