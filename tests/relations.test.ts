import { describe, it, expect } from 'vitest'
import { hasOne, hasMany, belongsToMany } from '../src/relations'
import { number, text } from '../src/fields'

describe('Relation Builders', () => {
  describe('hasOne()', () => {
    it('creates a hasOne relation', () => {
      const rel = hasOne('User')
      expect(rel._config.type).toBe('hasOne')
      expect(rel._config.entity).toBe('User')
    })
  })

  describe('hasMany()', () => {
    it('creates a hasMany relation', () => {
      const rel = hasMany('Post')
      expect(rel._config.type).toBe('hasMany')
      expect(rel._config.entity).toBe('Post')
    })
  })

  describe('belongsToMany()', () => {
    it('creates a belongsToMany relation', () => {
      const rel = belongsToMany('Tag')
      expect(rel._config.type).toBe('belongsToMany')
      expect(rel._config.entity).toBe('Tag')
    })

    it('supports pivot fields via through()', () => {
      const rel = belongsToMany('Product').through({
        table: 'order_items',
        fields: {
          quantity: number().required().min(1),
          unitPrice: number().required(),
        }
      })

      expect(rel._config.type).toBe('belongsToMany')
      expect(rel._config.entity).toBe('Product')
      expect(rel._config.pivot).toBeDefined()
      expect(rel._config.pivot?.table).toBe('order_items')
      expect(rel._config.pivot?.fields).toBeDefined()
      expect(rel._config.pivot?.fields?.quantity).toBeDefined()
      expect(rel._config.pivot?.fields?.quantity.type).toBe('number')
      expect(rel._config.pivot?.fields?.quantity.required).toBe(true)
      expect(rel._config.pivot?.fields?.unitPrice).toBeDefined()
    })

    it('allows through() without custom table name', () => {
      const rel = belongsToMany('Tag').through({
        fields: {
          sortOrder: number().default(0),
        }
      })

      expect(rel._config.pivot?.table).toBeUndefined()
      expect(rel._config.pivot?.fields?.sortOrder).toBeDefined()
    })

    it('chains field() with through()', () => {
      const rel = belongsToMany('Category')
        .field('categoryId')
        .through({
          fields: {
            isPrimary: text().default('false'),
          }
        })

      expect(rel._config.field).toBe('categoryId')
      expect(rel._config.pivot?.fields?.isPrimary).toBeDefined()
    })
  })
})
