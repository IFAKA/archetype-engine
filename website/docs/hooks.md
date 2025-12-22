---
sidebar_position: 9
---

# Hooks

Hooks let you run custom business logic before and after CRUD operations without modifying generated code.

## Enabling Hooks

Enable hooks per entity:

```typescript
export const Order = defineEntity('Order', {
  fields: {
    total: number().required(),
    status: text().default('pending'),
  },
  hooks: true,  // Enable all hooks
})
```

Or enable specific hooks:

```typescript
hooks: {
  beforeCreate: true,
  afterCreate: true,
  beforeUpdate: true,
  afterUpdate: true,
  beforeRemove: true,
  afterRemove: true,
}
```

## Generated Files

After running `npx archetype generate`:

```
generated/
└── hooks/
    ├── types.ts           # Type definitions
    └── order.ts           # Hook implementations (edit this)
```

## Hook Types

```typescript
// generated/hooks/types.ts
export interface HookContext {
  user?: {
    id: string
    email?: string
    name?: string
  }
  headers?: Record<string, string>
}

export interface OrderHooks {
  beforeCreate?: (input: OrderCreateInput, ctx: HookContext) => Promise<OrderCreateInput>
  afterCreate?: (record: OrderRecord, ctx: HookContext) => Promise<void>
  beforeUpdate?: (id: string, data: OrderUpdateInput, ctx: HookContext) => Promise<OrderUpdateInput>
  afterUpdate?: (record: OrderRecord, ctx: HookContext) => Promise<void>
  beforeRemove?: (id: string, ctx: HookContext) => Promise<void>
  afterRemove?: (record: OrderRecord, ctx: HookContext) => Promise<void>
}
```

## Implementing Hooks

Edit the generated hook file:

```typescript
// generated/hooks/order.ts
import type { OrderHooks, HookContext, OrderCreateInput, OrderRecord } from './types'

export const orderHooks: OrderHooks = {
  // Validate or modify input before creating
  async beforeCreate(input, ctx) {
    // Validate business rules
    if (input.total < 0) {
      throw new Error('Order total cannot be negative')
    }

    // Modify input
    return {
      ...input,
      status: 'pending',
    }
  },

  // Side effects after creating
  async afterCreate(record, ctx) {
    // Send confirmation email
    await sendOrderConfirmation(record, ctx.user)

    // Log to analytics
    await analytics.track('order_created', {
      orderId: record.id,
      total: record.total,
    })
  },

  // Validate before updating
  async beforeUpdate(id, data, ctx) {
    const order = await getOrder(id)

    // Prevent updating shipped orders
    if (order.status === 'shipped') {
      throw new Error('Cannot modify shipped orders')
    }

    return data
  },

  // Side effects after updating
  async afterUpdate(record, ctx) {
    if (record.status === 'shipped') {
      await sendShippingNotification(record)
    }
  },

  // Validate before removing
  async beforeRemove(id, ctx) {
    const order = await getOrder(id)

    if (order.status !== 'pending') {
      throw new Error('Can only delete pending orders')
    }
  },

  // Cleanup after removing
  async afterRemove(record, ctx) {
    await auditLog.record('order_deleted', record.id, ctx.user)
  },
}
```

## Common Patterns

### Auto-assign Author

```typescript
async beforeCreate(input, ctx) {
  if (!ctx.user) {
    throw new Error('Must be logged in')
  }
  return {
    ...input,
    authorId: ctx.user.id,
  }
}
```

### Validate Stock

```typescript
async beforeCreate(input, ctx) {
  const product = await getProduct(input.productId)
  if (product.quantity < input.quantity) {
    throw new Error('Insufficient stock')
  }
  return input
}
```

### Send Notifications

```typescript
async afterCreate(record, ctx) {
  await notify.send({
    to: record.email,
    template: 'welcome',
    data: { name: record.name },
  })
}
```

### Audit Logging

```typescript
async afterUpdate(record, ctx) {
  await auditLog.record({
    action: 'update',
    entity: 'order',
    recordId: record.id,
    userId: ctx.user?.id,
    timestamp: new Date(),
  })
}
```

### Prevent Deletion

```typescript
async beforeRemove(id, ctx) {
  const order = await getOrder(id)
  if (order.hasInvoice) {
    throw new Error('Cannot delete orders with invoices')
  }
}
```

## Error Handling

Throw errors in `before` hooks to abort the operation:

```typescript
async beforeCreate(input, ctx) {
  if (!isValid(input)) {
    throw new Error('Validation failed')  // Aborts create
  }
  return input
}
```

Errors in `after` hooks are logged but don't rollback the operation.
