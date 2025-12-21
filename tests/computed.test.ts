import { describe, it, expect } from 'vitest'
import { defineEntity, text, number, computed } from '../src/index'
import { schemaGenerator } from '../src/templates/nextjs-drizzle-trpc/generators/schema'
import { validationGenerator } from '../src/templates/nextjs-drizzle-trpc/generators/validation'
import { apiGenerator } from '../src/templates/nextjs-drizzle-trpc/generators/api'
import { createContext } from '../src/template/context'
import type { ManifestIR } from '../src/manifest'

describe('Computed Fields', () => {
  // Entity with computed fields
  const Person = defineEntity('Person', {
    fields: {
      firstName: text().required(),
      lastName: text().required(),
      fullName: computed({
        type: 'text',
        from: ['firstName', 'lastName'],
        get: '`${firstName} ${lastName}`'
      }),
    },
  })

  const OrderLine = defineEntity('OrderLine', {
    fields: {
      price: number().required(),
      quantity: number().required().integer(),
      total: computed({
        type: 'number',
        from: ['price', 'quantity'],
        get: 'price * quantity'
      }),
    },
  })

  const Product = defineEntity('Product', {
    fields: {
      name: text().required(),
      price: number().required(),
      stock: number().required().integer(),
      inStock: computed({
        type: 'boolean',
        from: ['stock'],
        get: 'stock > 0'
      }),
    },
  })

  const manifest: ManifestIR = {
    entities: [Person, OrderLine, Product],
    mode: { type: 'full' },
    database: { type: 'sqlite', file: './test.db' },
    auth: { enabled: false },
    i18n: { languages: ['en'], defaultLanguage: 'en' },
    tenancy: { enabled: false, field: 'tenantId' },
    observability: { logging: false, tracing: false },
    defaults: { timestamps: true, softDelete: false },
  }

  const ctx = createContext(manifest, { outputDir: 'generated' })

  describe('Field Builder', () => {
    it('creates computed field config', () => {
      const fullName = computed({
        type: 'text',
        from: ['firstName', 'lastName'],
        get: '`${firstName} ${lastName}`'
      })

      expect(fullName._config.type).toBe('computed')
      expect(fullName._config.returnType).toBe('text')
      expect(fullName._config.sourceFields).toEqual(['firstName', 'lastName'])
      expect(fullName._config.expression).toBe('`${firstName} ${lastName}`')
    })

    it('supports label method', () => {
      const total = computed({
        type: 'number',
        from: ['price', 'qty'],
        get: 'price * qty'
      }).label('Total Price')

      expect(total._config.label).toBe('Total Price')
    })

    it('supports different return types', () => {
      const textComputed = computed({ type: 'text', from: ['a'], get: 'a' })
      const numberComputed = computed({ type: 'number', from: ['a'], get: 'a' })
      const booleanComputed = computed({ type: 'boolean', from: ['a'], get: 'a > 0' })
      const dateComputed = computed({ type: 'date', from: ['a'], get: 'a' })

      expect(textComputed._config.returnType).toBe('text')
      expect(numberComputed._config.returnType).toBe('number')
      expect(booleanComputed._config.returnType).toBe('boolean')
      expect(dateComputed._config.returnType).toBe('date')
    })
  })

  describe('Schema Generation (Drizzle)', () => {
    const schemaOutput = schemaGenerator.generate(manifest, ctx)
    const schema = 'content' in schemaOutput ? schemaOutput.content : ''

    it('skips computed fields in database schema', () => {
      // Regular fields should be present
      expect(schema).toContain('firstName:')
      expect(schema).toContain('lastName:')
      expect(schema).toContain('price:')
      expect(schema).toContain('quantity:')

      // Computed fields should NOT be in schema
      expect(schema).not.toContain('fullName:')
      expect(schema).not.toContain('total:')
      expect(schema).not.toContain('inStock:')
    })
  })

  describe('Validation Generation (Zod)', () => {
    const validationOutput = validationGenerator.generate(manifest, ctx)
    const personSchema = validationOutput.find(f => f.path.includes('person'))?.content || ''

    it('excludes computed fields from create/update schemas', () => {
      // Regular fields should be in validation
      expect(personSchema).toContain('firstName:')
      expect(personSchema).toContain('lastName:')

      // Computed fields should NOT be in validation
      expect(personSchema).not.toContain('fullName:')
    })
  })

  describe('API Generation (tRPC)', () => {
    const apiOutput = apiGenerator.generate(manifest, ctx)
    const personRouter = apiOutput.find(f => f.path.includes('person'))?.content || ''
    const orderLineRouter = apiOutput.find(f => f.path.includes('orderline'))?.content || ''

    it('generates withComputedFields helper function', () => {
      expect(personRouter).toContain('withComputedFields')
      expect(personRouter).toContain('fullName: `${firstName} ${lastName}`')
    })

    it('applies computed fields to list response', () => {
      expect(personRouter).toContain('items.map(withComputedFields)')
    })

    it('applies computed fields to get response', () => {
      expect(personRouter).toContain('result[0] ? withComputedFields(result[0]) : null')
    })

    it('applies computed fields to create response', () => {
      expect(personRouter).toContain('result[0] ? withComputedFields(result[0]) : result[0]')
    })

    it('excludes computed fields from filter schema', () => {
      // Regular fields should be filterable
      expect(personRouter).toContain('firstName:')
      expect(personRouter).toContain('lastName:')

      // Computed fields should NOT be in filter
      expect(personRouter).not.toMatch(/where:.*fullName/)
    })

    it('handles numeric computed fields', () => {
      expect(orderLineRouter).toContain('total: price * quantity')
    })
  })

  describe('Entity without computed fields', () => {
    const SimpleEntity = defineEntity('Simple', {
      fields: {
        name: text().required(),
      },
    })

    const simpleManifest: ManifestIR = {
      entities: [SimpleEntity],
      mode: { type: 'full' },
      database: { type: 'sqlite', file: './test.db' },
      auth: { enabled: false },
      i18n: { languages: ['en'], defaultLanguage: 'en' },
      tenancy: { enabled: false, field: 'tenantId' },
      observability: { logging: false, tracing: false },
      defaults: { timestamps: true, softDelete: false },
    }

    const simpleCtx = createContext(simpleManifest, { outputDir: 'generated' })
    const apiOutput = apiGenerator.generate(simpleManifest, simpleCtx)
    const simpleRouter = apiOutput.find(f => f.path.includes('simple'))?.content || ''

    it('does not generate withComputedFields helper', () => {
      expect(simpleRouter).not.toContain('withComputedFields')
    })

    it('returns items directly without mapping', () => {
      expect(simpleRouter).toContain('items,')
      expect(simpleRouter).not.toContain('items.map(withComputedFields)')
    })
  })
})
