<img width="1280" height="640" alt="image" src="https://github.com/user-attachments/assets/eb752f28-ae21-49e6-b0ff-8adc1f4c5cd5" />

# Archetype Engine

**Write 1 entity definition. Get database schema + API + validation + React hooks.**

No magic. Just TypeScript → code generation → working app.

```typescript
export const Task = defineEntity('Task', {
  fields: {
    title: text().required().min(1).max(200),
    done: boolean().default(false),
  }
})
```

Run `npx archetype generate` → get Drizzle schema, tRPC API, Zod validation, React hooks.

---

## Why use this?

**Juniors:** Define your data structure once. Get fully working code automatically.

**Seniors:** Stop manually syncing schema → validation → API → hooks. Focus on business logic.

### vs Prisma/tRPC/Zod?

| Tool | What it does | What you still write |
|------|--------------|---------------------|
| Prisma | Database schema → Types | API, validation, hooks, filters |
| tRPC | Type-safe API | Schema, validation, CRUD, hooks |
| Zod | Validation schemas | Database, API, hooks |
| **Archetype** | **Schema → Everything** | Nothing (just business logic) |

You're not replacing tools. You're **generating** the Prisma + tRPC + Zod boilerplate.

---

## Quick Start (2 minutes)

```bash
npx create-next-app my-app && cd my-app
npm install archetype-engine
npx archetype init --yes
npx archetype generate
npx drizzle-kit push && npm run dev
```

**Done.** You now have:
- ✅ Database tables (Drizzle ORM)
- ✅ Type-safe API (tRPC with CRUD + pagination + filters)
- ✅ Validation (Zod with all field rules)
- ✅ React hooks (React Query for forms/lists)

---

## What You Get: Full Example

Write this entity:

```typescript
const Product = defineEntity('Product', {
  fields: {
    name: text().required().min(3),
    price: number().required().min(0),
    inStock: boolean().default(true),
  },
  relations: {
    reviews: hasMany('Review'),
  },
})
```

### You automatically get:

**1. Database schema** (Drizzle)
```typescript
export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  price: integer('price').notNull(),
  inStock: integer('in_stock', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})
```

**2. Validation** (Zod)
```typescript
export const productCreateSchema = z.object({
  name: z.string().min(3),
  price: z.number().min(0),
  inStock: z.boolean().optional(),
})
```

**3. API** (tRPC with built-in pagination/filtering)
```typescript
export const productRouter = router({
  list: publicProcedure.input(listSchema).query(...),
  get: publicProcedure.input(idSchema).query(...),
  create: publicProcedure.input(productCreateSchema).mutation(...),
  update: publicProcedure.input(productUpdateSchema).mutation(...),
  remove: publicProcedure.input(idSchema).mutation(...),
  createMany: publicProcedure.input(...).mutation(...),
  updateMany: publicProcedure.input(...).mutation(...),
  removeMany: publicProcedure.input(...).mutation(...),
})
```

**4. React hooks** (ready to use)
```typescript
'use client'
import { useProducts, useProductForm } from '@/generated/hooks/useProduct'

export default function ProductList() {
  const { data } = useProducts({ 
    where: { inStock: true },
    search: 'laptop' 
  })
  const { submit, register } = useProductForm()
  
  return (
    <form onSubmit={submit}>
      <input {...register('name')} />
      <input {...register('price')} type="number" />
      <button>Create</button>
    </form>
  )
}
```

**15 lines of input → 300+ lines of type-safe, working code.**

---

## Core Concepts

### 1. Field Types

```typescript
// Text
text().required().unique().min(5).max(100)
text().email()              // Email validation
text().url()                // URL validation
text().lowercase()          // Transform on save
text().oneOf(['draft', 'published'])

// Numbers
number().required().min(0).max(100)
number().integer().positive()

// Booleans
boolean().default(false)

// Dates
date().required()
date().default('now')

// Enums (creates DB enum types)
enumField(['draft', 'published', 'archived'] as const)
  .required()
  .default('draft')

// Computed (virtual fields, not stored)
computed({
  type: 'text',
  from: ['firstName', 'lastName'],
  get: '`${firstName} ${lastName}`'
})
```

### 2. Relations

```typescript
const Post = defineEntity('Post', {
  fields: { title: text() },
  relations: {
    author: hasOne('User'),              // Creates authorId FK
    comments: hasMany('Comment'),        // One-to-many
    tags: belongsToMany('Tag'),          // Many-to-many (junction table)
  }
})
```

**Pivot data** (extra fields on junction tables):
```typescript
products: belongsToMany('Product').through({
  table: 'order_items',
  fields: {
    quantity: number().required(),
    unitPrice: number().required(),
  }
})
```

### 3. Behaviors

```typescript
behaviors: {
  timestamps: true,    // Adds createdAt, updatedAt
  softDelete: true,    // Adds deletedAt (no hard deletes)
}
```

---

## Generated Hooks (All Entities)

Every entity gets these React hooks:

| Hook | What it does |
|------|--------------|
| `useProducts()` | List with pagination/filters/search |
| `useProduct(id)` | Get single item |
| `useProductForm()` | Create form (Zod validated) |
| `useProductEditForm(id)` | Edit form (pre-filled) |
| `useCreateProduct()` | Create mutation |
| `useUpdateProduct()` | Update mutation |
| `useProductRemove()` | Delete mutation |
| `useCreateManyProducts()` | Bulk create (CSV imports) |
| `useUpdateManyProducts()` | Bulk update |
| `useRemoveManyProducts()` | Bulk delete |

All use React Query (automatic caching + background refetch).

---

## Filtering & Search (Built-in)

```typescript
const { data } = useProducts({
  page: 2,
  limit: 50,
  where: {
    category: { eq: 'electronics' },
    price: { lt: 100, gte: 10 },
    inStock: true,
  },
  orderBy: { field: 'price', direction: 'asc' },
  search: 'laptop',  // Searches all text fields
})

// Returns: { items: [...], total: 543, hasMore: true, page: 2 }
```

**Filter operators:**
- Text: `eq`, `ne`, `contains`, `startsWith`, `endsWith`
- Number/Date: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`
- Boolean: Direct value `{ inStock: true }`

---

## Authentication (Next-Auth v5)

```bash
npx archetype init  # Select "Yes" for auth
```

```typescript
// archetype.config.ts
export default defineConfig({
  entities: [Product, Order],
  auth: {
    enabled: true,
    providers: ['credentials', 'google', 'github'],
  },
})
```

**Generates:** NextAuth config, auth routes, User/Account/Session tables, `.env.example`

**Protect entities:**
```typescript
const Order = defineEntity('Order', {
  fields: { total: number() },
  protected: 'write',  // list/get public, create/update/remove requires auth
})
```

Generated routers use `protectedProcedure` automatically.

---

## Business Logic Hooks (Optional)

Need validation before save? Emails after create?

```typescript
const Order = defineEntity('Order', {
  fields: { total: number() },
  hooks: true,  // Enable lifecycle hooks
})
```

**Implement your logic** in generated stub:
```typescript
// generated/hooks/order.ts (YOU edit this)
export const orderHooks: OrderHooks = {
  async beforeCreate(input, ctx) {
    if (input.total < 10) throw new Error('Min order $10')
    return input
  },
  
  async afterCreate(record, ctx) {
    await sendOrderConfirmation(record.id, ctx.user?.email)
  },
}
```

**Available:** `beforeCreate`, `afterCreate`, `beforeUpdate`, `afterUpdate`, `beforeRemove`, `afterRemove`

---

## Headless Mode (External API)

Using an existing backend? Generate only frontend code:

```bash
npx archetype init --headless
```

```typescript
export default defineConfig({
  mode: 'headless',
  source: external('env:API_URL'),  // REST conventions
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
  auth: { type: 'bearer' },
})
```

---

## CLI Commands

```bash
npx archetype init              # Interactive setup
npx archetype init --yes        # SQLite defaults
npx archetype init --headless   # Frontend-only mode
npx archetype generate          # Generate code
npx archetype validate          # Check without generating
npx archetype view              # View ERD diagram
```

---

## Database Support

```typescript
database: { type: 'sqlite', file: './sqlite.db' }
database: { type: 'postgres', url: process.env.DATABASE_URL }
database: { type: 'mysql', url: process.env.DATABASE_URL }
```

---

## AI Integration (JSON Input)

AI agents can control Archetype with JSON instead of TypeScript:

```json
{
  "entities": [
    { "name": "User", "fields": { "email": { "type": "text", "email": true } } }
  ],
  "database": { "type": "sqlite", "file": "./app.db" }
}
```

```bash
npx archetype validate manifest.json --json
npx archetype generate manifest.json --json
```

See [AI Integration Guide](documentation/AI_INTEGRATION.md).

---

## Real Example: 15-Entity E-commerce

See [`examples/ecommerce/`](examples/ecommerce/):
- Customer, Address, Product, Category, Brand, Tag
- Order, OrderItem, Payment, Cart, Review

**~60 lines of entities → 5,000+ lines generated** (schema, validation, API, hooks, i18n).

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for architecture and how to add features.

---

## License

MIT
