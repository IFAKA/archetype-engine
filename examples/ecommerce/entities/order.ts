// Order entity
import { defineEntity, text, number, boolean, date, hasOne, hasMany } from '../../../src'

export const Order = defineEntity('Order', {
  fields: {
    orderNumber: text().required().unique().label('Order Number'),
    status: text().default('pending').oneOf([
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded'
    ] as const).label('Order Status'),
    paymentStatus: text().default('pending').oneOf([
      'pending',
      'authorized',
      'paid',
      'partially_refunded',
      'refunded',
      'failed'
    ] as const).label('Payment Status'),
    subtotal: number().required().min(0).label('Subtotal'),
    tax: number().default(0).min(0).label('Tax Amount'),
    shipping: number().default(0).min(0).label('Shipping Cost'),
    discount: number().default(0).min(0).label('Discount'),
    total: number().required().min(0).label('Total'),
    currency: text().default('USD').min(3).max(3).uppercase().label('Currency'),
    notes: text().optional().max(1000).label('Order Notes'),
    shippingMethod: text().optional().label('Shipping Method'),
    trackingNumber: text().optional().label('Tracking Number'),
    estimatedDelivery: date().optional(),
    paidAt: date().optional(),
    shippedAt: date().optional(),
    deliveredAt: date().optional(),
    cancelledAt: date().optional(),
  },
  relations: {
    customer: hasOne('Customer'),
    items: hasMany('OrderItem'),
    shippingAddress: hasOne('Address'),
    billingAddress: hasOne('Address'),
    payments: hasMany('Payment'),
  },
  behaviors: {
    timestamps: true,
    softDelete: true,
    audit: true,
  },
})
