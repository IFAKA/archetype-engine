// File templates for archetype init

import type { InitConfig, DatabaseType } from './dependencies'
import { getEntityTemplate } from './entity-templates'

// archetype.config.ts
export function getConfigTemplate(config: InitConfig): string {
  // Headless mode config
  if (config.mode === 'headless') {
    const authConfig = config.auth && config.authProviders
      ? `
  auth: {
    enabled: true,
    providers: ${JSON.stringify(config.authProviders)},
  },`
      : ''

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
  entities: ${entities},${authConfig}${i18nConfig}
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

  const authConfig = config.auth && config.authProviders
    ? `
  auth: {
    enabled: true,
    providers: ${JSON.stringify(config.authProviders)},
  },`
    : ''

  const i18nConfig = config.i18n
    ? `
  i18n: {
    languages: ${JSON.stringify(config.i18n)},
    defaultLanguage: '${config.i18n[0]}',
  },`
    : ''

  let entityImport = ''
  let entities = '[]'
  
  if (config.includeExamples) {
    if (config.entityTemplate && config.entityTemplate !== 'simple') {
      const template = getEntityTemplate(config.entityTemplate)
      if (template) {
        // Import all entities from the template
        const imports = template.entities.map(e => {
          const entityName = e.filename.replace('.ts', '').split('-').map(w => 
            w.charAt(0).toUpperCase() + w.slice(1)
          ).join('')
          return `import { ${entityName} } from './archetype/entities/${e.filename.replace('.ts', '')}'`
        })
        entityImport = imports.join('\n')
        
        const entityNames = template.entities.map(e => {
          return e.filename.replace('.ts', '').split('-').map(w => 
            w.charAt(0).toUpperCase() + w.slice(1)
          ).join('')
        })
        entities = `[${entityNames.join(', ')}]`
      }
    } else {
      entityImport = `import { Task } from './archetype/entities/task'`
      entities = '[Task]'
    }
  }

  return `import { defineConfig } from 'archetype-engine'
${entityImport}

export default defineConfig({
  template: '${config.template}',
  entities: ${entities},
  database: ${dbConfig},${authConfig}${i18nConfig}
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
export function getTrpcServerTemplate(config: InitConfig): string {
  // Headless mode (no database)
  if (config.mode === 'headless') {
    if (config.auth) {
      return `import { initTRPC, TRPCError } from '@trpc/server'
import { auth } from './auth'

interface Context {
  session: Awaited<ReturnType<typeof auth>> | null
}

export async function createContext(): Promise<Context> {
  const session = await auth()
  return { session }
}

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure

/**
 * Protected procedure - requires authentication
 * Use for entity operations that need auth
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You must be logged in' })
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.session.user,
    },
  })
})
`
    }

    return `import { initTRPC } from '@trpc/server'

const t = initTRPC.create()

export const router = t.router
export const publicProcedure = t.procedure
`
  }

  // Full mode (with database)
  if (config.auth) {
    return `import { initTRPC, TRPCError } from '@trpc/server'
import { auth } from './auth'
import { db } from './db'

interface Context {
  session: Awaited<ReturnType<typeof auth>> | null
  db: typeof db
}

export async function createContext(): Promise<Context> {
  const session = await auth()
  return { session, db }
}

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure

/**
 * Protected procedure - requires authentication
 * Use for entity operations that need auth
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You must be logged in' })
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.session.user,
    },
  })
})
`
  }

  return `import { initTRPC } from '@trpc/server'
import { db } from './db'

interface Context {
  db: typeof db
}

export function createContext(): Context {
  return { db }
}

const t = initTRPC.context<Context>().create()

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
export function getApiRouteTemplate(config: InitConfig): string {
  if (config.auth) {
    return `import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@/generated/trpc/routers'
import { createContext } from '@/server/trpc'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
  })

export { handler as GET, handler as POST }
`
  }

  return `import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@/generated/trpc/routers'
import { createContext } from '@/server/trpc'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
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
  schema: ['./generated/db/schema.ts', './generated/db/auth-schema.ts'],
  out: './drizzle',
  dialect: '${dialectMap[database]}',
  dbCredentials: { ${credentialsMap[database]} },
})
`
}

// src/server/auth.ts - NextAuth configuration
export function getAuthTemplate(config: InitConfig): string {
  const providers = config.authProviders || ['credentials']
  const imports: string[] = ['import NextAuth from "next-auth"']
  const providerSetups: string[] = []

  if (providers.includes('credentials')) {
    imports.push('import Credentials from "next-auth/providers/credentials"')
    providerSetups.push(`    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // SCAFFOLD: Replace this placeholder with your authentication logic
        // Example implementation:
        //   1. Validate credentials exist
        //   2. Look up user in database by email
        //   3. Verify password with bcrypt
        //   4. Return user object or null
        if (!credentials?.email || !credentials?.password) return null

        // Example: look up user in database
        // const user = await db.query.users.findFirst({
        //   where: eq(users.email, credentials.email)
        // })
        // if (!user || !await bcrypt.compare(credentials.password, user.password)) {
        //   return null
        // }
        // return { id: user.id, email: user.email, name: user.name }

        return null
      },
    })`)
  }

  if (providers.includes('google')) {
    imports.push('import Google from "next-auth/providers/google"')
    providerSetups.push('    Google')
  }

  if (providers.includes('github')) {
    imports.push('import GitHub from "next-auth/providers/github"')
    providerSetups.push('    GitHub')
  }

  if (providers.includes('discord')) {
    imports.push('import Discord from "next-auth/providers/discord"')
    providerSetups.push('    Discord')
  }

  return `${imports.join('\n')}
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "./db"
import * as authSchema from "@/generated/db/auth-schema"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: authSchema.users,
    accountsTable: authSchema.accounts,
    sessionsTable: authSchema.sessions,
    verificationTokensTable: authSchema.verificationTokens,
  }),
  session: { strategy: "jwt" },
  providers: [
${providerSetups.join(',\n')},
  ],
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
      },
    }),
  },
})
`
}

// src/app/api/auth/[...nextauth]/route.ts
export function getAuthRouteTemplate(): string {
  return `import { handlers } from "@/server/auth"

export const { GET, POST } = handlers
`
}

// .env.example
export function getEnvExampleTemplate(config: InitConfig): string {
  const lines: string[] = ['# Authentication']
  lines.push('AUTH_SECRET=your-auth-secret-here  # Generate with: npx auth secret')

  const providers = config.authProviders || []

  if (providers.includes('google')) {
    lines.push('')
    lines.push('# Google OAuth')
    lines.push('AUTH_GOOGLE_ID=your-google-client-id')
    lines.push('AUTH_GOOGLE_SECRET=your-google-client-secret')
  }

  if (providers.includes('github')) {
    lines.push('')
    lines.push('# GitHub OAuth')
    lines.push('AUTH_GITHUB_ID=your-github-client-id')
    lines.push('AUTH_GITHUB_SECRET=your-github-client-secret')
  }

  if (providers.includes('discord')) {
    lines.push('')
    lines.push('# Discord OAuth')
    lines.push('AUTH_DISCORD_ID=your-discord-client-id')
    lines.push('AUTH_DISCORD_SECRET=your-discord-client-secret')
  }

  if (config.database && config.database !== 'sqlite') {
    lines.push('')
    lines.push('# Database')
    lines.push('DATABASE_URL=your-database-url')
  }

  return lines.join('\n') + '\n'
}

// .gitignore for Archetype projects
export function getGitignoreTemplate(): string {
  return `# Generated by Archetype
generated/

# Dependencies
node_modules/

# Database
*.db
*.db-shm
*.db-wal
drizzle/

# Environment
.env
.env.local
.env*.local

# Next.js
.next/
out/
build/
dist/

# Misc
.DS_Store
*.log
.turbo
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
    // Gitignore - always needed
    { path: '.gitignore', content: getGitignoreTemplate() },
  ]

  if (config.mode === 'headless') {
    // Headless mode: tRPC but no database
    files.push(
      { path: `${prefix}server/trpc.ts`, content: getTrpcServerTemplate(config) },
      { path: `${prefix}lib/trpc.ts`, content: getTrpcClientTemplate() },
      { path: `${prefix}app/providers.tsx`, content: getProvidersTemplate() },
      { path: `${prefix}app/api/trpc/[trpc]/route.ts`, content: getApiRouteTemplate(config) },
    )

    // Example entity for headless mode
    if (config.includeExamples) {
      if (config.entityTemplate && config.entityTemplate !== 'simple') {
        // Use advanced template
        const template = getEntityTemplate(config.entityTemplate)
        if (template) {
          template.entities.forEach(entity => {
            files.push({ path: `archetype/entities/${entity.filename}`, content: entity.code })
          })
        }
      } else {
        // Use simple product example
        files.push({ path: 'archetype/entities/product.ts', content: getProductEntityTemplate() })
      }
    }

    // Auth files for headless mode (if auth enabled)
    if (config.auth) {
      files.push(
        { path: `${prefix}server/auth.ts`, content: getAuthTemplate(config) },
        { path: `${prefix}app/api/auth/[...nextauth]/route.ts`, content: getAuthRouteTemplate() },
        { path: '.env.example', content: getEnvExampleTemplate(config) },
      )
    }
  } else {
    // Full mode: database + tRPC
    // database is guaranteed to be defined in full mode
    const db = config.database!
    files.push(
      { path: 'drizzle.config.ts', content: getDrizzleConfigTemplate(db) },
      { path: `${prefix}server/db.ts`, content: getDbTemplate(db) },
      { path: `${prefix}server/trpc.ts`, content: getTrpcServerTemplate(config) },
      { path: `${prefix}lib/trpc.ts`, content: getTrpcClientTemplate() },
      { path: `${prefix}app/providers.tsx`, content: getProvidersTemplate() },
      { path: `${prefix}app/api/trpc/[trpc]/route.ts`, content: getApiRouteTemplate(config) },
    )

    // Example entities for full mode
    if (config.includeExamples) {
      if (config.entityTemplate && config.entityTemplate !== 'simple') {
        // Use advanced template
        const template = getEntityTemplate(config.entityTemplate)
        if (template) {
          template.entities.forEach(entity => {
            files.push({ path: `archetype/entities/${entity.filename}`, content: entity.code })
          })
        }
      } else {
        // Use simple task example
        files.push({ path: 'archetype/entities/task.ts', content: getTaskEntityTemplate() })
      }
    }

    // Auth files for full mode (if auth enabled)
    if (config.auth) {
      files.push(
        { path: `${prefix}server/auth.ts`, content: getAuthTemplate(config) },
        { path: `${prefix}app/api/auth/[...nextauth]/route.ts`, content: getAuthRouteTemplate() },
        { path: '.env.example', content: getEnvExampleTemplate(config) },
      )
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
