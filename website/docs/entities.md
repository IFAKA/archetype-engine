---
sidebar_position: 3
---

# Entities

Entities are the core building blocks of Archetype. Each entity represents a data model that generates database tables, API endpoints, and React hooks.

## Defining an Entity

```typescript
import { defineEntity, text, number, boolean } from 'archetype-engine'

export const Product = defineEntity('Product', {
  fields: {
    name: text().required(),
    description: text().optional(),
    price: number().required().positive(),
    inStock: boolean().default(true),
  },
})
```

## Entity Options

| Option | Type | Description |
|--------|------|-------------|
| `fields` | object | Field definitions (required) |
| `relations` | object | Relationships to other entities |
| `behaviors` | object | Built-in behaviors like timestamps |
| `protected` | string/object | Authentication requirements |
| `hooks` | boolean/object | Enable lifecycle hooks |

## Complete Example

```typescript
import { defineEntity, text, number, date, hasMany, belongsTo } from 'archetype-engine'

export const Order = defineEntity('Order', {
  // Fields define the columns
  fields: {
    orderNumber: text().required().unique(),
    status: text().default('pending'),
    total: number().required().positive(),
    notes: text().optional(),
    shippedAt: date().optional(),
  },

  // Relations to other entities
  relations: {
    customer: belongsTo('Customer'),
    items: hasMany('OrderItem'),
  },

  // Built-in behaviors
  behaviors: {
    timestamps: true,    // adds createdAt, updatedAt
    softDelete: true,    // adds deletedAt instead of hard delete
  },

  // Protection settings
  protected: 'write',    // list/get public, mutations require auth

  // Enable lifecycle hooks
  hooks: true,
})
```

## What Gets Generated

For each entity, Archetype generates:

### Database Schema
```typescript
// generated/db/schema.ts
export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  status: text('status').default('pending'),
  total: integer('total').notNull(),
  notes: text('notes'),
  shippedAt: integer('shipped_at'),
  customerId: text('customer_id').references(() => customers.id),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
})
```

### Zod Validation
```typescript
// generated/schemas/order.ts
export const orderCreateSchema = z.object({
  orderNumber: z.string().min(1),
  status: z.string().optional(),
  total: z.number().positive(),
  notes: z.string().optional(),
  shippedAt: z.date().optional(),
  customerId: z.string().optional(),
})
```

### tRPC Router
```typescript
// generated/trpc/routers/order.ts
export const orderRouter = router({
  list: publicProcedure.query(...),
  get: publicProcedure.input(z.string()).query(...),
  create: protectedProcedure.input(orderCreateSchema).mutation(...),
  update: protectedProcedure.input(orderUpdateSchema).mutation(...),
  remove: protectedProcedure.input(z.string()).mutation(...),
})
```

### React Hooks
```typescript
// generated/hooks/useOrder.ts
export function useOrders(options?) { ... }
export function useOrder(id: string) { ... }
export function useCreateOrder() { ... }
export function useUpdateOrder() { ... }
export function useRemoveOrder() { ... }
```

## Naming Conventions

Archetype follows conventions:

| Input | Table Name | Router Name |
|-------|-----------|-------------|
| `User` | `users` | `userRouter` |
| `OrderItem` | `order_items` | `orderItemRouter` |
| `ProductCategory` | `product_categories` | `productCategoryRouter` |

Entity names should be PascalCase singular nouns.
