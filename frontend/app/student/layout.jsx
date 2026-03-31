'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  CalendarRange,
  BookMarked,
  Award,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Zap,
  Settings,
  ChevronRight,
  ClipboardCheck,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import getSocket from '../../lib/socket'
import SidebarTooltip from '../components/ui/SidebarTooltip'

function getInitials(name) {
  return String(name || 'Student')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'ST'
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/student/dashboard' },
  { icon: CalendarRange, label: 'Browse Events', href: '/student/events' },
  { icon: BookMarked, label: 'My Registered Events', href: '/student/registered' },
  { icon: ClipboardCheck, label: 'Attendance', href: '/student/attendance' },
  { icon: Award, label: 'Certificates', href: '/student/certificates' },
]

const aiInsights = [
  '⚡ "AI for Campus Innovation" is your best match — only 18 seats left!',
  '🔥 "Cultural Night 2026" is trending — 180+ students registered',
  '🎯 "Cybersecurity Kickstart" matches your CSE profile — register now',
  '📅 Sports Meet Trials on Mar 29 — 40 seats available',
]

export default function StudentLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const profileRef = useRef(null)
  const studentId = session?.user?.registrationId || session?.user?.id || ''
  const profileName = session?.user?.name || 'Student User'
  const profileEmail = session?.user?.email || 'No email available'
  const profileAvatar = session?.user?.avatar || ''
  const profileRole = session?.user?.role || 'student'

  const unreadCount = notificationCount

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    let ignore = false

    async function loadNotifications() {
      if (status === 'loading') {
        return
      }

      if (!studentId) {
        setNotificationCount(0)
        return
      }

      try {
        const res = await fetch(`/api/student/notifications?user_id=${encodeURIComponent(studentId)}`, {
          cache: 'no-store',
        })
        const json = await res.json()
        if (!res.ok) {
          return
        }
        if (!ignore) {
          setNotificationCount(Array.isArray(json.items) ? json.items.length : 0)
        }
      } catch {
        if (!ignore) {
          setNotificationCount(0)
        }
      }
    }

    loadNotifications()

    return () => {
      ignore = true
    }
  }, [pathname, status, studentId])

  useEffect(() => {
    if (!studentId) {
      return undefined
    }

    const socket = getSocket()
    if (!socket) {
      return undefined
    }

    socket.emit('join:user', studentId)

    const handleNotification = (item) => {
      if (String(item?.user_id) === String(studentId)) {
        setNotificationCount((prev) => prev + 1)
      }
    }

    const handleDashboardRefresh = (payload) => {
      if (payload?.scope === 'student' && String(payload?.studentId || '') === String(studentId)) {
        fetch(`/api/student/notifications?user_id=${encodeURIComponent(studentId)}`, { cache: 'no-store' })
          .then((res) => res.json())
          .then((json) => {
            setNotificationCount(Array.isArray(json.items) ? json.items.length : 0)
          })
          .catch(() => {
            setNotificationCount(0)
          })
      }
    }

    socket.on('notification:new', handleNotification)
    socket.on('dashboard:refresh', handleDashboardRefresh)

    return () => {
      socket.off('notification:new', handleNotification)
      socket.off('dashboard:refresh', handleDashboardRefresh)
    }
  }, [studentId])

  function handleLogout() {
    router.push('/login')
  }

  // To detect if Chat Panel has forced collapse
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  useEffect(() => {
    const check = () => setIsChatPanelOpen(document.body.classList.contains('chat-panel-open'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const shouldShowTooltip = isCollapsed || isChatPanelOpen;

  return (
    <div className="min-h-screen bg-[#F0F4FA] text-slate-900">
      {/* ── Mobile overlay ─────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar (fixed) ────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex flex-col ${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-slate-200/70 shadow-xl lg:shadow-none
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-md">
              <Zap className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden whitespace-nowrap">
                <p className="text-base font-bold tracking-tight text-slate-900">Aurora Hub</p>
                <p className="text-[10px] text-slate-400 font-medium">Student Portal</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!isCollapsed && (
              <button onClick={() => setIsCollapsed(true)} className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
                <ChevronsLeft className="h-4 w-4" />
              </button>
            )}
            {isCollapsed && (
              <button onClick={() => setIsCollapsed(false)} className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
                <ChevronsRight className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname?.startsWith(item.href)
            const Icon = item.icon
            return (
              <SidebarTooltip key={item.href} label={item.label} isVisible={shouldShowTooltip}>
                <Link href={item.href} onClick={() => setSidebarOpen(false)} className="w-full">
                  <span
                    className={`
                      flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} rounded-xl py-2.5 text-sm font-medium transition-all duration-200
                      ${active
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}
                    `}
                    title={isCollapsed ? item.label : undefined}
                    aria-label={item.label}
                  >
                    <span
                      className={`
                        flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors
                        ${active ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'}
                      `}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    {!isCollapsed && item.label}
                    {!isCollapsed && active && <ChevronRight className="ml-auto h-3.5 w-3.5 text-indigo-400" />}
                  </span>
                </Link>
              </SidebarTooltip>
            )
          })}
          {/* Logout */}
          <SidebarTooltip label="Logout" isVisible={shouldShowTooltip}>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} rounded-xl py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-50 transition-colors`}
              title={isCollapsed ? 'Logout' : undefined}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50">
                <LogOut className="h-4 w-4 text-rose-500" />
              </span>
              {!isCollapsed && "Logout"}
            </button>
          </SidebarTooltip>
        </nav>
      </aside>

      {/* ── Right side: Navbar + Content ───────────────── */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} flex flex-col min-h-screen`}>

        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/70 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-4 px-6 py-3.5">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden rounded-xl p-2 text-slate-500 hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* AI Insights Marquee */}
            <div className="flex-1 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/80 rounded-xl px-3 py-1.5 overflow-hidden border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                  <Zap className="h-3 w-3 text-indigo-500" /> AI Insights
                </span>
                <div className="relative flex-1 overflow-hidden">
                  <div className="flex animate-marquee whitespace-nowrap gap-16">
                    {[...aiInsights, ...aiInsights].map((text, i) => (
                      <span key={i} className="text-xs font-medium text-slate-600">
                        {text}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              {/* Notifications bell */}
              <Link href="/student/notifications">
                <span className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                  <Bell className="h-[18px] w-[18px]" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </span>
              </Link>

              {/* Profile dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors"
                >
                  {profileAvatar ? (
                    <img
                      src={profileAvatar}
                      alt={profileName}
                      className="h-7 w-7 rounded-full object-cover ring-2 ring-indigo-100"
                    />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 ring-2 ring-indigo-100">
                      {getInitials(profileName)}
                    </span>
                  )}
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-slate-800 leading-tight">{profileName}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{profileRole}</p>
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-50"
                    >
                      <div className="p-3 border-b border-slate-100 bg-slate-50">
                        <p className="text-sm font-bold text-slate-800">{profileName}</p>
                        <p className="text-xs text-slate-400">{profileEmail}</p>
                      </div>
                      {[
                        { icon: User, label: 'View Profile', href: '/student/profile' },
                        { icon: Settings, label: 'Settings', href: '/student/profile' },
                      ].map(({ icon: Icon, label, href }) => (
                        <Link key={label} href={href} onClick={() => setProfileOpen(false)}>
                          <span className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                            <Icon className="h-4 w-4 text-slate-400" />
                            {label}
                          </span>
                        </Link>
                      ))}
                      <div className="border-t border-slate-100">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Marquee animation */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
