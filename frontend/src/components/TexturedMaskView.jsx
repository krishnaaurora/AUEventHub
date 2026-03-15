import React from 'react'
import { motion } from 'framer-motion'

const TexturedMaskText = () => {
  return (
    <motion.h2
      className="text-5xl md:text-8xl font-black uppercase text-white"
      style={{
        fontFamily: 'Lovira, serif',
        textShadow: '0 0 20px rgba(120, 160, 255, 0.15)',
      }}
      initial={{ scale: 1.5 }}
      animate={{ scale: 1 }}
      transition={{ duration: 10, ease: 'linear', repeat: Infinity, repeatType: 'reverse' }}
    >
      Memorials
    </motion.h2>
  )
}

export default function TexturedMaskView() {
  return (
    <div className="flex flex-col items-center justify-center font-sans p-4 bg-black/5 rounded-lg">
      <TexturedMaskText />
    </div>
  )
}
