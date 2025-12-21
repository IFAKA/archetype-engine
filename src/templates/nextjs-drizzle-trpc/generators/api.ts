/**
 * tRPC Router Generator
 *
 * Generates type-safe tRPC routers with CRUD operations for each entity.
 * Adapts to database or external API source based on entity/manifest configuration.
 *
 * Generated files:
 * - trpc/routers/{entity}.ts - Individual entity routers with list, get, create, update, remove
 * - trpc/routers/index.ts - App router combining all entity routers
 *
 * Features:
 * - Automatic procedure type selection (publicProcedure vs protectedProcedure)
 * - Multi-tenancy support with automatic tenant filtering
 * - Soft delete support (updates deletedAt instead of hard delete)
 * - External API integration via generated service layer
 * - Input validation using generated Zod schemas
 *
 * @module generators/api
 */

import type { Generator, GeneratedFile } from '../../../template/types'
import type { GeneratorContext } from '../../../template/context'
import type { ManifestIR } from '../../../manifest'
import type { EntityIR, ProtectedIR, HooksIR } from '../../../entity'
import type { FieldConfig } from '../../../fields'
import { toSnakeCase, pluralize, toCamelCase } from '../../../core/utils'

/**
 * Check if entity has any hooks enabled
 */
function hasAnyHooks(hooks: HooksIR): boolean {
  return Object.values(hooks).some(v => v)
}

function getTableName(entityName: string): string {
  return toSnakeCase(pluralize(entityName))
}

/**
 * Get the column name for a field (snake_case)
 */
function getColumnName(fieldName: string): string {
  return toSnakeCase(fieldName)
}

/**
 * Generate Zod filter schema for a field based on its type
 */
function generateFieldFilterSchema(fieldName: string, field: FieldConfig): string {
  const baseType = field.type

  switch (baseType) {
    case 'text':
      return `${fieldName}: z.union([
      z.string(),
      z.object({
        eq: z.string().optional(),
        ne: z.string().optional(),
        contains: z.string().optional(),
        startsWith: z.string().optional(),
        endsWith: z.string().optional(),
      })
    ]).optional()`

    case 'number':
      return `${fieldName}: z.union([
      z.number(),
      z.object({
        eq: z.number().optional(),
        ne: z.number().optional(),
        gt: z.number().optional(),
        gte: z.number().optional(),
        lt: z.number().optional(),
        lte: z.number().optional(),
      })
    ]).optional()`

    case 'boolean':
      return `${fieldName}: z.boolean().optional()`

    case 'date':
      return `${fieldName}: z.union([
      z.string(),
      z.object({
        eq: z.string().optional(),
        ne: z.string().optional(),
        gt: z.string().optional(),
        gte: z.string().optional(),
        lt: z.string().optional(),
        lte: z.string().optional(),
      })
    ]).optional()`

    default:
      return `${fieldName}: z.string().optional()`
  }
}

/**
 * Generate the complete filter/sort schema for an entity
 */
function generateListInputSchema(entity: EntityIR): string {
  // Skip computed fields - they can't be filtered
  const storedFields = Object.entries(entity.fields).filter(([_, f]) => f.type !== 'computed')
  const fieldNames = storedFields.map(([name]) => name)
  const filterFields = storedFields
    .map(([name, field]) => generateFieldFilterSchema(name, field))
    .join(',\n    ')

  // Include system fields in orderBy options
  const orderByFields = [...fieldNames, 'createdAt', 'updatedAt']

  // Get searchable (text) fields for search - skip computed
  const textFields = storedFields
    .filter(([_, field]) => field.type === 'text')
    .map(([name]) => name)

  return `// List input schema with pagination, filtering, sorting, and search
const listInput = z.object({
  // Pagination
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),

  // Filtering
  where: z.object({
    ${filterFields}
  }).optional(),

  // Sorting
  orderBy: z.object({
    field: z.enum([${orderByFields.map(f => `'${f}'`).join(', ')}]),
    direction: z.enum(['asc', 'desc']).default('asc'),
  }).optional(),

  // Search across text fields${textFields.length > 0 ? ` (${textFields.join(', ')})` : ''}
  search: z.string().optional(),
}).optional()`
}

/**
 * Check if entity uses external API source
 *
 * Checks entity-level source first, then falls back to manifest-level source.
 *
 * @param entity - Entity IR to check
 * @param manifest - Manifest IR with global source configuration
 * @returns true if entity should use external API, false for database
 */
function hasExternalSource(entity: EntityIR, manifest: ManifestIR): boolean {
  const source = entity.source || manifest.source
  return source?.type === 'external'
}

type CrudMethod = 'list' | 'get' | 'create' | 'update' | 'remove'

/**
 * Determine procedure type for a CRUD method based on protection config
 *
 * @param method - CRUD method name (list, get, create, update, remove)
 * @param prot - Normalized protection config from entity
 * @param authEnabled - Whether auth is enabled in manifest
 * @returns 'publicProcedure' or 'protectedProcedure'
 */
function getProcedureType(
  method: CrudMethod,
  prot: ProtectedIR,
  authEnabled: boolean
): 'publicProcedure' | 'protectedProcedure' {
  if (!authEnabled) return 'publicProcedure'
  return prot[method] ? 'protectedProcedure' : 'publicProcedure'
}

/**
 * Determine which procedure imports are needed for an entity
 *
 * @param prot - Normalized protection config from entity
 * @param authEnabled - Whether auth is enabled in manifest
 * @returns Import string (e.g., "publicProcedure, protectedProcedure")
 */
function getProcedureImports(prot: ProtectedIR, authEnabled: boolean): string {
  if (!authEnabled) return 'publicProcedure'

  const needsPublic = Object.values(prot).some(v => !v)
  const needsProtected = Object.values(prot).some(v => v)

  if (needsPublic && needsProtected) {
    return 'publicProcedure, protectedProcedure'
  } else if (needsProtected) {
    return 'protectedProcedure'
  }
  return 'publicProcedure'
}

/**
 * Generate tRPC router for entity backed by external API
 *
 * Uses the generated service layer to make HTTP requests to external APIs.
 *
 * @param entity - Entity IR with fields and protection config
 * @param manifest - Manifest IR with auth configuration
 * @returns Complete router code as string
 */
function generateExternalEntityRouter(entity: EntityIR, manifest: ManifestIR): string {
  const name = entity.name
  const lowerName = name.toLowerCase()
  const authEnabled = manifest.auth.enabled
  const prot = entity.protected
  const hooks = entity.hooks
  const useHooks = hasAnyHooks(hooks)

  // Get procedure type for each method
  const proc = (method: CrudMethod) => getProcedureType(method, prot, authEnabled)
  const procedureImports = getProcedureImports(prot, authEnabled)

  // Generate list input schema (same as database)
  const listInputSchema = generateListInputSchema(entity)
  const computedMapper = generateComputedFieldsMapper(entity)
  const useComputed = hasComputedFields(entity)

  // Hook import (only if hooks enabled)
  const hookImport = useHooks
    ? `import { ${lowerName}Hooks } from '@/generated/hooks/${lowerName}'`
    : ''

  // Hook context builder
  const hookContextBuilder = useHooks
    ? `
// Build hook context from tRPC context
function buildHookContext(ctx: any) {
  return {
    user: ctx.session?.user ? {
      id: ctx.session.user.id,
      email: ctx.session.user.email,
      name: ctx.session.user.name,
    } : undefined,
    headers: ctx.headers,
  }
}
`
    : ''

  return `// Auto-generated tRPC router for ${name} (external API)
// Do not edit manually - regenerate with: npx archetype generate

import { z } from 'zod'
import { router, ${procedureImports} } from '@/server/trpc'
import { ${lowerName}Service } from '@/generated/services/${lowerName}Service'
import { ${lowerName}CreateSchema, ${lowerName}UpdateSchema } from '@/generated/schemas/${lowerName}'
${hookImport}

${listInputSchema}
${computedMapper}${hookContextBuilder}
export const ${lowerName}Router = router({
  // List ${name}s with pagination, filtering, sorting, and search
  list: ${proc('list')}
    .input(listInput)
    .query(async ({ input }) => {
      const page = input?.page ?? 1
      const limit = input?.limit ?? 20
      const result = await ${lowerName}Service.list({
        page,
        limit,
        where: input?.where,
        orderBy: input?.orderBy,
        search: input?.search,
      })
      return ${useComputed ? '{ ...result, items: result.items.map(withComputedFields) }' : 'result'}
    }),

  // Get single ${name} by ID
  get: ${proc('get')}
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const result = await ${lowerName}Service.get(input.id)
      return ${useComputed ? 'result ? withComputedFields(result) : null' : 'result'}
    }),

  // Create new ${name}
  create: ${proc('create')}
    .input(${lowerName}CreateSchema)
    .mutation(async ({ ctx, input }) => {${hooks.beforeCreate ? `
      // Run beforeCreate hook
      const hookCtx = buildHookContext(ctx)
      const processedInput = ${lowerName}Hooks.beforeCreate
        ? await ${lowerName}Hooks.beforeCreate(input, hookCtx)
        : input
` : ''}
      const result = await ${lowerName}Service.create(${hooks.beforeCreate ? 'processedInput' : 'input'})
      const record = ${useComputed ? 'result ? withComputedFields(result) : result' : 'result'}${hooks.afterCreate ? `

      // Run afterCreate hook
      if (record && ${lowerName}Hooks.afterCreate) {
        await ${lowerName}Hooks.afterCreate(record, ${hooks.beforeCreate ? 'hookCtx' : 'buildHookContext(ctx)'})
      }
` : ''}
      return record
    }),

  // Update ${name}
  update: ${proc('update')}
    .input(z.object({
      id: z.string(),
      data: ${lowerName}UpdateSchema,
    }))
    .mutation(async ({ ctx, input }) => {${hooks.beforeUpdate ? `
      // Run beforeUpdate hook
      const hookCtx = buildHookContext(ctx)
      const processedData = ${lowerName}Hooks.beforeUpdate
        ? await ${lowerName}Hooks.beforeUpdate(input.id, input.data, hookCtx)
        : input.data
` : ''}
      const result = await ${lowerName}Service.update(input.id, ${hooks.beforeUpdate ? 'processedData' : 'input.data'})
      const record = ${useComputed ? 'result ? withComputedFields(result) : result' : 'result'}${hooks.afterUpdate ? `

      // Run afterUpdate hook
      if (record && ${lowerName}Hooks.afterUpdate) {
        await ${lowerName}Hooks.afterUpdate(record, ${hooks.beforeUpdate ? 'hookCtx' : 'buildHookContext(ctx)'})
      }
` : ''}
      return record
    }),

  // Remove ${name}
  remove: ${proc('remove')}
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {${hooks.beforeRemove ? `
      // Run beforeRemove hook
      const hookCtx = buildHookContext(ctx)
      if (${lowerName}Hooks.beforeRemove) {
        await ${lowerName}Hooks.beforeRemove(input.id, hookCtx)
      }
` : ''}
      const result = await ${lowerName}Service.delete(input.id)
      const record = ${useComputed ? 'result ? withComputedFields(result) : result' : 'result'}${hooks.afterRemove ? `

      // Run afterRemove hook
      if (record && ${lowerName}Hooks.afterRemove) {
        await ${lowerName}Hooks.afterRemove(record, ${hooks.beforeRemove ? 'hookCtx' : 'buildHookContext(ctx)'})
      }
` : ''}
      return record
    }),

  // ============ BATCH OPERATIONS ============

  // Create multiple ${name}s
  createMany: ${proc('create')}
    .input(z.object({
      items: z.array(${lowerName}CreateSchema).min(1).max(100),
    }))
    .mutation(async ({ input }) => {
      const result = await ${lowerName}Service.createMany(input.items)
      return ${useComputed ? '{ ...result, created: result.created.map(withComputedFields) }' : 'result'}
    }),

  // Update multiple ${name}s
  updateMany: ${proc('update')}
    .input(z.object({
      items: z.array(z.object({
        id: z.string(),
        data: ${lowerName}UpdateSchema,
      })).min(1).max(100),
    }))
    .mutation(async ({ input }) => {
      const result = await ${lowerName}Service.updateMany(input.items)
      return ${useComputed ? '{ ...result, updated: result.updated.map(withComputedFields) }' : 'result'}
    }),

  // Remove multiple ${name}s
  removeMany: ${proc('remove')}
    .input(z.object({
      ids: z.array(z.string()).min(1).max(100),
    }))
    .mutation(async ({ input }) => {
      const result = await ${lowerName}Service.deleteMany(input.ids)
      return ${useComputed ? '{ ...result, removed: result.removed.map(withComputedFields) }' : 'result'}
    }),
})
`
}

/**
 * Generate the filter builder function that converts input.where to Drizzle conditions
 */
function generateFilterBuilder(entity: EntityIR, tableName: string): string {
  // Skip computed fields - they're not in the database
  const fieldConditions = Object.entries(entity.fields)
    .filter(([_, field]) => field.type !== 'computed')
    .map(([fieldName, field]) => {
    const columnName = getColumnName(fieldName)
    const column = `${tableName}.${columnName}`

    if (field.type === 'text') {
      return `    if (where.${fieldName} !== undefined) {
      if (typeof where.${fieldName} === 'string') {
        conditions.push(eq(${column}, where.${fieldName}))
      } else {
        const f = where.${fieldName}
        if (f.eq !== undefined) conditions.push(eq(${column}, f.eq))
        if (f.ne !== undefined) conditions.push(ne(${column}, f.ne))
        if (f.contains !== undefined) conditions.push(like(${column}, \`%\${f.contains}%\`))
        if (f.startsWith !== undefined) conditions.push(like(${column}, \`\${f.startsWith}%\`))
        if (f.endsWith !== undefined) conditions.push(like(${column}, \`%\${f.endsWith}\`))
      }
    }`
    } else if (field.type === 'number' || field.type === 'date') {
      return `    if (where.${fieldName} !== undefined) {
      if (typeof where.${fieldName} === '${field.type === 'number' ? 'number' : 'string'}') {
        conditions.push(eq(${column}, where.${fieldName}))
      } else {
        const f = where.${fieldName}
        if (f.eq !== undefined) conditions.push(eq(${column}, f.eq))
        if (f.ne !== undefined) conditions.push(ne(${column}, f.ne))
        if (f.gt !== undefined) conditions.push(gt(${column}, f.gt))
        if (f.gte !== undefined) conditions.push(gte(${column}, f.gte))
        if (f.lt !== undefined) conditions.push(lt(${column}, f.lt))
        if (f.lte !== undefined) conditions.push(lte(${column}, f.lte))
      }
    }`
    } else if (field.type === 'boolean') {
      return `    if (where.${fieldName} !== undefined) {
      conditions.push(eq(${column}, where.${fieldName}))
    }`
    }
    return ''
  }).filter(Boolean).join('\n')

  return `function buildFilters(where: NonNullable<typeof listInput._type>['where']) {
  const conditions: SQL[] = []
  if (!where) return conditions

${fieldConditions}

  return conditions
}`
}

/**
 * Generate the search condition for text fields
 */
function generateSearchBuilder(entity: EntityIR, tableName: string): string {
  // Skip computed fields - only search stored text fields
  const textFields = Object.entries(entity.fields)
    .filter(([_, field]) => field.type === 'text')
    .map(([name]) => name)

  if (textFields.length === 0) {
    return `function buildSearch(_search: string | undefined) {
  return undefined
}`
  }

  const searchConditions = textFields.map(fieldName => {
    const columnName = getColumnName(fieldName)
    return `like(${tableName}.${columnName}, \`%\${search}%\`)`
  }).join(',\n      ')

  return `function buildSearch(search: string | undefined) {
  if (!search) return undefined
  return or(
    ${searchConditions}
  )
}`
}

/**
 * Check if entity has computed fields
 */
function hasComputedFields(entity: EntityIR): boolean {
  return Object.values(entity.fields).some(f => f.type === 'computed')
}

/**
 * Generate computed field mapper function
 * This function adds computed field values to database results at runtime
 */
function generateComputedFieldsMapper(entity: EntityIR): string {
  const computedFields = Object.entries(entity.fields).filter(([_, f]) => f.type === 'computed')

  if (computedFields.length === 0) {
    return ''
  }

  const fieldMappings = computedFields.map(([name, field]) => {
    // The expression is already valid JS (e.g., "`${firstName} ${lastName}`" or "price * quantity")
    return `    ${name}: ${field.expression},`
  }).join('\n')

  return `
// Helper: Add computed fields to a record
function withComputedFields<T extends Record<string, any>>(record: T) {
  return {
    ...record,
${fieldMappings}
  }
}
`
}

/**
 * Generate the orderBy builder
 */
function generateOrderByBuilder(entity: EntityIR, tableName: string): string {
  // Skip computed fields - can only sort by stored fields
  const fieldNames = Object.entries(entity.fields)
    .filter(([_, f]) => f.type !== 'computed')
    .map(([name]) => name)
  const allFields = [...fieldNames, 'createdAt', 'updatedAt']

  const fieldCases = allFields.map(fieldName => {
    const columnName = getColumnName(fieldName)
    return `    case '${fieldName}': column = ${tableName}.${columnName}; break`
  }).join('\n')

  return `function buildOrderBy(orderBy: NonNullable<typeof listInput._type>['orderBy']) {
  if (!orderBy) return undefined
  let column: any
  switch (orderBy.field) {
${fieldCases}
  }
  return orderBy.direction === 'desc' ? desc(column) : asc(column)
}`
}

/**
 * Generate tRPC router for entity backed by database
 *
 * Uses Drizzle ORM for database operations with support for:
 * - Multi-tenancy filtering
 * - Soft delete (when enabled)
 * - Automatic timestamps
 * - Pagination (page, limit)
 * - Filtering (where)
 * - Sorting (orderBy)
 * - Search (full-text across text fields)
 *
 * @param entity - Entity IR with fields, relations, and behaviors
 * @param manifest - Manifest IR with database, auth, and tenancy configuration
 * @returns Complete router code as string
 */
function generateDatabaseEntityRouter(entity: EntityIR, manifest: ManifestIR): string {
  const name = entity.name
  const lowerName = name.toLowerCase()
  const tableName = getTableName(name)

  const useTenancy = manifest.tenancy.enabled
  const useSoftDelete = entity.behaviors.softDelete
  const authEnabled = manifest.auth.enabled
  const prot = entity.protected
  const hooks = entity.hooks
  const useHooks = hasAnyHooks(hooks)

  // Get procedure type for each method
  const proc = (method: CrudMethod) => getProcedureType(method, prot, authEnabled)
  const procedureImports = getProcedureImports(prot, authEnabled)

  // Schema import
  const schemaImport = `import { ${lowerName}CreateSchema, ${lowerName}UpdateSchema } from '@/generated/schemas/${lowerName}'`

  // Hook import (only if hooks enabled)
  const hookImport = useHooks
    ? `import { ${lowerName}Hooks } from '@/generated/hooks/${lowerName}'`
    : ''

  // Hook context builder
  const hookContextBuilder = useHooks
    ? `
// Build hook context from tRPC context
function buildHookContext(ctx: any) {
  return {
    user: ctx.session?.user ? {
      id: ctx.session.user.id,
      email: ctx.session.user.email,
      name: ctx.session.user.name,
    } : undefined,
    headers: ctx.headers,
  }
}
`
    : ''

  // Build base where clauses (tenancy, soft delete)
  const tenantWhere = useTenancy
    ? `eq(${tableName}.${manifest.tenancy.field}, ctx.${manifest.tenancy.field})`
    : ''
  const softDeleteWhere = useSoftDelete
    ? `isNull(${tableName}.deletedAt)`
    : ''

  const baseWheres = [tenantWhere, softDeleteWhere].filter(Boolean)

  const getWhereClause = baseWheres.length > 0
    ? `and(eq(${tableName}.id, input.id), ${baseWheres.join(', ')})`
    : `eq(${tableName}.id, input.id)`

  // Check if we have text fields for search
  const hasTextFields = Object.values(entity.fields).some(f => f.type === 'text')

  // Drizzle imports - include all needed operators
  const drizzleOperators = ['eq', 'and', 'count', 'ne', 'gt', 'gte', 'lt', 'lte', 'like', 'asc', 'desc', 'inArray']
  if (hasTextFields) drizzleOperators.push('or')
  if (useSoftDelete) drizzleOperators.push('isNull')
  const drizzleImports = `import { ${drizzleOperators.join(', ')}, type SQL } from 'drizzle-orm'`

  // Generate list input schema
  const listInputSchema = generateListInputSchema(entity)

  // Generate helper functions
  const filterBuilder = generateFilterBuilder(entity, tableName)
  const searchBuilder = generateSearchBuilder(entity, tableName)
  const orderByBuilder = generateOrderByBuilder(entity, tableName)
  const computedMapper = generateComputedFieldsMapper(entity)
  const useComputed = hasComputedFields(entity)

  // Build the combined where conditions for list
  const combineConditions = baseWheres.length > 0
    ? `    // Combine base conditions (tenancy, soft delete) with filters and search
    const baseConditions: SQL[] = [${baseWheres.join(', ')}]
    const allConditions = [...baseConditions, ...filterConditions]
    if (searchCondition) allConditions.push(searchCondition)
    const whereClause = allConditions.length > 0 ? and(...allConditions) : undefined`
    : `    // Combine filters and search
    const allConditions = [...filterConditions]
    if (searchCondition) allConditions.push(searchCondition)
    const whereClause = allConditions.length > 0 ? and(...allConditions) : undefined`

  return `// Auto-generated tRPC router for ${name}
// Do not edit manually - regenerate with: npx archetype generate

import { z } from 'zod'
import { router, ${procedureImports} } from '@/server/trpc'
import { db } from '@/server/db'
import { ${tableName} } from '@/generated/db/schema'
${schemaImport}
${drizzleImports}
${hookImport}

${listInputSchema}

// Helper: Build filter conditions from where input
${filterBuilder}

// Helper: Build search condition across text fields
${searchBuilder}

// Helper: Build orderBy clause
${orderByBuilder}
${computedMapper}${hookContextBuilder}
export const ${lowerName}Router = router({
  // List ${name}s with pagination, filtering, sorting, and search
  list: ${proc('list')}
    .input(listInput)
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1
      const limit = input?.limit ?? 20
      const offset = (page - 1) * limit

      // Build conditions
      const filterConditions = buildFilters(input?.where)
      const searchCondition = buildSearch(input?.search)
      const orderByClause = buildOrderBy(input?.orderBy)

${combineConditions}

      // Build query
      let query = db.select().from(${tableName})
      if (whereClause) query = query.where(whereClause) as typeof query
      if (orderByClause) query = query.orderBy(orderByClause) as typeof query

      // Get items with pagination
      const items = await query.limit(limit).offset(offset)

      // Get total count with same filters
      let countQuery = db.select({ total: count() }).from(${tableName})
      if (whereClause) countQuery = countQuery.where(whereClause) as typeof countQuery
      const [{ total }] = await countQuery

      return {
        items: ${useComputed ? 'items.map(withComputedFields)' : 'items'},
        total,
        page,
        limit,
        hasMore: offset + items.length < total,
      }
    }),

  // Get single ${name} by ID
  get: ${proc('get')}
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await db.select().from(${tableName})
        .where(${getWhereClause})
        .limit(1)
      return ${useComputed ? 'result[0] ? withComputedFields(result[0]) : null' : 'result[0] ?? null'}
    }),

  // Create new ${name}
  create: ${proc('create')}
    .input(${lowerName}CreateSchema)
    .mutation(async ({ ctx, input }) => {${hooks.beforeCreate ? `
      // Run beforeCreate hook
      const hookCtx = buildHookContext(ctx)
      const processedInput = ${lowerName}Hooks.beforeCreate
        ? await ${lowerName}Hooks.beforeCreate(input, hookCtx)
        : input
` : ''}
      const now = new Date().toISOString()
      const result = await db.insert(${tableName}).values({
        id: crypto.randomUUID(),
        ...${hooks.beforeCreate ? 'processedInput' : 'input'},${useTenancy ? `\n        ${manifest.tenancy.field}: ctx.${manifest.tenancy.field},` : ''}
        createdAt: now,
        updatedAt: now,
      }).returning()
      const record = ${useComputed ? 'result[0] ? withComputedFields(result[0]) : result[0]' : 'result[0]'}${hooks.afterCreate ? `

      // Run afterCreate hook
      if (record && ${lowerName}Hooks.afterCreate) {
        await ${lowerName}Hooks.afterCreate(record, ${hooks.beforeCreate ? 'hookCtx' : 'buildHookContext(ctx)'})
      }
` : ''}
      return record
    }),

  // Update ${name}
  update: ${proc('update')}
    .input(z.object({
      id: z.string(),
      data: ${lowerName}UpdateSchema,
    }))
    .mutation(async ({ ctx, input }) => {${hooks.beforeUpdate ? `
      // Run beforeUpdate hook
      const hookCtx = buildHookContext(ctx)
      const processedData = ${lowerName}Hooks.beforeUpdate
        ? await ${lowerName}Hooks.beforeUpdate(input.id, input.data, hookCtx)
        : input.data
` : ''}
      const result = await db.update(${tableName})
        .set({
          ...${hooks.beforeUpdate ? 'processedData' : 'input.data'},
          updatedAt: new Date().toISOString(),
        })
        .where(${getWhereClause})
        .returning()
      const record = ${useComputed ? 'result[0] ? withComputedFields(result[0]) : result[0]' : 'result[0]'}${hooks.afterUpdate ? `

      // Run afterUpdate hook
      if (record && ${lowerName}Hooks.afterUpdate) {
        await ${lowerName}Hooks.afterUpdate(record, ${hooks.beforeUpdate ? 'hookCtx' : 'buildHookContext(ctx)'})
      }
` : ''}
      return record
    }),

  // Remove ${name}
  remove: ${proc('remove')}
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {${hooks.beforeRemove ? `
      // Run beforeRemove hook
      const hookCtx = buildHookContext(ctx)
      if (${lowerName}Hooks.beforeRemove) {
        await ${lowerName}Hooks.beforeRemove(input.id, hookCtx)
      }
` : ''}${useSoftDelete ? `
      // Soft delete
      const result = await db.update(${tableName})
        .set({ deletedAt: new Date().toISOString() })
        .where(${getWhereClause})
        .returning()
      const record = ${useComputed ? 'result[0] ? withComputedFields(result[0]) : result[0]' : 'result[0]'}` : `
      const result = await db.delete(${tableName})
        .where(${getWhereClause})
        .returning()
      const record = ${useComputed ? 'result[0] ? withComputedFields(result[0]) : result[0]' : 'result[0]'}`}${hooks.afterRemove ? `

      // Run afterRemove hook
      if (record && ${lowerName}Hooks.afterRemove) {
        await ${lowerName}Hooks.afterRemove(record, ${hooks.beforeRemove ? 'hookCtx' : 'buildHookContext(ctx)'})
      }
` : ''}
      return record
    }),

  // ============ BATCH OPERATIONS ============

  // Create multiple ${name}s
  createMany: ${proc('create')}
    .input(z.object({
      items: z.array(${lowerName}CreateSchema).min(1).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString()
      const values = input.items.map(item => ({
        id: crypto.randomUUID(),
        ...item,${useTenancy ? `\n        ${manifest.tenancy.field}: ctx.${manifest.tenancy.field},` : ''}
        createdAt: now,
        updatedAt: now,
      }))
      const result = await db.insert(${tableName}).values(values).returning()
      return { created: ${useComputed ? 'result.map(withComputedFields)' : 'result'}, count: result.length }
    }),

  // Update multiple ${name}s
  updateMany: ${proc('update')}
    .input(z.object({
      items: z.array(z.object({
        id: z.string(),
        data: ${lowerName}UpdateSchema,
      })).min(1).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString()
      const results: typeof ${tableName}.$inferSelect[] = []

      // Update each item (Drizzle doesn't support bulk update with different values)
      for (const item of input.items) {
        const result = await db.update(${tableName})
          .set({
            ...item.data,
            updatedAt: now,
          })
          .where(${useTenancy || useSoftDelete ? `and(eq(${tableName}.id, item.id)${useTenancy ? `, eq(${tableName}.${manifest.tenancy.field}, ctx.${manifest.tenancy.field})` : ''}${useSoftDelete ? `, isNull(${tableName}.deletedAt)` : ''})` : `eq(${tableName}.id, item.id)`})
          .returning()
        if (result[0]) results.push(result[0])
      }

      return { updated: ${useComputed ? 'results.map(withComputedFields)' : 'results'}, count: results.length }
    }),

  // Remove multiple ${name}s
  removeMany: ${proc('remove')}
    .input(z.object({
      ids: z.array(z.string()).min(1).max(100),
    }))
    .mutation(async ({ ctx, input }) => {${useSoftDelete ? `
      // Soft delete
      const result = await db.update(${tableName})
        .set({ deletedAt: new Date().toISOString() })
        .where(${useTenancy ? `and(inArray(${tableName}.id, input.ids), eq(${tableName}.${manifest.tenancy.field}, ctx.${manifest.tenancy.field}), isNull(${tableName}.deletedAt))` : `and(inArray(${tableName}.id, input.ids), isNull(${tableName}.deletedAt))`})
        .returning()
      return { removed: ${useComputed ? 'result.map(withComputedFields)' : 'result'}, count: result.length }` : `
      const result = await db.delete(${tableName})
        .where(${useTenancy ? `and(inArray(${tableName}.id, input.ids), eq(${tableName}.${manifest.tenancy.field}, ctx.${manifest.tenancy.field}))` : `inArray(${tableName}.id, input.ids)`})
        .returning()
      return { removed: ${useComputed ? 'result.map(withComputedFields)' : 'result'}, count: result.length }`}
    }),
})
`
}

/**
 * Generate router for entity, selecting source type automatically
 *
 * @param entity - Entity IR
 * @param manifest - Manifest IR
 * @returns Router code for either external API or database source
 */
function generateEntityRouter(entity: EntityIR, manifest: ManifestIR): string {
  if (hasExternalSource(entity, manifest)) {
    return generateExternalEntityRouter(entity, manifest)
  }
  return generateDatabaseEntityRouter(entity, manifest)
}

function generateAppRouter(entities: EntityIR[]): string {
  const imports = entities
    .map(e => `import { ${e.name.toLowerCase()}Router } from './${e.name.toLowerCase()}'`)
    .join('\n')

  const routers = entities
    .map(e => `  ${e.name.toLowerCase()}: ${e.name.toLowerCase()}Router,`)
    .join('\n')

  return `// Auto-generated app router
// Do not edit manually - regenerate with: npx archetype generate

import { router } from '@/server/trpc'
${imports}

export const appRouter = router({
${routers}
})

export type AppRouter = typeof appRouter
`
}

export const apiGenerator: Generator = {
  name: 'trpc-routers',
  description: 'Generate tRPC routers with CRUD operations',

  generate(manifest: ManifestIR, ctx: GeneratorContext): GeneratedFile[] {
    const files: GeneratedFile[] = []

    // Generate router for each entity
    for (const entity of manifest.entities) {
      files.push({
        path: `trpc/routers/${entity.name.toLowerCase()}.ts`,
        content: generateEntityRouter(entity, manifest),
      })
    }

    // Generate app router that combines all entity routers
    files.push({
      path: 'trpc/routers/index.ts',
      content: generateAppRouter(manifest.entities),
    })

    return files
  },
}
