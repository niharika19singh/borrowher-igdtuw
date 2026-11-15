import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Bell, Megaphone, Sparkles } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { MOCK_LISTINGS } from '../data/mockListings';

const trending = MOCK_LISTINGS.slice(0, 4);

export const TrendingSection: React.FC = () => {
  return (
    <section className="py-10 bg-[#faf7f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-[#c45a7c]" />
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#2d1f24]">
              Trending on BorrowHer
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a7a84]"
              />
              <input
                type="search"
                placeholder="Search for items..."
                className="w-full pl-9 pr-3 py-2 rounded-full border border-blush-200 bg-white text-sm text-[#2d1f24] placeholder:text-[#9a7a84] focus:outline-none focus:ring-2 focus:ring-[#e8a0b0] focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const q = (e.target as HTMLInputElement).value;
                    window.location.href = `/marketplace?q=${encodeURIComponent(q)}`;
                  }
                }}
              />
            </div>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#c45a7c] text-white text-sm font-medium hover:bg-[#a34463] transition-colors"
            >
              <Filter size={14} />
              Filter
            </Link>
          </div>
        </div>

        {/* Cards grid + Emergency promo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {trending.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}

          {/* Emergency Essentials promo card */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#f4c0d0] via-[#e8a0b0] to-[#d97a9a] p-5 flex flex-col justify-between min-h-[260px] shadow-md">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/4" />

            <div className="relative z-10">
              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center mb-3 shadow-sm">
                <Bell size={18} className="text-[#c45a7c]" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-white leading-tight">
                Emergency Essentials
              </h3>
              <p className="text-white/90 text-sm mt-1.5 leading-snug">
                Need something urgently? Check out our emergency board!
              </p>
            </div>

            <div className="relative z-10 mt-4">
              <Link
                to="/emergency"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-[#c45a7c] text-sm font-semibold hover:bg-blush-50 transition-colors shadow-sm"
              >
                View Board
                <span className="text-base">→</span>
              </Link>
            </div>

            <div className="absolute bottom-4 right-4 text-white/30">
              <Megaphone size={40} strokeWidth={1.2} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrendingSection;
