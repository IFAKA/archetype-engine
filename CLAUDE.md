# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run build          # Compile TypeScript to dist/
npm run generate       # Generate code from archetype/index.ts
npm run test:run       # Run tests
```

## CLI Commands

```bash
npx archetype init                    # Create config + entities + infrastructure
npx archetype init --yes              # Quick setup with defaults (SQLite)
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

### Config Format

```typescript
// archetype.config.ts
import { defineConfig } from 'archetype-engine'
import { User } from './archetype/entities/user'
import { Post } from './archetype/entities/post'

export default defineConfig({
  entities: [User, Post],
  database: { type: 'sqlite', file: './sqlite.db' },
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
  }
})
```

### Generated Output

```
generated/
├── db/schema.ts           # Drizzle ORM schema
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

## Testing

```bash
npm run test       # Watch mode
npm run test:run   # Single run
```

Tests are in `tests/` directory using Vitest.
