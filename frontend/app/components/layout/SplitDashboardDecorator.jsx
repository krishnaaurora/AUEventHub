"use client";
import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Sparkles } from 'lucide-react';
import FloatingChat from '../FloatingChat';

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
            className={`w-full min-h-screen bg-white m-0 p-0 ${isOpen ? 'flex overflow-visible' : 'relative'} ${isResizing ? 'select-none' : ''}`}
        >
            {/* 1. MAIN CONTENT AREA */}
            <div className={`min-w-0 bg-white relative ${isOpen ? 'flex-1 flex flex-col overflow-visible' : 'w-full'}`}>
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

            {/* 2. RESIZABLE ASSISTANT (Flex Child - Zero Spacing) */}
            {isOpen && (
                <>
                    <div
                        onMouseDown={handleMouseDown}
                        className={`
                            w-[2px] h-screen cursor-col-resize hover:bg-indigo-500/50 transition-all z-[70] shrink-0
                            ${isResizing ? 'bg-indigo-600' : 'bg-gray-200'}
                        `}
                    />
                    <aside
                        style={{ width: `${sidebarWidth}px` }}
                        className="h-screen bg-white flex flex-col border-l border-gray-200 z-[70] shrink-0 overflow-hidden"
                    >
                        <div
                            style={{ fontFamily: '"Times New Roman", Times, serif' }}
                            className="p-4 bg-indigo-600 text-white flex items-center justify-between"
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
                        <div className="flex-1 overflow-hidden">
                            <FloatingChat isEmbedded={true} />
                        </div>
                    </aside>
                </>
            )}

            <style jsx global>{`
                /* ── ZEN SCROLLING (Invisible Scrollbars, Normal Scrolling) ── */
                * {
                    scrollbar-width: none !important;
                    -ms-overflow-style: none !important;
                }
                *::-webkit-scrollbar {
                    display: none !important;
                    width: 0 !important;
                    height: 0 !important;
                }

                /* ── CHAT OPEN LAYOUT FIXES ── */
                /* Force Original Sidebar to 72px */
                .chat-panel-open aside[class*="fixed"][class*="left-0"] {
                    width: 72px !important;
                    overflow: visible !important; /* Allow Tooltips to overflow */
                }

                /* Pull the Main Content left to match the 72px sidebar */
                .chat-panel-open div[class*="lg:ml-64"],
                .chat-panel-open div[class*="lg:ml-20"] {
                    margin-left: 72px !important;
                    transition: margin-left 0.3s ease !important;
                }

                /* Suppress Text inside the 72px collapsed Sidebar */
                .chat-panel-open aside[class*="fixed"][class*="left-0"] span {
                    font-size: 0 !important;
                    opacity: 0 !important;
                    display: none !important;
                }

                /* Keep Icons and Tooltips visible */
                .chat-panel-open aside[class*="fixed"][class*="left-0"] svg,
                .chat-panel-open aside[class*="fixed"][class*="left-0"] .sidebar-tooltip-content span,
                .chat-panel-open aside[class*="fixed"][class*="left-0"] .sidebar-tooltip-content {
                    font-size: 14px !important;
                    opacity: 1 !important;
                    display: flex !important;
                }

                /* Ensure the tooltip wrapper itself does not get hidden */
                .chat-panel-open aside[class*="fixed"][class*="left-0"] .group {
                    display: flex !important;
                }

                /* Center Navigation Buttons in 72px Space */
                .chat-panel-open aside[class*="fixed"][class*="left-0"] nav a > span,
                .chat-panel-open aside[class*="fixed"][class*="left-0"] button {
                    justify-content: center !important;
                    padding-left: 0 !important;
                    padding-right: 0 !important;
                }

                /* Keep Chat panel sticky to top of viewport even if user scrolls */
                .chat-panel-open aside[class*="border-l"] {
                    position: sticky !important;
                    top: 0;
                    height: 100vh;
                }
            `}</style>
        </div>
    );
}
