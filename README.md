<img width="1280" height="640" alt="image" src="https://github.com/user-attachments/assets/eb752f28-ae21-49e6-b0ff-8adc1f4c5cd5" />

# Archetype Engine

**Define your data model. Generate the boring parts.**

```typescript
export const Task = defineEntity('Task', {
  fields: {
    title: text().required().min(1).max(200),
    done: boolean().default(false),
  },
  behaviors: { timestamps: true }
})
```

Run `npx archetype generate` → get Drizzle schema, Zod validation, tRPC router, React hooks.

## Quick Start

```bash
npx create-next-app my-app && cd my-app
npm install archetype-engine
npx archetype init --yes
```

This creates:
```
archetype.config.ts          # Your config
archetype/entities/task.ts   # Example Task entity
lib/                         # Database + tRPC infrastructure
```

Now generate and run:
```bash
npx archetype generate
npx drizzle-kit push && npm run dev
```

## What Gets Generated

```
generated/
├── db/schema.ts              # Drizzle ORM schema
├── schemas/task.ts           # Zod validation
├── trpc/routers/task.ts      # tRPC CRUD router
├── hooks/useTask.ts          # React Query hooks
└── erd.md                    # Entity diagram
```

## Using the Hooks

```tsx
'use client'
import { useTasks, useTaskForm, useTaskRemove } from "@/generated/hooks/useTask"

export default function TaskList() {
  const { data: tasks } = useTasks()
  const { submit, register } = useTaskForm()
  const { remove } = useTaskRemove()

  return (
    <div>
      <form onSubmit={submit}>
        <input {...register('title')} placeholder="New task" />
        <button type="submit">Add</button>
      </form>
      <ul>
        {tasks?.map(task => (
          <li key={task.id}>
            {task.title}
            <button onClick={() => remove(task.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

**All generated hooks:**
| Hook | Purpose |
|------|---------|
| `useTasks()` | Fetch all with React Query caching |
| `useTask(id)` | Fetch single by ID |
| `useTaskForm()` | Create form with Zod validation |
| `useTaskEditForm(id)` | Edit form, pre-filled |
| `useTaskRemove()` | Delete mutation |
| `useCreateTask()` | Raw create mutation |
| `useUpdateTask()` | Raw update mutation |

## Defining Entities

```typescript
// archetype/entities/task.ts
import { defineEntity, text, boolean, date } from 'archetype-engine'

export const Task = defineEntity('Task', {
  fields: {
    title: text().required().min(1).max(200),
    description: text().optional(),
    done: boolean().default(false),
    dueDate: date().optional(),
  },
  behaviors: {
    timestamps: true,    // adds createdAt, updatedAt
    softDelete: true,    // adds deletedAt instead of hard delete
  },
  protected: 'write',    // list/get public, mutations require auth
})
```

Register entities in your config:

```typescript
// archetype.config.ts
import { defineConfig } from 'archetype-engine'
import { Task } from './archetype/entities/task'

export default defineConfig({
  entities: [Task],
  database: { type: 'sqlite', file: './sqlite.db' },
})
```

## Field Types

```typescript
// text
text().required().unique().default('value')
text().min(5).max(255).label('Title')
text().email()                    // email format
text().url()                      // URL format
text().regex(/pattern/)           // custom regex
text().oneOf(['draft', 'published']) // enum
text().trim().lowercase()         // transforms

// number
number().required().min(0).max(100)
number().integer().positive()

// boolean
boolean().default(false)

// date
date().optional()
date().default('now')             // current timestamp
```

## Relations

Relations go inside an entity definition. The relation key becomes the foreign key name.

```typescript
// archetype/entities/post.ts
export const Post = defineEntity('Post', {
  fields: {
    title: text().required(),
    body: text().required(),
  },
  relations: {
    // Creates authorId column pointing to User
    author: hasOne('User'),

    // Post has many Comments (Comment needs postId)
    comments: hasMany('Comment'),

    // Creates PostTag junction table
    tags: belongsToMany('Tag'),
  }
})
```

```typescript
import { hasOne, hasMany, belongsToMany } from 'archetype-engine'
```

## CLI

```bash
npx archetype init             # Interactive setup
npx archetype init --yes       # Defaults (SQLite)
npx archetype generate         # Generate from entities
npx archetype validate         # Validate without generating
npx archetype view             # View ERD in browser
```

## AI Integration

Archetype can be used by AI agents to generate apps from natural language. Instead of writing TypeScript, AI generates a simple JSON manifest.

```bash
# AI generates JSON
echo '{
  "entities": [
    { "name": "User", "fields": { "email": { "type": "text", "email": true } } },
    { "name": "Post", "fields": { "title": { "type": "text" } },
      "relations": { "author": { "type": "hasOne", "entity": "User" } } }
  ],
  "database": { "type": "sqlite", "file": "./app.db" }
}' > manifest.json

# Validate
npx archetype validate manifest.json --json
# → { "valid": true, "errors": [] }

# Generate
npx archetype generate manifest.json --json
# → { "success": true, "files": [...] }
```

**Flags for AI:**
- `--json` - Output as structured JSON
- `--stdin` - Read JSON from stdin (for piping)

See the full [AI Integration Guide](documentation/AI_INTEGRATION.md) for JSON schema reference, error codes, and example system prompts.

## Database Options

```typescript
database: { type: 'sqlite', file: './sqlite.db' }
database: { type: 'postgres', url: process.env.DATABASE_URL }
database: { type: 'mysql', url: process.env.DATABASE_URL }
```

## Authentication

Archetype generates next-auth v5 (Auth.js) configuration with Drizzle adapter.

### Setup

```bash
npx archetype init  # Select "Yes" for authentication, choose providers
```

Or configure manually:

```typescript
// archetype.config.ts
export default defineConfig({
  entities: [User, Post],
  database: { type: 'sqlite', file: './sqlite.db' },
  auth: {
    enabled: true,
    providers: ['credentials', 'google', 'github'],
  },
})
```

### Generated Files

```
src/server/auth.ts              # NextAuth config with providers
src/app/api/auth/[...nextauth]/ # Auth route handler
generated/db/auth-schema.ts     # Auth tables (users, accounts, sessions)
.env.example                    # Required secrets
```

### Providers

| Provider | Requires |
|----------|----------|
| `credentials` | None (email/password) |
| `google` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| `github` | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` |
| `discord` | `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` |

## Entity Protection

Control which CRUD operations require authentication per entity.

### Shorthand Options

```typescript
protected: 'write'   // list/get public, create/update/remove require auth (MOST COMMON)
protected: 'all'     // All operations require auth
protected: true      // Same as 'all'
protected: false     // All public (default)
```

### Granular Control

```typescript
protected: {
  list: false,     // Public
  get: false,      // Public
  create: true,    // Requires auth
  update: true,    // Requires auth
  remove: true,    // Requires auth
}
```

### Example

```typescript
// Public catalog, protected checkout
export const Product = defineEntity('Product', {
  fields: { name: text().required(), price: number().required() },
  protected: 'write',  // Anyone can browse, auth required to modify
})

// All operations require auth
export const Order = defineEntity('Order', {
  fields: { total: number().required() },
  protected: 'all',
})
```

Generated routers use the appropriate procedure:

```typescript
// generated/trpc/routers/product.ts
export const productRouter = router({
  list: publicProcedure.query(...),       // Public
  get: publicProcedure.input(...).query(...),
  create: protectedProcedure.input(...).mutation(...),  // Requires auth
  update: protectedProcedure.input(...).mutation(...),
  remove: protectedProcedure.input(...).mutation(...),
})
```

## Headless Mode

For frontends connecting to external APIs instead of a local database:

```bash
npx archetype init --headless
```

```typescript
import { defineConfig, external } from 'archetype-engine'

export default defineConfig({
  mode: 'headless',
  source: external('env:API_URL'),
  entities: [Task],
})
```

Generates validation, hooks, and services—skips database schema.

### Generation Modes

| Mode | Generates | Use case |
|------|-----------|----------|
| `full` | DB schema, API, validation, hooks | Full-stack with local DB (default) |
| `headless` | Validation, hooks, services | Frontend to external API |
| `api-only` | Validation, services | Backend services only |

### External Source Options

```typescript
// Simple - uses REST conventions
source: external('env:API_URL')
// → GET/POST /tasks, GET/PUT/DELETE /tasks/:id

// With path prefix
source: external('env:API_URL', { pathPrefix: '/v1' })
// → /v1/tasks, /v1/tasks/:id

// Override non-standard endpoints
source: external('env:LEGACY_API', {
  override: {
    list: 'GET /catalog/search',
    get: 'GET /catalog/item/:sku',
  }
})

// With authentication
source: external('env:API_URL', {
  auth: { type: 'bearer' }              // Authorization: Bearer <token>
})
source: external('env:API_URL', {
  auth: { type: 'api-key', header: 'X-API-Key' }
})
```

### Per-Entity Sources

Override the global source for specific entities:

```typescript
export const Product = defineEntity('Product', {
  fields: { name: text().required() },
  source: external('env:CATALOG_API', { pathPrefix: '/v2' })
})
```

## Contributing

```bash
git clone https://github.com/ifaka/archetype.git && cd archetype
npm install && npm run build
npm link

# In test project:
npm link archetype-engine
```

## License

MIT
