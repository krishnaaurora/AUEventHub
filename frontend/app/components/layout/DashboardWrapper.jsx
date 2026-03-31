"use client";
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import SplitLayout from './SplitLayout';
import EditorPanel from './EditorPanel';
import { Bot, MessageCircle } from 'lucide-react';
import FloatingChat from '../FloatingChat'; // Reuse the existing chat logic if possible

export default function DashboardWrapper({ children }) {
  const pathname = usePathname();
  const [showAssistant, setShowAssistant] = useState(false);

  // If landing page, return children as is (no side layout)
  if (pathname === '/') {
    return <>{children}</>;
  }

  const toggleAssistant = () => setShowAssistant(!showAssistant);

  return (
    <div className="flex h-screen w-full bg-[#1e1e1e] overflow-hidden">
      {/* 1. Sidebar (Fixed Activity Bar) */}
      <Sidebar onToggleAssistant={toggleAssistant} />

      {/* 2. Main Workspace (Pushed by Sidebar) */}
      <div className="ml-12 flex-1 flex flex-col min-w-0">
        <SplitLayout 
          showRight={showAssistant} 
          onToggleRight={toggleAssistant}
          rightPanel={
            <div className="h-full w-full bg-[#1e1e1e] flex flex-col border-l border-[#333]">
              <FloatingChat isEmbedded={true} />
            </div>
          }
        >
          {/* Main Content Area */}
          <main className="h-full w-full relative">
            <EditorPanel>
              {children}
            </EditorPanel>
            
            {/* FAB - Global trigger when Assistant is closed */}
            {!showAssistant && (
              <button
                onClick={toggleAssistant}
                className="fixed bottom-6 right-6 z-[9999] h-14 w-14 rounded-full bg-indigo-600 text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
              >
                <MessageCircle className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
              </button>
            )}
          </main>
        </SplitLayout>
      </div>
    </div>
  );
}
