---
sidebar_position: 15
---

# Generated Code

Understanding what Archetype generates and how to use it.

## Output Structure

After running `npx archetype generate`:

```
generated/
├── db/
│   ├── schema.ts          # Drizzle ORM schema
│   └── auth-schema.ts     # Auth tables (if auth enabled)
├── schemas/
│   └── {entity}.ts        # Zod validation schemas
├── trpc/
│   └── routers/
│       ├── {entity}.ts    # Entity CRUD router
│       └── index.ts       # Combined app router
├── hooks/
│   └── use{Entity}.ts     # React Query hooks
└── erd.md                 # Mermaid ERD diagram
```

## Database Schema

Drizzle ORM table definitions:

```typescript
// generated/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  content: text('content'),
  authorId: text('author_id').references(() => users.id),
  // ...
})
```

### Using the Schema

```typescript
import { db } from '@/server/db'
import { users, posts } from '@/generated/db/schema'
import { eq } from 'drizzle-orm'

// Query directly when needed
const user = await db.select().from(users).where(eq(users.id, userId))
```

## Validation Schemas

Zod schemas for each entity:

```typescript
// generated/schemas/user.ts
import { z } from 'zod'

export const userCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
})

export const userUpdateSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
})

export type UserCreateInput = z.infer<typeof userCreateSchema>
export type UserUpdateInput = z.infer<typeof userUpdateSchema>
```

### Using Validation

```typescript
import { userCreateSchema } from '@/generated/schemas/user'

// Validate form data
const result = userCreateSchema.safeParse(formData)
if (!result.success) {
  return { errors: result.error.flatten() }
}
```

## tRPC Routers

CRUD endpoints for each entity:

```typescript
// generated/trpc/routers/user.ts
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { userCreateSchema, userUpdateSchema } from '../../schemas/user'

export const userRouter = router({
  // List with pagination, filtering, search
  list: publicProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      where: z.object({ ... }).optional(),
      orderBy: z.object({ ... }).optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => { ... }),

  // Get single record
  get: publicProcedure
    .input(z.string())
    .query(async ({ input }) => { ... }),

  // Create record
  create: protectedProcedure
    .input(userCreateSchema)
    .mutation(async ({ input }) => { ... }),

  // Update record
  update: protectedProcedure
    .input(z.object({ id: z.string(), data: userUpdateSchema }))
    .mutation(async ({ input }) => { ... }),

  // Delete record
  remove: protectedProcedure
    .input(z.string())
    .mutation(async ({ input }) => { ... }),

  // Batch operations
  createMany: protectedProcedure.input(...).mutation(...),
  updateMany: protectedProcedure.input(...).mutation(...),
  removeMany: protectedProcedure.input(...).mutation(...),
})
```

### Combined Router

```typescript
// generated/trpc/routers/index.ts
import { router } from '../trpc'
import { userRouter } from './user'
import { postRouter } from './post'

export const appRouter = router({
  user: userRouter,
  post: postRouter,
})

export type AppRouter = typeof appRouter
```

## React Hooks

TanStack Query hooks for data fetching:

```typescript
// generated/hooks/useUser.ts
import { trpc } from '@/lib/trpc'

// List hook with filters
export function useUsers(options?: {
  page?: number
  limit?: number
  where?: { ... }
  orderBy?: { ... }
  search?: string
}) {
  return trpc.user.list.useQuery(options)
}

// Single record hook
export function useUser(id: string) {
  return trpc.user.get.useQuery(id, { enabled: !!id })
}

// Mutation hooks
export function useCreateUser() {
  const utils = trpc.useUtils()
  return trpc.user.create.useMutation({
    onSuccess: () => utils.user.list.invalidate(),
  })
}

export function useUpdateUser() {
  const utils = trpc.useUtils()
  return trpc.user.update.useMutation({
    onSuccess: () => utils.user.list.invalidate(),
  })
}

export function useRemoveUser() {
  const utils = trpc.useUtils()
  return trpc.user.remove.useMutation({
    onSuccess: () => utils.user.list.invalidate(),
  })
}

// Batch hooks
export function useCreateManyUsers() { ... }
export function useUpdateManyUsers() { ... }
export function useRemoveManyUsers() { ... }
```

### Using Hooks

```typescript
import { useUsers, useCreateUser, useUpdateUser, useRemoveUser } from '@/generated/hooks/useUser'

function UserList() {
  const { data, isLoading } = useUsers({ page: 1, limit: 20 })
  const { mutate: createUser } = useCreateUser()
  const { mutate: updateUser } = useUpdateUser()
  const { mutate: removeUser } = useRemoveUser()

  if (isLoading) return <Spinner />

  return (
    <ul>
      {data.items.map(user => (
        <li key={user.id}>
          {user.name}
          <button onClick={() => removeUser(user.id)}>Delete</button>
        </li>
      ))}
    </ul>
  )
}
```

## ERD Diagram

Mermaid diagram of your schema:

```markdown
<!-- generated/erd.md -->
erDiagram
    users {
        text id PK
        text email UK
        text name
        integer created_at
        integer updated_at
    }
    posts {
        text id PK
        text title
        text content
        text author_id FK
    }
    users ||--o{ posts : "has many"
```

View with `npx archetype view` or paste into any Mermaid renderer.

## Don't Edit Generated Files

Generated code is overwritten on each `npx archetype generate`.

For customization:
- Use [hooks](/docs/hooks) for business logic
- Extend routers in your own files
- Create wrapper components around generated hooks
