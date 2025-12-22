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

    // Guest Order Support
    customerEmail: text().required().email().label('Customer Email'),
    customerFirstName: text().required().min(1).max(50).trim().label('Customer First Name'),
    customerLastName: text().required().min(1).max(50).trim().label('Customer Last Name'),

    // SFCC Integration
    customerNo: text().optional().label('Customer Number'),
    orderToken: text().optional().unique().label('Order Token'),

    // Marketplace Integration
    isMiraklOrder: boolean().default(false).label('Marketplace Order'),
  },
  relations: {
    customer: hasOne('Customer').optional(),
    items: hasMany('OrderItem'),
    shippingAddress: hasOne('Address'),
    billingAddress: hasOne('Address'),
    payments: hasMany('Payment'),
    shipments: hasMany('Shipment'),
  },
  behaviors: {
    timestamps: true,
    softDelete: true,
    audit: true,
  },
  protected: 'write',
})
