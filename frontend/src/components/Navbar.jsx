import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import PulsatingButton from './ui/pulsating-button'
import { Alert, AlertTitle, AlertDescription, AlertAction } from './ui/alert'
import { Button } from './ui/button'
import { FloatingDock } from './ui/floating-dock'
// ...existing code...

export default function Navbar() {
  const router = useRouter();
  const [showAlert, setShowAlert] = useState(false);

  const handleFestClick = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/");
    } else {
      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
        router.push("/login");
      }, 2500);
    }
  };

  const dockItems = [
    {
      title: "Our Fests",
      onClick: handleFestClick,
    },
    {
      title: "Our Gallery",
      href: "/gallery",
    },
  ];

  return (
    <>
      <nav className="sticky top-0 w-full px-6 py-3 flex items-center justify-between z-50 relative"
        style={{ background: 'transparent' }}>
        <div className="flex items-center" />

        {/* Floating Dock — Centered */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2">
          <FloatingDock items={dockItems} />
        </div>

        {/* Mobile fallback */}
        <div className="flex md:hidden items-center gap-4">
          <button onClick={handleFestClick} className="text-gray-700 hover:text-black transition-colors">
            Our Fests
          </button>
          <Link href="/" className="text-gray-700 hover:text-black transition-colors">
            Our Gallery
          </Link>
        </div>

        {/* Entry button removed from Navbar */}
      </nav>

      {/* Auth Alert Overlay */}
      <AnimatePresence>
        {showAlert && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-6">
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
            >
              <Alert className="border-[#E54D4D]/20 bg-white shadow-2xl">
                <AlertTitle className="text-[#E54D4D]">Authentication Required</AlertTitle>
                <AlertDescription>
                  Please login to your account to view and register for fests. Redirecting...
                </AlertDescription>
                <AlertAction>
                  <Button size="sm" variant="outline" className="text-[#E54D4D] border-[#E54D4D]/20">
                    Login
                  </Button>
                </AlertAction>
              </Alert>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
