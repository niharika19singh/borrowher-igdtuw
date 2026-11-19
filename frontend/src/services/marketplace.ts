import {
  collection,
  limit,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { callFunction, db, storage } from "../firebase/client";
import type {
  Category,
  CreateListingInput,
  GetListingResponse,
  Listing,
  PauseListingInput,
  PauseListingResponse,
  PickupZone,
  PublicProfile,
  UpdateListingInput,
} from "../types/backend";
import {
  buildListingImagePath,
  validateImageFile,
} from "../utils/marketplace";

// =============================================================================
// LIVE FIREBASE MARKETPLACE SERVICES (BE1 CONTRACTS — asia-south1)
// =============================================================================

export function subscribeActiveListings(
  onData: (items: Listing[]) => void,
  onError: (err: unknown) => void,
): () => void {
  if (!db) {
    onData([]);
    return () => {};
  }
  const q = query(
    collection(db, "listings"),
    where("status", "==", "active"),
    limit(100),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        ...(d.data() as Listing),
        listingId: d.id,
      }));
      onData(items);
    },
    onError,
  );
}

export function subscribeMyListings(
  uid: string,
  onData: (items: Listing[]) => void,
  onError: (err: unknown) => void,
): () => void {
  if (!db || !uid) {
    onData([]);
    return () => {};
  }
  const q = query(
    collection(db, "listings"),
    where("ownerUid", "==", uid),
    limit(100),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        ...(d.data() as Listing),
        listingId: d.id,
      }));
      onData(items);
    },
    onError,
  );
}

export function subscribeActiveCategories(
  onData: (items: Category[]) => void,
  onError: (err: unknown) => void,
): () => void {
  if (!db) {
    onData([]);
    return () => {};
  }
  const q = query(collection(db, "categories"), limit(50));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => ({
          ...(d.data() as Category),
          categoryId: d.id,
        }))
        .filter((cat) => cat.active === true);
      onData(items);
    },
    onError,
  );
}

export function subscribeApprovedPickupZones(
  onData: (items: PickupZone[]) => void,
  onError: (err: unknown) => void,
): () => void {
  if (!db) {
    onData([]);
    return () => {};
  }
  const q = query(collection(db, "pickupZones"), limit(50));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => ({
          ...(d.data() as PickupZone),
          zoneId: d.id,
        }))
        .filter(
          (zone) => zone.active === true && zone.approvalStatus === "approved",
        );
      onData(items);
    },
    onError,
  );
}

export async function getListingDetail(
  listingId: string,
): Promise<GetListingResponse> {
  return callFunction<{ listingId: string }, GetListingResponse>("getListing", {
    listingId,
  });
}

export async function createListing(
  input: CreateListingInput,
): Promise<Listing> {
  return callFunction<CreateListingInput, Listing>("createListing", input);
}

export async function updateListing(
  input: UpdateListingInput,
): Promise<Listing> {
  return callFunction<UpdateListingInput, Listing>("updateListing", input);
}

export async function pauseListing(
  listingId: string,
  paused: boolean,
): Promise<PauseListingResponse> {
  return callFunction<PauseListingInput, PauseListingResponse>("pauseListing", {
    listingId,
    paused,
  });
}

export async function uploadListingPhoto(
  uid: string,
  folderId: string,
  file: File,
): Promise<{ path: string; url: string }> {
  const fileError = validateImageFile(file);
  if (fileError) {
    throw new Error(fileError);
  }
  if (!storage) {
    throw new Error("Firebase Storage is not configured.");
  }
  const storagePath = buildListingImagePath(uid, folderId, file.name);
  const fileRef = ref(storage, storagePath);
  await uploadBytes(fileRef, file, { contentType: file.type });
  const url = await getDownloadURL(fileRef);
  return { path: storagePath, url };
}

const resolvedUrlCache = new Map<string, string>();

export async function resolveListingImageUrl(
  path: string,
): Promise<string | null> {
  if (!path) return null;
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("/")
  ) {
    return path;
  }
  const cached = resolvedUrlCache.get(path);
  if (cached) return cached;
  if (!storage) return null;
  const url = await getDownloadURL(ref(storage, path));
  resolvedUrlCache.set(path, url);
  return url;
}

// =============================================================================
// ISOLATED DEMO-ONLY PREVIEW DATA (STRICTLY FOR /demo/* ROUTES)
// =============================================================================

export const DEMO_CATEGORIES: Category[] = [
  {
    categoryId: "electronics-calculators",
    name: "Calculators & Electronics",
    slug: "electronics-calculators",
    description: "Scientific calculators, chargers, and adapters.",
    active: true,
  },
  {
    categoryId: "academic-books",
    name: "Academic Books & Notes",
    slug: "academic-books",
    description: "Textbooks, reference manuals, and semester guides.",
    active: true,
  },
  {
    categoryId: "lab-project-equipment",
    name: "Lab Coats & Equipment",
    slug: "lab-project-equipment",
    description: "Lab coats, drafters, and practical kits.",
    active: true,
  },
  {
    categoryId: "campus-essentials",
    name: "Campus Essentials",
    slug: "campus-essentials",
    description: "Umbrellas, formal wear, and everyday campus items.",
    active: true,
  },
];

export const DEMO_PICKUP_ZONES: PickupZone[] = [
  {
    zoneId: "admin-block-foyer",
    label: "Admin Block Foyer",
    campusArea: "Central Academic Lawn",
    active: true,
    approvalStatus: "approved",
    guidance: "Meet near the main noticeboard during daytime campus hours.",
    accessNote: "Open to all verified IGDTUW students.",
  },
  {
    zoneId: "library-entrance",
    label: "Central Library Entrance",
    campusArea: "Library & Study Block",
    active: true,
    approvalStatus: "approved",
    guidance: "Exchange outside the reading-room turnstile.",
    accessNote: "Follow library entry hours.",
  },
];

export const DEMO_LISTINGS: Listing[] = [
  {
    listingId: "demo-calc",
    ownerUid: "demo-priya",
    title: "Casio Scientific Calculator fx-991EX",
    description:
      "Sample listing · Clean engineering scientific calculator with cover, ready for semester exams.",
    categoryId: "electronics-calculators",
    condition: "like-new",
    imagePaths: ["/images/calculator.jpg"],
    mode: "rental",
    pricePerDay: 20,
    depositAmount: 200,
    minDays: 1,
    maxDays: 7,
    pickupZoneIds: ["admin-block-foyer"],
    status: "active",
    createdAt: "2026-11-14T10:00:00Z",
    updatedAt: "2026-11-14T10:00:00Z",
  },
  {
    listingId: "demo-coat",
    ownerUid: "me",
    title: "Cotton Chemistry Lab Coat (Size M)",
    description:
      "Sample listing · Freshly washed white cotton lab coat for chemistry and physics practicals.",
    categoryId: "lab-project-equipment",
    condition: "good",
    imagePaths: ["/images/lab-coat.jpg"],
    mode: "free_peer",
    pricePerDay: 0,
    depositAmount: 100,
    minDays: 1,
    maxDays: 5,
    pickupZoneIds: ["library-entrance"],
    status: "active",
    createdAt: "2026-11-13T10:00:00Z",
    updatedAt: "2026-11-13T10:00:00Z",
  },
  {
    listingId: "demo-books",
    ownerUid: "demo-ananya",
    title: "Engineering Mathematics Reference Set",
    description:
      "Sample listing · Clean second-hand textbook bundle for first and second year courses.",
    categoryId: "academic-books",
    condition: "good",
    imagePaths: ["/images/books.jpg"],
    mode: "rental",
    pricePerDay: 15,
    depositAmount: 150,
    minDays: 2,
    maxDays: 14,
    pickupZoneIds: ["library-entrance", "admin-block-foyer"],
    status: "active",
    createdAt: "2026-11-12T10:00:00Z",
    updatedAt: "2026-11-12T10:00:00Z",
  },
  {
    listingId: "demo-umbrella",
    ownerUid: "demo-kavya",
    title: "Compact Burgundy Campus Umbrella",
    description:
      "Sample listing · Windproof foldable umbrella for sudden monsoon showers between classes.",
    categoryId: "campus-essentials",
    condition: "like-new",
    imagePaths: ["/images/umbrella.jpg"],
    mode: "free_peer",
    pricePerDay: 0,
    depositAmount: 50,
    minDays: 1,
    maxDays: 3,
    pickupZoneIds: ["admin-block-foyer"],
    status: "active",
    createdAt: "2026-11-11T10:00:00Z",
    updatedAt: "2026-11-11T10:00:00Z",
  },
];

export const DEMO_LENDER_PROFILES: Record<string, PublicProfile> = {
  me: {
    uid: "me",
    displayName: "Aanya Sharma",
    photoURL: null,
    verificationBadge: true,
    completedBorrowCount: 5,
    ratingSummary: { averageRating: 4.9, totalReviews: 5 },
  },
  "demo-priya": {
    uid: "demo-priya",
    displayName: "Priya Verma",
    photoURL: null,
    verificationBadge: true,
    completedBorrowCount: 8,
    ratingSummary: { averageRating: 4.8, totalReviews: 6 },
  },
  "demo-ananya": {
    uid: "demo-ananya",
    displayName: "Ananya Kapoor",
    photoURL: null,
    verificationBadge: true,
    completedBorrowCount: 4,
    ratingSummary: { averageRating: 5.0, totalReviews: 4 },
  },
  "demo-kavya": {
    uid: "demo-kavya",
    displayName: "Kavya Nair",
    photoURL: null,
    verificationBadge: true,
    completedBorrowCount: 3,
    ratingSummary: { averageRating: 4.7, totalReviews: 3 },
  },
};
