'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  PlusSquare,
  CalendarRange,
  Users,
  BarChart3,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Zap,
  Settings,
  ChevronRight,
  QrCode,
  Wrench,
  Mic,
  ChevronsLeft,
  ChevronsRight,
  Award,
} from 'lucide-react'
import getSocket from '../../lib/socket'
import SidebarTooltip from '../components/ui/SidebarTooltip'

function getInitials(name) {
  return String(name || 'Organizer')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'OR'
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/organizer/dashboard' },
  { icon: PlusSquare, label: 'Create Event', href: '/organizer/create-event' },
  { icon: CalendarRange, label: 'My Events', href: '/organizer/my-events' },
  { icon: Users, label: 'Registrations', href: '/organizer/registrations' },
  { icon: QrCode, label: 'QR Scanner', href: '/organizer/attendance' },
  { icon: Award, label: 'Certificates', href: '/organizer/certificates' },
  { icon: BarChart3, label: 'Analytics', href: '/organizer/analytics' },
  { icon: Wrench, label: 'AI Tools', href: '/organizer/ai-tools' },
  { icon: Mic, label: 'Speakers & Schedule', href: '/organizer/speakers' },
]

const aiInsights = [
  '⚡ 3 events pending approval — check "My Events" for status updates',
  '🔥 "AI Hackathon" has 180+ registrations — trending event!',
  '🎯 No venue clashes detected for your upcoming events',
  '📅 2 events scheduled this week — review attendance settings',
]

export default function OrganizerLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const profileRef = useRef(null)
  const userId = session?.user?.registrationId || session?.user?.id || ''
  const profileName = session?.user?.name || 'Organizer'
  const profileEmail = session?.user?.email || 'No email available'
  const profileAvatar = session?.user?.avatar || ''
  const profileRole = session?.user?.role || 'organizer'

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
    if (!userId) return
    const socket = getSocket()
    if (!socket) return

    socket.emit('join:role', 'organizer')
    socket.emit('join:user', userId)

    const handleNotification = () => setNotificationCount((prev) => prev + 1)
    const handleDashboardRefresh = (payload) => {
      if (payload?.scope === 'organizer') setNotificationCount((prev) => prev + 1)
    }

    socket.on('notification:new', handleNotification)
    socket.on('dashboard:refresh', handleDashboardRefresh)
    return () => {
      socket.off('notification:new', handleNotification)
      socket.off('dashboard:refresh', handleDashboardRefresh)
    }
  }, [userId])

  function handleLogout() { router.push('/login') }

  // Detect chat panel collapse
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  useEffect(() => {
    const check = () => setIsChatPanelOpen(document.body.classList.contains('chat-panel-open'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const shouldShowTooltip = isCollapsed || isChatPanelOpen;
  // When chatbot is open, behave as if fully collapsed (icon-only rail)
  const effectivelyCollapsed = isCollapsed || isChatPanelOpen;

  return (
    <div className="min-h-screen bg-[#F0F4FA] text-slate-900">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 h-screen max-h-screen overscroll-none
          flex flex-col ${effectivelyCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-slate-200/70 shadow-xl lg:shadow-none
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => !isChatPanelOpen && setIsCollapsed(!isCollapsed)}
              disabled={isChatPanelOpen}
              className={`h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md transition-opacity ${isChatPanelOpen ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
            >
              <Zap className="h-5 w-5 text-white" />
            </button>
            {!effectivelyCollapsed && (
              <div className="overflow-hidden">
                <p className="text-base font-bold tracking-tight text-slate-900 truncate">Aurora Hub</p>
                <p className="text-[10px] text-slate-400 font-medium">Organizer Portal</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!effectivelyCollapsed && (
              <button onClick={() => setIsCollapsed(true)} className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
                <ChevronsLeft className="h-4 w-4" />
              </button>
            )}
            {effectivelyCollapsed && !isChatPanelOpen && (
              <button onClick={() => setIsCollapsed(false)} className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
                <ChevronsRight className="h-4 w-4" />
              </button>
            )}
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav 
          className="flex-1 h-full min-h-0 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden overscroll-none scroll-smooth hide-scrollbar"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/organizer/dashboard' && pathname?.startsWith(item.href))
            const Icon = item.icon
            return (
              <SidebarTooltip key={item.href} label={item.label} isVisible={shouldShowTooltip}>
                <Link href={item.href} onClick={() => setSidebarOpen(false)} className="w-full">
                  <span
                    className={`
                      flex items-center ${effectivelyCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} rounded-xl py-2.5 text-sm font-medium transition-all duration-200
                      ${active
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}
                    `}
                    title={isCollapsed ? item.label : undefined}
                    aria-label={item.label}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${active ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    {!effectivelyCollapsed && item.label}
                    {!effectivelyCollapsed && active && <ChevronRight className="ml-auto h-3.5 w-3.5 text-indigo-400" />}
                  </span>
                </Link>
              </SidebarTooltip>
            )
          })}
          
          </nav>
          
          <div className="flex-shrink-0 p-3 border-t border-slate-100">
            <SidebarTooltip label="Logout" isVisible={shouldShowTooltip}>
              <button
                onClick={handleLogout}
                className={`w-full flex items-center ${effectivelyCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} rounded-xl py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-50 transition-colors`}
                title={effectivelyCollapsed ? 'Logout' : undefined}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50">
                  <LogOut className="h-4 w-4 text-rose-500" />
                </span>
                {!effectivelyCollapsed && 'Logout'}
              </button>
            </SidebarTooltip>
          </div>
      </aside>

      <div className={`transition-all duration-300 ${effectivelyCollapsed ? 'lg:ml-20' : 'lg:ml-64'} flex flex-col min-h-screen`}>
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/70 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-4 px-6 py-3.5">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden rounded-xl p-2 text-slate-500 hover:bg-slate-100">
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex-1 bg-gradient-to-r from-violet-50/80 via-white to-indigo-50/80 rounded-xl px-3 py-1.5 overflow-hidden border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700">
                  <Zap className="h-3 w-3 text-violet-500" /> AI Insights
                </span>
                <div className="relative flex-1 overflow-hidden">
                  <div className="flex animate-marquee whitespace-nowrap gap-16">
                    {[...aiInsights, ...aiInsights].map((text, i) => (
                      <span key={i} className="text-xs font-medium text-slate-600">{text}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <Link href="/organizer/notifications">
                <span className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                  <Bell className="h-[18px] w-[18px]" />
                  {notificationCount > 0 && (
                    <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white flex items-center justify-center">
                      {notificationCount}
                    </span>
                  )}
                </span>
              </Link>

              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors"
                >
                  {profileAvatar ? (
                    <img src={profileAvatar} alt={profileName} className="h-7 w-7 rounded-full object-cover ring-2 ring-indigo-100" />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700 ring-2 ring-violet-100">
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
                        { icon: User, label: 'View Profile', href: '/organizer/profile' },
                        { icon: Settings, label: 'Settings', href: '/organizer/profile' },
                      ].map(({ icon: Icon, label, href }) => (
                        <Link key={label} href={href} onClick={() => setProfileOpen(false)}>
                          <span className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                            <Icon className="h-4 w-4 text-slate-400" />
                            {label}
                          </span>
                        </Link>
                      ))}
                      <div className="border-t border-slate-100">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 transition-colors">
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

        <main className="flex-1">{children}</main>
      </div>

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

        /* ── ZEN SCROLLING FOR SIDEBAR ── */
        .hide-scrollbar {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }
      `}</style>
    </div>
  )
}
