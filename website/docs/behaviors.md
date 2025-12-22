---
sidebar_position: 6
---

# Behaviors

Behaviors are built-in patterns that add common functionality to entities. Enable them in the `behaviors` option.

## Available Behaviors

### timestamps

Adds `createdAt` and `updatedAt` fields that are automatically managed.

```typescript
export const Post = defineEntity('Post', {
  fields: {
    title: text().required(),
  },
  behaviors: {
    timestamps: true,
  },
})
```

**Generated fields:**
```typescript
createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
updatedAt: integer('updated_at').notNull().$defaultFn(() => Date.now()),
```

The `updatedAt` field is automatically updated on every modification.

### softDelete

Adds a `deletedAt` field instead of permanently deleting records.

```typescript
export const User = defineEntity('User', {
  fields: {
    email: text().required().email(),
  },
  behaviors: {
    softDelete: true,
  },
})
```

**Generated field:**
```typescript
deletedAt: integer('deleted_at'),  // null = not deleted
```

**Generated router behavior:**
- `list` and `get` automatically filter out soft-deleted records
- `remove` sets `deletedAt` instead of `DELETE`
- To permanently delete, use the database directly

## Combining Behaviors

Enable multiple behaviors:

```typescript
export const Document = defineEntity('Document', {
  fields: {
    title: text().required(),
    content: text().optional(),
  },
  behaviors: {
    timestamps: true,   // createdAt, updatedAt
    softDelete: true,   // deletedAt
  },
})
```

## Example Usage

### With Timestamps

```typescript
// Created record includes timestamps
const post = await trpc.post.create.mutate({
  title: 'Hello World',
})
// { id: '...', title: 'Hello World', createdAt: 1703001234567, updatedAt: 1703001234567 }

// Updated record has new updatedAt
const updated = await trpc.post.update.mutate({
  id: post.id,
  title: 'Updated Title',
})
// { ..., updatedAt: 1703001234999 }
```

### With Soft Delete

```typescript
// Remove sets deletedAt instead of deleting
await trpc.user.remove.mutate(userId)

// List excludes soft-deleted records
const users = await trpc.user.list.query()
// Only returns users where deletedAt is null

// Soft-deleted records still exist in database
// Access directly for admin/restore functionality
```

## Future Behaviors

Planned behaviors for future releases:

| Behavior | Description |
|----------|-------------|
| `audit: true` | Log all changes to an audit table |
| `versioning: true` | Keep history of all record versions |
| `slug: 'field'` | Auto-generate URL slugs from a field |
