import React, { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, PackageOpen } from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { CategoryBar } from '../../components/CategoryBar';
import { ProductCard } from '../../components/ProductCard';
import { MOCK_LISTINGS, CATEGORIES } from '../../data/mockListings';
import type { Listing } from '../../types/listing';

type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'rating';

export const MarketplacePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';

  const [query, setQuery] = useState(qParam);
  const [category, setCategory] = useState(categoryParam);
  const [sort, setSort] = useState<SortOption>('relevance');
  const [isLoading] = useState(false);

  // Sync URL → state on mount / param change
  React.useEffect(() => {
    setQuery(qParam);
    setCategory(categoryParam);
  }, [qParam, categoryParam]);

  const filtered: Listing[] = useMemo(() => {
    let list = [...MOCK_LISTINGS];

    if (category && category !== 'safe') {
      list = list.filter((l) => l.categoryId === category);
    }

    if (query.trim()) {
      const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
      list = list.filter((l) => {
        const hay = `${l.title} ${l.description} ${l.categoryLabel}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
      });
    }

    switch (sort) {
      case 'price-asc':
        list.sort((a, b) => a.pricePerDay - b.pricePerDay);
        break;
      case 'price-desc':
        list.sort((a, b) => b.pricePerDay - a.pricePerDay);
        break;
      case 'rating':
        list.sort((a, b) => b.rating - a.rating);
        break;
      default:
        // relevance: keep original order (or could boost exact title matches)
        break;
    }

    return list;
  }, [query, category, sort]);

  const applySearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (category) params.set('category', category);
    setSearchParams(params);
  };

  const handleCategoryChange = (catId: string) => {
    const next = catId === category ? '' : catId;
    setCategory(next);
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (next) params.set('category', next);
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-[#faf7f5]">
      <Navbar />
      <CategoryBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header + controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#2d1f24]">
              Marketplace
            </h1>
            <p className="text-sm text-[#6b4f57] mt-1">
              {filtered.length} item{filtered.length !== 1 ? 's' : ''} available
              {category
                ? ` in ${CATEGORIES.find((c) => c.id === category)?.name || category}`
                : ''}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <form onSubmit={applySearch} className="relative flex-1 sm:w-72">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a7a84]"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for items..."
                className="w-full pl-9 pr-3 py-2.5 rounded-full border border-blush-200 bg-white text-sm text-[#2d1f24] placeholder:text-[#9a7a84] focus:outline-none focus:ring-2 focus:ring-[#e8a0b0] focus:border-transparent"
              />
            </form>

            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  className="appearance-none pl-3 pr-8 py-2.5 rounded-full border border-blush-200 bg-white text-sm text-[#2d1f24] focus:outline-none focus:ring-2 focus:ring-[#e8a0b0]"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
                <SlidersHorizontal
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a7a84] pointer-events-none"
                />
              </div>
              <button
                type="button"
                onClick={() => applySearch()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#c45a7c] text-white text-sm font-medium hover:bg-[#a34463] transition-colors"
              >
                <Filter size={14} />
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Category chips (filter) */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            onClick={() => handleCategoryChange('')}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !category
                ? 'bg-[#c45a7c] text-white'
                : 'bg-white border border-blush-200 text-[#6b4f57] hover:bg-blush-50'
            }`}
          >
            All
          </button>
          {CATEGORIES.filter((c) => c.id !== 'safe').map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleCategoryChange(c.id)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === c.id
                  ? 'bg-[#c45a7c] text-white'
                  : 'bg-white border border-blush-200 text-[#6b4f57] hover:bg-blush-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-blush-100 h-64 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-blush-100 p-12 text-center">
            <PackageOpen size={40} className="mx-auto text-[#e8a0b0] mb-3" />
            <h3 className="font-serif text-lg font-semibold text-[#2d1f24]">
              No items found
            </h3>
            <p className="text-sm text-[#6b4f57] mt-1 max-w-md mx-auto">
              Try adjusting your search or filters. You can also list something the campus needs.
            </p>
            <Link
              to="/listings/new"
              className="inline-flex mt-5 px-5 py-2.5 rounded-full bg-[#c45a7c] text-white text-sm font-medium hover:bg-[#a34463] transition-colors"
            >
              List an Item
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filtered.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplacePage;
