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
        <div ref={sectionRef} className="font-sans flex flex-col items-center py-24 px-4 sm:px-6 lg:px-8 bg-white text-gray-900 dark:bg-black dark:text-white relative overflow-hidden">
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
                className="text-4xl sm:text-5xl lg:text-7xl font-bold text-center max-w-4xl leading-tight mb-4 relative z-10"
            >
                From Our Leadership Team
            </motion.h1>
            <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 text-center max-w-3xl mb-20 px-4 relative z-10"
            >
                Empowering campus innovation through streamlined event management.
            </motion.p>

            {/* Testimonial Cards Container */}
            <motion.div style={{ y: yCards }} className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full max-w-6xl relative z-10">
                {/* Large Left Card */}
                <motion.div
                    initial={{ opacity: 0, x: -80 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-white/80 dark:bg-black/50 p-6 rounded-xl flex flex-col justify-between border border-gray-200 dark:border-gray-800 backdrop-blur-sm shadow-md group relative overflow-hidden transition-all duration-300"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-blue-500/10 opacity-0 pointer-events-none" />
                    <div className="mb-6 relative z-10">
                        {/* Nike Logo Placeholder */}
                        <div className="flex items-center mb-4">
                            <svg className="w-8 h-8 text-gray-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M22 10.99C22 5.47 17.52 1 12 1S2 5.47 2 10.99C2 16.51 6.48 21 12 21S22 16.51 22 10.99ZM12 19C7.58 19 4 15.42 4 11C4 6.58 7.58 3 12 3S20 6.58 20 11C20 15.42 16.42 19 12 19ZM12 5C9.24 5 7 7.24 7 10C7 12.76 9.24 15 12 15C14.76 15 17 12.76 17 10C17 7.24 14.76 5 12 5ZM12 13C10.34 13 9 11.66 9 10C9 8.34 10.34 7 12 7C13.66 7 15 8.34 15 10C15 11.66 13.66 13 12 13Z" />
                            </svg>
                        </div>
                        <p className="text-sm sm:text-base lg:text-lg text-gray-800 dark:text-gray-200 leading-relaxed mb-6">
                            &ldquo;Aurora Hub has transformed the way we organize and manage campus events. What once required multiple approvals, paperwork, and manual coordination is now streamlined into a single digital platform. From planning and approvals to student participation and analytics, Aurora Hub simplifies every stage of the process. It empowers organizers to focus more on creativity and innovation while ensuring transparency and efficiency across the university. By centralizing our administrative workflows, we&rsquo;ve seen a significant increase in student engagement and a reduction in logistic turnaround times. Our vision is to create a connected campus ecosystem where every event is an opportunity for growth and discovery.&rdquo;
                        </p>
                    </div>
                    <div className="flex items-center">
                        <img
                            src="https://i.pinimg.com/736x/6f/a3/6a/6fa36aa2c367da06b2a4c8ae1cf9ee02.jpg"
                            alt="DR V Harsha Shastri"
                            className="w-12 h-12 rounded-full object-cover mr-4"
                            onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/48x48/6B7280/FFFFFF?text=VHS" }}
                        />
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100 leading-tight">DR V Harsha Shastri</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Convener</p>
                        </div>
                    </div>
                </motion.div>

                {/* Right Column for Testimonials */}
                <div className="flex flex-col gap-4">
                    {/* Large Right Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="bg-white/80 dark:bg-black/50 p-6 rounded-xl flex flex-col justify-between border border-gray-200 dark:border-gray-800 backdrop-blur-sm shadow-md group relative overflow-hidden transition-all duration-300"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-blue-500/10 opacity-0 pointer-events-none" />
                        <p className="text-sm sm:text-base lg:text-lg text-gray-800 dark:text-gray-200 leading-relaxed mb-6 relative z-10">
                            &ldquo;Our goal with Aurora Hub was to build a smarter way for universities to manage events. With automation, AI assistance, and structured approvals, it empowers organizers to focus on innovation rather than paperwork.&rdquo;
                        </p>
                        <div className="flex items-center">
                            <img
                                src="https://i.pinimg.com/736x/89/4e/16/894e16749bb2800527958cf7813b998e.jpg"
                                alt="Nimmaturi Rames"
                                className="w-12 h-12 rounded-full object-cover mr-4"
                                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/48x48/6B7280/FFFFFF?text=NR" }}
                            />
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">Nimmaturi Ramesh</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Founder</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Small Cards Container */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Dr. T. Malathi Card (Moved Up) */}
                        <motion.div
                            initial={{ opacity: 0, x: 80 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="bg-white/80 dark:bg-black/50 p-5 rounded-xl flex flex-col justify-between border border-gray-200 dark:border-gray-800 backdrop-blur-sm shadow-md group relative overflow-hidden transition-all duration-300 sm:col-span-2"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-blue-500/10 opacity-0 pointer-events-none" />
                            <p className="text-sm sm:text-base lg:text-lg text-gray-800 dark:text-gray-200 leading-relaxed mb-4 relative z-10">
                                &ldquo;Our commitment to academic excellence is reflected in our digital transformation journey with Aurora Hub, simplifying student engagement.&rdquo;
                            </p>
                            <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 text-blue-600 dark:text-blue-400 font-bold shrink-0">
                                    TM
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">Dr. T. Malathi</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Director</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Small Card 1 */}
                        <motion.div
                            initial={{ opacity: 0, x: 80 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className="bg-white/80 dark:bg-black/50 p-5 rounded-xl flex flex-col justify-between border border-gray-200 dark:border-gray-800 backdrop-blur-sm shadow-md group relative overflow-hidden transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-blue-500/10 opacity-0 pointer-events-none" />
                            <p className="text-sm sm:text-base lg:text-lg text-gray-800 dark:text-gray-200 leading-relaxed mb-4 relative z-10">
                                &ldquo;Aurora Hub transforms how students and organizers collaborate. The platform makes event discovery, participation, and management effortless for the entire campus community.&rdquo;
                            </p>
                            <div className="flex items-center">
                                <img
                                    src="https://i.pinimg.com/736x/5a/ac/66/5aac6619a8b81993b10be58fbded3951.jpg"
                                    alt="Anudeep Aurora"
                                    className="w-10 h-10 rounded-full object-cover mr-3"
                                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/40x40/6B7280/FFFFFF?text=AA" }}
                                />
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">Anudeep Aurora</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Founder</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Small Card 2 */}
                        <motion.div
                            initial={{ opacity: 0, x: 80 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: 0.6 }}
                            className="bg-white/80 dark:bg-black/50 p-5 rounded-xl flex flex-col justify-between border border-gray-200 dark:border-gray-800 backdrop-blur-sm shadow-md group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:border-blue-400/50"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            <p className="text-sm sm:text-base lg:text-lg text-gray-800 dark:text-gray-200 leading-relaxed mb-4 relative z-10">
                                &ldquo;Digital platforms like Aurora Hub help institutions manage academic and cultural activities efficiently while maintaining transparency and structured approvals.&rdquo;
                            </p>
                            <div className="flex items-center">
                                <img
                                    src="https://i.pinimg.com/736x/d9/7f/aa/d97faa4ca82603ea39b68b534f63b89a.jpg"
                                    alt="Srilatha Chepuri"
                                    className="w-10 h-10 rounded-full object-cover mr-3"
                                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/40x40/6B7280/FFFFFF?text=SC" }}
                                />
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">Srilatha Chepuri</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Vice Chancellor</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.div >
        </div >
    );
}

export default Testimonial;
