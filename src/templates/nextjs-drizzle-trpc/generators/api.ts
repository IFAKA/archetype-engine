// tRPC router generator

import type { Generator, GeneratedFile } from '../../../template/types'
import type { GeneratorContext } from '../../../template/context'
import type { ManifestIR } from '../../../manifest'
import type { EntityIR } from '../../../entity'
import { toSnakeCase, pluralize } from '../../../core/utils'

function getTableName(entityName: string): string {
  return toSnakeCase(pluralize(entityName))
}

function generateEntityRouter(entity: EntityIR, manifest: ManifestIR): string {
  const name = entity.name
  const lowerName = name.toLowerCase()
  const tableName = getTableName(name)

  const useI18n = manifest.i18n.languages.length > 1
  const useTenancy = manifest.tenancy.enabled
  const useSoftDelete = entity.behaviors.softDelete

  // Determine procedure type (use publicProcedure for simplicity)
  const procedureType = 'publicProcedure'

  // Schema import
  const schemaImport = `import { ${lowerName}CreateSchema, ${lowerName}UpdateSchema } from '@/generated/schemas/${lowerName}'`

  // Build where clauses
  const tenantWhere = useTenancy
    ? `eq(${tableName}.${manifest.tenancy.field}, ctx.${manifest.tenancy.field})`
    : ''
  const softDeleteWhere = useSoftDelete
    ? `isNull(${tableName}.deletedAt)`
    : ''

  const listWheres = [tenantWhere, softDeleteWhere].filter(Boolean)
  const listWhereClause = listWheres.length > 0
    ? `.where(and(${listWheres.join(', ')}))`
    : ''

  const getWhereClause = listWheres.length > 0
    ? `and(eq(${tableName}.id, input.id), ${listWheres.join(', ')})`
    : `eq(${tableName}.id, input.id)`

  // Imports
  const drizzleImports = useSoftDelete
    ? `import { eq, and, isNull } from 'drizzle-orm'`
    : useTenancy
      ? `import { eq, and } from 'drizzle-orm'`
      : `import { eq } from 'drizzle-orm'`

  return `// Auto-generated tRPC router for ${name}
// Do not edit manually - regenerate with: npx archetype generate

import { z } from 'zod'
import { router, publicProcedure } from '@/server/trpc'
import { db } from '@/server/db'
import { ${tableName} } from '@/generated/db/schema'
${schemaImport}
${drizzleImports}

export const ${lowerName}Router = router({
  // List all ${name}s
  list: ${procedureType}.query(async ({ ctx }) => {
    return db.select().from(${tableName})${listWhereClause}
  }),

  // Get single ${name} by ID
  get: ${procedureType}
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await db.select().from(${tableName})
        .where(${getWhereClause})
        .limit(1)
      return result[0] ?? null
    }),

  // Create new ${name}
  create: ${procedureType}
    .input(${lowerName}CreateSchema)
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString()
      const result = await db.insert(${tableName}).values({
        id: crypto.randomUUID(),
        ...input,${useTenancy ? `\n        ${manifest.tenancy.field}: ctx.${manifest.tenancy.field},` : ''}
        createdAt: now,
        updatedAt: now,
      }).returning()
      return result[0]
    }),

  // Update ${name}
  update: ${procedureType}
    .input(z.object({
      id: z.string(),
      data: ${lowerName}UpdateSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.update(${tableName})
        .set({
          ...input.data,
          updatedAt: new Date().toISOString(),
        })
        .where(${getWhereClause})
        .returning()
      return result[0]
    }),

  // Remove ${name}
  remove: ${procedureType}
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {${useSoftDelete ? `
      // Soft delete
      const result = await db.update(${tableName})
        .set({ deletedAt: new Date().toISOString() })
        .where(${getWhereClause})
        .returning()
      return result[0]` : `
      const result = await db.delete(${tableName})
        .where(${getWhereClause})
        .returning()
      return result[0]`}
    }),
})
`
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
