// Next.js + Drizzle + tRPC + Zod Template
// Generates: Drizzle schema, Zod schemas, tRPC routers, React hooks

import type { Template } from '../../template/types'
import { schemaGenerator } from './generators/schema'
import { validationGenerator } from './generators/validation'
import { apiGenerator } from './generators/api'
import { hooksGenerator } from './generators/hooks'
import { i18nGenerator } from './generators/i18n'

export const template: Template = {
  meta: {
    id: 'nextjs-drizzle-trpc',
    name: 'Next.js + Drizzle + tRPC',
    description: 'Full-stack Next.js with Drizzle ORM, tRPC API, and React hooks',
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
    schemaGenerator,
    validationGenerator,
    apiGenerator,
    hooksGenerator,
    i18nGenerator,
  ],
}

export default template
