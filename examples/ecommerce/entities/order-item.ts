// Order Item entity
import { defineEntity, text, number, boolean, hasOne } from '../../../src'

export const OrderItem = defineEntity('OrderItem', {
  fields: {
    quantity: number().required().min(1).integer().label('Quantity'),
    unitPrice: number().required().min(0).label('Unit Price'),
    subtotal: number().required().min(0).label('Subtotal'),
    discount: number().default(0).min(0).label('Discount'),
    tax: number().default(0).min(0).label('Tax'),
    total: number().required().min(0).label('Total'),
    sku: text().required().label('Product SKU'),
    productName: text().required().label('Product Name'),
    variantName: text().optional().label('Variant Name'),

    // Gift Options
    isGift: boolean().default(false).label('Is Gift'),
    giftMessage: text().optional().max(500).label('Gift Message'),
  },
  relations: {
    order: hasOne('Order'),
    product: hasOne('Product'),
    variant: hasOne('ProductVariant'),
  },
  behaviors: {
    timestamps: true,
  },
  protected: 'all',
})
