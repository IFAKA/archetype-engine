// Product entity with complex validations
import { defineEntity, text, number, boolean, date, hasOne, hasMany, belongsToMany } from '../../../src'

export const Product = defineEntity('Product', {
  fields: {
    sku: text().required().unique().min(3).max(50).uppercase().label('SKU'),
    name: text().required().min(3).max(200).trim().label('Product Name'),
    slug: text().required().unique().lowercase().label('URL Slug'),
    description: text().optional().max(5000).label('Description'),
    shortDescription: text().optional().max(500).label('Short Description'),
    price: number().required().min(0).label('Price'),
    compareAtPrice: number().optional().min(0).label('Compare At Price'),
    costPrice: number().optional().min(0).label('Cost Price'),
    quantity: number().default(0).min(0).integer().label('Stock Quantity'),
    lowStockThreshold: number().default(5).min(0).integer().label('Low Stock Alert'),
    weight: number().optional().min(0).label('Weight (kg)'),
    isActive: boolean().default(true),
    isFeatured: boolean().default(false),
    isDigital: boolean().default(false),
    taxable: boolean().default(true),
    publishedAt: date().optional(),

    // SFCC Product Structure
    masterId: text().optional().label('Master Product ID'),

    // SEO Fields (critical for SFRA)
    metaTitle: text().optional().max(200).label('Meta Title'),
    metaDescription: text().optional().max(500).label('Meta Description'),
    metaKeywords: text().optional().max(500).label('Meta Keywords'),

    // Additional Content
    longDescription: text().optional().max(10000).label('Long Description'),
    pageTitle: text().optional().max(200).label('Page Title'),
    pageDescription: text().optional().max(1000).label('Page Description'),
  },
  relations: {
    category: hasOne('Category'),
    brand: hasOne('Brand'),
    images: hasMany('ProductImage'),
    variants: hasMany('ProductVariant'),
    reviews: hasMany('Review'),
    tags: belongsToMany('Tag'),
    relatedProducts: belongsToMany('Product'),
  },
  behaviors: {
    timestamps: true,
    softDelete: true,
    audit: true,
  },
  protected: false,
})
