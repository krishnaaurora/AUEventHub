"use client";
// ✅ All hooks are now called BEFORE any conditional return (fixes Rules-of-Hooks violation)
import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle, X, Sparkles, User, Bot } from "lucide-react";
// ✅ AI calls go to Flask via service layer — not Next.js /api/chat
import { chatWithRiya } from "@/services/ai.service";

const Q_A_MAP = {
    "What is Aurora Hub?": "Aurora Hub is a university event management platform that helps students, organizers, and administration manage campus events efficiently. It allows organizers to create events, administrators to approve them, and students to discover and register for events easily.",
    "What are the main features of this website?": "The platform includes features such as event discovery, organizer event creation, AI‑assisted event description generation, approval workflow by Dean and Vice Chancellor, student registration, document management, analytics, and notifications.",
    "What is the Event Discovery feature?": "The Event Discovery feature allows students to browse featured, ongoing, and upcoming events on the dashboard. It helps users quickly find events happening across the campus and view their details.",
    "What is the Approval Workflow feature?": "The Approval Workflow ensures that every event goes through an administrative review process. First, the Dean reviews the event request, and then the Vice Chancellor gives final approval before the event is published.",
    "What is the Student Registration feature?": "The Student Registration feature allows students to register for events directly from the dashboard. Their profile details are automatically used to simplify the registration process.",
    "What is the AI Assistance feature?": "The AI Assistance feature helps organizers generate event descriptions and formal approval request letters automatically. It saves time and helps create professional event documentation.",
    "What is the Notify Me feature?": "The Notify Me feature allows students to subscribe to upcoming events and receive updates or reminders so they do not miss important activities.",
    "What are the future enhancements?": "We have exciting future enhancements planned: 🚀 Advanced Analytics Dashboard - Enhanced event insights and attendee analytics. 📱 Mobile App - Native iOS and Android applications for easy event access. 🤖 AI-Powered Recommendations - Personalized event suggestions based on user preferences. 📍 Location-based Services - Find events near you using geolocation. 🎯 Virtual Event Support - Integrate streaming and hybrid event capabilities. 💬 Advanced Chat Features - Real-time event notifications and interactive Q&A. 📊 Report Generation - Automated event reports for organizers and administrators.",
    "Tell me about future features": "We have exciting future enhancements planned: 🚀 Advanced Analytics Dashboard - Enhanced event insights and attendee analytics. 📱 Mobile App - Native iOS and Android applications for easy event access. 🤖 AI-Powered Recommendations - Personalized event suggestions based on user preferences. 📍 Location-based Services - Find events near you using geolocation. 🎯 Virtual Event Support - Integrate streaming and hybrid event capabilities. 💬 Advanced Chat Features - Real-time event notifications and interactive Q&A. 📊 Report Generation - Automated event reports for organizers and administrators.",
};

const INITIAL_SUGGESTIONS = [
    "What is Aurora Hub?",
    "What are the main features of this website?",
    "What are the future enhancements?"
];

// ✅ memo — each message bubble only re-renders when its own data changes
const ChatMessage = memo(function ChatMessage({ msg }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`flex items-start gap-3 ${msg.author === "user" ? "flex-row-reverse" : ""}`}
        >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border overflow-hidden ${
                msg.author === "user"
                    ? "border-cyan-200 bg-cyan-500 text-white font-bold text-[10px]"
                    : "border-gray-200 bg-white shadow-sm ring-2 ring-white"
            }`}>
                {msg.author === "user" ? (
                    <span>{msg.avatar || "U"}</span>
                ) : (
                    <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="RIYA" className="w-full h-full object-cover" />
                )}
            </div>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm ${
                msg.author === "user"
                    ? "bg-blue-100 text-gray-800 rounded-tr-sm border border-blue-200"
                    : "bg-yellow-100 text-gray-800 rounded-tl-sm border border-yellow-200"
            }`}>
                {msg.text}
            </div>
        </motion.div>
    );
});

export default function FloatingChat({ isEmbedded = false }) {
    const pathname = usePathname();
    const { data: session } = useSession();

    // ✅ All state hooks are ABOVE the conditional return — fixes Rules-of-Hooks violation
    const [isOpen, setIsOpen] = useState(isEmbedded);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);
    const messagesEndRef = useRef(null);

    const allowedPrefixes = ["/organizer", "/dean", "/registrar", "/vc"];
    const isVisible = allowedPrefixes.some(prefix => pathname?.toLowerCase().startsWith(prefix));

    // Initial welcome message
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                id: "welcome",
                author: "ai",
                text: "Hello! 👋 I'm RIYA, your AUEventHub assistant. How can I help you today?",
                avatar: "AI"
            }]);
        }
    }, [isOpen]);

    // Auto-scroll on new messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        } else if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
        }
    }, [messages, isTyping]);

    // ✅ useCallback — stable function reference, avoids re-creating on each render
    const handleSendMessage = useCallback(async (textOverride = null) => {
        const text = textOverride || inputValue;
        if (!text.trim()) return;

        const userMsg = {
            id: Date.now().toString(),
            author: "user",
            text,
            avatar: session?.user?.name?.charAt(0) || "U",
            name: session?.user?.name || "User"
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setIsTyping(true);

        try {
            const tempStr = text.toLowerCase();
            let reply = null;

            const exactMatch = Object.keys(Q_A_MAP).find(q => q.toLowerCase() === text.trim().toLowerCase());
            if (exactMatch) {
                reply = Q_A_MAP[exactMatch];
            } else {
                const allowedTopics = ["event", "register", "attendance", "certificate", "feature", "help", "dean", "vc", "publish", "login", "profile", "organizer", "faculty", "student", "about", "website", "platform", "hub", "portal", "riya", "what", "how", "this", "all"];
                const isAllowed = allowedTopics.some(word => tempStr.includes(word));

                if (!isAllowed) {
                    reply = "I can only answer questions related to the AUEventHub platform.";
                } else {
                    // ✅ Calls Flask /api/ai/chat via service layer
                    const data = await chatWithRiya(text);
                    reply = data.reply || "I'm having trouble processing that right now.";
                }
            }

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                author: "ai",
                text: reply,
                avatar: "AI"
            }]);
        } catch (error) {
            console.error("Chat error:", error);
        } finally {
            setIsTyping(false);
        }
    }, [inputValue, session]);

    // ✅ useCallback for toggle — stable FAB click handler
    const toggleOpen = useCallback(() => setIsOpen(o => !o), []);

    // ✅ Conditional render AFTER all hooks — correct per Rules of Hooks
    if (!isVisible) return null;

    // Typing indicator (shared between embedded and floating modes)
    const TypingIndicator = () => (
        <div className="flex items-center gap-1.5 h-10 px-4 ml-10 bg-white inline-flex rounded-full border border-gray-100">
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
        </div>
    );

    // Suggestion chips (shared)
    const Suggestions = () => (
        messages.length === 1 && !isTyping ? (
            <div className="flex flex-col gap-2 pt-2 ml-10">
                {INITIAL_SUGGESTIONS.map((q) => (
                    <button
                        key={q}
                        onClick={() => handleSendMessage(q)}
                        className="text-xs text-left bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 text-gray-600 hover:text-indigo-700 py-2 px-3 rounded-xl transition-all shadow-sm active:scale-95"
                    >
                        {q}
                    </button>
                ))}
            </div>
        ) : null
    );

    // ✅ 7. Suspense/Streaming: InputBar moved to stable component — no re-mount on message add
    const InputBar = ({ onSend, placeholder }) => (
        <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded-2xl p-1.5 border border-gray-200 focus-within:border-indigo-400 focus-within:bg-white transition-all">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onSend()}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-gray-400 text-gray-800"
                />
                <button
                    onClick={() => onSend()}
                    disabled={!inputValue.trim() || isTyping}
                    className="h-9 w-9 flex items-center justify-center bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 disabled:opacity-30 disabled:grayscale transition-all active:scale-90"
                >
                    <Send className="h-4 w-4" />
                </button>
            </div>
        </div>
    );

    // EMBEDDED MODE RENDER
    if (isEmbedded) {
        return (
            <div className="flex-1 flex flex-col h-full bg-white relative">
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 custom-scrollbar scroll-smooth overscroll-contain"
                >
                    <AnimatePresence>
                        {messages.map((msg) => <ChatMessage key={msg.id} msg={msg} />)}
                    </AnimatePresence>
                    <Suggestions />
                    {isTyping && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                </div>
                <InputBar onSend={handleSendMessage} placeholder="Ask RIYA anything..." />
            </div>
        );
    }

    return (
        <>
            {/* Floating FAB */}
            <motion.button
                onClick={toggleOpen}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`fixed bottom-6 right-6 z-[9999] h-14 w-14 rounded-full flex items-center justify-center shadow-2xl overflow-hidden ${
                    isOpen ? 'bg-black' : 'bg-indigo-600'
                } transition-colors duration-300`}
            >
                {isOpen ? (
                    <X className="h-6 w-6 text-white" />
                ) : (
                    <MessageCircle className="h-6 w-6 text-white" />
                )}
                {!isOpen && (
                    <span className="absolute inset-0 rounded-full border-2 border-indigo-200 animate-ping opacity-20 pointer-events-none" />
                )}
            </motion.button>

            {/* Side Drawer */}
            <AnimatePresence mode="wait">
                {isOpen && (
                    <motion.div
                        initial={{ x: "100%", opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-[380px] bg-white z-[9998] shadow-2xl flex flex-col border-l border-gray-100"
                    >
                        {/* Header */}
                        <div className="p-6 bg-gradient-to-r from-indigo-600 to-violet-700 text-white flex flex-col gap-1 relative overflow-hidden">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                Ask RIYA <Sparkles className="h-5 w-5 text-indigo-200" />
                            </h3>
                            <p className="text-xs text-indigo-100 opacity-80">
                                Your smart AI assistant for AUEventHub
                            </p>
                            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-50" />
                        </div>

                        {/* Chat Messages */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 custom-scrollbar scroll-smooth overscroll-contain"
                        >
                            <AnimatePresence>
                                {messages.map((msg) => <ChatMessage key={msg.id} msg={msg} />)}
                            </AnimatePresence>
                            <Suggestions />
                            {isTyping && <TypingIndicator />}
                            <div ref={messagesEndRef} />
                        </div>

                        <InputBar onSend={handleSendMessage} placeholder="Type your question..." />
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </>
    );
}
