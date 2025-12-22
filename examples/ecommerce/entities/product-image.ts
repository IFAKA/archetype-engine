// Product Image entity
import { defineEntity, text, number, boolean, hasOne } from '../../../src'

export const ProductImage = defineEntity('ProductImage', {
  fields: {
    url: text().required().url().label('Image URL'),
    altText: text().optional().max(200).label('Alt Text'),
    position: number().default(0).integer().label('Sort Order'),
    isPrimary: boolean().default(false),
    width: number().optional().positive().integer(),
    height: number().optional().positive().integer(),
  },
  relations: {
    product: hasOne('Product'),
    variant: hasOne('ProductVariant'),
  },
  behaviors: {
    timestamps: true,
  },
  protected: false,
})
