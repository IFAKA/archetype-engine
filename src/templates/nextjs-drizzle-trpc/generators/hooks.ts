/**
 * React Hooks Generator
 *
 * Generates React hooks for data fetching and form handling using tRPC and React Hook Form.
 * Provides a complete set of hooks for each entity's CRUD operations.
 *
 * Generated files:
 * - hooks/use{Entity}.ts - Hooks for list, get, create, edit, and remove operations
 *
 * Generated hooks per entity:
 * - use{Entity}s() - List all entities (useQuery)
 * - use{Entity}(id) - Get single entity by ID (useQuery)
 * - use{Entity}Form() - Create form with validation and mutation
 * - use{Entity}EditForm(id) - Edit form with data loading and mutation
 * - use{Entity}Remove() - Delete mutation with cache invalidation
 * - useCreate{Entity}() - Create mutation without form
 * - useUpdate{Entity}() - Update mutation without form
 *
 * Features:
 * - Zod validation integration via zodResolver
 * - Automatic tRPC cache invalidation on mutations
 * - i18n support for validation messages when multiple languages configured
 * - Form reset on successful create
 * - Null-to-undefined conversion for form compatibility
 *
 * @module generators/hooks
 */

import type { Generator, GeneratedFile } from '../../../template/types'
import type { GeneratorContext } from '../../../template/context'
import type { ManifestIR } from '../../../manifest'
import type { EntityIR } from '../../../entity'

/**
 * Generate filter type definitions for an entity
 */
function generateFilterTypes(entity: EntityIR): string {
  const filterFields = Object.entries(entity.fields).map(([fieldName, field]) => {
    switch (field.type) {
      case 'text':
        return `  ${fieldName}?: string | {
    eq?: string
    ne?: string
    contains?: string
    startsWith?: string
    endsWith?: string
  }`
      case 'number':
        return `  ${fieldName}?: number | {
    eq?: number
    ne?: number
    gt?: number
    gte?: number
    lt?: number
    lte?: number
  }`
      case 'boolean':
        return `  ${fieldName}?: boolean`
      case 'date':
        return `  ${fieldName}?: string | {
    eq?: string
    ne?: string
    gt?: string
    gte?: string
    lt?: string
    lte?: string
  }`
      default:
        return `  ${fieldName}?: string`
    }
  }).join('\n')

  // Get field names for orderBy
  const fieldNames = Object.keys(entity.fields)
  const orderByFields = [...fieldNames, 'createdAt', 'updatedAt']

  return `// Filter operators for ${entity.name}
export interface ${entity.name}Filter {
${filterFields}
}

// OrderBy options for ${entity.name}
export interface ${entity.name}OrderBy {
  field: ${orderByFields.map(f => `'${f}'`).join(' | ')}
  direction?: 'asc' | 'desc'
}`
}

/**
 * Generate complete hooks file for an entity
 *
 * @param entity - Entity IR with name and field definitions
 * @param manifest - Manifest IR with i18n configuration
 * @returns Complete hooks file content as string
 */
function generateEntityHooks(entity: EntityIR, manifest: ManifestIR): string {
  const name = entity.name
  const lowerName = name.toLowerCase()
  const useI18n = manifest.i18n.languages.length > 1

  // Schema imports
  const schemaImport = useI18n
    ? `import { ${lowerName}CreateSchemaI18n, ${lowerName}UpdateSchemaI18n, ${name}Create, ${name}Update } from '@/generated/schemas/${lowerName}'`
    : `import { ${lowerName}CreateSchema, ${lowerName}UpdateSchema, ${name}Create, ${name}Update } from '@/generated/schemas/${lowerName}'`

  const i18nImport = useI18n
    ? `import { useTranslations } from 'next-intl'`
    : ''

  const tDeclaration = useI18n
    ? `  const t = useTranslations('validation')`
    : ''

  const resolverSchema = useI18n
    ? `${lowerName}CreateSchemaI18n(t)`
    : `${lowerName}CreateSchema`

  const updateResolverSchema = useI18n
    ? `${lowerName}UpdateSchemaI18n(t)`
    : `${lowerName}UpdateSchema`

  // Generate filter types
  const filterTypes = generateFilterTypes(entity)

  return `// Auto-generated hooks for ${name}
// Do not edit manually - regenerate with: npx archetype generate

'use client'

import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { trpc } from '@/lib/trpc'
${i18nImport}
${schemaImport}

// Convert null values to undefined for form compatibility
type NullToUndefined<T> = {
  [K in keyof T]: T[K] extends null ? undefined : Exclude<T[K], null>
}

function nullToUndefined<T extends Record<string, unknown>>(
  obj: T | null | undefined
): NullToUndefined<T> | undefined {
  if (!obj) return undefined
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === null ? undefined : v])
  ) as NullToUndefined<T>
}

${filterTypes}

// ============ LIST WITH PAGINATION, FILTERING, SORTING, AND SEARCH ============
export interface Use${name}sOptions {
  // Pagination
  page?: number
  limit?: number
  // Filtering
  where?: ${name}Filter
  // Sorting
  orderBy?: ${name}OrderBy
  // Search across text fields
  search?: string
}

export function use${name}s(options?: Use${name}sOptions) {
  return trpc.${lowerName}.list.useQuery({
    page: options?.page ?? 1,
    limit: options?.limit ?? 20,
    where: options?.where,
    orderBy: options?.orderBy,
    search: options?.search,
  })
}

// ============ GET ============
export function use${name}(id: string) {
  return trpc.${lowerName}.get.useQuery({ id }, {
    enabled: !!id,
  })
}

// ============ CREATE FORM ============
export function use${name}Form() {
${tDeclaration}
  const utils = trpc.useUtils()

  const form = useForm<${name}Create>({
    resolver: zodResolver(${resolverSchema}),
  })

  const mutation = trpc.${lowerName}.create.useMutation({
    onSuccess: () => {
      utils.${lowerName}.list.invalidate()
      form.reset()
    },
  })

  return {
    ...form,
    submit: form.handleSubmit((data) => mutation.mutate(data)),
    isPending: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    reset: () => {
      form.reset()
      mutation.reset()
    },
  }
}

// ============ EDIT FORM ============
export function use${name}EditForm(id: string) {
${tDeclaration}
  const utils = trpc.useUtils()
  const { data: ${lowerName}, isLoading } = trpc.${lowerName}.get.useQuery({ id })

  const mutation = trpc.${lowerName}.update.useMutation({
    onSuccess: () => {
      utils.${lowerName}.invalidate()
    },
  })

  const formValues = useMemo(() => nullToUndefined(${lowerName}), [${lowerName}])

  const form = useForm<${name}Update>({
    resolver: zodResolver(${updateResolverSchema}),
    values: formValues,
  })

  return {
    ...form,
    submit: form.handleSubmit((data) => mutation.mutate({ id, data })),
    isPending: mutation.isPending,
    isLoading,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  }
}

// ============ REMOVE ============
export function use${name}Remove() {
  const utils = trpc.useUtils()
  const mutation = trpc.${lowerName}.remove.useMutation({
    onSuccess: () => {
      utils.${lowerName}.list.invalidate()
    },
  })

  return {
    remove: (id: string) => mutation.mutate({ id }),
    isPending: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  }
}

// ============ CREATE MUTATION (without form) ============
export function useCreate${name}() {
  const utils = trpc.useUtils()
  return trpc.${lowerName}.create.useMutation({
    onSuccess: () => {
      utils.${lowerName}.list.invalidate()
    },
  })
}

// ============ UPDATE MUTATION (without form) ============
export function useUpdate${name}() {
  const utils = trpc.useUtils()
  return trpc.${lowerName}.update.useMutation({
    onSuccess: () => {
      utils.${lowerName}.invalidate()
    },
  })
}

// ============ BATCH OPERATIONS ============

// Create multiple ${name}s at once
export function useCreateMany${name}s() {
  const utils = trpc.useUtils()
  const mutation = trpc.${lowerName}.createMany.useMutation({
    onSuccess: () => {
      utils.${lowerName}.list.invalidate()
    },
  })

  return {
    createMany: (items: ${name}Create[]) => mutation.mutate({ items }),
    ...mutation,
  }
}

// Update multiple ${name}s at once
export function useUpdateMany${name}s() {
  const utils = trpc.useUtils()
  const mutation = trpc.${lowerName}.updateMany.useMutation({
    onSuccess: () => {
      utils.${lowerName}.invalidate()
    },
  })

  return {
    updateMany: (items: { id: string; data: ${name}Update }[]) => mutation.mutate({ items }),
    ...mutation,
  }
}

// Remove multiple ${name}s at once
export function useRemoveMany${name}s() {
  const utils = trpc.useUtils()
  const mutation = trpc.${lowerName}.removeMany.useMutation({
    onSuccess: () => {
      utils.${lowerName}.list.invalidate()
    },
  })

  return {
    removeMany: (ids: string[]) => mutation.mutate({ ids }),
    ...mutation,
  }
}
`
}

export const hooksGenerator: Generator = {
  name: 'react-hooks',
  description: 'Generate React hooks with React Hook Form integration',

  generate(manifest: ManifestIR, ctx: GeneratorContext): GeneratedFile[] {
    return manifest.entities.map(entity => ({
      path: `hooks/use${entity.name}.ts`,
      content: generateEntityHooks(entity, manifest),
    }))
  },
}
