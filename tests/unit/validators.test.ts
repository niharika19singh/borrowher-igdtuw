import { describe, it, expect } from 'vitest';
import {
  createListingSchema,
  updateListingSchema,
  completeListingStateSchema,
  validateMergedListingState,
  approveStudentSchema,
  setAdminRoleSchema,
  pauseListingSchema,
  adminModerateListingSchema,
  adminManageCategorySchema,
  updateUserProfileSchema,
} from '../../functions/src/shared/validators';

describe('Marketplace & Listing Input Validation', () => {
  const validListingPayload = {
    title: 'Casio Scientific Calculator fx-991EX',
    description: 'Barely used calculator with solar battery, ideal for semester exams and engineering labs.',
    categoryId: 'electronics-calculators',
    condition: 'like-new' as const,
    imagePaths: ['listing-images/user123/listing001/calc1.jpg'],
    mode: 'rental' as const,
    pricePerDay: 25,
    depositAmount: 500,
    minDays: 1,
    maxDays: 7,
    pickupZoneIds: ['admin-block-foyer', 'it-department-gf'],
    status: 'active' as const,
  };

  it('accepts a valid marketplace listing input', () => {
    const result = createListingSchema.safeParse(validListingPayload);
    expect(result.success).toBe(true);
  });

  it('accepts a free peer lending listing with 0 price', () => {
    const freePayload = {
      ...validListingPayload,
      mode: 'free_peer' as const,
      pricePerDay: 0,
      depositAmount: 200,
    };
    const result = createListingSchema.safeParse(freePayload);
    expect(result.success).toBe(true);
  });

  it('rejects free peer lending listing if pricePerDay is greater than 0', () => {
    const invalidFreePayload = {
      ...validListingPayload,
      mode: 'free_peer' as const,
      pricePerDay: 50,
    };
    const result = createListingSchema.safeParse(invalidFreePayload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Price per day must be 0 for free peer lending mode');
    }
  });

  it('rejects titles that are too short (< 3 characters)', () => {
    const payload = { ...validListingPayload, title: 'ab' };
    const result = createListingSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('rejects titles that exceed 100 characters', () => {
    const payload = { ...validListingPayload, title: 'a'.repeat(101) };
    const result = createListingSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('rejects descriptions that are too short (< 10 characters)', () => {
    const payload = { ...validListingPayload, description: 'Too short' };
    const result = createListingSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('rejects negative price per day', () => {
    const payload = { ...validListingPayload, pricePerDay: -10 };
    const result = createListingSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('rejects negative deposit amount', () => {
    const payload = { ...validListingPayload, depositAmount: -50 };
    const result = createListingSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('rejects when maxDays is less than minDays', () => {
    const payload = { ...validListingPayload, minDays: 5, maxDays: 3 };
    const result = createListingSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Maximum borrow days must be greater than or equal to minimum borrow days');
    }
  });

  it('rejects borrowing durations exceeding 30 days', () => {
    const payload = { ...validListingPayload, maxDays: 31 };
    const result = createListingSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('rejects when no pickup zones are selected', () => {
    const payload = { ...validListingPayload, pickupZoneIds: [] };
    const result = createListingSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('rejects more than 5 attached images', () => {
    const payload = {
      ...validListingPayload,
      imagePaths: ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg'],
    };
    const result = createListingSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('validates partial listing updates', () => {
    const updatePayload = {
      listingId: 'listing123',
      pricePerDay: 30,
      title: 'Updated Casio Calculator Title',
    };
    const result = updateListingSchema.safeParse(updatePayload);
    expect(result.success).toBe(true);
  });

  it('validates pauseListing input', () => {
    const valid = pauseListingSchema.safeParse({ listingId: 'list1', paused: true });
    expect(valid.success).toBe(true);

    const invalid = pauseListingSchema.safeParse({ listingId: '', paused: true });
    expect(invalid.success).toBe(false);
  });
});

describe('Partial Listing Update & Complete Merged State Invariants', () => {
  const existingRentalListing = {
    title: 'Casio fx-991EX Calculator',
    description: 'Engineering calculator in great condition for math practicals.',
    categoryId: 'electronics-calculators',
    condition: 'like-new' as const,
    imagePaths: ['listing-images/sample.jpg'],
    mode: 'rental' as const,
    pricePerDay: 20,
    depositAmount: 500,
    minDays: 2,
    maxDays: 7,
    pickupZoneIds: ['admin-block-foyer'],
    status: 'active' as const,
  };

  const existingFreePeerListing = {
    title: 'Engineering Chemistry Lab Coat',
    description: 'Clean white cotton lab coat for first year engineering lab.',
    categoryId: 'lab-project-equipment',
    condition: 'good' as const,
    imagePaths: ['listing-images/coat.jpg'],
    mode: 'free_peer' as const,
    pricePerDay: 0,
    depositAmount: 150,
    minDays: 1,
    maxDays: 5,
    pickupZoneIds: ['admin-block-foyer'],
    status: 'active' as const,
  };

  it('rejects updating minDays alone beyond existing maxDays', () => {
    // Existing maxDays is 7. Updating minDays alone to 10 makes maxDays < minDays.
    expect(() =>
      validateMergedListingState(existingRentalListing, {
        listingId: 'listing123',
        minDays: 10,
      })
    ).toThrow('Maximum borrow days must be greater than or equal to minimum borrow days');
  });

  it('rejects updating maxDays below existing minDays', () => {
    // Existing minDays is 2. Updating maxDays alone to 1 makes maxDays < minDays.
    expect(() =>
      validateMergedListingState(existingRentalListing, {
        listingId: 'listing123',
        maxDays: 1,
      })
    ).toThrow('Maximum borrow days must be greater than or equal to minimum borrow days');
  });

  it('rejects switching rental to free_peer without resetting price', () => {
    // Existing pricePerDay is 20. Switching mode alone to free_peer leaves price > 0.
    expect(() =>
      validateMergedListingState(existingRentalListing, {
        listingId: 'listing123',
        mode: 'free_peer',
      })
    ).toThrow('Price per day must be 0 for free peer lending mode');
  });

  it('rejects updating price while mode is free_peer', () => {
    // Existing mode is free_peer. Updating pricePerDay to 15 violates free_peer rule.
    expect(() =>
      validateMergedListingState(existingFreePeerListing, {
        listingId: 'listing456',
        pricePerDay: 15,
      })
    ).toThrow('Price per day must be 0 for free peer lending mode');
  });

  it('accepts valid partial updates', () => {
    // 1. Updating title alone
    const titleUpdate = validateMergedListingState(existingRentalListing, {
      listingId: 'listing123',
      title: 'Brand New Scientific Calculator fx-991EX',
    });
    expect(titleUpdate.title).toBe('Brand New Scientific Calculator fx-991EX');
    expect(titleUpdate.pricePerDay).toBe(20);

    // 2. Updating minDays alone within existing maxDays (minDays: 4 <= maxDays: 7)
    const minDaysUpdate = validateMergedListingState(existingRentalListing, {
      listingId: 'listing123',
      minDays: 4,
    });
    expect(minDaysUpdate.minDays).toBe(4);
    expect(minDaysUpdate.maxDays).toBe(7);

    // 3. Updating maxDays alone above existing minDays (maxDays: 14 >= minDays: 2)
    const maxDaysUpdate = validateMergedListingState(existingRentalListing, {
      listingId: 'listing123',
      maxDays: 14,
    });
    expect(maxDaysUpdate.maxDays).toBe(14);
    expect(maxDaysUpdate.minDays).toBe(2);

    // 4. Switching rental to free_peer while resetting price to 0
    const modeSwitchUpdate = validateMergedListingState(existingRentalListing, {
      listingId: 'listing123',
      mode: 'free_peer',
      pricePerDay: 0,
    });
    expect(modeSwitchUpdate.mode).toBe('free_peer');
    expect(modeSwitchUpdate.pricePerDay).toBe(0);

    // 5. Switching free_peer to rental with valid non-negative price
    const toRentalUpdate = validateMergedListingState(existingFreePeerListing, {
      listingId: 'listing456',
      mode: 'rental',
      pricePerDay: 35,
    });
    expect(toRentalUpdate.mode).toBe('rental');
    expect(toRentalUpdate.pricePerDay).toBe(35);

    // 6. Updating depositAmount alone
    const depositUpdate = validateMergedListingState(existingRentalListing, {
      listingId: 'listing123',
      depositAmount: 600,
    });
    expect(depositUpdate.depositAmount).toBe(600);
  });
});

describe('Student Verification & Admin Validation', () => {
  it('validates approveStudent input for valid statuses', () => {
    expect(approveStudentSchema.safeParse({ uid: 'user1', status: 'verified' }).success).toBe(true);
    expect(approveStudentSchema.safeParse({ uid: 'user2', status: 'rejected', reason: 'Invalid student ID' }).success).toBe(true);
    expect(approveStudentSchema.safeParse({ uid: 'user3', status: 'suspended' }).success).toBe(true);
  });

  it('rejects invalid verification status', () => {
    const result = approveStudentSchema.safeParse({ uid: 'user1', status: 'super_verified' });
    expect(result.success).toBe(false);
  });

  it('validates setAdminRole input', () => {
    expect(setAdminRoleSchema.safeParse({ targetUid: 'user1', admin: true }).success).toBe(true);
    expect(setAdminRoleSchema.safeParse({ targetUid: 'user1', admin: false }).success).toBe(true);
    expect(setAdminRoleSchema.safeParse({ targetUid: '', admin: true }).success).toBe(false);
  });

  it('validates adminModerateListing input', () => {
    const valid = adminModerateListingSchema.safeParse({
      listingId: 'listing_001',
      status: 'removed',
      moderationReason: 'Contains counterfeit equipment that violates campus safety guidelines.',
    });
    expect(valid.success).toBe(true);

    const tooShortReason = adminModerateListingSchema.safeParse({
      listingId: 'listing_001',
      status: 'removed',
      moderationReason: 'bad',
    });
    expect(tooShortReason.success).toBe(false);
  });

  it('validates adminManageCategory input', () => {
    const valid = adminManageCategorySchema.safeParse({
      categoryId: 'sports-gear',
      name: 'Sports & Fitness Gear',
      slug: 'sports-fitness',
      description: 'Badminton rackets, basketballs, and sports equipment.',
      active: true,
      allowedFields: ['brand', 'sportType'],
    });
    expect(valid.success).toBe(true);
  });

  it('validates elective user profile updates', () => {
    const valid = updateUserProfileSchema.safeParse({
      displayName: 'Priya Sharma',
      programme: 'B.Tech IT',
      year: 3,
    });
    expect(valid.success).toBe(true);
  });
});
