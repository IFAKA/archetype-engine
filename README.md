<img width="1280" height="640" alt="image" src="https://github.com/user-attachments/assets/eb752f28-ae21-49e6-b0ff-8adc1f4c5cd5" />

# Archetype Engine

A declarative data engine with a fluent TypeScript API that generates type-safe CRUD infrastructure from entity definitions.

**Define your data model once, generate everything:**
- Drizzle ORM schemas
- Zod validation schemas
- tRPC routers with full CRUD
- React hooks for forms and data fetching
- ERD diagrams

## Quick Start

### Local Installation (Development)

```bash
# 1. Clone and build archetype-engine
git clone https://github.com/ifaka/archetype.git
cd archetype
npm install && npm run build
npm link

# 2. Create Next.js project
cd ..
npx create-next-app my-app && cd my-app

# 3. Link archetype-engine locally
npm link archetype-engine

# 4. Initialize (creates config + infrastructure + installs deps)
npx archetype init --yes

# 5. Generate code
npx archetype generate

# 6. Push DB schema + run
npx drizzle-kit push && npm run dev
```

That's it! You now have a working fullstack app with a Task entity.

## What `init` Creates

```
my-app/
├── archetype.config.ts           # Config file
├── archetype/entities/task.ts    # Example entity
├── drizzle.config.ts             # Drizzle config
└── src/
    ├── server/
    │   ├── db.ts                 # Database connection
    │   └── trpc.ts               # tRPC setup
    ├── lib/trpc.ts               # Client-side tRPC
    └── app/
        ├── providers.tsx         # React Query + tRPC providers
        └── api/trpc/[trpc]/route.ts  # API route
```

## What `generate` Creates

```
generated/
├── db/schema.ts              # Drizzle schema
├── schemas/task.ts           # Zod validation
├── trpc/routers/
│   ├── task.ts               # tRPC router with CRUD
│   └── index.ts              # Router index
├── hooks/useTask.ts          # React hooks
└── erd.md                    # Entity diagram
```

## Define Entities

```typescript
// archetype/entities/user.ts
import { defineEntity, text, number, boolean, date, hasMany } from 'archetype-engine'

export const User = defineEntity('User', {
  fields: {
    email: text().required().unique().email(),
    name: text().required().min(2).max(100),
    role: text().default('user').oneOf(['admin', 'user', 'guest']),
    age: number().optional().min(0).integer(),
    isActive: boolean().default(true),
  },
  relations: {
    posts: hasMany('Post'),
  },
  behaviors: {
    timestamps: true,
    softDelete: true,
  }
})
```

## Config File

```typescript
// archetype.config.ts
import { defineConfig } from 'archetype-engine'
import { User } from './archetype/entities/user'
import { Post } from './archetype/entities/post'

export default defineConfig({
  template: 'nextjs-drizzle-trpc',  // Template to use
  entities: [User, Post],
  database: { type: 'sqlite', file: './sqlite.db' },
})
```

## Templates

Templates define which stack to generate code for:

| Template | Stack |
|----------|-------|
| `nextjs-drizzle-trpc` | Next.js + Drizzle ORM + tRPC + React hooks |

More templates coming soon (SvelteKit, Remix, etc.)

## Field Types

### text()
```typescript
text()
  .required()           // Not null
  .optional()           // Nullable
  .unique()             // Unique constraint
  .default('value')     // Default value
  .min(5).max(255)      // Length constraints
  .email()              // Email format
  .url()                // URL format
  .regex(/pattern/)     // Custom pattern
  .oneOf(['a', 'b'])    // Enum values
  .trim()               // Trim whitespace
  .label('Display Name') // For error messages
```

### number()
```typescript
number()
  .required()
  .min(0).max(100)
  .integer()
  .positive()
```

### boolean()
```typescript
boolean().default(false)
```

### date()
```typescript
date().default('now')
```

## Relations

```typescript
import { hasOne, hasMany, belongsToMany } from 'archetype-engine'

relations: {
  author: hasOne('User'),           // FK: authorId
  comments: hasMany('Comment'),     // One-to-many
  tags: belongsToMany('Tag'),       // Many-to-many
}
```

## Using Generated Hooks

Replace `app/page.tsx` with this to see it in action:

```typescript
"use client";

import { useTasks, useTaskForm, useTaskRemove } from "@/generated/hooks/useTask";

export default function Home() {
  const { data, isPending } = useTasks();
  const { remove } = useTaskRemove();
  const { submit, register, formState } = useTaskForm();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <form onSubmit={submit} className="flex gap-2">
        <input {...register("title")} placeholder="New task..." className="border px-2 py-1" />
        <button className="bg-black px-3 py-1 text-white">Add</button>
      </form>
      {formState.errors.title && <p className="text-red-500">{formState.errors.title.message}</p>}
      <ul className="w-64">
        {isPending ? (
          <p>Loading...</p>
        ) : (
          data?.map((task) => (
            <li key={task.id} className="flex justify-between border-b py-1">
              <span>{task.title}</span>
              <button onClick={() => remove(task.id)} className="text-red-500">×</button>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
```

**What you get:**
- `useTasks()` — Fetches all tasks with React Query caching
- `useTaskForm()` — Form with Zod validation, auto-invalidates on success
- `useTaskRemove()` — Delete mutation with optimistic updates

## CLI Commands

```bash
npx archetype init           # Interactive setup
npx archetype init --yes     # Quick setup with defaults (SQLite)
npx archetype init --headless  # Quick setup for headless mode (no database)
npx archetype generate       # Generate code from entities
npx archetype view           # View ERD in browser
```

## Database Options

```typescript
// SQLite (default)
database: { type: 'sqlite', file: './sqlite.db' }

// PostgreSQL
database: { type: 'postgres', url: process.env.DATABASE_URL }

// MySQL
database: { type: 'mysql', url: process.env.DATABASE_URL }
```

## Headless Mode

For frontend-only projects that connect to external APIs instead of a local database:

```typescript
// archetype.config.ts
import { defineConfig, external } from 'archetype-engine'
import { Product } from './archetype/entities/product'

export default defineConfig({
  template: 'nextjs-drizzle-trpc',
  mode: 'headless',
  source: external('env:API_URL'),  // Global API source
  entities: [Product],
})
```

Entities inherit the global source, or can override it:

```typescript
// archetype/entities/product.ts
import { defineEntity, text, number, external } from 'archetype-engine'

export const Product = defineEntity('Product', {
  fields: {
    sku: text().required(),
    name: text().required(),
    price: number().required().positive(),
  },
  // Optional: override global source
  source: external('env:PRODUCTS_API', { pathPrefix: '/v1' }),
})
```

**What headless mode generates:**
- Zod validation schemas
- Service layer (API client wrappers)
- tRPC routers (using services instead of database)
- React hooks

**What it skips:**
- Drizzle schema (no database)
- drizzle.config.ts

### External Source Options

```typescript
// Simple - uses entity name for endpoints
external('env:API_URL')
// → GET/POST /products, GET/PUT/DELETE /products/:id

// With path prefix
external('env:API_URL', { pathPrefix: '/v1' })
// → /v1/products

// Custom resource name
external('env:API_URL', { resourceName: 'item' })
// → /items instead of /products

// Override specific endpoints
external('env:LEGACY_API', {
  override: {
    list: 'GET /catalog/search',
    get: 'GET /catalog/item/:sku',
  }
})

// With authentication
external('env:API_URL', {
  auth: { type: 'bearer' }  // or 'api-key'
})
```

## Development

```bash
npm install
npm run build
npm run test:run
```

## License

MIT
