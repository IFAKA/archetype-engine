import { describe, it, expect } from 'vitest'
import { validateManifest, ValidationCodes } from '../src/validation'
import type { ManifestJSON } from '../src/json/types'

describe('Validation', () => {
  describe('validateManifest', () => {
    it('validates a correct manifest', () => {
      const manifest: ManifestJSON = {
        entities: [
          { name: 'User', fields: { email: { type: 'text' } } },
        ],
        database: { type: 'sqlite', file: './app.db' },
      }
      const result = validateManifest(manifest)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('detects invalid entity name (not PascalCase)', () => {
      const manifest: ManifestJSON = {
        entities: [
          { name: 'user', fields: { email: { type: 'text' } } },
        ],
        database: { type: 'sqlite', file: './app.db' },
      }
      const result = validateManifest(manifest)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === ValidationCodes.INVALID_ENTITY_NAME)).toBe(true)
    })

    it('detects duplicate entity names', () => {
      const manifest: ManifestJSON = {
        entities: [
          { name: 'User', fields: { email: { type: 'text' } } },
          { name: 'User', fields: { name: { type: 'text' } } },
        ],
        database: { type: 'sqlite', file: './app.db' },
      }
      const result = validateManifest(manifest)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === ValidationCodes.DUPLICATE_ENTITY)).toBe(true)
    })

    it('detects invalid field type', () => {
      const manifest: ManifestJSON = {
        entities: [
          { name: 'User', fields: { email: { type: 'string' as 'text' } } },
        ],
        database: { type: 'sqlite', file: './app.db' },
      }
      const result = validateManifest(manifest)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === ValidationCodes.INVALID_FIELD_TYPE)).toBe(true)
    })

    it('detects missing entity in relation', () => {
      const manifest: ManifestJSON = {
        entities: [
          {
            name: 'Post',
            fields: { title: { type: 'text' } },
            relations: { author: { type: 'hasOne', entity: 'User' } },
          },
        ],
        database: { type: 'sqlite', file: './app.db' },
      }
      const result = validateManifest(manifest)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === ValidationCodes.RELATION_TARGET_NOT_FOUND)).toBe(true)
    })

    it('detects missing database for full mode', () => {
      const manifest: ManifestJSON = {
        entities: [
          { name: 'User', fields: { email: { type: 'text' } } },
        ],
        mode: 'full',
      }
      const result = validateManifest(manifest)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === ValidationCodes.DATABASE_REQUIRED)).toBe(true)
    })

    it('allows headless mode without database', () => {
      const manifest: ManifestJSON = {
        entities: [
          { name: 'User', fields: { email: { type: 'text' } } },
        ],
        mode: 'headless',
      }
      const result = validateManifest(manifest)

      expect(result.valid).toBe(true)
    })

    it('detects invalid database type', () => {
      const manifest: ManifestJSON = {
        entities: [
          { name: 'User', fields: { email: { type: 'text' } } },
        ],
        database: { type: 'oracle' as 'sqlite' },
      }
      const result = validateManifest(manifest)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === ValidationCodes.INVALID_DATABASE_TYPE)).toBe(true)
    })

    it('detects missing file for SQLite', () => {
      const manifest: ManifestJSON = {
        entities: [
          { name: 'User', fields: { email: { type: 'text' } } },
        ],
        database: { type: 'sqlite' },
      }
      const result = validateManifest(manifest)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === ValidationCodes.SQLITE_REQUIRES_FILE)).toBe(true)
    })

    it('detects missing URL for PostgreSQL', () => {
      const manifest: ManifestJSON = {
        entities: [
          { name: 'User', fields: { email: { type: 'text' } } },
        ],
        database: { type: 'postgres' },
      }
      const result = validateManifest(manifest)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === ValidationCodes.POSTGRES_REQUIRES_URL)).toBe(true)
    })

    it('detects protected without auth enabled', () => {
      const manifest: ManifestJSON = {
        entities: [
          {
            name: 'Post',
            fields: { title: { type: 'text' } },
            protected: 'write',
          },
        ],
        database: { type: 'sqlite', file: './app.db' },
      }
      const result = validateManifest(manifest)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === ValidationCodes.AUTH_REQUIRED_FOR_PROTECTED)).toBe(true)
    })

    it('allows protected with auth enabled', () => {
      const manifest: ManifestJSON = {
        entities: [
          {
            name: 'Post',
            fields: { title: { type: 'text' } },
            protected: 'write',
          },
        ],
        database: { type: 'sqlite', file: './app.db' },
        auth: { enabled: true },
      }
      const result = validateManifest(manifest)

      // No AUTH_REQUIRED_FOR_PROTECTED error
      expect(result.errors.some(e => e.code === ValidationCodes.AUTH_REQUIRED_FOR_PROTECTED)).toBe(false)
    })

    it('detects invalid auth provider', () => {
      const manifest: ManifestJSON = {
        entities: [
          { name: 'User', fields: { email: { type: 'text' } } },
        ],
        database: { type: 'sqlite', file: './app.db' },
        auth: {
          enabled: true,
          providers: ['invalid' as 'google'],
        },
      }
      const result = validateManifest(manifest)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === ValidationCodes.INVALID_PROVIDER)).toBe(true)
    })

    it('detects invalid mode', () => {
      const manifest: ManifestJSON = {
        entities: [
          { name: 'User', fields: { email: { type: 'text' } } },
        ],
        mode: 'invalid' as 'full',
        database: { type: 'sqlite', file: './app.db' },
      }
      const result = validateManifest(manifest)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === ValidationCodes.INVALID_MODE)).toBe(true)
    })

    it('validates valid relations between entities', () => {
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
      const result = validateManifest(manifest)

      expect(result.valid).toBe(true)
    })

    it('includes suggestions in error messages', () => {
      const manifest: ManifestJSON = {
        entities: [
          { name: 'user', fields: { email: { type: 'text' } } },
        ],
        database: { type: 'sqlite', file: './app.db' },
      }
      const result = validateManifest(manifest)

      expect(result.errors[0].suggestion).toBeDefined()
    })

    it('includes path in error messages', () => {
      const manifest: ManifestJSON = {
        entities: [
          {
            name: 'Post',
            fields: { title: { type: 'text' } },
            relations: { author: { type: 'hasOne', entity: 'User' } },
          },
        ],
        database: { type: 'sqlite', file: './app.db' },
      }
      const result = validateManifest(manifest)

      const error = result.errors.find(e => e.code === ValidationCodes.RELATION_TARGET_NOT_FOUND)
      expect(error?.path).toBe('Post.relations.author.entity')
    })
  })
})
