'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="flex flex-col items-center"
      >
        <div className="relative flex items-center justify-center">
          {/* Subtle gradient glowing behind the spinner */}
          <div className="absolute inset-0 h-16 w-16 -m-2 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 relative z-10" />
        </div>
        <motion.p 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-sm font-semibold tracking-wide text-indigo-600/80 uppercase"
        >
          Loading...
        </motion.p>
      </motion.div>
    </div>
  )
}
