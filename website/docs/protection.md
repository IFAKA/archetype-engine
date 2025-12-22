---
sidebar_position: 8
---

# Protection

Control which CRUD operations require authentication per entity.

## Quick Options

The `protected` option accepts shortcuts for common patterns:

```typescript
export const Post = defineEntity('Post', {
  fields: { ... },
  protected: 'write',  // Most common: reads public, writes protected
})
```

| Value | list | get | create | update | remove |
|-------|------|-----|--------|--------|--------|
| `false` (default) | public | public | public | public | public |
| `'write'` | public | public | protected | protected | protected |
| `'all'` or `true` | protected | protected | protected | protected | protected |

## Granular Control

For fine-grained control, pass an object:

```typescript
export const Comment = defineEntity('Comment', {
  fields: {
    content: text().required(),
  },
  protected: {
    list: false,      // Anyone can list comments
    get: false,       // Anyone can view a comment
    create: true,     // Must be logged in to create
    update: true,     // Must be logged in to update
    remove: true,     // Must be logged in to remove
  },
})
```

## Generated Router

The protection settings translate to procedure types in tRPC:

```typescript
// generated/trpc/routers/comment.ts
import { publicProcedure, protectedProcedure } from '../trpc'

export const commentRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    // No auth check
    return db.select().from(comments)
  }),

  get: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      // No auth check
      return db.select().from(comments).where(eq(comments.id, input))
    }),

  create: protectedProcedure
    .input(commentCreateSchema)
    .mutation(async ({ input, ctx }) => {
      // ctx.session is guaranteed to exist
      return db.insert(comments).values(input)
    }),

  update: protectedProcedure
    .input(commentUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      return db.update(comments).set(input.data).where(eq(comments.id, input.id))
    }),

  remove: protectedProcedure
    .input(z.string())
    .mutation(async ({ input, ctx }) => {
      return db.delete(comments).where(eq(comments.id, input))
    }),
})
```

## Examples by Use Case

### Blog Posts (public read, auth write)

```typescript
export const Post = defineEntity('Post', {
  fields: {
    title: text().required(),
    content: text().required(),
    published: boolean().default(false),
  },
  protected: 'write',
})
```

### User Profiles (fully protected)

```typescript
export const UserProfile = defineEntity('UserProfile', {
  fields: {
    bio: text().optional(),
    website: text().optional().url(),
  },
  protected: 'all',
})
```

### Products (public catalog, admin write)

```typescript
export const Product = defineEntity('Product', {
  fields: {
    name: text().required(),
    price: number().required().positive(),
  },
  protected: 'write',
  // Note: For role-based access, implement in hooks
})
```

### Comments (custom pattern)

```typescript
export const Comment = defineEntity('Comment', {
  fields: {
    content: text().required(),
  },
  protected: {
    list: false,    // Public timeline
    get: false,     // Public permalinks
    create: true,   // Login to comment
    update: true,   // Login to edit
    remove: true,   // Login to delete
  },
})
```

## Accessing User in Mutations

Protected procedures have access to the authenticated user via context:

```typescript
// In hooks or custom logic
export const postHooks = {
  async beforeCreate(input, ctx) {
    // ctx.user is guaranteed for protected procedures
    return {
      ...input,
      authorId: ctx.user.id,
    }
  },
}
```

## Requirements

Protection requires authentication to be enabled in your config:

```typescript
export default defineConfig({
  entities: [...],
  auth: {
    enabled: true,
    providers: ['credentials'],
  },
})
```

Without auth enabled, all entities are public regardless of the `protected` setting.
