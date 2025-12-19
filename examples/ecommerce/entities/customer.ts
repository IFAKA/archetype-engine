// Customer entity with full validation
import { defineEntity, text, number, boolean, date, hasOne, hasMany } from '../../../src'

export const Customer = defineEntity('Customer', {
  fields: {
    email: text().required().unique().email().max(255).label('Email Address'),
    firstName: text().required().min(1).max(50).trim().label('First Name'),
    lastName: text().required().min(1).max(50).trim().label('Last Name'),
    phone: text().optional().regex(/^\+?[1-9]\d{1,14}$/).label('Phone Number'),
    avatarUrl: text().optional().url(),
    tier: text().default('bronze').oneOf(['bronze', 'silver', 'gold', 'platinum'] as const).label('Membership Tier'),
    isVerified: boolean().default(false),
    marketingOptIn: boolean().default(false),
    dateOfBirth: date().optional(),
    loyaltyPoints: number().default(0).min(0).integer(),
    totalSpent: number().default(0).min(0),
  },
  relations: {
    addresses: hasMany('Address'),
    orders: hasMany('Order'),
    reviews: hasMany('Review'),
    wishlist: hasMany('WishlistItem'),
    cart: hasOne('Cart'),
  },
  behaviors: {
    timestamps: true,
    softDelete: true,
    audit: true,
  },
})
