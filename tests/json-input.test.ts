import { describe, it, expect } from 'vitest'
import {
  parseFieldJSON,
  parseRelationJSON,
  parseEntityJSON,
  parseManifestJSON,
} from '../src/json/parser'
import type { FieldJSON, EntityJSON, ManifestJSON } from '../src/json/types'

describe('JSON Input Parser', () => {
  describe('parseFieldJSON', () => {
    it('parses a basic text field', () => {
      const field: FieldJSON = { type: 'text' }
      const result = parseFieldJSON(field)

      expect(result.type).toBe('text')
      expect(result.required).toBe(true) // default is required
      expect(result.unique).toBe(false)
      expect(result.validations).toEqual([])
    })

    it('parses optional field', () => {
      const field: FieldJSON = { type: 'text', optional: true }
      const result = parseFieldJSON(field)

      expect(result.required).toBe(false)
    })

    it('parses required: false', () => {
      const field: FieldJSON = { type: 'text', required: false }
      const result = parseFieldJSON(field)

      expect(result.required).toBe(false)
    })

    it('parses text validations', () => {
      const field: FieldJSON = {
        type: 'text',
        min: 5,
        max: 100,
        email: true,
        trim: true,
      }
      const result = parseFieldJSON(field)

      expect(result.validations).toContainEqual({ type: 'minLength', value: 5 })
      expect(result.validations).toContainEqual({ type: 'maxLength', value: 100 })
      expect(result.validations).toContainEqual({ type: 'email' })
      expect(result.validations).toContainEqual({ type: 'trim' })
    })

    it('parses number validations', () => {
      const field: FieldJSON = {
        type: 'number',
        min: 0,
        max: 100,
        integer: true,
        positive: true,
      }
      const result = parseFieldJSON(field)

      expect(result.validations).toContainEqual({ type: 'min', value: 0 })
      expect(result.validations).toContainEqual({ type: 'max', value: 100 })
      expect(result.validations).toContainEqual({ type: 'integer' })
      expect(result.validations).toContainEqual({ type: 'positive' })
    })

    it('parses oneOf validation', () => {
      const field: FieldJSON = {
        type: 'text',
        oneOf: ['admin', 'user', 'guest'],
      }
      const result = parseFieldJSON(field)

      expect(result.validations).toContainEqual({
        type: 'oneOf',
        value: ['admin', 'user', 'guest'],
      })
    })

    it('parses default value', () => {
      const field: FieldJSON = { type: 'text', default: 'hello' }
      const result = parseFieldJSON(field)

      expect(result.default).toBe('hello')
    })

    it('parses label', () => {
      const field: FieldJSON = { type: 'text', label: 'Email Address' }
      const result = parseFieldJSON(field)

      expect(result.label).toBe('Email Address')
    })
  })

  describe('parseRelationJSON', () => {
    it('parses hasOne relation', () => {
      const result = parseRelationJSON({ type: 'hasOne', entity: 'User' })

      expect(result.type).toBe('hasOne')
      expect(result.entity).toBe('User')
    })

    it('parses hasMany relation', () => {
      const result = parseRelationJSON({ type: 'hasMany', entity: 'Post' })

      expect(result.type).toBe('hasMany')
      expect(result.entity).toBe('Post')
    })

    it('parses belongsToMany relation', () => {
      const result = parseRelationJSON({ type: 'belongsToMany', entity: 'Tag' })

      expect(result.type).toBe('belongsToMany')
      expect(result.entity).toBe('Tag')
    })

    it('parses custom field name', () => {
      const result = parseRelationJSON({
        type: 'hasOne',
        entity: 'User',
        field: 'authorId',
      })

      expect(result.field).toBe('authorId')
    })
  })

  describe('parseEntityJSON', () => {
    it('parses a basic entity', () => {
      const entity: EntityJSON = {
        name: 'User',
        fields: {
          email: { type: 'text', email: true },
          name: { type: 'text' },
        },
      }
      const result = parseEntityJSON(entity)

      expect(result.name).toBe('User')
      expect(result.fields.email.type).toBe('text')
      expect(result.fields.name.type).toBe('text')
      expect(result.behaviors.timestamps).toBe(true) // default
    })

    it('parses entity with relations', () => {
      const entity: EntityJSON = {
        name: 'Post',
        fields: {
          title: { type: 'text' },
        },
        relations: {
          author: { type: 'hasOne', entity: 'User' },
        },
      }
      const result = parseEntityJSON(entity)

      expect(result.relations.author.type).toBe('hasOne')
      expect(result.relations.author.entity).toBe('User')
    })

    it('parses entity behaviors', () => {
      const entity: EntityJSON = {
        name: 'Post',
        fields: { title: { type: 'text' } },
        behaviors: {
          timestamps: false,
          softDelete: true,
          audit: true,
        },
      }
      const result = parseEntityJSON(entity)

      expect(result.behaviors.timestamps).toBe(false)
      expect(result.behaviors.softDelete).toBe(true)
      expect(result.behaviors.audit).toBe(true)
    })

    it('parses protected: "write"', () => {
      const entity: EntityJSON = {
        name: 'Post',
        fields: { title: { type: 'text' } },
        protected: 'write',
      }
      const result = parseEntityJSON(entity)

      expect(result.protected.list).toBe(false)
      expect(result.protected.get).toBe(false)
      expect(result.protected.create).toBe(true)
      expect(result.protected.update).toBe(true)
      expect(result.protected.remove).toBe(true)
    })

    it('parses protected: true (all)', () => {
      const entity: EntityJSON = {
        name: 'Secret',
        fields: { data: { type: 'text' } },
        protected: true,
      }
      const result = parseEntityJSON(entity)

      expect(result.protected.list).toBe(true)
      expect(result.protected.get).toBe(true)
      expect(result.protected.create).toBe(true)
    })

    it('parses granular protected config', () => {
      const entity: EntityJSON = {
        name: 'Post',
        fields: { title: { type: 'text' } },
        protected: {
          list: false,
          get: false,
          create: true,
          update: true,
          remove: true,
        },
      }
      const result = parseEntityJSON(entity)

      expect(result.protected.list).toBe(false)
      expect(result.protected.get).toBe(false)
      expect(result.protected.create).toBe(true)
    })
  })

  describe('parseManifestJSON', () => {
    it('parses a basic manifest', () => {
      const manifest: ManifestJSON = {
        entities: [
          { name: 'User', fields: { email: { type: 'text' } } },
        ],
        database: { type: 'sqlite', file: './app.db' },
      }
      const result = parseManifestJSON(manifest)

      expect(result.entities).toHaveLength(1)
      expect(result.entities[0].name).toBe('User')
      expect(result.database?.type).toBe('sqlite')
      expect(result.mode.type).toBe('full')
    })

    it('parses manifest from JSON string', () => {
      const json = JSON.stringify({
        entities: [
          { name: 'User', fields: { email: { type: 'text' } } },
        ],
        database: { type: 'sqlite', file: './app.db' },
      })
      const result = parseManifestJSON(json)

      expect(result.entities).toHaveLength(1)
    })

    it('parses headless mode', () => {
      const manifest: ManifestJSON = {
        entities: [
          { name: 'User', fields: { email: { type: 'text' } } },
        ],
        mode: 'headless',
      }
      const result = parseManifestJSON(manifest)

      expect(result.mode.type).toBe('headless')
      expect(result.database).toBeUndefined()
    })

    it('parses auth config', () => {
      const manifest: ManifestJSON = {
        entities: [
          { name: 'User', fields: { email: { type: 'text' } } },
        ],
        database: { type: 'sqlite', file: './app.db' },
        auth: {
          enabled: true,
          providers: ['credentials', 'google'],
          sessionStrategy: 'jwt',
        },
      }
      const result = parseManifestJSON(manifest)

      expect(result.auth.enabled).toBe(true)
      expect(result.auth.providers).toContain('google')
    })

    it('throws error for full mode without database', () => {
      const manifest: ManifestJSON = {
        entities: [
          { name: 'User', fields: { email: { type: 'text' } } },
        ],
        mode: 'full',
      }

      expect(() => parseManifestJSON(manifest)).toThrow(/database configuration/)
    })

    it('parses multiple entities', () => {
      const manifest: ManifestJSON = {
        entities: [
          { name: 'User', fields: { email: { type: 'text' } } },
          {
            name: 'Post',
            fields: { title: { type: 'text' } },
            relations: { author: { type: 'hasOne', entity: 'User' } },
          },
        ],
        database: { type: 'sqlite', file: './app.db' },
      }
      const result = parseManifestJSON(manifest)

      expect(result.entities).toHaveLength(2)
      expect(result.entities[1].relations.author.entity).toBe('User')
    })
  })
})
