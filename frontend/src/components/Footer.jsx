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
              <img src="/assets/LOGo.png" alt="Aurora University Logo" className="h-10 md:h-12 w-auto object-contain" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-white font-black text-lg md:text-xl tracking-tight">AURORA UNIVERSITY</span>
              <span className="text-red-200/90 font-medium text-sm md:text-base tracking-[0.15em] uppercase">EVENT HUB</span>
            </div>
          </div>
          <p className="text-sm leading-relaxed italic text-red-200">"Simpler coordination for every student leader."</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Platform</h4>
          <ul className="space-y-2 text-sm text-red-200/80">
            <li><Link href="/" className="hover:text-white transition">EVENT</Link></li>
            <li><Link href="/" className="hover:text-white transition">About</Link></li>
            <li><Link href="/" className="hover:text-white transition">Gallery</Link></li>
            <li><Link href="/" className="hover:text-white transition">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Resources</h4>
          <ul className="space-y-2 text-sm text-red-200/80">
            <li><Link href="/" className="hover:text-white transition">Documentation</Link></li>
            <li><Link href="/" className="hover:text-white transition">API</Link></li>
            <li><Link href="/" className="hover:text-white transition">Support</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Legal</h4>
          <ul className="space-y-2 text-sm text-red-200/80">
            <li><Link href="/" className="hover:text-white transition">Privacy Policy</Link></li>
            <li><Link href="/" className="hover:text-white transition">Terms</Link></li>
          </ul>
        </div>
      </div>

      <div className="w-full border-t border-red-900/50">
        <div className="flex flex-col items-center justify-center overflow-hidden py-10">
          <div className="h-[6rem] md:h-[10rem] w-full max-w-4xl">
            <TextHoverEffect text="AURORA UNIVERSITY" />
          </div>
          <div className="h-[4rem] md:h-[8rem] w-full max-w-2xl -mt-4 md:-mt-8">
            <TextHoverEffect text="EVENT HUB" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-6 text-sm text-center text-red-300/60">
        © 2026 AURORA UNIVERSITY EVENT HUB. All rights reserved.
      </div>
    </footer>
  )
}
