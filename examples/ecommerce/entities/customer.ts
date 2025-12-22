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

    // SFCC Integration
    customerNo: text().optional().unique().label('SFCC Customer Number'),

    // Marketing Cloud Integration
    sscid: text().optional().label('Marketing Cloud Subscriber ID'),

    // GDPR Consent Fields
    gdprNewsletterConsent: boolean().default(false).label('Newsletter Consent'),
    gdprTermsConsent: boolean().default(false).label('Terms & Conditions Consent'),
    gdprPrivacyConsent: boolean().default(false).label('Privacy Policy Consent'),
    gdprConsentUpdatedAt: date().optional().label('GDPR Consent Update Date'),

    // Legacy Migration Support
    legacyPasswordHash: text().optional().label('Legacy Password Hash'),
  },
  relations: {
    addresses: hasMany('Address'),
    orders: hasMany('Order'),
    reviews: hasMany('Review'),
    wishlist: hasMany('WishlistItem'),
    cart: hasOne('Cart'),
    paymentInstruments: hasMany('PaymentInstrument'),
  },
  behaviors: {
    timestamps: true,
    softDelete: true,
    audit: true,
  },
  protected: 'all',
})
