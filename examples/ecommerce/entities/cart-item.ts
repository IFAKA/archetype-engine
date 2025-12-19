// Cart Item entity
import { defineEntity, number, hasOne } from '../../../src'

export const CartItem = defineEntity('CartItem', {
  fields: {
    quantity: number().required().min(1).integer().label('Quantity'),
    unitPrice: number().required().min(0).label('Unit Price'),
    subtotal: number().required().min(0).label('Subtotal'),
  },
  relations: {
    cart: hasOne('Cart'),
    product: hasOne('Product'),
    variant: hasOne('ProductVariant'),
  },
  behaviors: {
    timestamps: true,
  },
})
