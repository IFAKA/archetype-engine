import { describe, it, expect } from 'vitest'
import { defineEntity, text, number, belongsToMany } from '../src/index'
import { schemaGenerator } from '../src/templates/nextjs-drizzle-trpc/generators/schema'
import { createContext } from '../src/template/context'
import type { ManifestIR } from '../src/manifest'

describe('Pivot Relations', () => {
  // Create test entities with pivot fields
  const Order = defineEntity('Order', {
    fields: {
      orderNumber: text().required(),
      status: text().default('pending'),
    },
    relations: {
      products: belongsToMany('Product').through({
        table: 'order_items',
        fields: {
          quantity: number().required(),
          unitPrice: number().required(),
          discount: number().default(0),
        }
      }),
    },
  })

  const Product = defineEntity('Product', {
    fields: {
      name: text().required(),
      price: number().required(),
    },
  })

  const manifest: ManifestIR = {
    entities: [Order, Product],
    mode: { type: 'full' },
    database: { type: 'sqlite', file: './test.db' },
    auth: { enabled: false },
    i18n: { languages: ['en'], defaultLanguage: 'en' },
    tenancy: { enabled: false, field: 'tenantId' },
    observability: { logging: false, tracing: false },
    defaults: { timestamps: true, softDelete: false },
  }

  const ctx = createContext(manifest, { outputDir: 'generated' })
  const schemaOutput = schemaGenerator.generate(manifest, ctx)
  const schema = 'content' in schemaOutput ? schemaOutput.content : ''

  describe('Schema Generation', () => {
    it('generates junction table with custom name', () => {
      expect(schema).toContain('order_items')
      expect(schema).toContain("sqliteTable('order_items'")
    })

    it('includes foreign key columns in junction table', () => {
      expect(schema).toContain('orderId')
      expect(schema).toContain('productId')
      expect(schema).toContain("references(() => orders.id)")
      expect(schema).toContain("references(() => products.id)")
    })

    it('includes pivot fields in junction table', () => {
      expect(schema).toContain('quantity:')
      expect(schema).toContain('unitPrice:')
      expect(schema).toContain('discount:')
    })

    it('applies pivot field constraints', () => {
      // quantity is required
      expect(schema).toMatch(/quantity:.*\.notNull\(\)/)
      // discount has default
      expect(schema).toMatch(/discount:.*\.default\(0\)/)
    })
  })

  describe('Simple belongsToMany (no pivot)', () => {
    const Post = defineEntity('Post', {
      fields: {
        title: text().required(),
      },
      relations: {
        tags: belongsToMany('Tag'),
      },
    })

    const Tag = defineEntity('Tag', {
      fields: {
        name: text().required(),
      },
    })

    const simpleManifest: ManifestIR = {
      entities: [Post, Tag],
      mode: { type: 'full' },
      database: { type: 'sqlite', file: './test.db' },
      auth: { enabled: false },
      i18n: { languages: ['en'], defaultLanguage: 'en' },
      tenancy: { enabled: false, field: 'tenantId' },
      observability: { logging: false, tracing: false },
      defaults: { timestamps: true, softDelete: false },
    }

    const simpleCtx = createContext(simpleManifest, { outputDir: 'generated' })
    const simpleSchemaOutput = schemaGenerator.generate(simpleManifest, simpleCtx)
    const simpleSchema = 'content' in simpleSchemaOutput ? simpleSchemaOutput.content : ''

    it('generates default junction table name', () => {
      expect(simpleSchema).toContain('post_tag')
    })

    it('has only foreign key columns (no pivot fields)', () => {
      expect(simpleSchema).toContain('postId')
      expect(simpleSchema).toContain('tagId')
      // Should not have extra fields
      expect(simpleSchema).not.toContain('quantity')
    })
  })
})
