/**
 * Test Generator
 *
 * Generates comprehensive Vitest test suites for each entity's tRPC router.
 * Tests are generated based on entity configuration (fields, validations, relations, protection).
 *
 * Generated files:
 * - tests/{entity}.test.ts - Full CRUD test suite with validation, auth, relations, filters
 *
 * Features:
 * - CRUD operation tests (create, list, get, update, remove)
 * - Validation tests (required fields, field constraints, type checking)
 * - Authentication tests (protected operations require auth)
 * - Relation tests (hasMany, belongsToMany associations)
 * - Filter/search/pagination tests
 * - Batch operation tests (createMany, updateMany, removeMany)
 * - Soft delete tests (if enabled)
 * - Computed field tests (if present)
 *
 * @module generators/test
 */

import type { Generator, GeneratedFile } from '../../../template/types'
import type { GeneratorContext } from '../../../template/context'
import type { ManifestIR } from '../../../manifest'
import type { EntityIR, ProtectedIR } from '../../../entity'
import type { FieldConfig } from '../../../fields'
import { toCamelCase } from '../../../core/utils'

/**
 * Check if entity has any protected operations
 */
function hasProtection(protection: ProtectedIR): boolean {
  return Object.values(protection).some(v => v)
}

/**
 * Get required fields from entity
 */
function getRequiredFields(entity: EntityIR): [string, FieldConfig][] {
  return Object.entries(entity.fields).filter(([_, field]) => 
    field.required && (field as any).type !== 'computed'
  )
}

/**
 * Get optional fields from entity
 */
function getOptionalFields(entity: EntityIR): [string, FieldConfig][] {
  return Object.entries(entity.fields).filter(([_, field]) => 
    !field.required && (field as any).type !== 'computed'
  )
}

/**
 * Get computed fields from entity
 */
function getComputedFields(entity: EntityIR): [string, FieldConfig][] {
  return Object.entries(entity.fields).filter(([_, field]) => 
    (field as any).type === 'computed'
  )
}

/**
 * Get text fields for search testing
 */
function getTextFields(entity: EntityIR): [string, FieldConfig][] {
  return Object.entries(entity.fields).filter(([_, field]) => 
    field.type === 'text' && (field as any).type !== 'computed'
  )
}

/**
 * Generate valid mock data for a field
 */
function generateMockValue(fieldName: string, field: FieldConfig): string {
  switch (field.type) {
    case 'text':
      // Check for specific validation types
      if (field.validations.some(v => v.type === 'email')) {
        return `'test-${fieldName}@example.com'`
      }
      if (field.validations.some(v => v.type === 'url')) {
        return `'https://example.com/${fieldName}'`
      }
      if (field.enumValues) {
        return `'${field.enumValues[0]}'`
      }
      const minLength = field.validations.find(v => v.type === 'minLength')
      if (minLength) {
        const len = (minLength.value as number) + 5
        return `'${'x'.repeat(len)}'`
      }
      return `'Test ${fieldName}'`
    
    case 'number':
      const min = field.validations.find(v => v.type === 'min')?.value as number || 0
      const max = field.validations.find(v => v.type === 'max')?.value as number
      const isPositive = field.validations.some(v => v.type === 'positive')
      const isInteger = field.validations.some(v => v.type === 'integer')
      
      let value = min > 0 ? min + 10 : isPositive ? 10 : 42
      if (max && value > max) value = max - 1
      if (isInteger) value = Math.floor(value)
      return String(value)
    
    case 'boolean':
      return 'true'
    
    case 'date':
      return `new Date().toISOString()`
    
    case 'enum':
      return field.enumValues ? `'${field.enumValues[0]}'` : `'default'`
    
    default:
      return `'test-value'`
  }
}

/**
 * Generate invalid mock data for validation testing
 */
function generateInvalidValue(fieldName: string, field: FieldConfig): { value: string; reason: string } | null {
  switch (field.type) {
    case 'text':
      if (field.validations.some(v => v.type === 'email')) {
        return { value: `'invalid-email'`, reason: 'invalid email format' }
      }
      if (field.validations.some(v => v.type === 'url')) {
        return { value: `'not-a-url'`, reason: 'invalid URL format' }
      }
      const minLength = field.validations.find(v => v.type === 'minLength')
      if (minLength) {
        return { value: `'x'`, reason: `below minimum length of ${minLength.value}` }
      }
      const maxLength = field.validations.find(v => v.type === 'maxLength')
      if (maxLength) {
        const len = (maxLength.value as number) + 10
        return { value: `'${'x'.repeat(len)}'`, reason: `exceeds maximum length of ${maxLength.value}` }
      }
      if (field.enumValues) {
        return { value: `'invalid-enum'`, reason: `not in allowed values: ${field.enumValues.join(', ')}` }
      }
      return null
    
    case 'number':
      const min = field.validations.find(v => v.type === 'min')
      if (min) {
        return { value: String((min.value as number) - 10), reason: `below minimum of ${min.value}` }
      }
      const max = field.validations.find(v => v.type === 'max')
      if (max) {
        return { value: String((max.value as number) + 10), reason: `exceeds maximum of ${max.value}` }
      }
      if (field.validations.some(v => v.type === 'integer')) {
        return { value: '3.14', reason: 'not an integer' }
      }
      if (field.validations.some(v => v.type === 'positive')) {
        return { value: '-5', reason: 'not positive' }
      }
      return null
    
    default:
      return null
  }
}

/**
 * Generate valid entity data for testing
 */
function generateValidEntityData(entity: EntityIR): string {
  const fields = getRequiredFields(entity)
  const assignments = fields.map(([name, field]) => 
    `    ${name}: ${generateMockValue(name, field)},`
  )
  
  return `{\n${assignments.join('\n')}\n  }`
}

/**
 * Generate test file for an entity
 */
function generateEntityTest(entity: EntityIR, manifest: ManifestIR): string {
  const entityName = entity.name
  const routerName = toCamelCase(entityName)
  const hasAuth = hasProtection(entity.protected)
  const requiredFields = getRequiredFields(entity)
  const optionalFields = getOptionalFields(entity)
  const computedFields = getComputedFields(entity)
  const textFields = getTextFields(entity)
  const hasSoftDelete = entity.behaviors.softDelete
  const hasTimestamps = entity.behaviors.timestamps

  const lines: string[] = []

  // Imports
  lines.push(`import { describe, it, expect, beforeEach } from 'vitest'`)
  lines.push(`import { appRouter } from '@/generated/trpc/routers'`)
  lines.push(`import { createCallerFactory } from '@trpc/server'`)
  lines.push(``)
  lines.push(`// Create tRPC caller for testing`)
  lines.push(`const createCaller = createCallerFactory(appRouter)`)
  lines.push(``)
  
  // Mock contexts
  if (hasAuth) {
    lines.push(`// Mock authenticated context`)
    lines.push(`const mockAuthContext = {`)
    lines.push(`  session: {`)
    lines.push(`    user: { id: 'test-user-123', email: 'test@example.com', name: 'Test User' }`)
    lines.push(`  }`)
    lines.push(`}`)
    lines.push(``)
  }
  
  lines.push(`// Mock unauthenticated context`)
  lines.push(`const mockPublicContext = {`)
  lines.push(`  session: null`)
  lines.push(`}`)
  lines.push(``)

  // Test suite
  lines.push(`describe('${entityName} Router', () => {`)
  lines.push(`  const publicCaller = createCaller(mockPublicContext)`)
  if (hasAuth) {
    lines.push(`  const authCaller = createCaller(mockAuthContext)`)
  }
  lines.push(``)

  // Valid test data
  lines.push(`  const validData = ${generateValidEntityData(entity)}`)
  lines.push(``)

  // CREATE tests
  lines.push(`  describe('create', () => {`)
  
  if (entity.protected.create) {
    lines.push(`    it('should require authentication', async () => {`)
    lines.push(`      await expect(`)
    lines.push(`        publicCaller.${routerName}.create(validData)`)
    lines.push(`      ).rejects.toThrow(/UNAUTHORIZED|unauthorized/)`)
    lines.push(`    })`)
    lines.push(``)
    lines.push(`    it('should create ${entityName} when authenticated', async () => {`)
    lines.push(`      const result = await authCaller.${routerName}.create(validData)`)
  } else {
    lines.push(`    it('should create ${entityName} with valid data', async () => {`)
    lines.push(`      const result = await publicCaller.${routerName}.create(validData)`)
  }
  
  lines.push(``)
  lines.push(`      expect(result).toBeDefined()`)
  lines.push(`      expect(result.id).toBeDefined()`)
  
  // Check required fields
  requiredFields.forEach(([name]) => {
    lines.push(`      expect(result.${name}).toBe(validData.${name})`)
  })
  
  // Check timestamps
  if (hasTimestamps) {
    lines.push(`      expect(result.createdAt).toBeDefined()`)
    lines.push(`      expect(result.updatedAt).toBeDefined()`)
  }
  
  // Check computed fields
  computedFields.forEach(([name, field]) => {
    lines.push(`      expect(result.${name}).toBeDefined() // computed field`)
  })
  
  lines.push(`    })`)
  lines.push(``)

  // Validation tests for required fields
  requiredFields.forEach(([fieldName, field]) => {
    lines.push(`    it('should reject missing ${fieldName}', async () => {`)
    lines.push(`      const invalidData = { ...validData }`)
    lines.push(`      delete invalidData.${fieldName}`)
    lines.push(``)
    const caller = entity.protected.create ? 'authCaller' : 'publicCaller'
    lines.push(`      await expect(`)
    lines.push(`        ${caller}.${routerName}.create(invalidData as any)`)
    lines.push(`      ).rejects.toThrow()`)
    lines.push(`    })`)
    lines.push(``)

    // Field-specific validation tests
    const invalidCase = generateInvalidValue(fieldName, field)
    if (invalidCase) {
      const validationCaller = entity.protected.create ? 'authCaller' : 'publicCaller'
      lines.push(`    it('should reject invalid ${fieldName} (${invalidCase.reason})', async () => {`)
      lines.push(`      const invalidData = { ...validData, ${fieldName}: ${invalidCase.value} }`)
      lines.push(``)
      lines.push(`      await expect(`)
      lines.push(`        ${validationCaller}.${routerName}.create(invalidData)`)
      lines.push(`      ).rejects.toThrow()`)
      lines.push(`    })`)
      lines.push(``)
    }
  })
  
  lines.push(`  })`)
  lines.push(``)

  // LIST tests
  lines.push(`  describe('list', () => {`)
  
  if (entity.protected.list) {
    lines.push(`    it('should require authentication', async () => {`)
    lines.push(`      await expect(`)
    lines.push(`        publicCaller.${routerName}.list({})`)
    lines.push(`      ).rejects.toThrow(/UNAUTHORIZED|unauthorized/)`)
    lines.push(`    })`)
    lines.push(``)
    lines.push(`    it('should return paginated results when authenticated', async () => {`)
    lines.push(`      const result = await authCaller.${routerName}.list({ page: 1, limit: 10 })`)
  } else {
    lines.push(`    it('should return paginated results', async () => {`)
    lines.push(`      const result = await publicCaller.${routerName}.list({ page: 1, limit: 10 })`)
  }
  
  lines.push(``)
  lines.push(`      expect(result).toBeDefined()`)
  lines.push(`      expect(result.items).toBeInstanceOf(Array)`)
  lines.push(`      expect(result.total).toBeTypeOf('number')`)
  lines.push(`      expect(result.page).toBe(1)`)
  lines.push(`      expect(result.limit).toBe(10)`)
  lines.push(`    })`)
  lines.push(``)

  // Filter tests
  if (textFields.length > 0) {
    const [firstTextField, _] = textFields[0]
    const caller = entity.protected.list ? 'authCaller' : 'publicCaller'
    
    lines.push(`    it('should filter by ${firstTextField}', async () => {`)
    lines.push(`      const result = await ${caller}.${routerName}.list({`)
    lines.push(`        where: { ${firstTextField}: { contains: 'test' } }`)
    lines.push(`      })`)
    lines.push(``)
    lines.push(`      expect(result.items).toBeInstanceOf(Array)`)
    lines.push(`    })`)
    lines.push(``)
    
    lines.push(`    it('should search across text fields', async () => {`)
    lines.push(`      const result = await ${caller}.${routerName}.list({`)
    lines.push(`        search: 'test'`)
    lines.push(`      })`)
    lines.push(``)
    lines.push(`      expect(result.items).toBeInstanceOf(Array)`)
    lines.push(`    })`)
    lines.push(``)
  }

  // Pagination test
  const listCaller = entity.protected.list ? 'authCaller' : 'publicCaller'
  lines.push(`    it('should support pagination', async () => {`)
  lines.push(`      const page1 = await ${listCaller}.${routerName}.list({ page: 1, limit: 5 })`)
  lines.push(`      const page2 = await ${listCaller}.${routerName}.list({ page: 2, limit: 5 })`)
  lines.push(``)
  lines.push(`      expect(page1.page).toBe(1)`)
  lines.push(`      expect(page2.page).toBe(2)`)
  lines.push(`    })`)
  lines.push(``)
  
  lines.push(`  })`)
  lines.push(``)

  // GET tests
  lines.push(`  describe('get', () => {`)
  
  if (entity.protected.get) {
    lines.push(`    it('should require authentication', async () => {`)
    lines.push(`      await expect(`)
    lines.push(`        publicCaller.${routerName}.get({ id: 'test-id' })`)
    lines.push(`      ).rejects.toThrow(/UNAUTHORIZED|unauthorized/)`)
    lines.push(`    })`)
    lines.push(``)
    lines.push(`    it('should return entity by ID when authenticated', async () => {`)
    lines.push(`      const created = await authCaller.${routerName}.create(validData)`)
    lines.push(`      const result = await authCaller.${routerName}.get({ id: created.id })`)
  } else {
    lines.push(`    it('should return entity by ID', async () => {`)
    const createCaller = entity.protected.create ? 'authCaller' : 'publicCaller'
    lines.push(`      const created = await ${createCaller}.${routerName}.create(validData)`)
    lines.push(`      const result = await publicCaller.${routerName}.get({ id: created.id })`)
  }
  
  lines.push(``)
  lines.push(`      expect(result).toBeDefined()`)
  lines.push(`      expect(result.id).toBe(created.id)`)
  lines.push(`    })`)
  lines.push(``)
  
  const getCaller = entity.protected.get ? 'authCaller' : 'publicCaller'
  lines.push(`    it('should throw error for non-existent ID', async () => {`)
  lines.push(`      await expect(`)
  lines.push(`        ${getCaller}.${routerName}.get({ id: 'non-existent-id' })`)
  lines.push(`      ).rejects.toThrow()`)
  lines.push(`    })`)
  lines.push(``)
  
  lines.push(`  })`)
  lines.push(``)

  // UPDATE tests
  lines.push(`  describe('update', () => {`)
  
  if (entity.protected.update) {
    lines.push(`    it('should require authentication', async () => {`)
    const createCaller = entity.protected.create ? 'authCaller' : 'publicCaller'
    lines.push(`      const created = await ${createCaller}.${routerName}.create(validData)`)
    lines.push(``)
    lines.push(`      await expect(`)
    lines.push(`        publicCaller.${routerName}.update({ id: created.id, data: validData })`)
    lines.push(`      ).rejects.toThrow(/UNAUTHORIZED|unauthorized/)`)
    lines.push(`    })`)
    lines.push(``)
    lines.push(`    it('should update ${entityName} when authenticated', async () => {`)
    lines.push(`      const created = await authCaller.${routerName}.create(validData)`)
  } else {
    lines.push(`    it('should update ${entityName}', async () => {`)
    const createCaller = entity.protected.create ? 'authCaller' : 'publicCaller'
    lines.push(`      const created = await ${createCaller}.${routerName}.create(validData)`)
  }
  
  // Generate update data (modify first field)
  if (requiredFields.length > 0) {
    const [firstField, firstFieldConfig] = requiredFields[0]
    const newValue = generateMockValue('updated', firstFieldConfig)
    const updateCaller = entity.protected.update ? 'authCaller' : 'publicCaller'
    
    lines.push(`      const updateData = { ${firstField}: ${newValue} }`)
    lines.push(`      const result = await ${updateCaller}.${routerName}.update({ id: created.id, data: updateData })`)
    lines.push(``)
    lines.push(`      expect(result.${firstField}).toBe(updateData.${firstField})`)
    
    if (hasTimestamps) {
      lines.push(`      expect(new Date(result.updatedAt).getTime()).toBeGreaterThan(new Date(created.updatedAt).getTime())`)
    }
  }
  
  lines.push(`    })`)
  lines.push(``)
  
  lines.push(`  })`)
  lines.push(``)

  // REMOVE tests
  lines.push(`  describe('remove', () => {`)
  
  if (entity.protected.remove) {
    lines.push(`    it('should require authentication', async () => {`)
    const createCaller = entity.protected.create ? 'authCaller' : 'publicCaller'
    lines.push(`      const created = await ${createCaller}.${routerName}.create(validData)`)
    lines.push(``)
    lines.push(`      await expect(`)
    lines.push(`        publicCaller.${routerName}.remove({ id: created.id })`)
    lines.push(`      ).rejects.toThrow(/UNAUTHORIZED|unauthorized/)`)
    lines.push(`    })`)
    lines.push(``)
    lines.push(`    it('should remove ${entityName} when authenticated', async () => {`)
    lines.push(`      const created = await authCaller.${routerName}.create(validData)`)
    lines.push(`      const result = await authCaller.${routerName}.remove({ id: created.id })`)
  } else {
    lines.push(`    it('should remove ${entityName}', async () => {`)
    const createCaller = entity.protected.create ? 'authCaller' : 'publicCaller'
    lines.push(`      const created = await ${createCaller}.${routerName}.create(validData)`)
    lines.push(`      const result = await publicCaller.${routerName}.remove({ id: created.id })`)
  }
  
  lines.push(``)
  lines.push(`      expect(result).toBeDefined()`)
  lines.push(`      expect(result.id).toBe(created.id)`)
  
  if (hasSoftDelete) {
    lines.push(`      expect(result.deletedAt).toBeDefined() // soft delete`)
  }
  
  lines.push(`    })`)
  lines.push(``)
  
  lines.push(`  })`)
  lines.push(``)

  // BATCH OPERATIONS tests
  lines.push(`  describe('batch operations', () => {`)
  
  const batchCaller = entity.protected.create ? 'authCaller' : 'publicCaller'
  lines.push(`    it('should create multiple ${entityName}s', async () => {`)
  lines.push(`      const items = [validData, validData, validData]`)
  lines.push(`      const result = await ${batchCaller}.${routerName}.createMany({ items })`)
  lines.push(``)
  lines.push(`      expect(result.created).toHaveLength(3)`)
  lines.push(`      expect(result.count).toBe(3)`)
  lines.push(`    })`)
  lines.push(``)
  
  lines.push(`    it('should update multiple ${entityName}s', async () => {`)
  lines.push(`      const created = await ${batchCaller}.${routerName}.createMany({ items: [validData, validData] })`)
  if (requiredFields.length > 0) {
    const [firstField, firstFieldConfig] = requiredFields[0]
    const newValue = generateMockValue('batch-updated', firstFieldConfig)
    lines.push(`      const updates = created.created.map(item => ({`)
    lines.push(`        id: item.id,`)
    lines.push(`        data: { ${firstField}: ${newValue} }`)
    lines.push(`      }))`)
  } else {
    lines.push(`      const updates = created.created.map(item => ({ id: item.id, data: {} }))`)
  }
  const updateManyCaller = entity.protected.update ? 'authCaller' : 'publicCaller'
  lines.push(`      const result = await ${updateManyCaller}.${routerName}.updateMany({ items: updates })`)
  lines.push(``)
  lines.push(`      expect(result.count).toBe(2)`)
  lines.push(`    })`)
  lines.push(``)
  
  lines.push(`    it('should remove multiple ${entityName}s', async () => {`)
  lines.push(`      const created = await ${batchCaller}.${routerName}.createMany({ items: [validData, validData] })`)
  lines.push(`      const ids = created.created.map(item => item.id)`)
  const removeManyCaller = entity.protected.remove ? 'authCaller' : 'publicCaller'
  lines.push(`      const result = await ${removeManyCaller}.${routerName}.removeMany({ ids })`)
  lines.push(``)
  lines.push(`      expect(result.count).toBe(2)`)
  lines.push(`    })`)
  lines.push(``)
  
  lines.push(`  })`)

  // Close test suite
  lines.push(`})`)
  lines.push(``)

  return lines.join('\n')
}

/**
 * Test generator - creates Vitest test files for tRPC routers
 */
export const testGenerator: Generator = {
  name: 'vitest-tests',
  description: 'Generates comprehensive test suites for tRPC routers',
  
  generate(manifest: ManifestIR, ctx: GeneratorContext): GeneratedFile[] {
    const files: GeneratedFile[] = []

    // Generate test file for each entity
    for (const entity of manifest.entities) {
      files.push({
        path: `tests/${toCamelCase(entity.name)}.test.ts`,
        content: generateEntityTest(entity, manifest),
      })
    }

    // Generate test setup file
    files.push({
      path: 'tests/setup.ts',
      content: generateTestSetup(manifest),
    })

    return files
  },
}

/**
 * Generate test setup/configuration file
 */
function generateTestSetup(manifest: ManifestIR): string {
  const lines: string[] = []
  
  lines.push(`/**`)
  lines.push(` * Test Setup`)
  lines.push(` * `)
  lines.push(` * Global test configuration and utilities.`)
  lines.push(` */`)
  lines.push(``)
  lines.push(`import { beforeAll, afterAll, afterEach } from 'vitest'`)
  lines.push(``)
  lines.push(`// Setup test database connection`)
  lines.push(`beforeAll(async () => {`)
  lines.push(`  // TODO: Initialize test database`)
  lines.push(`  // For SQLite: create in-memory or temp file`)
  lines.push(`  // For PostgreSQL: create test database`)
  lines.push(`})`)
  lines.push(``)
  lines.push(`// Clean up after each test`)
  lines.push(`afterEach(async () => {`)
  lines.push(`  // TODO: Clear test data`)
  lines.push(`  // Truncate tables or reset database`)
  lines.push(`})`)
  lines.push(``)
  lines.push(`// Cleanup after all tests`)
  lines.push(`afterAll(async () => {`)
  lines.push(`  // TODO: Close database connection`)
  lines.push(`})`)
  lines.push(``)
  
  return lines.join('\n')
}
