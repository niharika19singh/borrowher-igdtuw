import type {
  CreateListingInput,
  Listing,
  ListingCondition,
  ListingMode,
  UpdateListingInput,
} from "../types/backend";

export const MAX_LISTING_IMAGES = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export interface ListingFormValues {
  title: string;
  description: string;
  categoryId: string;
  condition: ListingCondition;
  mode: ListingMode;
  pricePerDay: number;
  depositAmount: number;
  minDays: number;
  maxDays: number;
  pickupZoneIds: string[];
  imagePaths: string[];
  status: "draft" | "active" | "paused";
}

export type ListingFormErrors = Partial<Record<keyof ListingFormValues, string>>;

export function validateListingForm(
  values: ListingFormValues,
): ListingFormErrors {
  const errors: ListingFormErrors = {};
  const title = values.title.trim();
  const description = values.description.trim();

  if (title.length < 3 || title.length > 100) {
    errors.title = "Title must be between 3 and 100 characters.";
  }
  if (description.length < 10 || description.length > 2000) {
    errors.description = "Description must be between 10 and 2000 characters.";
  }
  if (!values.categoryId.trim()) {
    errors.categoryId = "Select an active campus category.";
  }
  if (values.mode === "free_peer") {
    if (values.pricePerDay !== 0) {
      errors.pricePerDay = "Price per day must be ₹0 for free peer lending.";
    }
  } else if (
    !Number.isFinite(values.pricePerDay) ||
    values.pricePerDay < 0
  ) {
    errors.pricePerDay = "Price per day must be ₹0 or more.";
  }
  if (!Number.isFinite(values.depositAmount) || values.depositAmount < 0) {
    errors.depositAmount = "Refundable deposit cannot be negative.";
  }
  if (
    !Number.isInteger(values.minDays) ||
    values.minDays < 1 ||
    values.minDays > 30
  ) {
    errors.minDays = "Minimum borrow days must be a whole number (1–30).";
  }
  if (
    !Number.isInteger(values.maxDays) ||
    values.maxDays < 1 ||
    values.maxDays > 30
  ) {
    errors.maxDays = "Maximum borrow days must be a whole number (1–30).";
  } else if (values.maxDays < values.minDays) {
    errors.maxDays =
      "Maximum borrow days must be greater than or equal to minimum borrow days.";
  }
  if (values.pickupZoneIds.length < 1 || values.pickupZoneIds.length > 10) {
    errors.pickupZoneIds = "Select between 1 and 10 approved campus pickup zones.";
  }
  if (values.imagePaths.length > MAX_LISTING_IMAGES) {
    errors.imagePaths = `You can attach up to ${MAX_LISTING_IMAGES} photos.`;
  }

  return errors;
}

export function validateImageFile(file: {
  type: string;
  size: number;
  name: string;
}): string | null {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    return `"${file.name}" must be a JPEG, PNG, or WebP image.`;
  }
  if (file.size >= MAX_IMAGE_BYTES) {
    return `"${file.name}" exceeds the 5 MB image upload limit.`;
  }
  return null;
}

export function buildListingImagePath(
  uid: string,
  folderId: string,
  fileName: string,
): string {
  const cleanUid = uid.replace(/[^a-zA-Z0-9_-]/g, "");
  const cleanFolder = folderId.replace(/[^a-zA-Z0-9_-]/g, "");
  const cleanName = fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  const stamp = Date.now();
  return `listing-images/${cleanUid}/${cleanFolder}/${stamp}-${cleanName || "photo.jpg"}`;
}

export function buildCreateListingPayload(
  values: ListingFormValues,
): CreateListingInput {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    categoryId: values.categoryId.trim(),
    condition: values.condition,
    imagePaths: values.imagePaths,
    mode: values.mode,
    pricePerDay: values.mode === "free_peer" ? 0 : values.pricePerDay,
    depositAmount: values.depositAmount,
    minDays: values.minDays,
    maxDays: values.maxDays,
    pickupZoneIds: values.pickupZoneIds,
    status: values.status === "draft" ? "draft" : "active",
  };
}

export function buildUpdateListingPayload(
  listingId: string,
  original: Listing,
  next: ListingFormValues,
): UpdateListingInput {
  const payload: UpdateListingInput = { listingId };
  const trimmedTitle = next.title.trim();
  const trimmedDescription = next.description.trim();
  const normalizedPrice = next.mode === "free_peer" ? 0 : next.pricePerDay;

  if (trimmedTitle !== original.title) payload.title = trimmedTitle;
  if (trimmedDescription !== original.description) {
    payload.description = trimmedDescription;
  }
  if (next.categoryId !== original.categoryId) {
    payload.categoryId = next.categoryId;
  }
  if (next.condition !== original.condition) payload.condition = next.condition;
  if (
    JSON.stringify(next.imagePaths) !== JSON.stringify(original.imagePaths)
  ) {
    payload.imagePaths = next.imagePaths;
  }
  if (next.mode !== original.mode) {
    payload.mode = next.mode;
    payload.pricePerDay = normalizedPrice;
  } else if (normalizedPrice !== original.pricePerDay) {
    payload.pricePerDay = normalizedPrice;
  }
  if (next.depositAmount !== original.depositAmount) {
    payload.depositAmount = next.depositAmount;
  }
  if (next.minDays !== original.minDays) payload.minDays = next.minDays;
  if (next.maxDays !== original.maxDays) payload.maxDays = next.maxDays;
  if (
    JSON.stringify(next.pickupZoneIds) !==
    JSON.stringify(original.pickupZoneIds)
  ) {
    payload.pickupZoneIds = next.pickupZoneIds;
  }
  if (next.status !== original.status) {
    payload.status = next.status;
  }

  return payload;
}

export type MarketplaceSort = "newest" | "price-asc" | "price-desc";

export interface MarketplaceFilter {
  query: string;
  categoryId: string;
  mode: "all" | ListingMode;
  condition: "all" | ListingCondition;
  sort: MarketplaceSort;
}

export function filterAndSortListings(
  listings: Listing[],
  filter: MarketplaceFilter,
): Listing[] {
  const q = filter.query.trim().toLowerCase();
  const filtered = listings.filter((item) => {
    if (filter.categoryId && item.categoryId !== filter.categoryId) {
      return false;
    }
    if (filter.mode !== "all" && item.mode !== filter.mode) {
      return false;
    }
    if (filter.condition !== "all" && item.condition !== filter.condition) {
      return false;
    }
    if (!q) return true;
    return `${item.title} ${item.description} ${item.categoryId}`
      .toLowerCase()
      .includes(q);
  });

  const sorted = [...filtered];
  if (filter.sort === "price-asc") {
    sorted.sort((a, b) => a.pricePerDay - b.pricePerDay);
  } else if (filter.sort === "price-desc") {
    sorted.sort((a, b) => b.pricePerDay - a.pricePerDay);
  } else {
    sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return sorted;
}

export const CONDITION_LABELS: Record<ListingCondition, string> = {
  new: "New",
  "like-new": "Like new",
  good: "Good",
  fair: "Fair",
};
