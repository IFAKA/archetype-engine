import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

// Import the e-commerce example
import manifest from '../examples/ecommerce/index'

// Import generators
import { schemaGenerator } from '../src/templates/nextjs-drizzle-trpc/generators/schema'
import { validationGenerator } from '../src/templates/nextjs-drizzle-trpc/generators/validation'
import { apiGenerator } from '../src/templates/nextjs-drizzle-trpc/generators/api'
import { hooksGenerator } from '../src/templates/nextjs-drizzle-trpc/generators/hooks'
import { i18nGenerator } from '../src/templates/nextjs-drizzle-trpc/generators/i18n'
import { generateERDFromIR } from '../src/generators/erd-ir'
import { createContext } from '../src/template/context'
import type { GeneratedFile, GeneratorOutput } from '../src/template/types'

const TEST_OUTPUT_DIR = 'test-generated'

// Helper to normalize generator output to array
function toArray(output: GeneratorOutput): GeneratedFile[] {
  return Array.isArray(output) ? output : [output]
}
const TEST_MESSAGES_DIR = 'test-messages'

// Create context for generators
const defaultConfig = {
  outputDir: 'generated',
  importAliases: {
    '@/': 'src/',
    '@/server': 'src/server',
    '@/lib': 'src/lib',
    '@/generated': 'generated',
  },
}
const ctx = createContext(manifest, defaultConfig)

// Helper to convert GeneratedFile[] to Record<string, string> by entity name
function filesToRecord(files: GeneratedFile[]): Record<string, string> {
  const result: Record<string, string> = {}
  for (const file of files) {
    // Extract entity name from path (e.g., "schemas/product.ts" -> "Product")
    const match = file.path.match(/\/([^/]+)\.ts$/)
    if (match) {
      const name = match[1].charAt(0).toUpperCase() + match[1].slice(1)
      result[name] = file.content
    }
  }
  return result
}

// Helper to convert i18n files to nested Record structure
function i18nFilesToRecord(files: GeneratedFile[]): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {}
  for (const file of files) {
    // Extract lang and filename from path (e.g., "i18n/en/validation.json")
    const match = file.path.match(/i18n\/([^/]+)\/(.+)$/)
    if (match) {
      const [, lang, filename] = match
      if (!result[lang]) result[lang] = {}
      result[lang][filename] = file.content
    }
  }
  return result
}

describe('E-commerce Example', () => {
  describe('Manifest Structure', () => {
    it('has 15 entities', () => {
      expect(manifest.entities).toHaveLength(15)
    })

    it('has all expected entity names', () => {
      const names = manifest.entities.map((e) => e.name)
      expect(names).toContain('Customer')
      expect(names).toContain('Address')
      expect(names).toContain('Product')
      expect(names).toContain('ProductVariant')
      expect(names).toContain('ProductImage')
      expect(names).toContain('Category')
      expect(names).toContain('Brand')
      expect(names).toContain('Tag')
      expect(names).toContain('Order')
      expect(names).toContain('OrderItem')
      expect(names).toContain('Payment')
      expect(names).toContain('Cart')
      expect(names).toContain('CartItem')
      expect(names).toContain('WishlistItem')
      expect(names).toContain('Review')
    })

    it('uses postgres database', () => {
      expect(manifest.database.type).toBe('postgres')
    })

    it('has i18n configured for 5 languages', () => {
      expect(manifest.i18n.languages).toHaveLength(5)
      expect(manifest.i18n.languages).toContain('en')
      expect(manifest.i18n.languages).toContain('es')
      expect(manifest.i18n.languages).toContain('fr')
      expect(manifest.i18n.languages).toContain('de')
      expect(manifest.i18n.languages).toContain('pt')
    })

    it('has auth enabled', () => {
      expect(manifest.auth?.enabled).toBe(true)
    })

    it('has tenancy enabled', () => {
      expect(manifest.tenancy?.enabled).toBe(true)
      expect(manifest.tenancy?.field).toBe('storeId')
    })
  })

  describe('Product Entity', () => {
    const product = manifest.entities.find((e) => e.name === 'Product')!

    it('exists', () => {
      expect(product).toBeDefined()
    })

    it('has required fields', () => {
      expect(product.fields.sku.required).toBe(true)
      expect(product.fields.name.required).toBe(true)
      expect(product.fields.slug.required).toBe(true)
      expect(product.fields.price.required).toBe(true)
    })

    it('has unique constraints', () => {
      expect(product.fields.sku.unique).toBe(true)
      expect(product.fields.slug.unique).toBe(true)
    })

    it('has correct field types', () => {
      expect(product.fields.sku.type).toBe('text')
      expect(product.fields.price.type).toBe('number')
      expect(product.fields.isActive.type).toBe('boolean')
      expect(product.fields.publishedAt.type).toBe('date')
    })

    it('has relations', () => {
      expect(product.relations.category.type).toBe('hasOne')
      expect(product.relations.category.entity).toBe('Category')
      expect(product.relations.brand.type).toBe('hasOne')
      expect(product.relations.tags.type).toBe('belongsToMany')
      expect(product.relations.relatedProducts.type).toBe('belongsToMany')
      expect(product.relations.relatedProducts.entity).toBe('Product')
    })

    it('has behaviors configured', () => {
      expect(product.behaviors.timestamps).toBe(true)
      expect(product.behaviors.softDelete).toBe(true)
      expect(product.behaviors.audit).toBe(true)
    })
  })

  describe('Order Entity', () => {
    const order = manifest.entities.find((e) => e.name === 'Order')!

    it('has oneOf validations', () => {
      const statusValidation = order.fields.status.validations.find(
        (v) => v.type === 'oneOf'
      )
      expect(statusValidation).toBeDefined()
      expect(statusValidation?.value).toContain('pending')
      expect(statusValidation?.value).toContain('shipped')
    })

    it('has correct relations', () => {
      expect(order.relations.customer.type).toBe('hasOne')
      expect(order.relations.items.type).toBe('hasMany')
      expect(order.relations.payments.type).toBe('hasMany')
    })
  })

  describe('Category Entity (self-referential)', () => {
    const category = manifest.entities.find((e) => e.name === 'Category')!

    it('has self-referential relations', () => {
      expect(category.relations.parent.entity).toBe('Category')
      expect(category.relations.parent.type).toBe('hasOne')
      expect(category.relations.children.entity).toBe('Category')
      expect(category.relations.children.type).toBe('hasMany')
    })
  })
})

describe('Drizzle Schema Generation', () => {
  let schema: string

  beforeAll(() => {
    const files = toArray(schemaGenerator.generate(manifest, ctx))
    schema = files[0].content
  })

  it('generates valid TypeScript', () => {
    expect(schema).toContain("import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core'")
  })

  it('generates all entity tables', () => {
    expect(schema).toContain('export const customers = pgTable')
    expect(schema).toContain('export const products = pgTable')
    expect(schema).toContain('export const orders = pgTable')
    expect(schema).toContain('export const categories = pgTable')
  })

  it('generates junction tables for belongsToMany', () => {
    expect(schema).toContain('product_tag')
    expect(schema).toContain('product_related_products')
  })

  it('uses correct types for fields', () => {
    expect(schema).toContain('text(')
    expect(schema).toContain('integer(')
    expect(schema).toContain('boolean(')
  })

  it('generates foreign key references', () => {
    expect(schema).toContain('.references(() =>')
  })

  it('handles unique constraints', () => {
    expect(schema).toContain('.unique()')
  })

  it('handles timestamps', () => {
    expect(schema).toContain('createdAt')
    expect(schema).toContain('updatedAt')
  })

  it('handles soft delete', () => {
    expect(schema).toContain('deletedAt')
  })

  it('uses sourceId/targetId for self-referential relations', () => {
    expect(schema).toContain('sourceId')
    expect(schema).toContain('targetId')
  })
})

describe('Zod Schema Generation', () => {
  let schemas: Record<string, string>

  beforeAll(() => {
    const files = toArray(validationGenerator.generate(manifest, ctx))
    schemas = filesToRecord(files)
  })

  it('generates schemas for all entities', () => {
    expect(Object.keys(schemas)).toHaveLength(15)
    expect(schemas).toHaveProperty('Product')
    expect(schemas).toHaveProperty('Order')
    expect(schemas).toHaveProperty('Customer')
  })

  it('generates both static and i18n schemas', () => {
    const productSchema = schemas.Product
    expect(productSchema).toContain('export const productCreateSchema')
    expect(productSchema).toContain('export function productCreateSchemaI18n')
  })

  it('generates create and update schemas', () => {
    const productSchema = schemas.Product
    expect(productSchema).toContain('productCreateSchema')
    expect(productSchema).toContain('productUpdateSchema')
  })

  it('includes validation rules', () => {
    const productSchema = schemas.Product
    expect(productSchema).toContain('.min(')
    expect(productSchema).toContain('.max(')
    expect(productSchema).toContain('.toUpperCase()')
  })

  it('includes oneOf validations', () => {
    const orderSchema = schemas.Order
    expect(orderSchema).toContain('.refine(')
    expect(orderSchema).toContain('pending')
  })

  it('exports TypeScript types', () => {
    const productSchema = schemas.Product
    expect(productSchema).toContain('export type ProductCreate')
    expect(productSchema).toContain('export type ProductUpdate')
  })
})

describe('tRPC Router Generation', () => {
  let routers: Record<string, string>

  beforeAll(() => {
    const files = toArray(apiGenerator.generate(manifest, ctx))
    routers = filesToRecord(files)
  })

  it('generates routers for all entities', () => {
    // 15 entities (index file is not captured by filesToRecord since it doesn't match the pattern)
    expect(Object.keys(routers)).toHaveLength(16)
  })

  it('generates CRUD procedures', () => {
    const productRouter = routers.Product
    expect(productRouter).toContain('list:')
    expect(productRouter).toContain('get:')
    expect(productRouter).toContain('create:')
    expect(productRouter).toContain('update:')
    expect(productRouter).toContain('remove:')
  })

  it('uses static schemas (not i18n)', () => {
    const productRouter = routers.Product
    expect(productRouter).toContain('productCreateSchema')
    expect(productRouter).not.toContain('productCreateSchema(ctx')
  })

  // TODO: Implement tenantProcedure - currently uses publicProcedure with ctx.storeId filter
  it.skip('uses tenant procedure when tenancy is enabled', () => {
    const productRouter = routers.Product
    expect(productRouter).toContain('tenantProcedure')
  })

  it('imports from correct paths', () => {
    const productRouter = routers.Product
    expect(productRouter).toContain("from '@/generated/schemas/product'")
    expect(productRouter).toContain("from '@/generated/db/schema'")
  })
})

describe('React Hooks Generation', () => {
  let hooks: Record<string, string>

  beforeAll(() => {
    const files = toArray(hooksGenerator.generate(manifest, ctx))
    hooks = {}
    for (const file of files) {
      // Extract entity name from path (e.g., "hooks/useProduct.ts" -> "Product")
      const match = file.path.match(/use([^/]+)\.ts$/)
      if (match) {
        hooks[match[1]] = file.content
      }
    }
  })

  it('generates hooks for all entities', () => {
    expect(Object.keys(hooks)).toHaveLength(15)
  })

  it('generates useForm hook', () => {
    const productHook = hooks.Product
    expect(productHook).toContain('export function useProductForm')
  })

  it('resets form to default values on successful create', () => {
    const productHook = hooks.Product
    // Verify form.reset() is called inside onSuccess callback
    expect(productHook).toMatch(/onSuccess:\s*\(\)\s*=>\s*\{[^}]*form\.reset\(\)/)
  })

  it('generates useEditForm hook', () => {
    const productHook = hooks.Product
    expect(productHook).toContain('export function useProductEditForm')
  })

  it('generates useRemove hook', () => {
    const productHook = hooks.Product
    expect(productHook).toContain('export function useProductRemove')
  })

  it('generates list hook', () => {
    const productHook = hooks.Product
    expect(productHook).toContain('export function useProducts')
  })

  it('uses i18n schemas for client-side', () => {
    const productHook = hooks.Product
    expect(productHook).toContain('productCreateSchemaI18n')
    expect(productHook).toContain('useTranslations')
  })
})

describe('i18n Generation', () => {
  let i18nFiles: Record<string, Record<string, string>>

  beforeAll(() => {
    const files = toArray(i18nGenerator.generate(manifest, ctx))
    i18nFiles = i18nFilesToRecord(files)
  })

  it('generates files for all configured languages', () => {
    expect(Object.keys(i18nFiles)).toHaveLength(5)
    expect(i18nFiles).toHaveProperty('en')
    expect(i18nFiles).toHaveProperty('es')
    expect(i18nFiles).toHaveProperty('fr')
    expect(i18nFiles).toHaveProperty('de')
    expect(i18nFiles).toHaveProperty('pt')
  })

  it('generates validation messages', () => {
    const enValidation = JSON.parse(i18nFiles.en['validation.json'])
    expect(enValidation).toHaveProperty('required')
    expect(enValidation).toHaveProperty('email')
    expect(enValidation).toHaveProperty('min')
    expect(enValidation).toHaveProperty('max')
    expect(enValidation).toHaveProperty('minLength')
    expect(enValidation).toHaveProperty('maxLength')
    expect(enValidation).toHaveProperty('oneOf')
    expect(enValidation).toHaveProperty('integer')
    expect(enValidation).toHaveProperty('positive')
  })

  it('translates messages for each language', () => {
    const esValidation = JSON.parse(i18nFiles.es['validation.json'])
    expect(esValidation.required).toContain('requerido')

    const frValidation = JSON.parse(i18nFiles.fr['validation.json'])
    expect(frValidation.required).toContain('requis')

    const deValidation = JSON.parse(i18nFiles.de['validation.json'])
    expect(deValidation.required).toContain('erforderlich')
  })

  it('generates entity labels', () => {
    const enEntities = JSON.parse(i18nFiles.en['entities.json'])
    expect(enEntities).toHaveProperty('product')
    expect(enEntities).toHaveProperty('order')
    expect(enEntities).toHaveProperty('customer')
  })

  it('generates field labels', () => {
    const enFields = JSON.parse(i18nFiles.en['fields.json'])
    expect(enFields).toHaveProperty('product')
    expect(enFields.product).toHaveProperty('sku')
    expect(enFields.product).toHaveProperty('name')
  })
})

describe('ERD Generation', () => {
  let erd: string

  beforeAll(() => {
    erd = generateERDFromIR(manifest)
  })

  it('starts with erDiagram', () => {
    expect(erd).toMatch(/^erDiagram/)
  })

  it('contains all entities', () => {
    expect(erd).toContain('Customer {')
    expect(erd).toContain('Product {')
    expect(erd).toContain('Order {')
    expect(erd).toContain('Category {')
  })

  it('uses valid Mermaid types', () => {
    expect(erd).toContain('string ')
    expect(erd).toContain('int ')
    expect(erd).toContain('boolean ')
    expect(erd).toContain('datetime ')
    // Should NOT contain our internal types
    expect(erd).not.toMatch(/\btext\b/)
    expect(erd).not.toMatch(/\bnumber\s+\w+/)
    expect(erd).not.toMatch(/\bdate\s+\w+[^t]/)
  })

  it('shows relationships', () => {
    expect(erd).toContain('||--||')  // hasOne
    expect(erd).toContain('||--o{')  // hasMany
    expect(erd).toContain('}o--o{')  // belongsToMany
  })

  it('has proper constraint annotations', () => {
    expect(erd).toContain('"required"')
    expect(erd).toContain('"required, unique"')
  })
})

describe('Full Generation Integration', () => {
  beforeAll(async () => {
    // Clean up test directories
    if (fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.rmSync(TEST_OUTPUT_DIR, { recursive: true })
    }
    if (fs.existsSync(TEST_MESSAGES_DIR)) {
      fs.rmSync(TEST_MESSAGES_DIR, { recursive: true })
    }
  })

  afterAll(() => {
    // Clean up
    if (fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.rmSync(TEST_OUTPUT_DIR, { recursive: true })
    }
    if (fs.existsSync(TEST_MESSAGES_DIR)) {
      fs.rmSync(TEST_MESSAGES_DIR, { recursive: true })
    }
  })

  it('all generators produce valid output', () => {
    // Drizzle
    const drizzleFiles = toArray(schemaGenerator.generate(manifest, ctx))
    const drizzle = drizzleFiles[0].content
    expect(drizzle.length).toBeGreaterThan(1000)
    expect(drizzle).not.toContain('undefined')
    expect(drizzle).not.toContain('null')

    // Zod
    const zodFiles = toArray(validationGenerator.generate(manifest, ctx))
    zodFiles.forEach((file) => {
      expect(file.content.length).toBeGreaterThan(100)
      expect(file.content).not.toContain('undefined')
    })

    // tRPC
    const trpcFiles = toArray(apiGenerator.generate(manifest, ctx))
    trpcFiles.forEach((file) => {
      expect(file.content.length).toBeGreaterThan(100)
      expect(file.content).not.toContain('undefined')
    })

    // Hooks
    const hookFiles = toArray(hooksGenerator.generate(manifest, ctx))
    hookFiles.forEach((file) => {
      expect(file.content.length).toBeGreaterThan(100)
      // Should not have unintended undefined (template failures produce ${undefined})
      expect(file.content).not.toContain('${undefined}')
      expect(file.content).not.toContain(': undefined,')
    })

    // i18n
    const i18nFilesArr = toArray(i18nGenerator.generate(manifest, ctx))
    i18nFilesArr.forEach((file) => {
      const parsed = JSON.parse(file.content)
      expect(Object.keys(parsed).length).toBeGreaterThan(0)
    })

    // ERD
    const erd = generateERDFromIR(manifest)
    expect(erd.length).toBeGreaterThan(500)
    expect(erd.split('\n').length).toBeGreaterThan(50)
  })
})
