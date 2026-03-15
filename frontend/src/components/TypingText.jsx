import React, { useState, useEffect } from 'react'

/**
 * TypingText – typewriter effect component.
 * Props:
 *   text      – the string to type out
 *   speed     – ms per character (default 80)
 *   delay     – ms before typing starts (default 0)
 *   className – extra classes on the wrapper span
 *   cursor    – show blinking cursor (default true)
 */
export default function TypingText({
  text = '',
  speed = 80,
  delay = 0,
  className = '',
  cursor = true,
  onComplete
}) {
  const [displayed, setDisplayed] = useState('')
  const [started, setStarted] = useState(false)
  const [done, setDone] = useState(false)

  // Initial delay
  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  // Type characters one by one
  useEffect(() => {
    if (!started) return
    if (displayed.length >= text.length) {
      setDone(true)
      if (onComplete) onComplete()
      return
    }
    const t = setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1))
    }, speed)
    return () => clearTimeout(t)
  }, [started, displayed, text, speed])

  return (
    <span className={className}>
      {displayed}
      {cursor && (
        <span
          className={`inline-block w-[3px] h-[1em] ml-1 align-middle bg-current ${done ? 'animate-pulse' : 'animate-[blink_0.7s_steps(1)_infinite]'}`}
        />
      )}
    </span>
  )
}
