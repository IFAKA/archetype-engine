// Wishlist Item entity
import { defineEntity, text, hasOne } from '../../../src'

export const WishlistItem = defineEntity('WishlistItem', {
  fields: {
    notes: text().optional().max(500).label('Notes'),
  },
  relations: {
    customer: hasOne('Customer'),
    product: hasOne('Product'),
    variant: hasOne('ProductVariant'),
  },
  behaviors: {
    timestamps: true,
  },
  protected: 'write',
})
