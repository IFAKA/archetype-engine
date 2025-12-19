// Product Variant entity
import { defineEntity, text, number, boolean, hasOne, hasMany } from '../../../src'

export const ProductVariant = defineEntity('ProductVariant', {
  fields: {
    sku: text().required().unique().uppercase().label('Variant SKU'),
    name: text().required().min(1).max(200).label('Variant Name'),
    price: number().optional().min(0).label('Price Override'),
    compareAtPrice: number().optional().min(0).label('Compare At Price'),
    costPrice: number().optional().min(0).label('Cost'),
    quantity: number().default(0).min(0).integer().label('Stock'),
    weight: number().optional().min(0).label('Weight (kg)'),
    barcode: text().optional().label('Barcode'),
    position: number().default(0).integer().label('Sort Order'),
    isActive: boolean().default(true),
    // Option values stored as JSON
    options: text().optional().label('Options JSON'),
  },
  relations: {
    product: hasOne('Product'),
    images: hasMany('ProductImage'),
  },
  behaviors: {
    timestamps: true,
    softDelete: true,
  },
})
