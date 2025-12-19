// Review entity
import { defineEntity, text, number, boolean, date, hasOne } from '../../../src'

export const Review = defineEntity('Review', {
  fields: {
    rating: number().required().min(1).max(5).integer().label('Rating'),
    title: text().optional().max(200).trim().label('Review Title'),
    body: text().required().min(10).max(5000).label('Review Body'),
    isVerifiedPurchase: boolean().default(false),
    isApproved: boolean().default(false),
    isFeatured: boolean().default(false),
    helpfulCount: number().default(0).min(0).integer(),
    reportCount: number().default(0).min(0).integer(),
    approvedAt: date().optional(),
  },
  relations: {
    product: hasOne('Product'),
    customer: hasOne('Customer'),
    order: hasOne('Order'),
  },
  behaviors: {
    timestamps: true,
    softDelete: true,
  },
})
