/**
 * CRUD Hooks Tests
 *
 * Tests for lifecycle hooks (beforeCreate, afterCreate, beforeUpdate, etc.)
 * in entity definitions and generated code.
 */

import { describe, it, expect } from 'vitest'
import { defineEntity } from '../src/entity'
import { text, number, boolean } from '../src/fields'
import { defineManifest } from '../src/manifest'
import { template } from '../src/templates/nextjs-drizzle-trpc'
import { parseManifestJSON } from '../src/json/parser'
import type { Generator } from '../src/template/types'

// Find specific generators
const crudHooksGenerator = template.generators.find(g => g.name === 'crud-hooks') as Generator
const apiGenerator = template.generators.find(g => g.name === 'trpc-routers') as Generator

describe('CRUD Hooks', () => {
  describe('Entity Definition', () => {
    it('should support hooks: true for all hooks', () => {
      const entity = defineEntity('User', {
        fields: { name: text() },
        hooks: true,
      })

      expect(entity.hooks).toEqual({
        beforeCreate: true,
        afterCreate: true,
        beforeUpdate: true,
        afterUpdate: true,
        beforeRemove: true,
        afterRemove: true,
      })
    })

    it('should support hooks: false for no hooks', () => {
      const entity = defineEntity('User', {
        fields: { name: text() },
        hooks: false,
      })

      expect(entity.hooks).toEqual({
        beforeCreate: false,
        afterCreate: false,
        beforeUpdate: false,
        afterUpdate: false,
        beforeRemove: false,
        afterRemove: false,
      })
    })

    it('should default to no hooks when not specified', () => {
      const entity = defineEntity('User', {
        fields: { name: text() },
      })

      expect(entity.hooks).toEqual({
        beforeCreate: false,
        afterCreate: false,
        beforeUpdate: false,
        afterUpdate: false,
        beforeRemove: false,
        afterRemove: false,
      })
    })

    it('should support granular hook configuration', () => {
      const entity = defineEntity('User', {
        fields: { name: text() },
        hooks: {
          beforeCreate: true,
          afterCreate: true,
          beforeRemove: true,
        },
      })

      expect(entity.hooks).toEqual({
        beforeCreate: true,
        afterCreate: true,
        beforeUpdate: false,
        afterUpdate: false,
        beforeRemove: true,
        afterRemove: false,
      })
    })
  })

  describe('JSON Parsing', () => {
    it('should parse hooks: true', () => {
      const manifest = parseManifestJSON({
        entities: [{
          name: 'User',
          fields: { name: { type: 'text' } },
          hooks: true,
        }],
        mode: 'headless',
      })

      expect(manifest.entities[0].hooks).toEqual({
        beforeCreate: true,
        afterCreate: true,
        beforeUpdate: true,
        afterUpdate: true,
        beforeRemove: true,
        afterRemove: true,
      })
    })

    it('should parse hooks: false', () => {
      const manifest = parseManifestJSON({
        entities: [{
          name: 'User',
          fields: { name: { type: 'text' } },
          hooks: false,
        }],
        mode: 'headless',
      })

      expect(manifest.entities[0].hooks).toEqual({
        beforeCreate: false,
        afterCreate: false,
        beforeUpdate: false,
        afterUpdate: false,
        beforeRemove: false,
        afterRemove: false,
      })
    })

    it('should parse granular hooks config', () => {
      const manifest = parseManifestJSON({
        entities: [{
          name: 'User',
          fields: { name: { type: 'text' } },
          hooks: {
            beforeCreate: true,
            afterUpdate: true,
          },
        }],
        mode: 'headless',
      })

      expect(manifest.entities[0].hooks).toEqual({
        beforeCreate: true,
        afterCreate: false,
        beforeUpdate: false,
        afterUpdate: true,
        beforeRemove: false,
        afterRemove: false,
      })
    })
  })

  describe('Hooks Types Generator', () => {
    it('should not generate files when no hooks enabled', () => {
      const manifest = defineManifest({
        entities: [
          defineEntity('User', { fields: { name: text() } }),
        ],
        database: { type: 'sqlite', file: './test.db' },
      })

      const files = crudHooksGenerator.generate(manifest, { config: {} as any })
      expect(files).toHaveLength(0)
    })

    it('should generate types file when hooks enabled', () => {
      const manifest = defineManifest({
        entities: [
          defineEntity('User', { fields: { name: text() }, hooks: true }),
        ],
        database: { type: 'sqlite', file: './test.db' },
      })

      const files = crudHooksGenerator.generate(manifest, { config: {} as any })
      const typesFile = files.find(f => f.path === 'hooks/types.ts')

      expect(typesFile).toBeDefined()
      expect(typesFile!.content).toContain('export interface HookContext')
      expect(typesFile!.content).toContain('export interface UserCreateInput')
      expect(typesFile!.content).toContain('export interface UserUpdateInput')
      expect(typesFile!.content).toContain('export interface UserRecord')
      expect(typesFile!.content).toContain('export interface UserHooks')
    })

    it('should generate entity hooks file', () => {
      const manifest = defineManifest({
        entities: [
          defineEntity('User', { fields: { name: text() }, hooks: true }),
        ],
        database: { type: 'sqlite', file: './test.db' },
      })

      const files = crudHooksGenerator.generate(manifest, { config: {} as any })
      const userHooksFile = files.find(f => f.path === 'hooks/user.ts')

      expect(userHooksFile).toBeDefined()
      expect(userHooksFile!.content).toContain("import type { UserHooks, HookContext")
      expect(userHooksFile!.content).toContain('export const userHooks: UserHooks')
      expect(userHooksFile!.content).toContain('async beforeCreate(input, ctx)')
      expect(userHooksFile!.content).toContain('async afterCreate(record, ctx)')
    })

    it('should only include enabled hooks in entity file', () => {
      const manifest = defineManifest({
        entities: [
          defineEntity('User', {
            fields: { name: text() },
            hooks: { beforeCreate: true, afterCreate: true },
          }),
        ],
        database: { type: 'sqlite', file: './test.db' },
      })

      const files = crudHooksGenerator.generate(manifest, { config: {} as any })
      const userHooksFile = files.find(f => f.path === 'hooks/user.ts')

      expect(userHooksFile!.content).toContain('beforeCreate')
      expect(userHooksFile!.content).toContain('afterCreate')
      expect(userHooksFile!.content).not.toContain('beforeUpdate')
      expect(userHooksFile!.content).not.toContain('afterUpdate')
      expect(userHooksFile!.content).not.toContain('beforeRemove')
      expect(userHooksFile!.content).not.toContain('afterRemove')
    })

    it('should generate correct field types in hook types', () => {
      const manifest = defineManifest({
        entities: [
          defineEntity('Product', {
            fields: {
              name: text(),
              price: number(),
              active: boolean().required(),
            },
            hooks: true,
          }),
        ],
        database: { type: 'sqlite', file: './test.db' },
      })

      const files = crudHooksGenerator.generate(manifest, { config: {} as any })
      const typesFile = files.find(f => f.path === 'hooks/types.ts')

      // Check that field types are present in the types file
      expect(typesFile!.content).toContain('name')
      expect(typesFile!.content).toContain('string')
      expect(typesFile!.content).toContain('price')
      expect(typesFile!.content).toContain('number')
      expect(typesFile!.content).toContain('active')
      expect(typesFile!.content).toContain('boolean')
    })

    it('should generate files only for entities with hooks', () => {
      const manifest = defineManifest({
        entities: [
          defineEntity('User', { fields: { name: text() }, hooks: true }),
          defineEntity('Post', { fields: { title: text() } }), // no hooks
        ],
        database: { type: 'sqlite', file: './test.db' },
      })

      const files = crudHooksGenerator.generate(manifest, { config: {} as any })

      expect(files.some(f => f.path === 'hooks/user.ts')).toBe(true)
      expect(files.some(f => f.path === 'hooks/post.ts')).toBe(false)
    })
  })

  describe('API Generator with Hooks', () => {
    it('should not import hooks when not enabled', () => {
      const manifest = defineManifest({
        entities: [
          defineEntity('User', { fields: { name: text() } }),
        ],
        database: { type: 'sqlite', file: './test.db' },
      })

      const files = apiGenerator.generate(manifest, { config: {} as any })
      const routerFile = files.find(f => f.path === 'trpc/routers/user.ts')

      expect(routerFile!.content).not.toContain("import { userHooks }")
      expect(routerFile!.content).not.toContain('buildHookContext')
    })

    it('should import hooks when enabled', () => {
      const manifest = defineManifest({
        entities: [
          defineEntity('User', { fields: { name: text() }, hooks: true }),
        ],
        database: { type: 'sqlite', file: './test.db' },
      })

      const files = apiGenerator.generate(manifest, { config: {} as any })
      const routerFile = files.find(f => f.path === 'trpc/routers/user.ts')

      expect(routerFile!.content).toContain("import { userHooks }")
      expect(routerFile!.content).toContain('function buildHookContext')
    })

    it('should invoke beforeCreate hook in create mutation', () => {
      const manifest = defineManifest({
        entities: [
          defineEntity('User', {
            fields: { name: text() },
            hooks: { beforeCreate: true },
          }),
        ],
        database: { type: 'sqlite', file: './test.db' },
      })

      const files = apiGenerator.generate(manifest, { config: {} as any })
      const routerFile = files.find(f => f.path === 'trpc/routers/user.ts')

      expect(routerFile!.content).toContain('Run beforeCreate hook')
      expect(routerFile!.content).toContain('userHooks.beforeCreate')
      expect(routerFile!.content).toContain('processedInput')
    })

    it('should invoke afterCreate hook in create mutation', () => {
      const manifest = defineManifest({
        entities: [
          defineEntity('User', {
            fields: { name: text() },
            hooks: { afterCreate: true },
          }),
        ],
        database: { type: 'sqlite', file: './test.db' },
      })

      const files = apiGenerator.generate(manifest, { config: {} as any })
      const routerFile = files.find(f => f.path === 'trpc/routers/user.ts')

      expect(routerFile!.content).toContain('Run afterCreate hook')
      expect(routerFile!.content).toContain('userHooks.afterCreate')
    })

    it('should invoke beforeUpdate hook in update mutation', () => {
      const manifest = defineManifest({
        entities: [
          defineEntity('User', {
            fields: { name: text() },
            hooks: { beforeUpdate: true },
          }),
        ],
        database: { type: 'sqlite', file: './test.db' },
      })

      const files = apiGenerator.generate(manifest, { config: {} as any })
      const routerFile = files.find(f => f.path === 'trpc/routers/user.ts')

      expect(routerFile!.content).toContain('Run beforeUpdate hook')
      expect(routerFile!.content).toContain('userHooks.beforeUpdate')
      expect(routerFile!.content).toContain('processedData')
    })

    it('should invoke afterUpdate hook in update mutation', () => {
      const manifest = defineManifest({
        entities: [
          defineEntity('User', {
            fields: { name: text() },
            hooks: { afterUpdate: true },
          }),
        ],
        database: { type: 'sqlite', file: './test.db' },
      })

      const files = apiGenerator.generate(manifest, { config: {} as any })
      const routerFile = files.find(f => f.path === 'trpc/routers/user.ts')

      expect(routerFile!.content).toContain('Run afterUpdate hook')
      expect(routerFile!.content).toContain('userHooks.afterUpdate')
    })

    it('should invoke beforeRemove hook in remove mutation', () => {
      const manifest = defineManifest({
        entities: [
          defineEntity('User', {
            fields: { name: text() },
            hooks: { beforeRemove: true },
          }),
        ],
        database: { type: 'sqlite', file: './test.db' },
      })

      const files = apiGenerator.generate(manifest, { config: {} as any })
      const routerFile = files.find(f => f.path === 'trpc/routers/user.ts')

      expect(routerFile!.content).toContain('Run beforeRemove hook')
      expect(routerFile!.content).toContain('userHooks.beforeRemove')
    })

    it('should invoke afterRemove hook in remove mutation', () => {
      const manifest = defineManifest({
        entities: [
          defineEntity('User', {
            fields: { name: text() },
            hooks: { afterRemove: true },
          }),
        ],
        database: { type: 'sqlite', file: './test.db' },
      })

      const files = apiGenerator.generate(manifest, { config: {} as any })
      const routerFile = files.find(f => f.path === 'trpc/routers/user.ts')

      expect(routerFile!.content).toContain('Run afterRemove hook')
      expect(routerFile!.content).toContain('userHooks.afterRemove')
    })

    it('should work with soft delete and hooks', () => {
      const manifest = defineManifest({
        entities: [
          defineEntity('User', {
            fields: { name: text() },
            behaviors: { softDelete: true },
            hooks: { beforeRemove: true, afterRemove: true },
          }),
        ],
        database: { type: 'sqlite', file: './test.db' },
      })

      const files = apiGenerator.generate(manifest, { config: {} as any })
      const routerFile = files.find(f => f.path === 'trpc/routers/user.ts')

      expect(routerFile!.content).toContain('Soft delete')
      expect(routerFile!.content).toContain('beforeRemove')
      expect(routerFile!.content).toContain('afterRemove')
    })
  })

  describe('External API with Hooks', () => {
    it('should support hooks with external API source', () => {
      const manifest = parseManifestJSON({
        entities: [{
          name: 'Product',
          fields: { name: { type: 'text' } },
          hooks: true,
          source: {
            baseUrl: 'https://api.example.com',
          },
        }],
        mode: 'headless',
      })

      const files = apiGenerator.generate(manifest, { config: {} as any })
      const routerFile = files.find(f => f.path === 'trpc/routers/product.ts')

      expect(routerFile!.content).toContain("import { productHooks }")
      expect(routerFile!.content).toContain('buildHookContext')
      expect(routerFile!.content).toContain('productService')
    })
  })
})
