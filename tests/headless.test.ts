// Tests for headless mode and external API sources

import { describe, it, expect } from 'vitest'
import {
  defineEntity,
  defineConfig,
  external,
  text,
  number,
  normalizeMode,
} from '../src'

describe('Headless Mode', () => {
  describe('normalizeMode', () => {
    it('should normalize undefined to full mode', () => {
      const mode = normalizeMode(undefined)
      expect(mode).toEqual({ type: 'full' })
    })

    it('should normalize "full" string to full mode', () => {
      const mode = normalizeMode('full')
      expect(mode).toEqual({ type: 'full' })
    })

    it('should normalize "headless" string to headless mode with defaults', () => {
      const mode = normalizeMode('headless')
      expect(mode).toEqual({
        type: 'headless',
        include: ['validation', 'hooks', 'services', 'i18n'],
      })
    })

    it('should normalize "api-only" string to api-only mode with defaults', () => {
      const mode = normalizeMode('api-only')
      expect(mode).toEqual({
        type: 'api-only',
        include: ['validation', 'services'],
      })
    })

    it('should pass through full ModeConfig object', () => {
      const mode = normalizeMode({
        type: 'headless',
        include: ['validation', 'hooks'],
      })
      expect(mode).toEqual({
        type: 'headless',
        include: ['validation', 'hooks'],
      })
    })
  })

  describe('defineConfig with headless mode', () => {
    it('should allow config without database in headless mode', () => {
      const Product = defineEntity('Product', {
        fields: {
          name: text().required(),
          price: number().required(),
        },
      })

      const config = defineConfig({
        mode: 'headless',
        entities: [Product],
      })

      expect(config.mode.type).toBe('headless')
      expect(config.database).toBeUndefined()
    })

    it('should throw error when full mode without database', () => {
      const Product = defineEntity('Product', {
        fields: { name: text().required() },
      })

      expect(() =>
        defineConfig({
          mode: 'full',
          entities: [Product],
        })
      ).toThrow("Mode 'full' requires database configuration")
    })

    it('should throw error when no mode and no database', () => {
      const Product = defineEntity('Product', {
        fields: { name: text().required() },
      })

      expect(() =>
        defineConfig({
          entities: [Product],
        } as any)
      ).toThrow("Mode 'full' requires database configuration")
    })
  })
})

describe('External Source', () => {
  describe('external() helper', () => {
    it('should create external source config with defaults', () => {
      const source = external('env:API_URL')

      expect(source.type).toBe('external')
      expect(source.baseUrl).toBe('env:API_URL')
      expect(source.pathPrefix).toBe('')
      expect(source.resourceName).toBeUndefined()
    })

    it('should create external source config with pathPrefix', () => {
      const source = external('env:API_URL', { pathPrefix: '/v1' })

      expect(source.pathPrefix).toBe('/v1')
    })

    it('should create external source config with resourceName', () => {
      const source = external('env:API_URL', { resourceName: 'item' })

      expect(source.resourceName).toBe('item')
    })

    it('should create external source config with bearer auth', () => {
      const source = external('env:API_URL', {
        auth: { type: 'bearer' },
      })

      expect(source.auth).toEqual({
        type: 'bearer',
        header: 'Authorization',
      })
    })

    it('should create external source config with api-key auth', () => {
      const source = external('env:API_URL', {
        auth: { type: 'api-key' },
      })

      expect(source.auth).toEqual({
        type: 'api-key',
        header: 'X-API-Key',
      })
    })

    it('should create external source config with custom auth header', () => {
      const source = external('env:API_URL', {
        auth: { type: 'api-key', header: 'X-Custom-Key' },
      })

      expect(source.auth).toEqual({
        type: 'api-key',
        header: 'X-Custom-Key',
      })
    })

    it('should handle endpoint overrides', () => {
      const source = external('env:API_URL', {
        override: {
          list: 'GET /catalog/items',
          get: 'GET /catalog/item/:sku',
        },
      })

      expect(source.endpoints.list).toBe('GET /catalog/items')
      expect(source.endpoints.get).toBe('GET /catalog/item/:sku')
    })
  })

  describe('Entity with source', () => {
    it('should preserve source config in entity', () => {
      const Product = defineEntity('Product', {
        fields: {
          name: text().required(),
        },
        source: external('env:PRODUCTS_API'),
      })

      expect(Product.source).toBeDefined()
      expect(Product.source?.type).toBe('external')
      expect(Product.source?.baseUrl).toBe('env:PRODUCTS_API')
    })

    it('should allow entity without source (uses manifest default)', () => {
      const Product = defineEntity('Product', {
        fields: {
          name: text().required(),
        },
      })

      expect(Product.source).toBeUndefined()
    })
  })

  describe('Manifest with global source', () => {
    it('should preserve global source in manifest', () => {
      const Product = defineEntity('Product', {
        fields: { name: text().required() },
      })

      const config = defineConfig({
        mode: 'headless',
        source: external('env:COMMERCE_API', { pathPrefix: '/v1' }),
        entities: [Product],
      })

      expect(config.source).toBeDefined()
      expect(config.source?.baseUrl).toBe('env:COMMERCE_API')
      expect(config.source?.pathPrefix).toBe('/v1')
    })

    it('should work with entities that have their own source', () => {
      const Product = defineEntity('Product', {
        fields: { name: text().required() },
        source: external('env:PRODUCTS_API'),
      })

      const Stock = defineEntity('Stock', {
        fields: { quantity: number().required() },
        source: external('env:INVENTORY_API'),
      })

      const config = defineConfig({
        mode: 'headless',
        source: external('env:DEFAULT_API'),
        entities: [Product, Stock],
      })

      // Entity sources should be preserved
      expect(config.entities[0].source?.baseUrl).toBe('env:PRODUCTS_API')
      expect(config.entities[1].source?.baseUrl).toBe('env:INVENTORY_API')
      // Manifest source also preserved
      expect(config.source?.baseUrl).toBe('env:DEFAULT_API')
    })
  })
})

describe('Hybrid Mode', () => {
  it('should support mix of database and external entities', () => {
    const User = defineEntity('User', {
      fields: {
        email: text().required().email(),
        name: text().required(),
      },
      // No source = uses database
    })

    const Product = defineEntity('Product', {
      fields: {
        sku: text().required(),
        name: text().required(),
      },
      source: external('env:PRODUCTS_API'),
    })

    const config = defineConfig({
      entities: [User, Product],
      database: { type: 'sqlite', file: './test.db' },
    })

    // User has no source (uses database)
    expect(config.entities[0].source).toBeUndefined()
    // Product has external source
    expect(config.entities[1].source?.type).toBe('external')
    // Mode is full (has database)
    expect(config.mode.type).toBe('full')
  })
})
