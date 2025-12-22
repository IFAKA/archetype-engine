// Cart Item entity
import { defineEntity, text, number, hasOne } from '../../../src'

export const CartItem = defineEntity('CartItem', {
  fields: {
    quantity: number().required().min(1).integer().label('Quantity'),
    unitPrice: number().required().min(0).label('Unit Price'),
    subtotal: number().required().min(0).label('Subtotal'),

    // Product snapshot (in case product changes)
    productName: text().required().label('Product Name'),
    productSku: text().required().label('Product SKU'),

    // SFCC Integration
    lineItemId: text().optional().unique().label('Line Item UUID'),
  },
  relations: {
    cart: hasOne('Cart'),
    product: hasOne('Product'),
    variant: hasOne('ProductVariant'),
  },
  behaviors: {
    timestamps: true,
  },
  protected: false,
})
