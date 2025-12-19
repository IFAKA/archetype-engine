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

```typescript
'use client'
import { useTasks, useTaskForm, useTaskDelete } from '@/generated/hooks/useTask'

function TaskList() {
  const { data: tasks } = useTasks()
  const { delete: deleteTask } = useTaskDelete()

  return (
    <ul>
      {tasks?.map(task => (
        <li key={task.id}>
          {task.title}
          <button onClick={() => deleteTask(task.id)}>Delete</button>
        </li>
      ))}
    </ul>
  )
}

function CreateTaskForm() {
  const { register, submit, formState: { errors }, isPending } = useTaskForm()

  return (
    <form onSubmit={submit}>
      <input {...register('title')} />
      {errors.title && <span>{errors.title.message}</span>}
      <button disabled={isPending}>Create</button>
    </form>
  )
}
```

## CLI Commands

```bash
npx archetype init           # Interactive setup
npx archetype init --yes     # Quick setup with defaults (SQLite)
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

## Development

```bash
npm install
npm run build
npm run test:run
```

## License

MIT
