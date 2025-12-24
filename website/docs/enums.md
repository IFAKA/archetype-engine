---
sidebar_position: 13
---

# Enum Fields

Define constrained string fields that only accept specific values. Generates native PostgreSQL enums or validated text columns for SQLite.

## Definition

```typescript
import { defineEntity, enumField } from 'archetype-engine'

export const Post = defineEntity('Post', {
  fields: {
    status: enumField('draft', 'published', 'archived')
      .required()
      .default('draft'),
  },
})
```

Values are automatically inferred as readonly literal types - no need for `as const`!

## Methods

| Method | Description |
|--------|-------------|
| `.required()` | Field must have a value |
| `.optional()` | Field can be null |
| `.default(value)` | Default value (must be one of the enum values) |
| `.label(string)` | Human-readable label |

## Generated Code

### PostgreSQL

Native enum types for better performance and documentation:

```typescript
// generated/db/schema.ts
import { pgTable, pgEnum } from 'drizzle-orm/pg-core'

export const postStatusEnum = pgEnum('post_status', ['draft', 'published', 'archived'])

export const posts = pgTable('posts', {
  id: text('id').primaryKey(),
  status: postStatusEnum('status').notNull().default('draft'),
})
```

### SQLite

Text column with Zod validation:

```typescript
// generated/db/schema.ts
export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  status: text('status').notNull().default('draft'),
})

// generated/schemas/post.ts
export const postCreateSchema = z.object({
  status: z.enum(['draft', 'published', 'archived']),
})
```

## Examples

### Order Status

```typescript
export const Order = defineEntity('Order', {
  fields: {
    status: enumField(
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled'
    )
      .required()
      .default('pending'),
  },
})
```

### Priority Levels

```typescript
export const Task = defineEntity('Task', {
  fields: {
    priority: enumField('low', 'medium', 'high', 'urgent')
      .default('medium'),
  },
})
```

### User Roles

```typescript
export const User = defineEntity('User', {
  fields: {
    role: enumField('user', 'moderator', 'admin')
      .required()
      .default('user'),
  },
})
```

### Payment Status

```typescript
export const Payment = defineEntity('Payment', {
  fields: {
    status: enumField(
      'pending',
      'processing',
      'succeeded',
      'failed',
      'refunded'
    )
      .required()
      .default('pending'),
  },
})
```

## Enum vs text().oneOf()

Both constrain values, but differ in generated output:

| Feature | `enumField()` | `text().oneOf()` |
|---------|---------------|------------------|
| PostgreSQL | Native `pgEnum` | Text + check constraint |
| SQLite | Text + Zod validation | Text + Zod validation |
| Type inference | Literal union | Literal union |
| Database-level constraint | Yes (PostgreSQL) | No |

Use `enumField()` when:
- You want native database enums (PostgreSQL)
- Values are truly fixed and unlikely to change
- You need database-level validation

Use `text().oneOf()` when:
- Values might change frequently
- You don't need database-level constraints
- You're prototyping

## Type Safety

Both approaches provide full TypeScript type inference:

```typescript
// Inferred type: 'draft' | 'published' | 'archived'
const status: Post['status'] = 'published'

// Type error: '"invalid"' is not assignable
const bad: Post['status'] = 'invalid'
```
