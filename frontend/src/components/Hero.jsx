"use client"
 
import React, { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Navbar from './Navbar'
import EntryPointButton from './ui/EntryPointButton'
import { InteractiveGridPattern } from './ui/InteractiveGridPattern'

export default function Hero() {
  const containerRef = useRef(null)
  const [showButton, setShowButton] = useState(true)
  const lastScrollY = useRef(0)

  // Smooth transitions based on scroll (REMOVED PARALLAX)
  const scale = 1;
  const opacity = 1;

  useEffect(() => {
    lastScrollY.current = window.scrollY

    const handleScroll = () => {
      const currentY = window.scrollY
      if (currentY > lastScrollY.current) {
        setShowButton(false) // scrolling down
      } else {
        setShowButton(true) // scrolling up
      }
      lastScrollY.current = currentY
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section
      ref={containerRef}
      className="relative h-screen min-h-[600px] flex flex-col bg-white overflow-hidden"
      style={{ zIndex: 0 }}
    >

      {/* Background container */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-white" />
        <InteractiveGridPattern containerRef={containerRef} cellSize={60} />
      </div>

      <div className="relative z-20">
        <Navbar />
      </div>

      <motion.div
        style={{ scale, opacity }}
        className="relative flex-1 flex flex-col items-center justify-center z-20 w-full px-6 mt-12 pointer-events-none"
      >
        {/* Stacked Centered Layout */}
        <div className="relative flex flex-col items-center justify-center w-full max-w-7xl mx-auto gap-4 md:gap-8">

          {/* Top Text (Centered) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-3xl md:text-5xl lg:text-6xl font-bold text-black tracking-tighter text-center drop-shadow-[0_0_20px_rgba(255,255,255,0.9)] pointer-events-none"
            style={{ fontFamily: "'Satoshi', sans-serif" }}
          >
            The Ultimate
          </motion.div>

          {/* Center Branding */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="flex-shrink-0 relative flex flex-col items-center select-none pointer-events-none"
          >
            <div className="flex flex-col items-center mb-4">
              <span
                className="text-[40px] md:text-[70px] lg:text-[90px] font-bold text-black drop-shadow-[0_0_40px_rgba(255,255,255,1)] text-center tracking-tight leading-none"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                AURORA UNIVERSITY
              </span>
            </div>

            <div
              className="mt-4 text-lg md:text-2xl lg:text-3xl font-light text-black tracking-[0.6em] lg:tracking-[0.8em] uppercase drop-shadow-[0_0_25px_rgba(255,255,255,0.9)] text-center"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              EVENT HUB
            </div>
          </motion.div>
        </div>

        {/* Call to Action Button */}
        <motion.div
          className="mt-20 flex justify-center pointer-events-auto"
          initial={{ opacity: 1 }}
          animate={{ opacity: showButton ? 1 : 0, y: showButton ? 0 : 20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="pointer-events-auto">
            <Link href="/login">
              <EntryPointButton />
            </Link>
          </div>
        </motion.div>


      </motion.div >

      <style>{`
        nav, nav * { pointer-events: auto !important; }
        .Btn-Container { pointer-events: auto !important; }
      `}</style>
    </section >
  )
}
