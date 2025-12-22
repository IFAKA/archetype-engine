// Tag entity
import { defineEntity, text, belongsToMany } from '../../../src'

export const Tag = defineEntity('Tag', {
  fields: {
    name: text().required().unique().min(1).max(50).trim().lowercase().label('Tag Name'),
    slug: text().required().unique().lowercase().label('URL Slug'),
  },
  relations: {
    products: belongsToMany('Product'),
  },
  behaviors: {
    timestamps: true,
  },
  protected: false,
})
