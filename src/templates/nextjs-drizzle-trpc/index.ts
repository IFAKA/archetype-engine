/**
 * Next.js + Drizzle + tRPC Template
 *
 * Full-stack template for Next.js applications with:
 * - Drizzle ORM for database access
 * - tRPC for type-safe API routes
 * - Zod for runtime validation
 * - React Hook Form integration for forms
 *
 * Supports both database-backed and external API-backed entities.
 * Can run in full mode (with database) or headless mode (API-only).
 *
 * @module templates/nextjs-drizzle-trpc
 */

import type { Template } from '../../template/types'
import { schemaGenerator } from './generators/schema'
import { authGenerator } from './generators/auth'
import { validationGenerator } from './generators/validation'
import { serviceGenerator } from './generators/service'
import { apiGenerator } from './generators/api'
import { hooksGenerator } from './generators/hooks'
import { crudHooksGenerator } from './generators/crud-hooks'
import { i18nGenerator } from './generators/i18n'
import { testGenerator } from './generators/test'
import { openapiGenerator } from './generators/openapi'
import { seedGenerator } from './generators/seed'

/**
 * Template definition for Next.js + Drizzle + tRPC stack
 *
 * Generators run in order, with some conditionally skipped:
 * 1. schemaGenerator - Drizzle tables (skipped in headless mode)
 * 2. authGenerator - Auth.js tables (only if auth.enabled)
 * 3. validationGenerator - Zod schemas (always runs)
 * 4. serviceGenerator - API client (only for external entities)
 * 5. apiGenerator - tRPC routers (adapts to source type)
 * 6. hooksGenerator - React hooks (always runs)
 * 7. crudHooksGenerator - Business logic hooks (only if hooks enabled)
 * 8. i18nGenerator - Translation files (only if i18n configured)
 * 9. testGenerator - Vitest test suites (always runs)
 * 10. openapiGenerator - OpenAPI spec and Swagger UI (always runs)
 * 11. seedGenerator - Seed data for development (always runs)
 */
export const template: Template = {
  meta: {
    id: 'nextjs-drizzle-trpc',
    name: 'Next.js + Drizzle + tRPC',
    description: 'Full-stack Next.js with Drizzle ORM, tRPC API, and React hooks. Supports headless mode with external APIs.',
    framework: 'nextjs',
    stack: {
      database: 'drizzle',
      validation: 'zod',
      api: 'trpc',
      ui: 'react',
    },
  },
  defaultConfig: {
    outputDir: 'generated',
    importAliases: {
      '@/': 'src/',
      '@/server': 'src/server',
      '@/lib': 'src/lib',
      '@/generated': 'generated',
    },
  },
  generators: [
    schemaGenerator,      // Skipped in headless mode
    authGenerator,        // Only if auth enabled
    validationGenerator,  // Always runs
    serviceGenerator,     // Only for external entities
    apiGenerator,         // Adapts to source type + auth
    hooksGenerator,       // Always runs
    crudHooksGenerator,   // Only if hooks enabled
    i18nGenerator,        // Only if i18n enabled
    testGenerator,        // Always runs - generates test suites
    openapiGenerator,     // Always runs - generates API docs
    seedGenerator,        // Always runs - generates seed data
  ],
}

export default template
