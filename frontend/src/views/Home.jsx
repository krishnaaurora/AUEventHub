import React from 'react';
import dynamic from 'next/dynamic';
import Hero from '../components/Hero';

const Features = dynamic(() => import('../components/Features'), {
  loading: () => <div className="h-[800px] flex items-center justify-center bg-white text-gray-500">Loading Features...</div>,
  ssr: false,
});
import Testimonial from '../components/Testimonial';
import IconMarquee from '../components/IconMarquee';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <main>
        <Hero />
        {/* This div scrolls OVER the sticky Hero — parallax effect */}
        <div className="relative" style={{ zIndex: 2 }}>
          <div className="bg-white rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.1)] overflow-hidden">
            <Features />
            <Testimonial />
            <IconMarquee />
          </div>
        </div>
      </main>
      <div className="relative" style={{ zIndex: 2 }}>
        <Footer />
      </div>
    </div>
  );
}
