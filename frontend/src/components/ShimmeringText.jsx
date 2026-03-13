import React from 'react'
import { motion } from 'motion/react'

export default function ShimmeringText({
  text,
  duration = 1,
  transition,
  wave = false,
  className = '',
  color = '#000',
  shimmeringColor = '#6366f1',
  ...props
}) {
  return (
    <motion.span
      className={`relative inline-block ${className}`}
      style={{
        '--shimmering-color': shimmeringColor,
        '--color': color,
        color: 'var(--color)',
        perspective: '500px',
      }}
      {...props}
    >
      {text?.split('')?.map((char, i) => (
        <motion.span
          animate={{
            ...(wave
              ? {
                  x: [0, 5, 0],
                  y: [0, -5, 0],
                  scale: [1, 1.1, 1],
                  rotateY: [0, 15, 0],
                }
              : {}),
            color: ['var(--color)', 'var(--shimmering-color)', 'var(--color)'],
          }}
          className="inline-block whitespace-pre"
          style={{ transformStyle: 'preserve-3d' }}
          initial={{
            ...(wave ? { scale: 1, rotateY: 0 } : {}),
            color: 'var(--color)',
          }}
          key={i}
          transition={{
            duration,
            repeat: Infinity,
            repeatType: 'loop',
            repeatDelay: text.length * 0.05,
            delay: (i * duration) / text.length,
            ease: 'easeInOut',
            ...transition,
          }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  )
}
