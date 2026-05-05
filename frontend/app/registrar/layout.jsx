'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  CheckCircle2,
  XCircle,
  Calendar,
  BarChart3,
  Bell,
  User,
  LogOut,
  Search,
  Menu,
  X,
  Building2,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import getSocket from '../../lib/socket'

const navigation = [
  { name: 'Dashboard', href: '/registrar/dashboard', icon: LayoutDashboard },
  { name: 'Dean Approved EVENT', href: '/registrar/dean-approved', icon: CheckCircle2 },
  { name: 'Venue Schedule', href: '/registrar/venue-schedule', icon: Calendar },
  { name: 'Registrar Approved', href: '/registrar/approved', icon: CheckCircle2 },
  { name: 'Rejected EVENT', href: '/registrar/rejected', icon: XCircle },
  { name: 'Analytics', href: '/registrar/analytics', icon: BarChart3 },
]

export default function RegistrarLayout({ children }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user?.role !== 'registrar') { router.push('/login'); return }
    loadNotifications()
  }, [session, status, router])

  // Detect chat panel state
  useEffect(() => {
    const check = () => setIsChatPanelOpen(document.body.classList.contains('chat-panel-open'))
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const handleRefresh = (payload) => {
      if (!payload?.scope || payload?.scope === 'registrar') loadNotifications()
    }
    socket.on('dashboard:refresh', handleRefresh)
    socket.on('notification:new', loadNotifications)
    return () => {
      socket.off('dashboard:refresh', handleRefresh)
      socket.off('notification:new', loadNotifications)
    }
  }, [])

  async function loadNotifications() {
    try {
      const res = await fetch('/api/registrar/notifications', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.unreadCount || 0)
      }
    } catch { /* silently fail */ }
  }

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  if (!session || session.user?.role !== 'registrar') return null

  return (
    <div className="flex min-h-screen bg-slate-50">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 ${isCollapsed ? 'w-20' : 'w-64'} transform bg-white shadow-lg transition-all duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => !isChatPanelOpen && setIsCollapsed(!isCollapsed)}
                disabled={isChatPanelOpen}
                className={`h-8 w-8 shrink-0 rounded-lg bg-emerald-500 flex items-center justify-center transition-opacity ${isChatPanelOpen ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
              >
                <Building2 className="h-5 w-5 text-white" />
              </button>
              {!isCollapsed && <span className="text-lg font-bold text-slate-900 truncate">Aurora Hub</span>}
            </div>
            <div className="flex items-center gap-1">
              {!isCollapsed && (
                <button onClick={() => !isChatPanelOpen && setIsCollapsed(true)} disabled={isChatPanelOpen} className={`hidden lg:flex h-7 w-7 items-center justify-center rounded text-slate-400 transition-opacity ${isChatPanelOpen ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100'}`}>
                  <ChevronsLeft className="h-4 w-4" />
                </button>
              )}
              {isCollapsed && (
                <button onClick={() => !isChatPanelOpen && setIsCollapsed(false)} disabled={isChatPanelOpen} className={`hidden lg:flex h-7 w-7 items-center justify-center rounded text-slate-400 transition-opacity ${isChatPanelOpen ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100'}`}>
                  <ChevronsRight className="h-4 w-4" />
                </button>
              )}
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/registrar/dashboard' && pathname?.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} rounded-lg py-2.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && item.name}
                </Link>
              )
            })}
          </nav>

          {/* User info and logout */}
          <div className="border-t border-slate-200 p-4">
            {!isCollapsed && (
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 shrink-0 rounded-full bg-emerald-500 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">{session.user?.name?.charAt(0)?.toUpperCase() || 'R'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{session.user?.name || 'Registrar'}</p>
                  <p className="text-xs text-slate-500">Registrar</p>
                </div>
              </div>
            )}
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} w-full rounded-lg py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors`}
              title={isCollapsed ? 'Logout' : undefined}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!isCollapsed && 'Logout'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex flex-1 flex-col transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'} min-h-screen relative`}>
        {/* Top navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-white px-6 shadow-sm border-b border-slate-200">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-slate-600">
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search EVENT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/registrar/notifications" className="relative text-slate-400 hover:text-slate-600">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">{session.user?.name?.charAt(0)?.toUpperCase() || 'R'}</span>
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">{session.user?.name || 'Registrar'}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}