"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calendar, 
  Settings, 
  LogOut, 
  MessageSquare,
  Bot,
  Terminal,
  Zap
} from 'lucide-react';

const SIDEBAR_ITEMS = [
  { id: 'dashboard', icon: LayoutDashboard, href: '/student/dashboard', title: 'Dashboard' },
  { id: 'events', icon: Calendar, href: '/student/events', title: 'Events' },
  { id: 'cli', icon: Terminal, href: '/organizer/dashboard', title: 'Organizer' },
  { id: 'bot', icon: Bot, href: '#', title: 'Assistant' },
];

export default function Sidebar({ onToggleAssistant }) {
  const pathname = usePathname();

  return (
    <aside className="w-12 h-screen fixed top-0 left-0 bg-[#333333] border-r border-[#1e1e1e] flex flex-col items-center py-4 z-50">
      <div className="mb-8">
        <Zap className="h-6 w-6 text-indigo-400" />
      </div>

      <div className="flex flex-col gap-4 w-full px-1">
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.id === 'bot') {
            return (
              <button
                key={item.id}
                onClick={onToggleAssistant}
                className={`
                  p-2.5 rounded-lg flex items-center justify-center transition-all group relative
                  ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}
                `}
                title={item.title}
              >
                <Icon className="h-6 w-6" />
                <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  {item.title}
                </div>
              </button>
            );
          }

          return (
            <Link 
              key={item.id} 
              href={item.href}
              className={`
                p-2.5 rounded-lg flex items-center justify-center transition-all group relative
                ${isActive ? 'text-white border-l-2 border-indigo-400' : 'text-gray-400 hover:text-white'}
              `}
              title={item.title}
            >
              <Icon className="h-6 w-6" />
              <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {item.title}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-4 w-full px-2">
        <button className="p-2 text-gray-400 hover:text-white transition-colors">
          <Settings className="h-6 w-6" />
        </button>
        <button className="p-2 text-rose-400 hover:text-rose-500 transition-colors">
          <LogOut className="h-6 w-6" />
        </button>
      </div>
    </aside>
  );
}
