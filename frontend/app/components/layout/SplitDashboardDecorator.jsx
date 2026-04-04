"use client";
import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Sparkles } from 'lucide-react';
import dynamic from 'next/dynamic';
const FloatingChat = dynamic(() => import('../FloatingChat'), { 
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-50/50">
      <div className="animate-pulse text-indigo-500 font-medium">Loading Assistant...</div>
    </div>
  )
});

export default function SplitDashboardDecorator({ children }) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(380);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef(null);

    // Filter paths: Organizer, Dean, Registrar, VC
    const allowedPrefixes = ["/organizer", "/dean", "/registrar", "/vc"];
    const isAllowedPage = allowedPrefixes.some(prefix => pathname?.toLowerCase().startsWith(prefix));

    useEffect(() => {
        const saved = localStorage.getItem('aurora-chat-width');
        if (saved) setSidebarWidth(parseInt(saved));
    }, []);

    // Effect to hide other sidebars when chat is open
    useEffect(() => {
        if (isOpen && isAllowedPage) {
            document.body.classList.add('chat-panel-open');
        } else {
            document.body.classList.remove('chat-panel-open');
        }
    }, [isOpen, isAllowedPage]);

    const handleMouseDown = (e) => {
        setIsResizing(true);
        e.preventDefault();
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing || !containerRef.current) return;
            const containerRect = containerRef.current.getBoundingClientRect();
            const newWidth = containerRect.right - e.clientX;
            const clampedWidth = Math.min(Math.max(newWidth, 300), containerRect.width / 2);
            setSidebarWidth(clampedWidth);
            localStorage.setItem('aurora-chat-width', clampedWidth);
        };

        const handleMouseUp = () => setIsResizing(false);

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
        } else {
            document.body.style.cursor = 'default';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    if (!isAllowedPage) return <>{children}</>;

    return (
        <div
            ref={containerRef}
            className={`w-full min-h-screen bg-white m-0 p-0 ${isOpen ? 'flex overflow-hidden' : 'relative'} ${isResizing ? 'select-none' : ''}`}
            style={isOpen ? { paddingRight: `${sidebarWidth}px` } : {}}
        >
            {/* 1. MAIN CONTENT AREA */}
            <div className={`main-content-flow bg-white relative transition-all duration-300 ${isOpen ? 'flex flex-col' : 'w-full'}`}>
                {children}

                {/* Floating Toggle Button (Only when closed) */}
                {!isOpen && (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-8 right-8 z-[60] h-14 w-14 rounded-full bg-indigo-600 text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                    >
                        <MessageCircle className="h-6 w-6" />
                    </button>
                )}
            </div>

            {/* 2. RESIZABLE ASSISTANT */}
            {isOpen && (
                <>
                    <div
                        onMouseDown={handleMouseDown}
                        className={`
                            w-[2px] h-screen cursor-col-resize hover:bg-indigo-500/50 transition-all z-[45] shrink-0
                            ${isResizing ? 'bg-indigo-600' : 'bg-gray-200'}
                        `}
                    />
                    <aside
                        style={{ width: `${sidebarWidth}px` }}
                        className="chat-panel-container bg-white flex flex-col border-l border-gray-200 shrink-0 overflow-hidden"
                    >
                        <div
                            style={{ fontFamily: '"Times New Roman", Times, serif' }}
                            className="p-4 bg-indigo-600 text-white flex items-center justify-between shadow-md relative z-10"
                        >
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-indigo-200" />
                                <span className="font-bold text-xs tracking-wider uppercase">RIYA AI</span>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-white/10 rounded-md transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden relative">
                            <FloatingChat isEmbedded={true} />
                        </div>
                    </aside>
                </>
            )}

            <style jsx global>{`
                /* ── ZEN SCROLLING ── */
                * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
                *::-webkit-scrollbar { display: none !important; }

                /* ── CHAT PANEL - FIXED ASIDE ── */
                aside.chat-panel-container {
                    position: fixed !important;
                    top: 0 !important; right: 0 !important; bottom: 0 !important;
                    height: 100vh !important;
                    z-index: 50;
                    background: #ffffff;
                    overflow: hidden !important;
                    border-left: 1px solid #e5e7eb;
                    display: flex;
                    flex-direction: column;
                }
                aside.chat-panel-container > div:last-child {
                    flex: 1; overflow-y: auto; overflow-x: hidden;
                }

                /* ── MAIN CONTENT ── */
                .main-content-flow { flex: 1; min-width: 0; overflow-y: auto; overflow-x: hidden; }

                /* ── Tooltip on hover in collapsed sidebar ── */
                body.chat-panel-open aside[class*="fixed"][class*="left-0"] .group:hover > [class*="absolute"] {
                    opacity: 1 !important;
                    visibility: visible !important;
                    pointer-events: auto !important;
                }
            `}</style>
        </div>
    );
}
