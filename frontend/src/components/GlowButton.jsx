import React, { useEffect, useState } from 'react'

const variants = {
  green: {
    light: {
      outerGlow: 'rgba(34, 197, 94, 0.4)',
      blobGlow: 'rgba(34, 197, 94, 0.6)',
      blobHighlight: '#4ade80',
      blobShadow: 'rgba(34, 197, 94, 0.25)',
      innerGlow: 'rgba(34, 197, 94, 0.1)',
      innerHighlight: 'rgba(187, 247, 208, 0.15)',
      outerBg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      innerBg: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
      textColor: '#14532d',
    },
    dark: {
      outerGlow: 'rgba(230, 255, 230, 0.4)',
      blobGlow: 'rgba(0, 255, 100, 0.5)',
      blobHighlight: '#adff2f',
      blobShadow: 'rgba(0, 255, 100, 0.18)',
      innerGlow: 'rgba(0, 255, 100, 0.07)',
      innerHighlight: 'rgba(173, 255, 47, 0.1)',
      outerBg: 'radial-gradient(circle 80px at 80% -10%, #ffffff, #181b1b)',
      innerBg: 'radial-gradient(circle 80px at 80% -50%, #777777, #0f1111)',
      textColor: '#ffffff',
    },
  },
  red: {
    light: {
      outerGlow: 'rgba(239, 68, 68, 0.6)',
      blobGlow: 'rgba(239, 68, 68, 0.85)',
      blobHighlight: '#fecaca',
      blobShadow: 'rgba(239, 68, 68, 0.35)',
      innerGlow: 'rgba(239, 68, 68, 0.2)',
      innerHighlight: 'rgba(254, 202, 202, 0.35)',
      outerBg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
      innerBg: 'linear-gradient(135deg, #ffffff 0%, #fee2e2 100%)',
      textColor: '#991b1b',
    },
    dark: {
      outerGlow: 'rgba(255, 140, 140, 0.55)',
      blobGlow: 'rgba(255, 80, 80, 0.75)',
      blobHighlight: '#fca5a5',
      blobShadow: 'rgba(255, 80, 80, 0.3)',
      innerGlow: 'rgba(255, 80, 80, 0.14)',
      innerHighlight: 'rgba(252, 165, 165, 0.2)',
      outerBg: 'radial-gradient(circle 80px at 80% -10%, #fff5f5, #2a0f0f)',
      innerBg: 'radial-gradient(circle 80px at 80% -50%, #a44747, #1a0b0b)',
      textColor: '#ffffff',
    },
  },
}

const useTheme = () => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const checkTheme = () => {
      const isDarkMode =
        document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDark(isDarkMode)
    }

    checkTheme()

    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', checkTheme)

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', checkTheme)
    }
  }, [])

  return isDark
}

export default function GlowButton({ children = 'Get Started', variant = 'green' }) {
  const isDark = useTheme()
  const palette = variants[variant] || variants.green
  const colors = isDark ? palette.dark : palette.light

  return (
    <button
      className="relative cursor-pointer rounded-2xl border-none p-0.5 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95"
      style={{ background: colors.outerBg }}
    >
      <div
        className="absolute top-0 right-0 h-[60%] w-[65%] rounded-[120px] -z-10"
        style={{ boxShadow: `0 0 30px ${colors.outerGlow}` }}
      />

      <div
        className="absolute bottom-0 left-0 h-full w-[70px] rounded-2xl"
        style={{
          boxShadow: `-10px 10px 30px ${colors.blobShadow}`,
          background: `radial-gradient(circle 60px at 0% 100%, ${colors.blobHighlight}, ${colors.blobGlow}, transparent)`,
        }}
      />

      <div
        className="relative z-20 flex h-11 items-center justify-center overflow-hidden rounded-[14px] px-8"
        style={{
          background: colors.innerBg,
          color: colors.textColor,
        }}
      >
        <div
          className="absolute top-0 left-0 h-full w-full rounded-[14px]"
          style={{
            background: `radial-gradient(circle 60px at 0% 100%, ${colors.innerHighlight}, ${colors.innerGlow}, transparent)`,
          }}
        />

        <span className="relative z-10 whitespace-nowrap text-lg font-semibold">
          {children}
        </span>
      </div>
    </button>
  )
}
