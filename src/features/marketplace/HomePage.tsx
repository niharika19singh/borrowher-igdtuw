import React from 'react';
import { Navbar } from '../../components/Navbar';
import { Hero } from '../../components/Hero';
import { CategoryBar } from '../../components/CategoryBar';
import { TrendingSection } from '../../components/TrendingSection';
import { HowItWorks } from '../../components/HowItWorks';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#faf7f5]">
      <Navbar />
      <main>
        <Hero />
        <CategoryBar />
        <TrendingSection />
        <HowItWorks />
      </main>
      {/* Simple footer */}
      <footer className="bg-white border-t border-blush-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-[#9a7a84]">
          <p>© 2026 BorrowHer · IGDTUW Campus Sharing Economy</p>
          <p className="text-xs">Built for Cloud-Based Full Stack Application Development</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
