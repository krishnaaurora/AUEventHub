import React from 'react'
import Link from 'next/link'
import { TextHoverEffect } from './ui/text-hover-effect'

export default function Footer() {
  return (
    <footer className="bg-red-950 text-red-100 py-12">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/20">
              <img src="/assets/LOGo.png" alt="AU Logo" className="h-10 md:h-12 w-auto object-contain" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">AU event HUb</span>
          </div>
          <p className="text-sm leading-relaxed italic text-red-200">"Simpler coordination for every student leader."</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Platform</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-white transition">Events</Link></li>
            <li><Link href="/" className="hover:text-white transition">About</Link></li>
            <li><Link href="/" className="hover:text-white transition">Gallery</Link></li>
            <li><Link href="/" className="hover:text-white transition">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Resources</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition">Documentation</a></li>
            <li><a href="#" className="hover:text-white transition">API</a></li>
            <li><a href="#" className="hover:text-white transition">Support</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white transition">Terms</a></li>
          </ul>
        </div>
      </div>

      <div className="w-full border-t border-red-900/50">
        <div className="h-[12rem] md:h-[16rem] flex items-center justify-center overflow-hidden">
          <TextHoverEffect text="AU EVENT HUB" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-6 text-sm text-center text-red-300">
        © 2026 AU event HUb. All rights reserved.
      </div>
    </footer>
  )
}
