<img width="1280" height="640" alt="image" src="https://github.com/user-attachments/assets/eb752f28-ae21-49e6-b0ff-8adc1f4c5cd5" />

# Archetype Engine

**Stop writing CRUD boilerplate. Define your data, get type-safe infrastructure.**

One entity definition → Database schema + API + Validation + React hooks. No magic, just code generation.

```typescript
export const Task = defineEntity('Task', {
  fields: {
    title: text().required().min(1).max(200),
    done: boolean().default(false),
  },
  behaviors: { timestamps: true }
})
```

Run `npx archetype generate` → You get:
- ✅ Drizzle ORM schema
- ✅ Zod validation (min/max/email/etc)
- ✅ tRPC router with CRUD + pagination + filtering
- ✅ React Query hooks ready to use

## Why Archetype?

**For juniors:** Define data once. Get working code. No need to manually sync database ↔ API ↔ validation ↔ UI.

**For seniors:** Skip the repetitive plumbing. Focus on business logic. Everything type-safe. No runtime overhead.

### What makes this different from Prisma/tRPC/etc?

| Tool | What it does | What you still write manually |
|------|--------------|-------------------------------|
| **Prisma** | Schema → Database + types | Validation, API routes, hooks, filtering logic |
| **tRPC** | Type-safe API | Schema, validation, CRUD procedures, hooks |
| **Zod** | Validation | Schema, API, database, hooks |
| **Archetype** | **Schema → Everything** | Only business logic hooks (if needed) |

You're not replacing your stack. You're generating the boring parts of it.

## Quick Start

```bash
# 1. Create Next.js project
npx create-next-app my-app && cd my-app

# 2. Install
npm install archetype-engine

# 3. Initialize (creates config + entity examples + infrastructure)
npx archetype init --yes

# 4. Generate everything
npx archetype generate

# 5. Push to DB and run
npx drizzle-kit push && npm run dev
```

You now have:
- `generated/db/schema.ts` - Drizzle schema
- `generated/schemas/task.ts` - Zod validation
- `generated/trpc/routers/task.ts` - CRUD API with pagination/filtering
- `generated/hooks/useTask.ts` - React Query hooks

## Real Example: E-commerce Product

```typescript
const Product = defineEntity('Product', {
  fields: {
    sku: text().required().unique().uppercase(),
    name: text().required().min(3).max(200),
    price: number().required().min(0),
    quantity: number().default(0).integer(),
    isActive: boolean().default(true),
  },
  relations: {
    category: hasOne('Category'),
    reviews: hasMany('Review'),
    tags: belongsToMany('Tag'),
  },
  behaviors: {
    timestamps: true,   // createdAt, updatedAt
    softDelete: true,   // deletedAt instead of DELETE
  },
})
```

**This generates:**

### 1. Database Schema (Drizzle)
```typescript
export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  price: integer('price').notNull(),
  quantity: integer('quantity').default(0).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  categoryId: text('category_id').references(() => categories.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
})
```

### 2. Validation (Zod)
```typescript
export const productCreateSchema = z.object({
  sku: z.string().min(1).toUpperCase(),
  name: z.string().min(3).max(200),
  price: z.number().min(0),
  quantity: z.number().int().optional(),
  isActive: z.boolean().optional(),
})
```

### 3. API (tRPC)
```typescript
export const productRouter = router({
  list: publicProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(50),
      where: z.object({
        isActive: z.boolean().optional(),
        price: z.object({ lt: z.number() }).optional(),
      }).optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      // Built-in filtering, search, pagination
      const items = await db.select()...
      return { items, total, hasMore }
    }),
  
  create: publicProcedure
    .input(productCreateSchema)
    .mutation(async ({ input }) => { /* ... */ }),
  
  // update, remove, get, createMany, updateMany, removeMany
})
```

### 4. React Hooks
```typescript
'use client'
import { useProducts, useProductForm } from '@/generated/hooks/useProduct'

export default function ProductList() {
  // Pagination + filtering built-in
  const { data } = useProducts({
    where: { isActive: true, price: { lt: 100 } },
    search: 'laptop',
  })
  
  const { submit, register } = useProductForm()
  
  return (
    <form onSubmit={submit}>
      <input {...register('name')} />
      <button>Create Product</button>
    </form>
  )
}
```

**You wrote 15 lines. You got ~300 lines of working, type-safe code.**

## Generated Hooks Reference

Every entity gets these hooks:

| Hook | What it does |
|------|--------------|
| `useProducts()` | List with pagination/filtering/search |
| `useProduct(id)` | Get single item |
| `useProductForm()` | Create form (Zod validated) |
| `useProductEditForm(id)` | Edit form (pre-filled) |
| `useCreateProduct()` | Raw create mutation |
| `useUpdateProduct()` | Raw update mutation |
| `useProductRemove()` | Delete mutation |
| `useCreateManyProducts()` | Bulk create (CSV imports) |
| `useUpdateManyProducts()` | Bulk update |
| `useRemoveManyProducts()` | Bulk delete |

All hooks use React Query with automatic caching + refetching.

## Field Types

```typescript
// Text fields
text().required().unique().min(5).max(255)
text().email()                    // Email validation
text().url()                      // URL validation
text().regex(/^[A-Z]{3}$/)        // Custom regex
text().oneOf(['draft', 'published'])
text().trim().lowercase()         // Transforms

// Numbers
number().required().min(0).max(100)
number().integer().positive()

// Booleans
boolean().default(false)

// Dates
date().optional()
date().default('now')

// Enums (native DB enums on PostgreSQL)
enumField(['draft', 'published', 'archived'] as const)
  .required()
  .default('draft')

// Computed fields (not stored in DB)
computed({
  type: 'text',
  from: ['firstName', 'lastName'],
  get: '`${firstName} ${lastName}`'
})
```

## Relations

```typescript
const Post = defineEntity('Post', {
  fields: { title: text().required() },
  relations: {
    author: hasOne('User'),           // Creates authorId FK
    comments: hasMany('Comment'),     // One-to-many
    tags: belongsToMany('Tag'),       // Junction table
    
    // Many-to-many WITH extra fields (pivot data)
    products: belongsToMany('Product').through({
      table: 'order_items',
      fields: {
        quantity: number().required(),
        unitPrice: number().required(),
      }
    }),
  }
})
```

## Pagination, Filtering, Search

**Built into every `list` procedure and hook:**

```typescript
// In your React component
const { data } = useProducts({
  page: 2,
  limit: 50,
  where: {
    category: { eq: 'electronics' },
    price: { lt: 100, gte: 10 },
    isActive: true,
  },
  orderBy: { field: 'price', direction: 'asc' },
  search: 'laptop',  // Searches across all text fields
})

// Returns: { items: [...], total: 543, page: 2, limit: 50, hasMore: true }
```

**Filter operators:**
- **Text:** `eq`, `ne`, `contains`, `startsWith`, `endsWith`
- **Number/Date:** `eq`, `ne`, `gt`, `gte`, `lt`, `lte`
- **Boolean:** Direct value `{ isActive: true }`

## Authentication with Next-Auth v5

```bash
npx archetype init  # Select "Yes" for auth, choose providers
```

```typescript
// archetype.config.ts
export default defineConfig({
  entities: [Product, Order],
  database: { type: 'sqlite', file: './sqlite.db' },
  auth: {
    enabled: true,
    providers: ['credentials', 'google', 'github'],
  },
})
```

**Generated:**
- `src/server/auth.ts` - NextAuth config
- `src/app/api/auth/[...nextauth]/route.ts` - Auth routes
- `generated/db/auth-schema.ts` - User/Account/Session tables
- `.env.example` - Required secrets

### Protect Your Entities

```typescript
const Order = defineEntity('Order', {
  fields: { total: number().required() },
  
  // Shorthand: list/get public, mutations require auth
  protected: 'write',
  
  // OR granular:
  protected: {
    list: false,    // Public
    get: false,     // Public
    create: true,   // Requires auth
    update: true,   // Requires auth
    remove: true,   // Requires auth
  }
})
```

Generated routers use `publicProcedure` vs `protectedProcedure` automatically.

## Business Logic Hooks

Need custom validation? Side effects after create? Add lifecycle hooks:

```typescript
const Order = defineEntity('Order', {
  fields: { total: number() },
  hooks: true,  // Enable all hooks
  // OR: hooks: { beforeCreate: true, afterCreate: true }
})
```

**Generates stub files you implement:**

```typescript
// generated/hooks/order.ts (YOU edit this)
export const orderHooks: OrderHooks = {
  async beforeCreate(input, ctx) {
    // Validate inventory, modify input
    if (input.total < 10) {
      throw new Error('Minimum order $10')
    }
    return input
  },

  async afterCreate(record, ctx) {
    // Send email, log to analytics
    await sendOrderConfirmation(record.id, ctx.user?.email)
  },

  async beforeRemove(id, ctx) {
    // Prevent deletion of shipped orders
    const order = await getOrder(id)
    if (order.status === 'shipped') {
      throw new Error('Cannot delete shipped orders')
    }
  },
}
```

**Available hooks:** `beforeCreate`, `afterCreate`, `beforeUpdate`, `afterUpdate`, `beforeRemove`, `afterRemove`

## Headless Mode (Frontend → External API)

Using an existing backend? Generate only frontend code:

```bash
npx archetype init --headless
```

```typescript
import { defineConfig, external } from 'archetype-engine'

export default defineConfig({
  mode: 'headless',
  source: external('env:API_URL'),  // Uses REST conventions
  entities: [Product, Order],
})
```

**Generates:** Validation, hooks, services (no database schema).

**Custom endpoints:**
```typescript
source: external('env:LEGACY_API', {
  pathPrefix: '/v1',
  override: {
    list: 'GET /catalog/search',
    get: 'GET /catalog/item/:id',
  },
  auth: { type: 'bearer' },  // Authorization: Bearer <token>
})
```

## CLI Commands

```bash
npx archetype init                    # Interactive setup
npx archetype init --yes              # SQLite defaults
npx archetype init --headless         # Frontend-only
npx archetype generate                # Generate from entities
npx archetype validate                # Check without generating
npx archetype view                    # View ERD diagram in browser
```

## Database Support

```typescript
database: { type: 'sqlite', file: './sqlite.db' }
database: { type: 'postgres', url: process.env.DATABASE_URL }
database: { type: 'mysql', url: process.env.DATABASE_URL }
```

## AI Integration

Archetype can be controlled by AI agents to build apps from natural language. Instead of TypeScript, AI sends JSON:

```json
{
  "entities": [
    { "name": "User", "fields": { "email": { "type": "text", "email": true } } },
    { "name": "Post", "fields": { "title": { "type": "text" } },
      "relations": { "author": { "type": "hasOne", "entity": "User" } } }
  ],
  "database": { "type": "sqlite", "file": "./app.db" }
}
```

```bash
# Validate
npx archetype validate manifest.json --json
# → { "valid": true, "errors": [] }

# Generate
npx archetype generate manifest.json --json
# → { "success": true, "files": [...] }
```

See [AI Integration Guide](documentation/AI_INTEGRATION.md) for system prompts and schemas.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for architecture details and how to add new features.

## Full Example: 15-Entity E-commerce System

See [`examples/ecommerce/`](examples/ecommerce/) for a complete working system:
- Customer, Address, Product, ProductVariant, Category, Brand, Tag
- Order, OrderItem, Payment
- Cart, CartItem, WishlistItem, Review

**60 lines of entity definitions → 5,000+ lines of generated code** (schema, validation, API, hooks, i18n).

## License

MIT
