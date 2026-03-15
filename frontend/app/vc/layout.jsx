'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  CheckCircle2,
  XCircle,
  BarChart3,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Building2,
  Clock,
  ChevronsLeft,
  ChevronsRight,
  CalendarDays,
} from 'lucide-react'
import getSocket from '../../lib/socket'

const navigation = [
  { name: 'Dashboard', href: '/vc/dashboard', icon: LayoutDashboard },
  { name: 'Registrar Approved', href: '/vc/registrar-approved', icon: Clock },
  { name: 'Published Events', href: '/vc/published', icon: CheckCircle2 },
  { name: 'Rejected Events', href: '/vc/rejected', icon: XCircle },
  { name: 'Analytics', href: '/vc/analytics', icon: BarChart3 },
  { name: 'Venue Schedule', href: '/vc/venue-schedule', icon: CalendarDays },
]

function VCLayout({ children }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated' && session?.user?.role !== 'vc') { router.push('/login'); return }
    if (status === 'authenticated') loadNotifications()
  }, [session, status, router])

  useEffect(() => {
    if (!session?.user?.id) return
    const socket = getSocket()
    if (!socket) return
    socket.emit('join:role', 'vc')
    socket.emit('join:user', session.user.id)
    const handleNotification = (notification) => {
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
    }
    socket.on('notification:new', handleNotification)
    return () => socket.off('notification:new', handleNotification)
  }, [session?.user?.id])

  async function loadNotifications() {
    try {
      const res = await fetch('/api/vc/notifications', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.notifications?.filter(n => !n.read).length || 0)
      }
    } catch { /* silently fail */ }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    )
  }

  if (!session || session.user.role !== 'vc') return null

  return (
    <div className="min-h-screen bg-slate-50">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-600 bg-opacity-75 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 ${isCollapsed ? 'w-20' : 'w-64'} bg-white shadow-lg transform transition-all duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} h-16 px-4 bg-emerald-600`}>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Building2 className="h-8 w-8 text-white shrink-0" />
              {!isCollapsed && <span className="ml-1 text-xl font-bold text-white">Aurora Hub</span>}
            </button>
            <div className="flex items-center gap-1">
              {!isCollapsed && (
                <button onClick={() => setIsCollapsed(true)} className="hidden lg:flex h-7 w-7 items-center justify-center rounded text-emerald-200 hover:text-white">
                  <ChevronsLeft className="h-4 w-4" />
                </button>
              )}
              {isCollapsed && (
                <button onClick={() => setIsCollapsed(false)} className="hidden lg:flex h-7 w-7 items-center justify-center rounded text-emerald-200 hover:text-white">
                  <ChevronsRight className="h-4 w-4" />
                </button>
              )}
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-emerald-200 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-5 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/vc/dashboard' && pathname?.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border-r-2 border-emerald-500'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className={`h-5 w-5 shrink-0 ${!isCollapsed ? 'mr-3' : ''}`} />
                  {!isCollapsed && item.name}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-slate-200">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} w-full py-3 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors`}
              title={isCollapsed ? 'Logout' : undefined}
            >
              <LogOut className={`h-5 w-5 shrink-0 ${!isCollapsed ? 'mr-3' : ''}`} />
              {!isCollapsed && 'Logout'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Top navbar */}
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button className="lg:hidden p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1 flex items-center">
              <p className="text-sm font-semibold text-slate-700 ml-2 hidden sm:block">Vice Chancellor Portal</p>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              <Link href="/vc/notifications" className="relative p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100">
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700 hidden sm:block">
                  {session.user.name || 'VC'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}

export default VCLayout