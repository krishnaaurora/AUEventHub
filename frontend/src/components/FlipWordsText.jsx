import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SelectionHandle = ({ position }) => {
  return (
    <div
      className={`absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-sm ${position}`}
    />
  )
}

const FlipWords = ({ words, duration = 3000, className = '' }) => {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % words.length)
    }, duration)

    return () => clearInterval(intervalId)
  }, [words, duration])

  const wordContainerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
      },
    },
    exit: {
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
  }

  const letterVariants = {
    hidden: {
      opacity: 0,
      y: 10,
      filter: 'blur(8px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        type: 'tween',
        ease: [0.25, 0.1, 0.25, 1],
        duration: 0.4,
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      filter: 'blur(8px)',
      transition: {
        type: 'tween',
        ease: [0.4, 0, 0.6, 1],
        duration: 0.4,
      },
    },
  }

  const currentWord = words[index]

  return (
    <div className={`inline-block align-middle overflow-hidden h-[1.2em] leading-none ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentWord}
          variants={wordContainerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="inline-block whitespace-nowrap"
        >
          {currentWord.split('').map((char, i) => (
            <motion.span key={`${char}-${i}`} variants={letterVariants} className="inline-block">
              {char}
            </motion.span>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default function FlipWordsText({
  words = ['Simple'],
  className = '',
  duration = 3000,
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <div className="relative inline-block my-2 min-w-[18rem]">
        <div className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-slate-800 py-2 px-6 inline-flex items-center justify-center uppercase relative w-full">
          <span className="mr-2">EVENT Made</span>
          <FlipWords words={words} duration={duration} />
        </div>

        <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />

        <SelectionHandle position="-top-2 -left-2" />
        <SelectionHandle position="-top-2 -right-2" />
        <SelectionHandle position="-bottom-2 -left-2" />
        <SelectionHandle position="-bottom-2 -right-2" />
      </div>
    </div>
  )
}
