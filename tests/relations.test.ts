import { describe, it, expect } from 'vitest'
import { hasOne, hasMany, belongsToMany } from '../src/relations'

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
  })
})
