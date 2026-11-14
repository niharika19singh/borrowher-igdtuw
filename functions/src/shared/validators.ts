import { z } from 'zod';

// =============================================================================
// LISTING VALIDATION SCHEMAS
// =============================================================================

export const listingConditionSchema = z.enum(['new', 'like-new', 'good', 'fair']);
export const listingModeSchema = z.enum(['free_peer', 'rental']);
export const listingStatusSchema = z.enum(['draft', 'active', 'paused', 'unavailable', 'removed']);

export const createListingSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters long')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(10, 'Description must be at least 10 characters long')
    .max(2000, 'Description cannot exceed 2000 characters'),
  categoryId: z
    .string({ required_error: 'Category is required' })
    .trim()
    .min(1, 'Category ID is required'),
  condition: listingConditionSchema,
  imagePaths: z
    .array(z.string().trim())
    .max(5, 'A maximum of 5 images can be attached to a listing')
    .default([]),
  mode: listingModeSchema,
  pricePerDay: z
    .number({ required_error: 'Price per day is required' })
    .min(0, 'Price per day cannot be negative'),
  depositAmount: z
    .number({ required_error: 'Deposit amount is required' })
    .min(0, 'Deposit amount cannot be negative'),
  minDays: z
    .number({ required_error: 'Minimum borrow days is required' })
    .int('Minimum days must be an integer')
    .min(1, 'Minimum borrow period must be at least 1 day')
    .max(30, 'Minimum borrow period cannot exceed 30 days'),
  maxDays: z
    .number({ required_error: 'Maximum borrow days is required' })
    .int('Maximum days must be an integer')
    .min(1, 'Maximum borrow period must be at least 1 day')
    .max(30, 'Maximum borrow period cannot exceed 30 days'),
  pickupZoneIds: z
    .array(z.string().trim().min(1))
    .min(1, 'At least one campus pickup zone must be selected')
    .max(10, 'Cannot exceed 10 pickup zones'),
  status: z.enum(['draft', 'active']).default('active'),
}).refine((data) => data.maxDays >= data.minDays, {
  message: 'Maximum borrow days must be greater than or equal to minimum borrow days',
  path: ['maxDays'],
}).refine((data) => {
  if (data.mode === 'free_peer' && data.pricePerDay > 0) {
    return false;
  }
  return true;
}, {
  message: 'Price per day must be 0 for free peer lending mode',
  path: ['pricePerDay'],
});

export const updateListingSchema = z.object({
  listingId: z.string().trim().min(1, 'Listing ID is required'),
  title: z.string().trim().min(3).max(100).optional(),
  description: z.string().trim().min(10).max(2000).optional(),
  categoryId: z.string().trim().min(1).optional(),
  condition: listingConditionSchema.optional(),
  imagePaths: z.array(z.string().trim()).max(5).optional(),
  mode: listingModeSchema.optional(),
  pricePerDay: z.number().min(0).optional(),
  depositAmount: z.number().min(0).optional(),
  minDays: z.number().int().min(1).max(30).optional(),
  maxDays: z.number().int().min(1).max(30).optional(),
  pickupZoneIds: z.array(z.string().trim().min(1)).min(1).max(10).optional(),
  status: z.enum(['draft', 'active', 'paused']).optional(),
}).refine((data) => {
  if (data.minDays !== undefined && data.maxDays !== undefined) {
    return data.maxDays >= data.minDays;
  }
  return true;
}, {
  message: 'Maximum borrow days must be greater than or equal to minimum borrow days',
  path: ['maxDays'],
});

// =============================================================================
// USER & ADMIN VALIDATION SCHEMAS
// =============================================================================

export const approveStudentSchema = z.object({
  uid: z.string().trim().min(1, 'UID is required'),
  status: z.enum(['verified', 'rejected', 'suspended'], {
    required_error: 'Verification status is required',
  }),
  reason: z.string().trim().max(500).optional(),
});

export const setAdminRoleSchema = z.object({
  targetUid: z.string().trim().min(1, 'Target UID is required'),
  admin: z.boolean({ required_error: 'Admin boolean flag is required' }),
});

export const pauseListingSchema = z.object({
  listingId: z.string().trim().min(1, 'Listing ID is required'),
  paused: z.boolean({ required_error: 'Paused boolean flag is required' }),
});

export const adminModerateListingSchema = z.object({
  listingId: z.string().trim().min(1, 'Listing ID is required'),
  status: z.enum(['active', 'removed']),
  moderationReason: z.string().trim().min(5, 'Moderation reason must be at least 5 characters').max(500),
});

export const adminManageCategorySchema = z.object({
  categoryId: z.string().trim().min(1, 'Category ID is required'),
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(100),
  description: z.string().trim().min(5).max(500),
  active: z.boolean().default(true),
  allowedFields: z.array(z.string()).optional(),
});

export const updateUserProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(100).optional(),
  programme: z.string().trim().max(100).optional(),
  year: z.union([z.number().int().min(1).max(6), z.string().trim().max(20)]).optional(),
});
