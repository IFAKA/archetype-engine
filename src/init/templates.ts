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

// vitest.config.ts
export function getVitestConfigTemplate(structure: ProjectStructure): string {
  const prefix = structure.useSrcDir ? './src/' : './'
  return `import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '${prefix}'),
    },
  },
})
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

// CLAUDE.md - Rules for Claude Code in user projects
export function getClaudeMdTemplate(): string {
  return `# Archetype Engine Project - Rules for Claude Code

## Overview
This is an **Archetype Engine** project. Archetype generates backend code (Drizzle schemas, tRPC routers, Zod validation, React hooks) from entity definitions.

**CRITICAL:** Code in \`generated/\` is auto-generated and **MUST NOT** be edited manually.

## 🚫 NEVER Edit These Directories

- \`generated/db/\` - Database schemas (regenerated on each \`archetype generate\`)
- \`generated/trpc/\` - tRPC routers (regenerated)
- \`generated/schemas/\` - Zod validation schemas (regenerated)
- \`generated/hooks/use*.ts\` - React hooks (regenerated)
- \`generated/erd.md\` - ERD diagram (regenerated)

**Why?** These files are overwritten every time \`npm run archetype:generate\` runs.

## ✅ ALWAYS Edit These Instead

- \`archetype/entities/\` - Entity definitions (source of truth)
- \`archetype.config.ts\` - Archetype configuration
- \`manifest.json\` - Alternative to entity files (JSON format)
- \`src/app/\`, \`src/components/\` - Next.js UI code
- \`generated/hooks/{entity}.ts\` - Hook implementations (if hooks enabled)

## Correct Workflow

### When User Asks to Add/Modify Entities

**Option 1: JSON Manifest (Recommended - Faster)**

\`\`\`bash
# 1. Create/update manifest.json
cat > manifest.json << 'EOF'
{
  "entities": [
    {
      "name": "Product",
      "fields": {
        "name": { "type": "text", "required": true, "min": 1, "max": 200 },
        "price": { "type": "number", "required": true, "min": 0 },
        "stock": { "type": "number", "required": true, "integer": true, "min": 0 }
      },
      "behaviors": {
        "timestamps": true
      }
    }
  ],
  "database": { "type": "sqlite", "file": "./app.db" }
}
EOF

# 2. Generate code
npx archetype generate manifest.json

# 3. Push to database
npx drizzle-kit push
\`\`\`

**Option 2: TypeScript Entity Files (For Incremental Changes)**

\`\`\`typescript
// Edit: archetype/entities/product.ts
import { defineEntity, text, number } from 'archetype-engine'

export const Product = defineEntity('Product', {
  fields: {
    name: text().required().min(1).max(200),
    price: number().required().positive(),
    stock: number().required().integer().min(0),
  },
  behaviors: {
    timestamps: true,
  },
})
\`\`\`

\`\`\`bash
# Generate code
npm run archetype:generate

# Push to database
npm run db:push
\`\`\`

### When to Use Each Method

| User Request | Use |
|-------------|-----|
| "Create a blog with users and posts" | JSON manifest |
| "Build an e-commerce app" | JSON manifest |
| "Add a comment entity" | JSON manifest or entity file |
| "Add a field to User" | Edit entity file |
| "Change email to unique" | Edit entity file |

## Available Commands

\`\`\`bash
# Archetype commands
npm run archetype:generate   # Generate code from entities
npm run archetype:view       # View ERD diagram in browser
npm run archetype:docs       # View API docs (Swagger UI)
npm run archetype:check      # Validate manifest without generating

# Database commands
npm run db:push              # Push schema to database
npm run db:studio            # Open Drizzle Studio (database GUI)
npm run db:seed              # Seed database with sample data
npm run db:seed:reset        # Reset database and seed

# Testing
npm run test:api             # Run generated API tests
\`\`\`

## Examples

### ❌ WRONG: Editing Generated Code

\`\`\`typescript
// File: generated/trpc/routers/product.ts
// DON'T DO THIS - will be overwritten!
export const productRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    // Adding custom logic here ❌
    const products = await ctx.db.query.products.findMany()
    return products.filter(p => p.stock > 0) // ❌ WRONG
  })
})
\`\`\`

### ✅ CORRECT: Using Hooks for Business Logic

If the entity has \`hooks: true\`, edit the hook implementation:

\`\`\`typescript
// File: generated/hooks/product.ts (editable!)
export const productHooks: ProductHooks = {
  async beforeCreate(input, ctx) {
    // Validate stock is positive
    if (input.stock < 0) {
      throw new Error('Stock cannot be negative')
    }
    return input
  },
  
  async afterCreate(record, ctx) {
    // Send notification
    await notifyLowStock(record)
  },
}
\`\`\`

### ✅ CORRECT: Modifying Entity Definition

\`\`\`typescript
// File: archetype/entities/product.ts
import { defineEntity, text, number, boolean } from 'archetype-engine'

export const Product = defineEntity('Product', {
  fields: {
    name: text().required().min(1).max(200),
    price: number().required().positive(),
    stock: number().required().integer().min(0),
    // Add new field ✅
    inStock: boolean().default(true),
  },
  behaviors: {
    timestamps: true,
  },
})
\`\`\`

Then run:
\`\`\`bash
npm run archetype:generate && npm run db:push
\`\`\`

## Field Types Reference

- \`text()\` - String with \`.email()\`, \`.url()\`, \`.regex()\`, \`.min()\`, \`.max()\`, \`.oneOf()\`
- \`number()\` - Numeric with \`.integer()\`, \`.positive()\`, \`.min()\`, \`.max()\`
- \`boolean()\` - Boolean with \`.default()\`
- \`date()\` - Date/timestamp with \`.default('now')\`

All fields: \`.required()\`, \`.optional()\`, \`.unique()\`, \`.default()\`, \`.label()\`

## Relations

- \`hasOne('Entity')\` - One-to-one
- \`hasMany('Entity')\` - One-to-many
- \`belongsToMany('Entity')\` - Many-to-many
- \`belongsToMany('Entity').through({ fields: {...} })\` - Many-to-many with pivot data

## Questions to Ask Before Making Changes

1. **Am I editing \`generated/\`?** → STOP. Edit entity definition instead.
2. **Am I adding business logic?** → Use hooks system, not generated routers.
3. **Am I creating a new entity?** → Use manifest.json or create entity file.
4. **Am I modifying UI?** → That's fine, UI code is not Archetype-managed.

## Technology Stack

- **ORM**: Drizzle (schemas in \`generated/db/\`)
- **API**: tRPC (routers in \`generated/trpc/\`)
- **Validation**: Zod (schemas in \`generated/schemas/\`)
- **Frontend**: React hooks (in \`generated/hooks/\`)
- **Auth**: NextAuth v5 (if enabled)

## Summary

1. **Source of truth**: Entity definitions in \`archetype/entities/\` or \`manifest.json\`
2. **Generated code**: Read-only, never edit directly
3. **Workflow**: Edit entities → Generate → Push to DB
4. **Business logic**: Use hooks, not router edits
5. **Prefer JSON manifests** for new entities (faster, simpler)
`
}

// .cursorrules - AI assistant rules for Archetype projects
export function getCursorRulesTemplate(): string {
  return `# Archetype Engine - AI Assistant Rules

## Overview
This project uses **Archetype Engine** to generate backend code from entity definitions.
You are working in a project that follows the Archetype workflow.

## Critical Rules

### 🚫 NEVER Edit Generated Code
- **NEVER** modify files in \`generated/\` directory
- **NEVER** edit \`generated/db/schema.ts\`, \`generated/trpc/routers/\`, or \`generated/hooks/\`
- Generated code is **read-only** - it gets overwritten on next generation

### ✅ Always Edit Source Files Instead
- To change database schema: Edit \`archetype/entities/*.ts\`
- To add/modify fields: Edit entity definitions
- To change relations: Edit entity relations
- To add validation: Edit field validators in entities

## Correct Workflow

### Adding/Modifying Entities

**Option 1: TypeScript Files (Incremental Changes)**
\`\`\`typescript
// Edit: archetype/entities/user.ts
import { defineEntity, text, number } from 'archetype-engine'

export const User = defineEntity('User', {
  fields: {
    email: text().required().unique().email(),
    name: text().required().min(2),
    age: number().optional().min(0),
  },
})
\`\`\`

**Option 2: JSON Manifest (Full App Setup)**
\`\`\`json
// Edit: manifest.json
{
  "entities": [
    {
      "name": "User",
      "fields": {
        "email": { "type": "text", "email": true, "required": true, "unique": true },
        "name": { "type": "text", "required": true, "min": 2 }
      }
    }
  ],
  "database": { "type": "sqlite", "file": "./app.db" }
}
\`\`\`

### After Editing Entities
1. Run: \`npm run archetype:generate\` (or \`npx archetype generate\`)
2. Review changes in \`generated/\`
3. Run: \`npm run db:push\` to update database schema

### User-Editable Directories
- \`archetype/entities/\` - Entity definitions ✅
- \`archetype.config.ts\` - Configuration ✅
- \`src/app/\` - Next.js pages and components ✅
- \`src/components/\` - React components ✅
- \`src/lib/\` - Utility functions ✅
- \`generated/hooks/{entity}.ts\` - Hook implementations (if hooks enabled) ✅
- \`drizzle.config.ts\` - Drizzle configuration ✅

### Read-Only Directories
- \`generated/db/\` - Generated database schemas ❌
- \`generated/trpc/\` - Generated tRPC routers ❌
- \`generated/schemas/\` - Generated Zod schemas ❌
- \`generated/hooks/use{Entity}.ts\` - Generated React hooks ❌
- \`generated/erd.md\` - Generated ERD diagram ❌

## Common Tasks

### Add a New Field
1. Edit the entity file in \`archetype/entities/{entity}.ts\`
2. Add the field using field builders: \`text()\`, \`number()\`, \`boolean()\`, \`date()\`
3. Run \`npm run archetype:generate\`
4. Run \`npm run db:push\`

### Add a Relation
1. Edit entity file: add to \`relations\` object
2. Use: \`hasOne('Entity')\`, \`hasMany('Entity')\`, or \`belongsToMany('Entity')\`
3. Run \`npm run archetype:generate\`
4. Run \`npm run db:push\`

### Enable Authentication
1. Edit \`archetype.config.ts\`:
   \`\`\`typescript
   auth: {
     enabled: true,
     providers: ['credentials', 'google'],
   }
   \`\`\`
2. Run \`npm run archetype:generate\`
3. Configure env vars in \`.env.local\`

### Add CRUD Hooks (Business Logic)
1. Edit entity: \`hooks: true\` or \`hooks: { beforeCreate: true, afterCreate: true }\`
2. Run \`npm run archetype:generate\`
3. Edit \`generated/hooks/{entity}.ts\` to implement logic

## Technology Stack
- **Database ORM**: Drizzle (generated schemas in \`generated/db/\`)
- **API Layer**: tRPC (generated routers in \`generated/trpc/\`)
- **Validation**: Zod (generated schemas in \`generated/schemas/\`)
- **React Hooks**: TanStack Query + tRPC hooks (generated in \`generated/hooks/\`)
- **Auth**: NextAuth v5 (if enabled)

## File References
When discussing code, use \`file:line\` format: \`archetype/entities/user.ts:12\`

## When User Asks to "Add Backend" or "Create API"
1. **Ask which approach they prefer**:
   - Quick setup: Create \`manifest.json\` + run \`npx archetype generate manifest.json\`
   - Incremental: Create/edit entity files in \`archetype/entities/\`

2. **For new projects**: Recommend \`manifest.json\` (faster, simpler)
3. **For existing projects**: Edit entity files directly

## Commands Reference
\`\`\`bash
# Archetype - Generate & View
npm run archetype:generate   # Generate code from entities
npm run archetype:view       # View ERD diagram in browser
npm run archetype:docs       # View API docs (Swagger UI)
npm run archetype:check      # Validate manifest without generating

# Database (full mode only)
npm run db:push              # Push schema to database
npm run db:studio            # Open Drizzle Studio (database GUI)
npm run db:seed              # Seed database with sample data
npm run db:seed:reset        # Reset database and seed

# Testing
npm run test:api             # Run generated API tests
\`\`\`

## Examples

### ❌ Wrong: Editing Generated Code
\`\`\`typescript
// DON'T DO THIS - will be overwritten
// File: generated/trpc/routers/user.ts
export const userRouter = router({
  list: publicProcedure.query(async () => {
    // Adding custom logic here - WRONG!
  })
})
\`\`\`

### ✅ Correct: Using Hooks for Business Logic
\`\`\`typescript
// DO THIS - edit hook implementation
// File: generated/hooks/user.ts
export const userHooks: UserHooks = {
  async beforeCreate(input, ctx) {
    // Custom validation
    if (input.email.includes('spam')) {
      throw new Error('Invalid email')
    }
    return input
  },
  async afterCreate(record, ctx) {
    // Send welcome email
    await sendWelcomeEmail(record.email)
  },
}
\`\`\`

### ✅ Correct: Modifying Entity Definition
\`\`\`typescript
// DO THIS - edit source entity
// File: archetype/entities/user.ts
import { defineEntity, text } from 'archetype-engine'

export const User = defineEntity('User', {
  fields: {
    email: text().required().unique().email(),
    // Add new field here
    phone: text().optional().regex(/^\\+?[1-9]\\d{1,14}$/),
  },
})
\`\`\`

## Questions to Ask Before Acting
1. Is this modifying generated code? → Edit entity definition instead
2. Is this business logic? → Use hooks system
3. Is this a new entity? → Create in \`archetype/entities/\` or update \`manifest.json\`
4. Is this UI/frontend? → Edit normally (not Archetype-managed)

## Summary
- **Source of truth**: Entity definitions in \`archetype/entities/\` or \`manifest.json\`
- **Generated code**: Read-only, regenerated on every \`archetype generate\`
- **Workflow**: Edit entities → Generate → Push to DB → Develop frontend
- **Business logic**: Use hooks system, not direct router edits
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
    // Vitest config for path aliases
    { path: 'vitest.config.ts', content: getVitestConfigTemplate(structure) },
    // Gitignore - always needed
    { path: '.gitignore', content: getGitignoreTemplate() },
    // AI assistant guidance files
    { path: 'CLAUDE.md', content: getClaudeMdTemplate() },        // For Claude Code
    { path: '.cursorrules', content: getCursorRulesTemplate() },  // For Cursor/Windsurf
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
    // Archetype - core commands
    'archetype:generate': 'archetype generate',
    'archetype:view': 'archetype view',
    'archetype:docs': 'archetype docs',
    'archetype:check': 'archetype validate',
  }

  // Only add database scripts for full mode
  if (config.mode === 'full') {
    scripts['db:push'] = 'drizzle-kit push'
    scripts['db:studio'] = 'drizzle-kit studio'
    scripts['db:seed'] = 'tsx generated/seeds/run.ts'
    scripts['db:seed:reset'] = 'tsx generated/seeds/run.ts --reset'
    scripts['test:api'] = 'vitest run generated/tests'
  }

  return scripts
}
