// Category entity with self-referential relation
import { defineEntity, text, number, boolean, hasOne, hasMany } from '../../../src'

export const Category = defineEntity('Category', {
  fields: {
    name: text().required().min(2).max(100).trim().label('Category Name'),
    slug: text().required().unique().lowercase().label('URL Slug'),
    description: text().optional().max(1000),
    imageUrl: text().optional().url(),
    position: number().default(0).integer().label('Sort Order'),
    isActive: boolean().default(true),
    isFeatured: boolean().default(false),
  },
  relations: {
    parent: hasOne('Category'),
    children: hasMany('Category'),
    products: hasMany('Product'),
  },
  behaviors: {
    timestamps: true,
    softDelete: true,
  },
})
