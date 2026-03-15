import React from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
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
