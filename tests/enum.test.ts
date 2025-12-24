import { describe, it, expect } from 'vitest'
import { defineEntity, text, enumField } from '../src/index'
import { schemaGenerator } from '../src/templates/nextjs-drizzle-trpc/generators/schema'
import { validationGenerator } from '../src/templates/nextjs-drizzle-trpc/generators/validation'
import { createContext } from '../src/template/context'
import type { ManifestIR } from '../src/manifest'

describe('Enum Fields', () => {
  // Entity with enum fields
  const Post = defineEntity('Post', {
    fields: {
      title: text().required(),
      status: enumField('draft', 'published', 'archived')
        .required()
        .default('draft'),
    },
  })

  const Order = defineEntity('Order', {
    fields: {
      orderNumber: text().required(),
      status: enumField('pending', 'processing', 'shipped', 'delivered', 'cancelled')
        .required()
        .default('pending'),
      priority: enumField('low', 'medium', 'high')
        .default('medium'),
    },
  })

  describe('Field Builder', () => {
    it('creates enum field config', () => {
      const status = enumField('draft', 'published', 'archived')

      expect(status._config.type).toBe('enum')
      expect(status._config.enumValues).toEqual(['draft', 'published', 'archived'])
      expect(status._config.required).toBe(false)
    })

    it('supports required() method', () => {
      const status = enumField('active', 'inactive').required()

      expect(status._config.required).toBe(true)
    })

    it('supports default() method', () => {
      const status = enumField('active', 'inactive').default('active')

      expect(status._config.default).toBe('active')
    })

    it('supports label() method', () => {
      const status = enumField('active', 'inactive').label('Account Status')

      expect(status._config.label).toBe('Account Status')
    })

    it('supports unique() method', () => {
      const code = enumField('A', 'B', 'C').unique()

      expect(code._config.unique).toBe(true)
    })
  })

  describe('Schema Generation - SQLite', () => {
    const sqliteManifest: ManifestIR = {
      entities: [Post, Order],
      mode: { type: 'full' },
      database: { type: 'sqlite', file: './test.db' },
      auth: { enabled: false },
      i18n: { languages: ['en'], defaultLanguage: 'en' },
      tenancy: { enabled: false, field: 'tenantId' },
      observability: { logging: false, tracing: false },
      defaults: { timestamps: true, softDelete: false },
    }

    const ctx = createContext(sqliteManifest, { outputDir: 'generated' })
    const schemaOutput = schemaGenerator.generate(sqliteManifest, ctx)
    const schema = 'content' in schemaOutput ? schemaOutput.content : ''

    it('uses text columns for enum fields in SQLite', () => {
      expect(schema).toContain("status: text('status')")
      expect(schema).toContain("priority: text('priority')")
    })

    it('does not include pgEnum for SQLite', () => {
      expect(schema).not.toContain('pgEnum')
    })

    it('applies notNull for required enums', () => {
      expect(schema).toMatch(/status:.*\.notNull\(\)/)
    })

    it('applies default values', () => {
      expect(schema).toMatch(/status:.*\.default\('draft'\)/)
      expect(schema).toMatch(/priority:.*\.default\('medium'\)/)
    })
  })

  describe('Schema Generation - PostgreSQL', () => {
    const pgManifest: ManifestIR = {
      entities: [Post, Order],
      mode: { type: 'full' },
      database: { type: 'postgres', url: 'postgres://localhost/test' },
      auth: { enabled: false },
      i18n: { languages: ['en'], defaultLanguage: 'en' },
      tenancy: { enabled: false, field: 'tenantId' },
      observability: { logging: false, tracing: false },
      defaults: { timestamps: true, softDelete: false },
    }

    const ctx = createContext(pgManifest, { outputDir: 'generated' })
    const schemaOutput = schemaGenerator.generate(pgManifest, ctx)
    const schema = 'content' in schemaOutput ? schemaOutput.content : ''

    it('imports pgEnum for PostgreSQL', () => {
      expect(schema).toContain('pgEnum')
    })

    it('generates enum type definitions', () => {
      expect(schema).toContain("postStatusEnum = pgEnum('postStatusEnum', ['draft', 'published', 'archived'])")
      expect(schema).toContain("orderStatusEnum = pgEnum('orderStatusEnum', ['pending', 'processing', 'shipped', 'delivered', 'cancelled'])")
      expect(schema).toContain("orderPriorityEnum = pgEnum('orderPriorityEnum', ['low', 'medium', 'high'])")
    })

    it('uses enum type references in columns', () => {
      expect(schema).toContain("status: postStatusEnum('status')")
      expect(schema).toContain("status: orderStatusEnum('status')")
      expect(schema).toContain("priority: orderPriorityEnum('priority')")
    })
  })

  describe('Validation Generation (Zod)', () => {
    const manifest: ManifestIR = {
      entities: [Post],
      mode: { type: 'full' },
      database: { type: 'sqlite', file: './test.db' },
      auth: { enabled: false },
      i18n: { languages: ['en'], defaultLanguage: 'en' },
      tenancy: { enabled: false, field: 'tenantId' },
      observability: { logging: false, tracing: false },
      defaults: { timestamps: true, softDelete: false },
    }

    const ctx = createContext(manifest, { outputDir: 'generated' })
    const validationOutput = validationGenerator.generate(manifest, ctx)
    const postSchema = validationOutput.find(f => f.path.includes('post'))?.content || ''

    it('generates z.enum() for enum fields', () => {
      expect(postSchema).toContain("z.enum(['draft', 'published', 'archived'])")
    })

    it('does not use refine for enum fields', () => {
      // z.enum() is preferred over z.string().refine()
      expect(postSchema).not.toMatch(/status:.*refine/)
    })
  })

  describe('Entity without enum fields', () => {
    const SimpleEntity = defineEntity('Simple', {
      fields: {
        name: text().required(),
      },
    })

    const manifest: ManifestIR = {
      entities: [SimpleEntity],
      mode: { type: 'full' },
      database: { type: 'postgres', url: 'postgres://localhost/test' },
      auth: { enabled: false },
      i18n: { languages: ['en'], defaultLanguage: 'en' },
      tenancy: { enabled: false, field: 'tenantId' },
      observability: { logging: false, tracing: false },
      defaults: { timestamps: true, softDelete: false },
    }

    const ctx = createContext(manifest, { outputDir: 'generated' })
    const schemaOutput = schemaGenerator.generate(manifest, ctx)
    const schema = 'content' in schemaOutput ? schemaOutput.content : ''

    it('does not import pgEnum when no enum fields exist', () => {
      expect(schema).not.toContain('pgEnum')
    })

    it('does not generate enum definitions', () => {
      expect(schema).not.toMatch(/= pgEnum\(/)
    })
  })
})
