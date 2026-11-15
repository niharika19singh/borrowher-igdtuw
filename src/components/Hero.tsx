import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#fdf6f8] via-[#fceef2] to-[#f8e8ee]">
      {/* Decorative organic curves */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#f4c0d0]/40 to-transparent blur-3xl" />
        <div className="absolute top-1/3 -left-16 w-72 h-72 rounded-full bg-[#f9dce5]/50 blur-2xl" />
        <svg
          className="absolute bottom-0 right-0 w-[60%] h-full opacity-30"
          viewBox="0 0 800 600"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M400 0C500 100 700 50 800 150V600H0V200C100 100 200 150 400 0Z"
            fill="url(#heroGrad)"
          />
          <defs>
            <linearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f4c0d0" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#e8a0b0" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left content */}
          <div className="z-10 space-y-6">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.25rem] font-semibold text-[#2d1f24] leading-[1.15] tracking-tight">
              Borrow.{' '}
              <span className="text-[#2d1f24]">Share.</span>{' '}
              <span className="font-script text-[#c45a7c] text-5xl sm:text-6xl lg:text-[3.75rem] font-medium italic">
                Repeat.
              </span>
            </h1>
            <p className="text-[#6b4f57] text-base sm:text-lg max-w-md leading-relaxed">
              Your go-to platform to lend and borrow essentials within the IGDTUW community.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#c45a7c] text-white font-medium text-sm shadow-md shadow-[#c45a7c]/25 hover:bg-[#a34463] hover:shadow-lg transition-all"
              >
                Explore Marketplace
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/listings/new"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-[#e8a0b0] text-[#c45a7c] font-medium text-sm bg-white/80 hover:bg-blush-50 transition-all"
              >
                List an Item
              </Link>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full bg-gradient-to-br from-[#e8a0b0] to-[#d97a9a] border-2 border-white flex items-center justify-center text-[10px] text-white font-medium"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <span className="text-sm text-[#6b4f57]">
                Trusted by <span className="font-semibold text-[#2d1f24]">1000+</span> IGDTUW students
              </span>
              <Heart size={14} className="text-[#c45a7c] fill-[#c45a7c]" />
            </div>
          </div>

          {/* Right: Campus image with decorative frame */}
          <div className="relative z-10">
            <div className="relative rounded-3xl overflow-hidden shadow-xl shadow-[#c45a7c]/15 border-4 border-white">
              {/* Placeholder campus image - using a gradient + building silhouette style */}
              <div className="aspect-[4/3] bg-gradient-to-br from-[#d4c4b0] via-[#c9b8a0] to-[#b8a88c] relative overflow-hidden">
                {/* Simulated building facade */}
                <div className="absolute inset-0 flex items-end justify-center">
                  <div className="w-full h-[85%] relative">
                    {/* Building body */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] h-full bg-[#c4b090] rounded-t-sm">
                      {/* Windows grid */}
                      <div className="absolute inset-4 grid grid-cols-6 gap-2 opacity-60">
                        {Array.from({ length: 24 }).map((_, i) => (
                          <div
                            key={i}
                            className="bg-[#e8e0d0]/80 rounded-sm border border-[#a09070]/30"
                          />
                        ))}
                      </div>
                      {/* IGDTUW text */}
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/90 px-4 py-1.5 rounded shadow-sm">
                        <span className="font-serif font-semibold text-[#5a4a3a] tracking-widest text-sm sm:text-base">
                          IGDTUW
                        </span>
                      </div>
                      {/* Balcony lines */}
                      <div className="absolute top-[40%] left-0 right-0 h-1 bg-[#a09070]/40" />
                      <div className="absolute top-[65%] left-0 right-0 h-1 bg-[#a09070]/40" />
                    </div>
                  </div>
                </div>
                {/* Foliage overlay left */}
                <div className="absolute left-0 bottom-0 w-1/3 h-2/3 bg-gradient-to-tr from-[#6b8f5e]/70 via-[#7a9f6a]/40 to-transparent rounded-tr-full" />
                {/* Pink blossoms right */}
                <div className="absolute right-0 top-1/4 w-1/3 h-1/2">
                  <div className="absolute inset-0 bg-gradient-to-bl from-[#e8a0b0]/60 via-[#f4c0d0]/30 to-transparent rounded-full blur-sm" />
                  <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-[#e8a0b0]/50 blur-md" />
                  <div className="absolute top-12 right-12 w-10 h-10 rounded-full bg-[#f4c0d0]/60 blur-sm" />
                </div>
              </div>
            </div>
            {/* Decorative sparkle */}
            <div className="absolute -top-3 -right-3 text-[#c45a7c] opacity-80">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L13.5 8.5L22 10L13.5 11.5L12 20L10.5 11.5L2 10L10.5 8.5L12 0Z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
