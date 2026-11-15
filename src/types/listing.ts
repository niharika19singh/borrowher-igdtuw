export type ListingCondition = 'new' | 'like-new' | 'good' | 'fair';
export type ListingStatus = 'active' | 'paused' | 'booked' | 'removed';

export interface Listing {
  id: string;
  ownerUid: string;
  ownerName: string;
  title: string;
  description: string;
  categoryId: string;
  categoryLabel: string;
  condition: ListingCondition;
  pricePerDay: number;
  depositAmount: number;
  minDays: number;
  maxDays: number;
  pickupZone: string;
  status: ListingStatus;
  imageUrls: string[];
  rating: number;
  reviewCount: number;
  createdAt: string;
  /** Visual fallback when no real image */
  imageEmoji?: string;
  bgColor?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}
