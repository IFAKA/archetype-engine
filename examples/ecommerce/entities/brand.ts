// Brand entity
import { defineEntity, text, boolean, hasMany } from '../../../src'

export const Brand = defineEntity('Brand', {
  fields: {
    name: text().required().unique().min(1).max(100).trim().label('Brand Name'),
    slug: text().required().unique().lowercase().label('URL Slug'),
    description: text().optional().max(2000),
    logoUrl: text().optional().url().label('Logo URL'),
    websiteUrl: text().optional().url().label('Website'),
    isActive: boolean().default(true),
    isFeatured: boolean().default(false),
  },
  relations: {
    products: hasMany('Product'),
  },
  behaviors: {
    timestamps: true,
    softDelete: true,
  },
  protected: false,
})
