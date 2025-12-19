// Cart entity
import { defineEntity, text, number, date, hasOne, hasMany } from '../../../src'

export const Cart = defineEntity('Cart', {
  fields: {
    sessionId: text().optional().label('Session ID'),
    currency: text().default('USD').min(3).max(3).uppercase(),
    subtotal: number().default(0).min(0),
    discount: number().default(0).min(0),
    tax: number().default(0).min(0),
    total: number().default(0).min(0),
    couponCode: text().optional().uppercase().label('Coupon Code'),
    expiresAt: date().optional(),
  },
  relations: {
    customer: hasOne('Customer'),
    items: hasMany('CartItem'),
  },
  behaviors: {
    timestamps: true,
  },
})
