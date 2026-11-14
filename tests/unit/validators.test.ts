import { describe, it, expect } from 'vitest';
import {
  createListingSchema,
  updateListingSchema,
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
