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
        <Features />
        <Testimonial />
        <IconMarquee />
      </main>
      <Footer />
    </div>
  );
}
