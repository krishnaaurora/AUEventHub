"use client";
import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

function Testimonial() {
    const sectionRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, 100]);
    const yCards = useTransform(scrollYProgress, [0, 1], [50, -50]);
    const rotate = useTransform(scrollYProgress, [0, 1], [0, 45]);

    return (
        <div ref={sectionRef} className="font-sans flex flex-col items-center py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white text-gray-900 dark:bg-black dark:text-white relative overflow-hidden">
            {/* Background Parallax Elements */}
            <motion.div 
                style={{ y: y1, rotate }}
                className="absolute top-1/4 -left-10 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"
            />
            <motion.div 
                style={{ y: y2, rotate: -rotate }}
                className="absolute bottom-1/4 -right-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"
            />

            {/* Main Heading */}
            <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-5xl font-bold text-center max-w-4xl leading-tight mb-4 relative z-10"
            >
                From Our Leadership Team
            </motion.h1>
            <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-lg md:text-xl text-gray-600 dark:text-gray-400 text-center max-w-3xl mb-16 px-4 relative z-10"
            >
                Empowering campus innovation through streamlined event management.
            </motion.p>

            {/* Testimonial Cards Container - Bento Grid */}
            <motion.div 
                style={{ y: yCards }} 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl relative z-10 auto-rows-[250px]"
            >
                {/* Card 1: Nimmaturi Ramesh (Bento: 2x1) */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="lg:col-span-2 lg:row-span-1 bg-white/80 dark:bg-black/50 p-8 rounded-3xl flex flex-col justify-between border border-gray-200 dark:border-gray-800 backdrop-blur-md shadow-sm group hover:shadow-xl transition-all duration-500"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <p className="text-base md:text-lg text-gray-800 dark:text-gray-200 leading-relaxed mb-6 relative z-10">
                        &ldquo;Our goal with Aurora Hub was to build a smarter way for universities to manage events. With automation, AI assistance, and structured approvals, it empowers organizers to focus on innovation rather than paperwork.&rdquo;
                    </p>
                    <div className="flex items-center relative z-10">
                        <img
                            src="https://i.pinimg.com/736x/d9/7f/aa/d97faa4ca82603ea39b68b534f63b89a.jpg"
                            alt="Dr. Srilatha Chepure"
                            className="w-14 h-14 rounded-full object-cover mr-4 ring-2 ring-blue-100 dark:ring-blue-900"
                            onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/56x56/6B7280/FFFFFF?text=SC" }}
                        />
                        <div>
                            <p className="font-bold text-gray-900 dark:text-gray-100 text-lg">Dr. Srilatha Chepure</p>
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Vice Chancellor</p>
                        </div>
                    </div>
                </motion.div>

                {/* Card 2: Anudeep Aurora (Bento: 1x2) */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="lg:col-span-1 lg:row-span-2 bg-white/80 dark:bg-black/50 p-8 rounded-3xl flex flex-col justify-between border border-gray-200 dark:border-gray-800 backdrop-blur-md shadow-sm group hover:shadow-xl transition-all duration-500"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6 text-purple-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <p className="text-base md:text-lg text-gray-800 dark:text-gray-200 leading-relaxed mb-6">
                            &ldquo;Aurora Hub transforms how students and organizers collaborate. The platform makes event discovery, participation, and management effortless for the entire campus community.&rdquo;
                        </p>
                    </div>
                    <div className="flex items-center relative z-10">
                        <img
                            src="https://i.pinimg.com/736x/5a/ac/66/5aac6619a8b81993b10be58fbded3951.jpg"
                            alt="Anudeep Aurora"
                            className="w-14 h-14 rounded-full object-cover mr-4 ring-2 ring-purple-100 dark:ring-purple-900"
                            onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/56x56/6B7280/FFFFFF?text=AA" }}
                        />
                        <div>
                            <p className="font-bold text-gray-900 dark:text-gray-100 text-lg">Anudeep Aurora</p>
                            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Founder</p>
                        </div>
                    </div>
                </motion.div>

                {/* Card 3: Dr. Srilatha Chepure (Bento: 1x1) */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="lg:col-span-1 lg:row-span-1 bg-white/80 dark:bg-black/50 p-8 rounded-3xl flex flex-col justify-between border border-gray-200 dark:border-gray-800 backdrop-blur-md shadow-sm group hover:shadow-xl transition-all duration-500"
                >
                    <div className="absolute inset-0 bg-gradient-to-bl from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <p className="text-sm md:text-base text-gray-800 dark:text-gray-200 leading-relaxed mb-4 relative z-10 italic">
                        &ldquo;Digital platforms like Aurora Hub help institutions manage activities efficiently while maintaining transparency.&rdquo;
                    </p>
                    <div className="flex items-center relative z-10">
                        <img
                            src="https://placehold.co/48x48/6B7280/FFFFFF?text=CK"
                            alt="Chandrasekhar Kandagatla"
                            className="w-12 h-12 rounded-full object-cover mr-4 ring-2 ring-cyan-100 dark:ring-cyan-900"
                        />
                        <div>
                            <p className="font-bold text-gray-900 dark:text-gray-100">Chandrasekhar Kandagatla</p>
                            <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">Registrar</p>
                        </div>
                    </div>
                </motion.div>

                {/* Card 4: Dr Ramesh Babu Nimmatoori (Bento: 1x1) */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="lg:col-span-1 lg:row-span-1 bg-white/80 dark:bg-black/50 p-8 rounded-3xl flex flex-col justify-between border border-gray-200 dark:border-gray-800 backdrop-blur-md shadow-sm group hover:shadow-xl transition-all duration-500"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <p className="text-sm md:text-base text-gray-800 dark:text-gray-200 leading-relaxed mb-4 relative z-10 italic">
                        &ldquo;Our vision is to empower every student with a platform that fosters growth and leadership.&rdquo;
                    </p>
                    <div className="flex items-center relative z-10">
                        <img
                            src="https://i.pinimg.com/736x/89/4e/16/894e16749bb2800527958cf7813b998e.jpg"
                            alt="Dr Ramesh Babu Nimmatoori"
                            className="w-12 h-12 rounded-full object-cover mr-4 ring-2 ring-indigo-100 dark:ring-indigo-900"
                            onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/48x48/6B7280/FFFFFF?text=RB" }}
                        />
                        <div>
                            <p className="font-bold text-gray-900 dark:text-gray-100">Dr Ramesh Babu Nimmatoori</p>
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Secretary</p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}

export default Testimonial;
