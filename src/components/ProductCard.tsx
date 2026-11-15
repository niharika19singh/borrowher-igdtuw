import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { Listing } from '../types/listing';

/** @deprecated Prefer Listing; kept for backward compatibility with older imports */
export type Product = Listing;

interface ProductCardProps {
  product: Listing;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <Link
      to={`/items/${product.id}`}
      className="group bg-white rounded-2xl border border-blush-100 overflow-hidden shadow-sm hover:shadow-md hover:border-blush-200 transition-all duration-200 flex flex-col h-full"
    >
      <div
        className="relative aspect-[4/3] overflow-hidden"
        style={{ backgroundColor: product.bgColor || '#f8f4f0' }}
      >
        {product.imageUrls && product.imageUrls.length > 0 ? (
          <img
            src={product.imageUrls[0]}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl select-none">
            {product.imageEmoji || '📦'}
          </div>
        )}
        <span className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[11px] font-medium text-[#6b4f57]">
          {product.categoryLabel}
        </span>
      </div>

      <div className="p-3.5 flex flex-col flex-1">
        <h3 className="font-medium text-[#2d1f24] text-sm leading-snug line-clamp-2 group-hover:text-[#c45a7c] transition-colors">
          {product.title}
        </h3>
        <p className="text-[11px] text-[#9a7a84] mt-0.5">IGDTUW · {product.pickupZone}</p>
        <div className="mt-auto pt-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-[12px] text-[#6b4f57] min-w-0">
            <Star size={12} className="text-amber-400 fill-amber-400 flex-shrink-0" />
            <span className="font-medium">{product.rating.toFixed(1)}</span>
            <span className="text-[#9a7a84] truncate">({product.reviewCount})</span>
          </div>
          <span className="font-semibold text-[#c45a7c] text-sm whitespace-nowrap">
            ₹{product.pricePerDay}
            <span className="text-[11px] font-normal text-[#9a7a84]">/day</span>
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
