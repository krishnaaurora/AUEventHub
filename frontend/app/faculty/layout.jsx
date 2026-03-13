'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Activity,
  ClipboardCheck,
  Users,
  FileText,
  Building2,
  Bell,
  User,
  LogOut,
  Menu,
  Search,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/faculty/dashboard', icon: LayoutDashboard },
  { name: 'Ongoing Events', href: '/faculty/ongoing-events', icon: Activity },
  { name: 'Student Attendance', href: '/faculty/student-attendance', icon: ClipboardCheck },
  { name: 'Student Participation', href: '/faculty/student-participation', icon: Users },
  { name: 'Event Reports', href: '/faculty/event-reports', icon: FileText },
  { name: 'Department Analytics', href: '/faculty/department-analytics', icon: Building2 },
]

function FacultyLayout({ children }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated' && session?.user?.role !== 'faculty') router.push('/login')
  }, [session, status, router])

  const filteredNavigation = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return navigation
    return navigation.filter((item) => item.name.toLowerCase().includes(query))
  }, [searchTerm])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-cyan-500" />
      </div>
    )
  }

  if (!session || session.user.role !== 'faculty') return null

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(6,182,212,0.12),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(37,99,235,0.12),transparent_35%)]" />

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 ${isCollapsed ? 'w-20' : 'w-72'} border-r border-slate-200 bg-white/95 backdrop-blur transition-all duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-600 text-white hover:opacity-90"
              >
                <Building2 className="h-5 w-5" />
              </button>
              {!isCollapsed && (
                <div className="ml-1 overflow-hidden">
                  <p className="text-sm font-semibold text-slate-900 truncate">Aurora Hub</p>
                  <p className="text-xs text-slate-500">Faculty Console</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
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
            </div>
          </div>

          {!isCollapsed && (
            <div className="p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search menu"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                />
              </div>
            </div>
          )}

          <nav className={`flex-1 space-y-1 px-3 ${isCollapsed ? 'py-4' : 'pb-3'}`}>
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} rounded-lg py-2.5 text-sm transition ${
                    isActive
                      ? 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className={`h-4 w-4 shrink-0 ${!isCollapsed ? 'mr-3' : ''}`} />
                  {!isCollapsed && item.name}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-slate-200 p-3">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} w-full rounded-lg py-2.5 text-sm text-slate-700 hover:bg-slate-100`}
              title={isCollapsed ? 'Logout' : undefined}
            >
              <LogOut className={`h-4 w-4 shrink-0 ${!isCollapsed ? 'mr-3' : ''}`} />
              {!isCollapsed && 'Logout'}
            </button>
          </div>
        </div>
      </aside>

      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden flex-1 md:block">
              <div className="relative max-w-xl">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search events, students, or departments"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                />
              </div>
            </div>

            <Link href="/faculty/notifications" className="rounded-md p-2 text-slate-600 hover:bg-slate-100" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Link>

            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600 text-white">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{session.user.name || 'Faculty'}</p>
                <p className="text-xs text-slate-500">FACULTY</p>
              </div>
            </div>
          </div>
        </header>

        <main className="relative z-10 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}

export default FacultyLayout
