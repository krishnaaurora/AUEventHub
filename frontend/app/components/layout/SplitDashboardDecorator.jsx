"use client";
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Sparkles } from 'lucide-react';
import dynamic from 'next/dynamic';

// Keep AI Chat lazy-loaded so it doesn't affect initial render speed
const FloatingChat = dynamic(() => import('../FloatingChat'), { 
  ssr: false,
  loading: () => null
});

export default function SplitDashboardDecorator({ children }) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    
    // Only show the AI assistant on specific role-based dashboard routes
    const allowedPrefixes = ["/organizer", "/dean", "/registrar", "/vc"];
    const isAllowedPage = allowedPrefixes.some(prefix => pathname?.toLowerCase().startsWith(prefix));

    // Simple performance-focused class management
    useEffect(() => {
        if (isOpen && isAllowedPage) {
            document.body.style.overflow = 'hidden';
            document.body.classList.add('chat-panel-active');
        } else {
            document.body.style.overflow = 'unset';
            document.body.classList.remove('chat-panel-active');
        }
    }, [isOpen, isAllowedPage]);

    if (!isAllowedPage) return <>{children}</>;

    return (
        <div className="flex min-h-screen bg-slate-50 relative">
            {/* 1. MAIN APPLICATION AREA */}
            <main className={`flex-1 min-w-0 transition-all duration-300 ${isOpen ? 'pr-[380px]' : ''}`}>
                <div className="h-full">
                    {children}
                </div>

                {/* Light-weight Chat Toggle */}
                {!isOpen && (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-8 right-8 z-[100] h-14 w-14 rounded-full bg-indigo-600 text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
                    >
                        <MessageCircle className="h-6 w-6 group-hover:animate-pulse" />
                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-500 border-2 border-white rounded-full" />
                    </button>
                )}
            </main>

            {/* 2. STATIC ASSISTANT OVERLAY (No Resizing for speed) */}
            {isOpen && (
                <aside 
                    className="fixed top-0 right-0 h-screen w-[380px] bg-white border-l border-slate-200 z-[200] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
                >
                    <header className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="font-black text-[10px] tracking-widest text-slate-400 uppercase">AI ASSISTANT</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </header>
                    
                    <div className="flex-1 overflow-hidden">
                        <FloatingChat isEmbedded={true} />
                    </div>
                    
                    {/* Clean background for the assistant area */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Powered by University AI HUB</p>
                    </div>
                </aside>
            )}

            <style jsx global>{`
                /* Prevent horizontal scrolls in the layout */
                body { overflow-x: hidden !important; }
                
                /* Fast scrollbars for inner content */
                .custom-inner-scroll::-webkit-scrollbar { width: 6px; }
                .custom-inner-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-inner-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    );
}
