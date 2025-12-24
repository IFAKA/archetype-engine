---
sidebar_position: 7
---

# Generated Code

Archetype generates comprehensive, production-ready code from your entity definitions.

## What Gets Generated

From a single entity definition, you get **1,400+ lines** of production code:

```
generated/
├── db/
│   └── schema.ts              # Drizzle ORM tables
├── schemas/
│   └── {entity}.ts            # Zod validation schemas
├── trpc/routers/
│   ├── {entity}.ts            # tRPC CRUD routers
│   └── index.ts               # Combined app router
├── hooks/
│   └── use{Entity}.ts         # React Query hooks
├── tests/                     # 🆕 Auto-generated tests
│   ├── {entity}.test.ts       # Comprehensive test suites
│   └── setup.ts               # Test configuration
├── docs/                      # 🆕 Auto-generated API docs
│   ├── openapi.json           # OpenAPI 3.0 specification
│   ├── swagger.html           # Interactive Swagger UI
│   └── API.md                 # Markdown documentation
└── seeds/                     # 🆕 Auto-generated seed data
    ├── {entity}.ts            # Seed functions per entity
    ├── index.ts               # Orchestrator
    └── run.ts                 # CLI runner
```

## Database Schemas

**Location:** `generated/db/schema.ts`

Type-safe Drizzle ORM tables with:
- Column definitions matching your field types
- Foreign key constraints for relations
- Indexes for unique fields
- Timestamps (if enabled)
- Soft delete columns (if enabled)

## Validation Schemas

**Location:** `generated/schemas/{entity}.ts`

Zod schemas for runtime validation:

```typescript
// generated/schemas/product.ts
import { z } from 'zod'

export const productCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  price: z.number().positive('Price must be positive'),
  stock: z.number().int().min(0).default(0),
})

export const productUpdateSchema = z.object({
  id: z.string(),
  data: productCreateSchema.partial(),
})

export type ProductCreateInput = z.infer<typeof productCreateSchema>
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>
```

**Features:**
- Maps field types to Zod validators (`z.string()`, `z.number()`, etc.)
- Applies all validation rules (min, max, email, url, regex)
- Excludes computed fields from create/update schemas
- Supports i18n error messages when multiple languages configured
- Exports TypeScript types for use in your code

## API Routers

**Location:** `generated/trpc/routers/{entity}.ts`

Full CRUD tRPC procedures:

```typescript
// generated/trpc/routers/product.ts
import { router, publicProcedure } from '../trpc'
import { productCreateSchema, productUpdateSchema } from '../../schemas/product'

export const productRouter = router({
  // List with pagination, filtering, search
  list: publicProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      where: z.record(z.any()).optional(),
      search: z.string().optional(),
      orderBy: z.object({
        field: z.string(),
        direction: z.enum(['asc', 'desc']),
      }).optional(),
    }))
    .query(async ({ input }) => {
      // Returns: { items, total, page, limit, hasMore }
    }),

  // Get single record
  get: publicProcedure
    .input(z.string())
    .query(async ({ input: id }) => {
      // Returns single record or throws
    }),

  // Create
  create: publicProcedure
    .input(productCreateSchema)
    .mutation(async ({ input }) => {
      // Returns created record
    }),

  // Batch create
  createMany: publicProcedure
    .input(z.object({ items: z.array(productCreateSchema).max(100) }))
    .mutation(async ({ input }) => {
      // Returns { created: Product[], count: number }
    }),

  // Update
  update: publicProcedure
    .input(productUpdateSchema)
    .mutation(async ({ input }) => {
      // Returns updated record
    }),

  // Batch update
  updateMany: publicProcedure
    .input(z.object({
      items: z.array(z.object({
        id: z.string(),
        data: productCreateSchema.partial(),
      })).max(100),
    }))
    .mutation(async ({ input }) => {
      // Returns { updated: Product[], count: number }
    }),

  // Remove
  remove: publicProcedure
    .input(z.string())
    .mutation(async ({ input: id }) => {
      // Soft delete if enabled, hard delete otherwise
    }),

  // Batch remove
  removeMany: publicProcedure
    .input(z.object({ ids: z.array(z.string()).max(100) }))
    .mutation(async ({ input }) => {
      // Returns { removed: Product[], count: number }
    }),
})
```

**Features:**
- Authentication checks (uses `protectedProcedure` when entity is protected)
- Soft delete support (sets `deletedAt` instead of DELETE)
- Computed fields added to responses
- Lifecycle hooks invoked (if enabled)
- Filtering with multiple operators (eq, ne, gt, lt, contains, etc.)
- Full-text search across all text fields

## React Hooks

**Location:** `generated/hooks/use{Entity}.ts`

React Query hooks for data fetching:
- `use{Entities}()` - List with filters
- `use{Entity}(id)` - Single record
- `useCreate{Entity}()` - Create mutation
- `useUpdate{Entity}()` - Update mutation
- `useRemove{Entity}()` - Delete mutation

## Tests (New!)

**Location:** `generated/tests/{entity}.test.ts`

Comprehensive Vitest test suites covering:
- CRUD operations
- Validation (required fields, email format, min/max)
- Authentication (protected operations)
- Filtering, search, pagination
- Batch operations
- Soft delete, timestamps

**Usage:**
```bash
npm test
```

## API Documentation (New!)

**Location:** `generated/docs/`

Complete API documentation:
- **OpenAPI 3.0 spec** (`openapi.json`) - Machine-readable API definition
- **Swagger UI** (`swagger.html`) - Interactive API explorer
- **Markdown docs** (`API.md`) - Human-readable documentation

**Usage:**
```bash
# Open Swagger UI in browser
open generated/docs/swagger.html
```

## Seed Data (New!)

**Location:** `generated/seeds/`

Realistic sample data for development:
- Smart field mapping (emails get emails, names get person names)
- Respects validation constraints
- Handles entity dependencies
- Optional faker.js integration

**Usage:**
```bash
npm run seed         # Seed database
npm run seed --reset # Reset + seed
```

## Regeneration

When you update entities:
```bash
npx archetype generate
```

All files are regenerated. Never edit generated files directly - use hooks for custom logic.

## Stats

For typical setup (User + Post entities):

| Component | Lines Generated |
|-----------|----------------|
| Database schemas | ~150 |
| Validation | ~100 |
| API routers | ~600 |
| React hooks | ~300 |
| Tests | ~434 |
| API docs | ~1,097 |
| Seed data | ~151 |
| **Total** | **~2,832 lines** |

**From ~40 lines of entity definitions.**

**Ratio: 71:1** (71 lines generated per 1 written)
