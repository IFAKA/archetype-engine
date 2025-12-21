# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run build          # Compile TypeScript to dist/
npm run generate       # Run archetype generate (for local dev testing)
npm run test:run       # Run tests
```

## CLI Commands

```bash
npx archetype init                    # Create config + entities + infrastructure
npx archetype init --yes              # Quick setup with defaults (SQLite)
npx archetype init --headless         # Quick setup for headless mode (no database)
npx archetype generate                # Generate code from entities
npx archetype generate path/to/config.ts  # Use custom config
npx archetype view                    # View ERD in browser
```

## Quick Start

```bash
# 1. Create Next.js project
npx create-next-app my-app && cd my-app

# 2. Install archetype
npm install archetype-engine  # or: npm link archetype-engine

# 3. Initialize (creates config + infrastructure + installs deps)
npx archetype init --yes

# 4. Generate code
npx archetype generate

# 5. Push DB schema + run
npx drizzle-kit push && npm run dev
```

## Project Vision

Archetype is a declarative data engine with a fluent TypeScript API that generates type-safe CRUD infrastructure from entity definitions. It eliminates repetitive "plumbing" tasks (manual SQL queries, validation, logging) by shifting developers to an "architect" role focused on entity definitions and business rules.

The name "Archetype" reflects the core concept: you define the archetypal data model (the original pattern), and the engine generates safe implementations from it.

**Core Differentiators:**
- Unbreakable safety policies (sandboxed data access to prevent cross-tenant leaks)
- Compile-time synchronization across database, API, and UI layers
- Built-in observability without manual logging
- Technology agnosticism via adapters

**Current Status:** MVP stage supporting fluent TypeScript entity definitions, generating Drizzle schemas, Zod validation, tRPC routers, React hooks, and i18n files.

## Design Principles

### Zero-Manual-Safety Policy
- All data access sandboxed by default
- Physically impossible to skip multi-tenant filters
- Engine owns data-access layer; developers own entity definitions

### Semantic Intent ("Presence-as-Intent")
- Manifest is declarative: present = active; absent = safest default (required, not null, private)

### Absolute Sync
- Single source of truth; manifest changes cause compile failures if out of sync
- No manual mappings—database, API, and UI derive from manifest

### Operational Visibility
- Automatic structured logs and traces for CRUD events
- No manual logging required

## Architecture

### Core Flow

1. **Config** (`archetype.config.ts`) - Configuration and entity imports
2. **Entities** (`archetype/entities/*.ts`) - Entity definitions using fluent API
3. **CLI** (`src/cli.ts`) - Loads config and invokes template generators
4. **Templates** (`src/templates/`) - Generates framework-specific code (Drizzle, tRPC, hooks)
5. **Output** (`generated/`) - Contains auto-generated schemas, routers, hooks, and ERD

### Key Files

- `src/entity.ts` - `defineEntity()` fluent API for entity definitions
- `src/fields.ts` - Field type builders (`text()`, `number()`, `boolean()`, `date()`)
- `src/relations.ts` - Relation helpers (`hasOne()`, `hasMany()`, `belongsToMany()`)
- `src/manifest.ts` - `defineManifest()` / `defineConfig()` and manifest IR types
- `src/cli.ts` - CLI entry point with init, generate, view commands
- `src/templates/nextjs-drizzle-trpc/` - Template for Next.js + Drizzle + tRPC stack
- `src/init/` - Init flow (creates config + entities + infrastructure)
- `src/index.ts` - Package entry point, exports all public APIs

### AI Module (`src/ai/`)

Tools for building AI-powered app builders. Import from `archetype-engine/ai`.

- `src/ai/types.ts` - Type definitions for tools and ManifestBuilder
- `src/ai/state.ts` - ManifestBuilder class (tracks entities across AI tool calls)
- `src/ai/tools.ts` - Framework-agnostic tool definitions (add_entity, set_database, etc.)
- `src/ai/adapters/openai.ts` - OpenAI function calling format
- `src/ai/adapters/anthropic.ts` - Anthropic tool use format
- `src/ai/adapters/vercel.ts` - Vercel AI SDK format with Zod schemas

```typescript
import { createManifestBuilder, aiTools } from 'archetype-engine/ai'

const builder = createManifestBuilder()
const tools = aiTools.vercel(builder)  // or aiTools.openai(), aiTools.anthropic()
```

### Config Format

```typescript
// archetype.config.ts
import { defineConfig } from 'archetype-engine'
import { User } from './archetype/entities/user'
import { Post } from './archetype/entities/post'

export default defineConfig({
  entities: [User, Post],
  database: { type: 'sqlite', file: './sqlite.db' },
  auth: {
    enabled: true,
    providers: ['credentials', 'google', 'github'],
  },
})
```

### Entity Format

```typescript
// archetype/entities/user.ts
import { defineEntity, text, number, hasMany } from 'archetype-engine'

export const User = defineEntity('User', {
  fields: {
    email: text().required().unique().email(),
    name: text().required().min(2).max(100),
    age: number().optional().min(0).integer(),
  },
  relations: {
    posts: hasMany('Post'),
  },
  behaviors: {
    timestamps: true,
    softDelete: true,
  },
  protected: 'write',  // list/get public, create/update/remove require auth
})
```

### Generated Output

```
generated/
├── db/
│   ├── schema.ts          # Drizzle ORM schema
│   └── auth-schema.ts     # Auth.js tables (if auth enabled)
├── schemas/{entity}.ts    # Zod validation schemas
├── trpc/routers/          # tRPC routers with CRUD
│   ├── {entity}.ts
│   └── index.ts
├── hooks/use{Entity}.ts   # React hooks for forms/data
└── erd.md                 # Mermaid ERD diagram
```

## Field Types

- `text()` - String fields with `.email()`, `.url()`, `.regex()`, `.oneOf()`, `.trim()`, `.lowercase()`, `.uppercase()`
- `number()` - Numeric fields with `.integer()`, `.positive()`, `.min()`, `.max()`
- `boolean()` - Boolean fields with `.default()`
- `date()` - Date/timestamp fields with `.default('now')`

All fields support: `.required()`, `.optional()`, `.unique()`, `.default()`, `.label()`

## Relations

- `hasOne('Entity')` - One-to-one (creates foreign key)
- `hasMany('Entity')` - One-to-many
- `belongsToMany('Entity')` - Many-to-many (creates junction table)

## Behaviors

- `timestamps: true` - Adds `createdAt`, `updatedAt` fields
- `softDelete: true` - Adds `deletedAt` field instead of hard delete
- `audit: true` - Logs all changes (planned)

## Authentication

Integrated next-auth v5 (Auth.js) support with Drizzle adapter.

### Config

```typescript
auth: {
  enabled: true,
  providers: ['credentials', 'google', 'github', 'discord'],
  sessionStrategy: 'jwt',  // or 'database'
}
```

### Init Flow

When running `npx archetype init`, if you enable auth you'll be prompted to select providers.

### Generated Files

- `src/server/auth.ts` - NextAuth configuration with selected providers
- `src/app/api/auth/[...nextauth]/route.ts` - Auth route handler
- `generated/db/auth-schema.ts` - Auth tables (users, accounts, sessions, verificationTokens)
- `.env.example` - Required environment variables

## Entity Protection

Control which CRUD operations require authentication per entity.

### Shorthand Options

```typescript
protected: 'write'   // list/get public, create/update/remove protected (MOST COMMON)
protected: 'all'     // All operations require auth
protected: true      // Alias for 'all'
protected: false     // All operations public (default)
```

### Granular Config

```typescript
protected: {
  list: false,
  get: false,
  create: true,
  update: true,
  remove: true,
}
```

### Generated Router

```typescript
// With protected: 'write', generates:
list: publicProcedure.query(...)      // public
get: publicProcedure.query(...)       // public
create: protectedProcedure.mutation(...)  // requires auth
update: protectedProcedure.mutation(...)  // requires auth
remove: protectedProcedure.mutation(...)  // requires auth
```

## Testing

```bash
npm run test       # Watch mode
npm run test:run   # Single run
```

Tests are in `tests/` directory using Vitest.

## Roadmap: Features to Add

The following features are planned for the engine. Each addresses a gap identified from real-world migration scenarios (e.g., migrating from Salesforce Commerce Cloud).

### Pagination in tRPC Routers

**Status:** ✅ Implemented

**Why needed:** Current `list` procedures return all records. Real applications need cursor/offset pagination for large datasets. Without this, listing 10,000 products would crash the browser.

**Implementation:** Added `page`, `limit` inputs to list procedures. Returns `{ items, total, page, limit, hasMore }`. Hooks support `useTasks({ page: 2, limit: 50 })`.

### Search and Filtering

**Status:** ✅ Implemented

**Why needed:** CRUD list endpoints need filtering (e.g., "products where category = 'electronics' and price < 100"). E-commerce, admin panels, and dashboards all require this.

**Implementation:** List procedures accept `where`, `orderBy`, and `search` parameters.

**Filter operators by field type:**
- **Text:** `eq`, `ne`, `contains`, `startsWith`, `endsWith` (or shorthand: `{ name: 'value' }`)
- **Number/Date:** `eq`, `ne`, `gt`, `gte`, `lt`, `lte`
- **Boolean:** direct value (`{ isActive: true }`)

**Usage example (hooks):**
```typescript
// Filter by field values
const { data } = useProducts({
  where: {
    category: { eq: 'electronics' },
    price: { lt: 100 },
    isActive: true,
  },
  orderBy: { field: 'price', direction: 'asc' },
  search: 'laptop',  // Searches across all text fields
})
```

**Generated helpers in routers:**
- `buildFilters()` - Converts `where` input to Drizzle conditions
- `buildSearch()` - Creates OR condition across text fields with LIKE
- `buildOrderBy()` - Maps field name + direction to Drizzle orderBy

### Batch Operations

**Status:** ✅ Implemented

**Why needed:** Bulk create/update/delete operations are common (import CSV, delete selected items, update all prices). Single-record CRUD is insufficient for admin workflows.

**Implementation:** Added `createMany`, `updateMany`, `removeMany` procedures with array inputs.

**Procedures:**
- `createMany` - Accepts `{ items: Entity[] }`, returns `{ created: Entity[], count: number }`
- `updateMany` - Accepts `{ items: { id, data }[] }`, returns `{ updated: Entity[], count: number }`
- `removeMany` - Accepts `{ ids: string[] }`, returns `{ removed: Entity[], count: number }`

**Limits:** All batch operations are limited to 100 items per request.

**Hooks:**
```typescript
const { createMany, isPending } = useCreateManyProducts()
const { updateMany } = useUpdateManyProducts()
const { removeMany } = useRemoveManyProducts()

// Import products from CSV
await createMany(csvProducts)

// Update prices in bulk
await updateMany(products.map(p => ({ id: p.id, data: { price: p.price * 1.1 } })))

// Delete selected items
await removeMany(selectedIds)
```

### Complex Relations (Many-to-Many with Pivot Data)

**Status:** ✅ Implemented

**Why needed:** `belongsToMany` creates junction tables, but needs to store extra data on the relation (e.g., `quantity` on OrderItem, `role` on UserOrganization). Essential for e-commerce (cart items, order lines).

**Implementation:** Added `.through()` method to `belongsToMany()` for pivot fields.

**Usage:**
```typescript
// Order with products and pivot data (quantity, unit price)
const Order = defineEntity('Order', {
  fields: {
    orderNumber: text().required(),
    status: text().default('pending'),
  },
  relations: {
    products: belongsToMany('Product').through({
      table: 'order_items',  // Optional custom table name
      fields: {
        quantity: number().required().min(1),
        unitPrice: number().required(),
        discount: number().default(0),
      }
    }),
  },
})
```

**Generated schema:**
```typescript
export const orderItems = sqliteTable('order_items', {
  orderId: text('order_id').notNull().references(() => orders.id),
  productId: text('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
  discount: integer('discount').default(0),
})
```

### Computed/Virtual Fields

**Status:** ✅ Implemented

**Why needed:** Fields derived from other fields (e.g., `fullName` from `firstName` + `lastName`, `totalPrice` from `price * quantity`). Reduces duplication and ensures consistency.

**Implementation:** Added `computed()` field type. Computed fields are:
- Excluded from database schema (not stored)
- Excluded from create/update validation schemas
- Included in all API responses (computed at runtime)

**Usage:**
```typescript
const Person = defineEntity('Person', {
  fields: {
    firstName: text().required(),
    lastName: text().required(),
    fullName: computed({
      type: 'text',
      from: ['firstName', 'lastName'],
      get: '`${firstName} ${lastName}`'
    }),
  },
})

const OrderLine = defineEntity('OrderLine', {
  fields: {
    price: number().required(),
    quantity: number().required(),
    total: computed({
      type: 'number',
      from: ['price', 'quantity'],
      get: 'price * quantity'
    }),
  },
})
```

**Generated router:**
```typescript
// Helper function added to routers with computed fields
function withComputedFields<T extends Record<string, any>>(record: T) {
  return {
    ...record,
    fullName: `${firstName} ${lastName}`,
  }
}

// Applied to all responses
list: ...query(async () => {
  const items = await db.select()...
  return { items: items.map(withComputedFields), ... }
})
```

### Enum Fields with Database Support

**Status:** ✅ Implemented

**Why needed:** `text().oneOf(['draft', 'published'])` validates but doesn't create database enums. PostgreSQL native enums are more efficient and self-documenting.

**Implementation:** Added `enumField()` function that:
- Generates native `pgEnum` types for PostgreSQL
- Uses text columns for SQLite (validation via Zod)
- Generates `z.enum()` in validation schemas

**Usage:**
```typescript
import { defineEntity, enumField } from 'archetype-engine'

const Post = defineEntity('Post', {
  fields: {
    status: enumField(['draft', 'published', 'archived'] as const)
      .required()
      .default('draft'),
  },
})

const Order = defineEntity('Order', {
  fields: {
    priority: enumField(['low', 'medium', 'high'] as const)
      .default('medium'),
  },
})
```

**Generated PostgreSQL schema:**
```typescript
import { pgTable, pgEnum } from 'drizzle-orm/pg-core'

export const postStatusEnum = pgEnum('postStatusEnum', ['draft', 'published', 'archived'])

export const posts = pgTable('posts', {
  status: postStatusEnum('status').notNull().default('draft'),
})
```

**Generated Zod schema:**
```typescript
export const postCreateSchema = z.object({
  status: z.enum(['draft', 'published', 'archived']),
})
```

### CRUD Hooks

**Status:** ✅ Implemented

**Why needed:** Business logic before/after CRUD (e.g., send email after user created, validate stock before order, audit log on delete). Without this, developers must manually edit generated code.

**Implementation:** Added `hooks` config per entity with `beforeCreate`, `afterCreate`, `beforeUpdate`, `afterUpdate`, `beforeRemove`, `afterRemove`. Hooks are invoked in generated tRPC routers.

**Usage:**
```typescript
const Order = defineEntity('Order', {
  fields: {
    total: number().required(),
    status: enumField(['pending', 'paid', 'shipped'] as const),
  },
  hooks: true,  // Enable all hooks
  // Or granular: hooks: { beforeCreate: true, afterCreate: true }
})
```

**Generated files:**
- `generated/hooks/types.ts` - Type definitions for all hook signatures
- `generated/hooks/{entity}.ts` - Hook implementation stubs (user-editable)

**Hook implementation:**
```typescript
// generated/hooks/order.ts (edit this file)
import type { OrderHooks, HookContext, OrderCreateInput, OrderRecord } from './types'

export const orderHooks: OrderHooks = {
  async beforeCreate(input, ctx) {
    // Validate business rules, modify input
    // throw new Error('message') to abort
    return input
  },

  async afterCreate(record, ctx) {
    // Side effects: send email, audit log
    await sendOrderConfirmation(record, ctx.user)
  },

  async beforeRemove(id, ctx) {
    // Prevent deletion if order is shipped
    const order = await getOrder(id)
    if (order.status === 'shipped') {
      throw new Error('Cannot delete shipped orders')
    }
  },
}
```

**Hook context:**
```typescript
interface HookContext {
  user?: { id: string; email?: string; name?: string }
  headers?: Record<string, string>
}
```

## Not In Scope

These are **runtime concerns** that belong in your application, not the code generator:

| Concern | Why Not In Engine | Recommendation |
|---------|-------------------|----------------|
| **File Uploads** | Runtime service, needs S3/storage | Use [uploadthing](https://uploadthing.com) or presigned URLs |
| **Multi-Site Routing** | Deployment/middleware concern | Implement as Next.js middleware |
| **API Versioning** | Routing concern | Handle via route structure (`/api/v1/...`) |
| **Background Jobs** | Runtime infrastructure | Use [Trigger.dev](https://trigger.dev) or BullMQ |
| **Email/Notifications** | External service | Use [Resend](https://resend.com) or similar |
| **Payments** | External service | Use Stripe, PayPal SDK directly |

The engine generates **static code** from entity definitions. It runs at build time, not runtime. Features requiring runtime services belong in your application code.
