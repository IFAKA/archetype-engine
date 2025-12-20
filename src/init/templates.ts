// File templates for archetype init

import type { InitConfig, DatabaseType } from './dependencies'

// archetype.config.ts
export function getConfigTemplate(config: InitConfig): string {
  // Headless mode config
  if (config.mode === 'headless') {
    const i18nConfig = config.i18n
      ? `
  i18n: {
    languages: ${JSON.stringify(config.i18n)},
    defaultLanguage: '${config.i18n[0]}',
  },`
      : ''

    const entityImport = config.includeExamples
      ? `import { Product } from './archetype/entities/product'`
      : ''
    const entities = config.includeExamples ? '[Product]' : '[]'
    const sourceUrl = config.externalApiUrl || 'env:API_URL'

    return `import { defineConfig, external } from 'archetype-engine'
${entityImport}

export default defineConfig({
  template: '${config.template}',
  mode: 'headless',
  source: external('${sourceUrl}'),
  entities: ${entities},${i18nConfig}
})
`
  }

  // Full mode config (with database)
  const dbConfig = config.database === 'sqlite'
    ? `{
    type: 'sqlite',
    file: './sqlite.db',
  }`
    : config.database === 'postgres'
    ? `{
    type: 'postgres',
    url: process.env.DATABASE_URL!,
  }`
    : `{
    type: 'mysql',
    url: process.env.DATABASE_URL!,
  }`

  const i18nConfig = config.i18n
    ? `

  i18n: {
    languages: ${JSON.stringify(config.i18n)},
    defaultLanguage: '${config.i18n[0]}',
  },`
    : ''

  const entityImport = config.includeExamples
    ? `import { Task } from './archetype/entities/task'`
    : ''
  const entities = config.includeExamples ? '[Task]' : '[]'

  return `import { defineConfig } from 'archetype-engine'
${entityImport}

export default defineConfig({
  template: '${config.template}',
  entities: ${entities},
  database: ${dbConfig},${i18nConfig}
})
`
}

// archetype/entities/task.ts (example entity for full mode)
export function getTaskEntityTemplate(): string {
  return `import { defineEntity, text, boolean, date } from 'archetype-engine'

export const Task = defineEntity('Task', {
  fields: {
    title: text().required().min(1).max(200).label('Title'),
    description: text().optional().max(2000).label('Description'),
    completed: boolean().default(false).label('Completed'),
    dueDate: date().optional().label('Due Date'),
  },
  behaviors: {
    timestamps: true,
  },
})
`
}

// archetype/entities/product.ts (example entity for headless mode)
export function getProductEntityTemplate(): string {
  return `import { defineEntity, text, number } from 'archetype-engine'

// Example entity for headless mode - uses external API
// The source is inherited from the config's global source
export const Product = defineEntity('Product', {
  fields: {
    sku: text().required().label('SKU'),
    name: text().required().min(1).max(200).label('Name'),
    description: text().optional().max(2000).label('Description'),
    price: number().required().positive().label('Price'),
    stock: number().optional().integer().min(0).label('Stock'),
  },
})
`
}

// src/server/db.ts
export function getDbTemplate(database: DatabaseType): string {
  switch (database) {
    case 'sqlite':
      return `import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from '@/generated/db/schema'

const sqlite = new Database('sqlite.db')
export const db = drizzle(sqlite, { schema })
`
    case 'postgres':
      return `import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/generated/db/schema'

const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle(client, { schema })
`
    case 'mysql':
      return `import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from '@/generated/db/schema'

const connection = await mysql.createConnection(process.env.DATABASE_URL!)
export const db = drizzle(connection, { schema, mode: 'default' })
`
  }
}

// src/server/trpc.ts
export function getTrpcServerTemplate(): string {
  return `import { initTRPC } from '@trpc/server'

const t = initTRPC.create()

export const router = t.router
export const publicProcedure = t.procedure
`
}

// src/lib/trpc.ts
export function getTrpcClientTemplate(): string {
  return `import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@/generated/trpc/routers'

export const trpc = createTRPCReact<AppRouter>()
`
}

// src/app/providers.tsx
export function getProvidersTemplate(): string {
  return `'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { trpc } from '@/lib/trpc'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchLink({ url: '/api/trpc' })],
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  )
}
`
}

// src/app/api/trpc/[trpc]/route.ts
export function getApiRouteTemplate(): string {
  return `import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@/generated/trpc/routers'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ({}),
  })

export { handler as GET, handler as POST }
`
}

// drizzle.config.ts
export function getDrizzleConfigTemplate(database: DatabaseType): string {
  const dialectMap: Record<DatabaseType, string> = {
    sqlite: 'sqlite',
    postgres: 'postgresql',
    mysql: 'mysql',
  }

  const credentialsMap: Record<DatabaseType, string> = {
    sqlite: "url: 'sqlite.db'",
    postgres: 'url: process.env.DATABASE_URL!',
    mysql: 'url: process.env.DATABASE_URL!',
  }

  return `import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './generated/db/schema.ts',
  out: './drizzle',
  dialect: '${dialectMap[database]}',
  dbCredentials: { ${credentialsMap[database]} },
})
`
}

// All template files to create
export interface TemplateFile {
  path: string
  content: string
}

export interface ProjectStructure {
  useSrcDir: boolean // true if project uses src/ directory
}

export function getAllTemplateFiles(config: InitConfig, structure: ProjectStructure): TemplateFile[] {
  const prefix = structure.useSrcDir ? 'src/' : ''

  const files: TemplateFile[] = [
    // Config - always needed
    { path: 'archetype.config.ts', content: getConfigTemplate(config) },
  ]

  if (config.mode === 'headless') {
    // Headless mode: tRPC but no database
    files.push(
      { path: `${prefix}server/trpc.ts`, content: getTrpcServerTemplate() },
      { path: `${prefix}lib/trpc.ts`, content: getTrpcClientTemplate() },
      { path: `${prefix}app/providers.tsx`, content: getProvidersTemplate() },
      { path: `${prefix}app/api/trpc/[trpc]/route.ts`, content: getApiRouteTemplate() },
    )

    // Example entity for headless mode
    if (config.includeExamples) {
      files.push({ path: 'archetype/entities/product.ts', content: getProductEntityTemplate() })
    }
  } else {
    // Full mode: database + tRPC
    // database is guaranteed to be defined in full mode
    const db = config.database!
    files.push(
      { path: 'drizzle.config.ts', content: getDrizzleConfigTemplate(db) },
      { path: `${prefix}server/db.ts`, content: getDbTemplate(db) },
      { path: `${prefix}server/trpc.ts`, content: getTrpcServerTemplate() },
      { path: `${prefix}lib/trpc.ts`, content: getTrpcClientTemplate() },
      { path: `${prefix}app/providers.tsx`, content: getProvidersTemplate() },
      { path: `${prefix}app/api/trpc/[trpc]/route.ts`, content: getApiRouteTemplate() },
    )

    // Example entity for full mode
    if (config.includeExamples) {
      files.push({ path: 'archetype/entities/task.ts', content: getTaskEntityTemplate() })
    }
  }

  return files
}

// package.json scripts to add
export function getPackageJsonScripts(config: InitConfig): Record<string, string> {
  const scripts: Record<string, string> = {
    'archetype:generate': 'archetype generate',
    'archetype:view': 'archetype view',
  }

  // Only add database scripts for full mode
  if (config.mode === 'full') {
    scripts['db:push'] = 'drizzle-kit push'
    scripts['db:studio'] = 'drizzle-kit studio'
  }

  return scripts
}
