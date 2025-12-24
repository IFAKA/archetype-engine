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
- Create input validation
- Update input validation
- Type-safe error messages
- i18n support (if configured)

## API Routers

**Location:** `generated/trpc/routers/{entity}.ts`

Full CRUD tRPC procedures:
- `list` - Paginated with filtering/search
- `get` - Single record by ID
- `create`, `update`, `remove`
- `createMany`, `updateMany`, `removeMany`
- Authentication checks (if protected)

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
