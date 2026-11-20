import { describe, expect, it } from "vitest";
import {
  buildCreateListingPayload,
  buildListingImagePath,
  buildUpdateListingPayload,
  filterAndSortListings,
  validateImageFile,
  validateListingForm,
  type ListingFormValues,
} from "./marketplace";
import type { Listing } from "../types/backend";

const validForm: ListingFormValues = {
  title: "Casio Scientific Calculator fx-991EX",
  description: "Clean calculator ready for engineering exams and practicals.",
  categoryId: "electronics-calculators",
  condition: "like-new",
  mode: "rental",
  pricePerDay: 25,
  depositAmount: 300,
  minDays: 2,
  maxDays: 7,
  pickupZoneIds: ["admin-block-foyer"],
  imagePaths: ["listing-images/u1/f1/photo.jpg"],
  status: "active",
};

const existingListing: Listing = {
  listingId: "list_1",
  ownerUid: "u1",
  title: validForm.title,
  description: validForm.description,
  categoryId: validForm.categoryId,
  condition: validForm.condition,
  mode: validForm.mode,
  pricePerDay: validForm.pricePerDay,
  depositAmount: validForm.depositAmount,
  minDays: validForm.minDays,
  maxDays: validForm.maxDays,
  pickupZoneIds: validForm.pickupZoneIds,
  imagePaths: validForm.imagePaths,
  status: "active",
  createdAt: "2026-11-15T10:00:00Z",
  updatedAt: "2026-11-15T10:00:00Z",
};

describe("marketplace form validation", () => {
  it("accepts a valid rental listing form", () => {
    expect(validateListingForm(validForm)).toEqual({});
  });

  it("rejects maxDays < minDays", () => {
    const errors = validateListingForm({
      ...validForm,
      minDays: 8,
      maxDays: 4,
    });
    expect(errors.maxDays).toContain("greater than or equal");
  });

  it("rejects non-zero pricePerDay in free_peer mode", () => {
    const errors = validateListingForm({
      ...validForm,
      mode: "free_peer",
      pricePerDay: 15,
    });
    expect(errors.pricePerDay).toContain("₹0");
  });

  it("requires at least one approved pickup zone", () => {
    const errors = validateListingForm({
      ...validForm,
      pickupZoneIds: [],
    });
    expect(errors.pickupZoneIds).toBeDefined();
  });

  it("normalizes free_peer pricePerDay to 0 on create and update payloads", () => {
    const createPayload = buildCreateListingPayload({
      ...validForm,
      mode: "free_peer",
      pricePerDay: 20,
    });
    expect(createPayload.pricePerDay).toBe(0);

    const updatePayload = buildUpdateListingPayload("list_1", existingListing, {
      ...validForm,
      mode: "free_peer",
      pricePerDay: 25,
    });
    expect(updatePayload.mode).toBe("free_peer");
    expect(updatePayload.pricePerDay).toBe(0);
  });

  it("only includes changed fields in partial update payloads", () => {
    const updatePayload = buildUpdateListingPayload("list_1", existingListing, {
      ...validForm,
      minDays: 3,
    });
    expect(updatePayload).toEqual({
      listingId: "list_1",
      minDays: 3,
    });
  });
});

describe("storage image validation and paths", () => {
  it("accepts JPEG, PNG, and WebP files under 5 MB", () => {
    expect(
      validateImageFile({
        name: "calc.jpg",
        type: "image/jpeg",
        size: 1024 * 500,
      }),
    ).toBeNull();
    expect(
      validateImageFile({
        name: "calc.webp",
        type: "image/webp",
        size: 1024 * 1024,
      }),
    ).toBeNull();
  });

  it("rejects non-image files and files >= 5 MB", () => {
    expect(
      validateImageFile({
        name: "notes.pdf",
        type: "application/pdf",
        size: 1024,
      }),
    ).toContain("JPEG, PNG, or WebP");
    expect(
      validateImageFile({
        name: "huge.png",
        type: "image/png",
        size: 5 * 1024 * 1024,
      }),
    ).toContain("5 MB");
  });

  it("builds a storage-rules-compliant listing-images/{uid}/{folder}/{file} path", () => {
    const path = buildListingImagePath("user_123", "draft_9", "My Calc Photo!.jpg");
    expect(path).toMatch(
      /^listing-images\/user_123\/draft_9\/\d+-my-calc-photo-\.jpg$/,
    );
  });
});

describe("marketplace filtering and sorting", () => {
  const freeCoat: Listing = {
    ...existingListing,
    listingId: "list_2",
    title: "Cotton Lab Coat",
    categoryId: "lab-project-equipment",
    mode: "free_peer",
    pricePerDay: 0,
    createdAt: "2026-11-16T10:00:00Z",
  };

  it("filters by mode and category and sorts by price", () => {
    const onlyFree = filterAndSortListings([existingListing, freeCoat], {
      query: "",
      categoryId: "",
      mode: "free_peer",
      condition: "all",
      sort: "newest",
    });
    expect(onlyFree.map((x) => x.listingId)).toEqual(["list_2"]);

    const byPriceDesc = filterAndSortListings([existingListing, freeCoat], {
      query: "",
      categoryId: "",
      mode: "all",
      condition: "all",
      sort: "price-desc",
    });
    expect(byPriceDesc.map((x) => x.listingId)).toEqual(["list_1", "list_2"]);
  });

  it("returns only listingId when no fields changed in buildUpdateListingPayload", () => {
    const noOp = buildUpdateListingPayload("list_1", existingListing, validForm);
    expect(noOp).toEqual({ listingId: "list_1" });
    expect(Object.keys(noOp)).toHaveLength(1);
  });
});
