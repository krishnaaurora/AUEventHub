"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Send, Sparkles } from "lucide-react";

const INITIAL_MESSAGES = [];

const Q_A_MAP = {
    "What is Aurora Hub?": "Aurora Hub is a university event management platform that helps students, organizers, and administration manage campus events efficiently. It allows organizers to create events, administrators to approve them, and students to discover and register for events easily.",
    "What are the main features of this website?": "The platform includes features such as event discovery, organizer event creation, AI‑assisted event description generation, approval workflow by Dean and Vice Chancellor, student registration, document management, analytics, and notifications.",
    "What is the Event Discovery feature?": "The Event Discovery feature allows students to browse featured, ongoing, and upcoming events on the dashboard. It helps users quickly find events happening across the campus and view their details.",
    "What is the Event Creation feature?": "The Event Creation feature allows organizers to create new events by entering details such as event title, category, venue, date, and description. The event can then be submitted for administrative approval.",
    "What is the AI Assistance feature?": "The AI Assistance feature helps organizers generate event descriptions and formal approval request letters automatically. It saves time and helps create professional event documentation.",
    "What is the Approval Workflow feature?": "The Approval Workflow ensures that every event goes through an administrative review process. First, the Dean reviews the event request, and then the Vice Chancellor gives final approval before the event is published.",
    "What is the Student Registration feature?": "The Student Registration feature allows students to register for events directly from the dashboard. Their profile details are automatically used to simplify the registration process.",
    "What is the Notify Me feature?": "The Notify Me feature allows students to subscribe to upcoming events and receive updates or reminders so they do not miss important activities.",
    "What is the Document Management feature?": "The Document Management feature stores all event-related documents such as drafts, approval letters, and submitted requests. These documents can be downloaded or shared through email or messaging platforms.",
    "What is the Analytics feature?": "The Analytics feature provides insights into event performance, including the number of registrations, participation statistics, and overall engagement for each event.",
    "What is the Guest List feature?": "The Guest List feature allows organizers to add guest speakers or special participants when creating an event. This helps provide more information about the event and its participants.",
    "What is the Event Visibility feature?": "The Event Visibility feature allows organizers to control who can see the event. Events can be set as public for all students or restricted to specific departments.",
    "What is the Dual Preview feature?": "The Dual Preview feature allows organizers to preview the event in two formats: a poster view for students and a formal approval letter view for administrative approval.",
    "What is the Previous Events section?": "The Previous Events section showcases past events along with winners, highlights, and achievements. It helps build credibility and encourages students to participate in future events.",
    "What is the AI Chat Assistant feature?": "The AI Chat Assistant helps users quickly get information about the platform, such as how to create events, how approvals work, and how to register for events.",
    "What are the features of this website?": "Aurora Hub offers event discovery, AI‑assisted event creation, structured approval workflows, student registration, document management, analytics, and smart notifications—making campus event management simple and efficient."
};

const SUGGESTED_QUESTIONS = Object.keys(Q_A_MAP);

const getRandomSuggestions = (count) => {
    const shuffled = [...SUGGESTED_QUESTIONS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

export default function Features() {
    const [messages, setMessages] = useState(INITIAL_MESSAGES);
    const [currentSuggestions, setCurrentSuggestions] = useState(() => getRandomSuggestions(2));
    const [hasInteracted, setHasInteracted] = useState(false);
    const scrollRef = useRef(null);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const isInView = useInView(chatContainerRef, { once: true, margin: "-100px" });

    useEffect(() => {
        if (isInView && messages.length === 0) {
            setMessages([
                {
                    id: 1,
                    author: "ai",
                    text: "Hello! 👋 I'm RIYA, your AI assistant.",
                    avatar: "AI"
                },
                {
                    id: 2,
                    author: "ai",
                    text: "I can help you navigate the platform. Click a suggestion below or type a question!",
                    avatar: "AI"
                }
            ]);
        }
    }, [isInView]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [messages]);

    const handleSendMessage = async (customMessage = null) => {
        const textToSend = customMessage;
        if (!textToSend || !textToSend.trim()) return;

        setHasInteracted(true);

        const newMessage = {
            id: Date.now(),
            author: "user",
            text: textToSend,
            avatar: "U"
        };

        const tempStr = textToSend.toLowerCase();
        let dummyContent = "I am Riya Event AI assistant. How can I help you today?";

        const exactMatch = Object.keys(Q_A_MAP).find(q => q.toLowerCase() === textToSend.trim().toLowerCase());

        if (exactMatch) {
            dummyContent = Q_A_MAP[exactMatch];
        } else if (tempStr.includes("create") || tempStr.includes("make") || tempStr.includes("add event")) {
            dummyContent = "You can create an event by logging into the Organizer Dashboard and selecting Create Event. Fill in details such as event title, category, venue, date, and description. You can also generate the event description or approval letter using AI assistance.";
        } else if (tempStr.includes("approv") || tempStr.includes("dean") || tempStr.includes("vc") || tempStr.includes("chancellor")) {
            dummyContent = "Once an organizer submits an event, it is sent to the Dean for review. After approval from the Dean, the request is forwarded to the Vice Chancellor for final approval. Once approved, the event is automatically published on the student dashboard.";
        } else if (tempStr.includes("register") || tempStr.includes("enroll") || tempStr.includes("join")) {
            dummyContent = "Students can browse events on the dashboard and click the Register button. Their profile details are automatically filled in the registration form, making the process quick and seamless.";
        } else if (tempStr.includes("ai ") || tempStr.includes("ai feature") || tempStr.includes("artificial") || tempStr.includes("bot")) {
            dummyContent = "Aurora Hub includes AI assistance that can help generate event descriptions, approval request letters, and announcements. Organizers can also use voice input to quickly create event content.";
        } else if (tempStr.includes("document") || tempStr.includes("store") || tempStr.includes("file") || tempStr.includes("attach")) {
            dummyContent = "All event documents such as drafts, submitted letters, and approval documents are stored in the Documents section of the organizer dashboard. These files can be downloaded or shared via email or WhatsApp.";
        } else if (tempStr.includes("guest") || tempStr.includes("speaker") || tempStr.includes("invite")) {
            dummyContent = "Yes. While creating an event, organizers can add a Guest List section where guest names and details can be included.";
        } else if (tempStr.includes("restrict") || tempStr.includes("department") || tempStr.includes("public") || tempStr.includes("private") || tempStr.includes("visib")) {
            dummyContent = "Yes. Events can be set to Public or Department Only, allowing organizers to control who can view and participate in the event.";
        } else if (tempStr.includes("statistic") || tempStr.includes("analytic") || tempStr.includes("report") || tempStr.includes("graphic")) {
            dummyContent = "Yes. The Analytics dashboard provides insights such as total registrations, participation trends, and event performance metrics.";
        } else if (tempStr.includes("previous") || tempStr.includes("champion") || tempStr.includes("data") || tempStr.includes("past") || tempStr.includes("hackathon") || tempStr.includes("football") || tempStr.includes("fest")) {
            dummyContent = (
                <div className="space-y-4 text-sm mt-1">
                    <div>
                        <strong>🧠 AI Innovation Hackathon 2025</strong><br />
                        <em className="text-gray-600 dark:text-gray-500">Organized by: Coding Club | Date: 15–16 September 2025 | Venue: Innovation Lab</em><br />
                        🏆 Champion: Neural Ninjas<br />
                        🥈 Runner‑Up: CodeStorm<br />
                        🥉 Second Runner‑Up: Algo Masters<br />
                        <span className="text-gray-700 font-medium">Highlights:</span> 120+ participants, 30 teams, Machine Learning projects.
                    </div>
                    <div className="border-t border-gray-200/60 pt-2 border-dashed">
                        <strong>⚽ Inter‑Department Football Championship 2025</strong><br />
                        <em className="text-gray-600 dark:text-gray-500">Organized by: Sports Club | Date: 20 August 2025 | Venue: University Sports Ground</em><br />
                        🏆 Champion: CSE Department<br />
                        🥈 Runner‑Up: Mechanical Department<br />
                        🥉 Third Place: MBA Department<br />
                        <span className="text-gray-700 font-medium">Highlights:</span> 10 departments, 500+ attendees, Penalty shootout finale.
                    </div>
                    <div className="border-t border-gray-200/60 pt-2 border-dashed">
                        <strong>🎭 Cultural Fest – Aurora Utsav 2025</strong><br />
                        <em className="text-gray-600 dark:text-gray-500">Organized by: Cultural Committee | Date: 10 July 2025 | Venue: Open Air Auditorium</em><br />
                        🏆 Champion: ECE Department<br />
                        🥈 Runner‑Up: CSE Department<br />
                        🥉 Third Place: Civil Department<br />
                        <span className="text-gray-700 font-medium">Highlights:</span> Dance, music, 800+ participants, Celebrity guest.
                    </div>
                </div>
            );
        }

        const replyMessage = {
            id: Date.now() + 1,
            author: "ai",
            text: dummyContent,
            avatar: "AI"
        };
        
        setMessages([...messages, newMessage, replyMessage]);
        setCurrentSuggestions(getRandomSuggestions(2));
    };

    return (
        <section id="features" className="relative min-h-[800px] py-16 bg-white overflow-hidden flex flex-col items-center">
            {/* Radial Gradient Background */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    background: "radial-gradient(125% 125% at 50% 10%, #fff 40%, #6366f1 100%)",
                }}
            />
            {/* Background Grain/Grid */}
            <div className="absolute inset-0 z-0 opacity-10 mix-blend-overlay">
                <div className="absolute inset-0 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:20px_20px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center">
                {/* Header */}
                <div className="text-center mb-8">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight"
                        style={{ fontFamily: "'Satoshi', sans-serif" }}
                    >
                        Chat .. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-700">
                            To know our Features !
                        </span>
                    </motion.h2>
                </div>

                {/* Main Integrated Container */}
                <motion.div
                    ref={chatContainerRef}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="w-full max-w-3xl bg-transparent flex flex-col items-center gap-6"
                >
                    {/* Glass Container for Chat */}
                    <div className="w-full max-w-2xl bg-transparent border border-black rounded-3xl overflow-hidden flex flex-col relative">

                        {/* Chat Area - Increased Size */}
                        <div
                            ref={scrollRef}
                            style={{
                                maskImage: "linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)",
                                WebkitMaskImage: "linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)",
                            }}
                            className="h-[400px] md:h-[500px] overflow-y-auto p-4 md:p-5 pb-8 space-y-4 custom-scrollbar bg-transparent overscroll-contain"
                            data-lenis-prevent
                        >
                            <AnimatePresence initial={false}>
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.35, ease: "easeOut" }}
                                        className={`flex items-start gap-3 ${msg.author === "user" ? "flex-row-reverse" : ""}`}
                                    >
                                        {/* Avatar */}
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border overflow-hidden
                                        ${msg.author === "user" ? "border-cyan-200 bg-cyan-50" : "border-gray-200 bg-white shadow-sm ring-2 ring-white"}`}
                                        >
                                            {msg.author === "user" ? (
                                                <img
                                                    src="https://randomuser.me/api/portraits/men/44.jpg"
                                                    alt="User Avatar"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <img
                                                    src="https://randomuser.me/api/portraits/women/68.jpg"
                                                    alt="AI Avatar"
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>

                                        {/* Bubble */}
                                        <div className={`relative max-w-[85%] px-4 py-3 rounded-2xl text-[14px] md:text-[15px] leading-relaxed
                                        ${msg.author === "user"
                                                ? "bg-blue-100 text-gray-800 rounded-tr-sm shadow-[0_2px_10px_rgba(59,130,246,0.1)] border border-blue-200"
                                                : "bg-yellow-100 text-gray-800 rounded-tl-sm shadow-[0_2px_10px_rgba(250,204,21,0.2)] border border-yellow-200"
                                            }`}
                                        >
                                            {msg.text}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            <div ref={messagesEndRef} />

                            {/* Suggested Questions Area */}
                            {messages.length >= 2 && !messages[messages.length - 1]?.isTyping && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex flex-wrap gap-2 mt-4 ml-[44px]"
                                >
                                    {currentSuggestions.map((q, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSendMessage(q)}
                                            className="text-xs md:text-sm bg-white/60 text-gray-700 py-1.5 px-3 rounded-full border border-gray-200 shadow-sm transition-all text-left"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </div>

                    </div>
                </motion.div>
            </div>

            <style>{`
                .custom-scrollbar {
                    scrollbar-width: none; /* Firefox */
                    -ms-overflow-style: none;  /* IE and Edge */
                    scroll-behavior: smooth;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    display: none; /* Chrome, Safari and Opera */
                }
            `}</style>
        </section>
    );
}
