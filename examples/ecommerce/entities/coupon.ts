// Coupon entity - Promotion codes and loyalty coupons
import { defineEntity, text, number, boolean, date } from '../../../src'

export const Coupon = defineEntity('Coupon', {
  fields: {
    code: text().required().unique().uppercase().min(3).max(50).label('Coupon Code'),
    description: text().optional().max(500).label('Description'),

    // Discount Configuration
    discountType: text().required().oneOf(['percentage', 'fixed_amount', 'free_shipping'] as const).label('Discount Type'),
    discountValue: number().required().min(0).label('Discount Value'),

    // Restrictions
    minimumPurchase: number().default(0).min(0).label('Minimum Purchase Amount'),
    maximumDiscount: number().optional().min(0).label('Maximum Discount Amount'),
    usageLimit: number().optional().min(0).integer().label('Usage Limit'),
    usageCount: number().default(0).min(0).integer().label('Times Used'),

    // Validity Period
    validFrom: date().required().label('Valid From'),
    validUntil: date().required().label('Valid Until'),

    // Flags
    isActive: boolean().default(true).label('Active'),
    requiresLogin: boolean().default(false).label('Requires Authentication'),
  },
  behaviors: {
    timestamps: true,
  },
  protected: false,
})
