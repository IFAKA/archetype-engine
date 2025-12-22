// Cart entity
import { defineEntity, text, number, boolean, date, hasOne, hasMany } from '../../../src'

export const Cart = defineEntity('Cart', {
  fields: {
    sessionId: text().optional().label('Session ID'),

    // SFCC Integration
    basketId: text().optional().unique().label('SFCC Basket UUID'),

    // Guest Cart Support
    isGuest: boolean().default(true).label('Guest Cart'),
    customerEmail: text().optional().email().label('Customer Email'),

    // Cart State
    status: text().default('active').oneOf(['active', 'abandoned', 'converted', 'merged'] as const).label('Cart Status'),

    // Totals
    currency: text().default('USD').min(3).max(3).uppercase(),
    subtotal: number().default(0).min(0),
    discount: number().default(0).min(0),
    tax: number().default(0).min(0),
    total: number().default(0).min(0),
    couponCode: text().optional().uppercase().label('Coupon Code'),
    expiresAt: date().optional(),
  },
  relations: {
    customer: hasOne('Customer').optional(),
    items: hasMany('CartItem'),
    appliedCoupons: hasMany('Coupon'),
  },
  behaviors: {
    timestamps: true,
  },
  protected: false,
})
