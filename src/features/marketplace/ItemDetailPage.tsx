import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  MapPin,
  Calendar,
  Shield,
  Package,
  User,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { MOCK_LISTINGS } from '../../data/mockListings';
import type { Listing } from '../../types/listing';

const conditionLabel: Record<string, string> = {
  new: 'New',
  'like-new': 'Like New',
  good: 'Good',
  fair: 'Fair',
};

export const ItemDetailPage: React.FC = () => {
  const { listingId } = useParams<{ listingId: string }>();
  const listing: Listing | undefined = useMemo(
    () => MOCK_LISTINGS.find((l) => l.id === listingId),
    [listingId]
  );

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#faf7f5]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <Package size={48} className="mx-auto text-[#e8a0b0] mb-4" />
          <h1 className="font-serif text-2xl font-semibold text-[#2d1f24]">
            Listing not found
          </h1>
          <p className="text-[#6b4f57] mt-2">
            This item may have been removed or the link is incorrect.
          </p>
          <Link
            to="/marketplace"
            className="inline-flex mt-6 px-5 py-2.5 rounded-full bg-[#c45a7c] text-white text-sm font-medium hover:bg-[#a34463]"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setMessage('Please select both start and end dates.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setMessage('End date must be after start date.');
      return;
    }
    setMessage('');
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#faf7f5]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-1.5 text-sm text-[#c45a7c] hover:underline mb-6"
        >
          <ArrowLeft size={16} /> Back to Marketplace
        </Link>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left: image + details */}
          <div className="lg:col-span-3 space-y-5">
            <div
              className="rounded-2xl overflow-hidden border border-blush-100 shadow-sm aspect-[4/3] flex items-center justify-center text-7xl"
              style={{ backgroundColor: listing.bgColor || '#f8f4f0' }}
            >
              {listing.imageUrls?.[0] ? (
                <img
                  src={listing.imageUrls[0]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{listing.imageEmoji || '📦'}</span>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-blush-100 p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-blush-50 text-[#c45a7c] text-xs font-medium mb-2">
                    {listing.categoryLabel}
                  </span>
                  <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#2d1f24]">
                    {listing.title}
                  </h1>
                </div>
                <div className="flex items-center gap-1 text-sm text-[#6b4f57]">
                  <Star size={16} className="text-amber-400 fill-amber-400" />
                  <span className="font-semibold">{listing.rating.toFixed(1)}</span>
                  <span className="text-[#9a7a84]">({listing.reviewCount} reviews)</span>
                </div>
              </div>

              <p className="mt-4 text-[#6b4f57] leading-relaxed">{listing.description}</p>

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-[#9a7a84] text-xs uppercase tracking-wide">Condition</p>
                  <p className="font-medium text-[#2d1f24] mt-0.5">
                    {conditionLabel[listing.condition] || listing.condition}
                  </p>
                </div>
                <div>
                  <p className="text-[#9a7a84] text-xs uppercase tracking-wide">Pickup zone</p>
                  <p className="font-medium text-[#2d1f24] mt-0.5 flex items-center gap-1">
                    <MapPin size={14} className="text-[#c45a7c]" />
                    {listing.pickupZone}
                  </p>
                </div>
                <div>
                  <p className="text-[#9a7a84] text-xs uppercase tracking-wide">Duration</p>
                  <p className="font-medium text-[#2d1f24] mt-0.5">
                    {listing.minDays}–{listing.maxDays} days
                  </p>
                </div>
              </div>
            </div>

            {/* Lender card */}
            <div className="bg-white rounded-2xl border border-blush-100 p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e8a0b0] to-[#c45a7c] text-white font-semibold flex items-center justify-center">
                {listing.ownerName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#2d1f24] flex items-center gap-1.5">
                  <User size={14} className="text-[#c45a7c]" />
                  {listing.ownerName}
                </p>
                <p className="text-xs text-[#9a7a84] mt-0.5">Verified IGDTUW student</p>
              </div>
              <Shield size={20} className="text-[#c45a7c] flex-shrink-0" />
            </div>
          </div>

          {/* Right: pricing + request */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-blush-100 p-6 shadow-sm sticky top-24">
              <div className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-[#6b4f57] text-sm">Rental</span>
                  <span className="font-serif text-2xl font-semibold text-[#c45a7c]">
                    ₹{listing.pricePerDay}
                    <span className="text-sm font-normal text-[#9a7a84]">/day</span>
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[#6b4f57] text-sm">Refundable deposit</span>
                  <span className="font-medium text-[#2d1f24]">
                    ₹{listing.depositAmount}
                    <span className="text-xs font-normal text-[#9a7a84] ml-1">(simulated)</span>
                  </span>
                </div>
              </div>

              <hr className="my-5 border-blush-100" />

              {submitted ? (
                <div className="rounded-xl bg-blush-50 border border-blush-200 p-4 text-center">
                  <p className="font-medium text-[#c45a7c]">Request submitted</p>
                  <p className="text-sm text-[#6b4f57] mt-1">
                    The lender will review your request. You will be notified when they respond.
                  </p>
                  <p className="text-xs text-[#9a7a84] mt-3">
                    (Demo only — booking flow is handled by Cloud Functions in production.)
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#6b4f57] mb-1.5">
                      <Calendar size={12} className="inline mr-1" />
                      Borrow from
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-blush-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8a0b0]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6b4f57] mb-1.5">
                      Return by
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-blush-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8a0b0]"
                      required
                    />
                  </div>

                  {message && (
                    <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{message}</p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 rounded-full bg-[#c45a7c] text-white font-medium text-sm hover:bg-[#a34463] transition-colors shadow-md shadow-[#c45a7c]/20"
                  >
                    Request to Borrow
                  </button>
                  <p className="text-[11px] text-[#9a7a84] text-center">
                    No payment is collected in this MVP. Deposit is simulated.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailPage;
