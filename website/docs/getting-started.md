---
sidebar_position: 2
---

# Getting Started

Get up and running with Archetype in under 5 minutes.

## Prerequisites

- Node.js 18+
- A Next.js project (or create one)

## Installation

### Option 1: New Project

```bash
# Create Next.js project
npx create-next-app my-app
cd my-app

# Install archetype
npm install archetype-engine

# Initialize (creates config + entities + infrastructure)
npx archetype init --yes

# Generate code
npx archetype generate

# Push database schema and run
npx drizzle-kit push
npm run dev
```

### Option 2: Existing Project

```bash
npm install archetype-engine
npx archetype init
npx archetype generate
```

### Option 3: Local Development (npm link)

To use an unpublished local version:

```bash
# In archetype-engine directory
npm run build && npm link

# In your project
npm link archetype-engine
npx archetype init
npx archetype generate
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `npx archetype init` | Create config, entities folder, and infrastructure |
| `npx archetype init --yes` | Quick setup with SQLite defaults |
| `npx archetype init --headless` | Setup without database (for edge/serverless) |
| `npx archetype generate` | Generate code from entity definitions |
| `npx archetype view` | Open ERD diagram in browser |

## Project Structure

After initialization, your project will have:

```
my-app/
├── archetype.config.ts          # Main configuration
├── archetype/
│   └── entities/
│       └── task.ts              # Example entity
├── generated/                   # Auto-generated (don't edit)
│   ├── db/
│   │   └── schema.ts            # Drizzle schema
│   ├── schemas/
│   │   └── task.ts              # Zod validation
│   ├── trpc/
│   │   └── routers/
│   │       ├── task.ts          # tRPC router
│   │       └── index.ts         # Combined router
│   ├── hooks/
│   │   └── useTask.ts           # React hooks
│   └── erd.md                   # Mermaid diagram
└── src/
    └── server/
        ├── db.ts                # Database connection
        └── trpc.ts              # tRPC setup
```

## Configuration

The `archetype.config.ts` file is your main configuration:

```typescript
import { defineConfig } from 'archetype-engine'
import { Task } from './archetype/entities/task'

export default defineConfig({
  entities: [Task],
  database: {
    type: 'sqlite',
    file: './sqlite.db',
  },
})
```

### Database Options

```typescript
// SQLite
database: { type: 'sqlite', file: './sqlite.db' }

// PostgreSQL
database: { type: 'postgres', url: process.env.DATABASE_URL }

// Turso
database: { type: 'turso', url: process.env.TURSO_URL, authToken: process.env.TURSO_TOKEN }
```

## Next Steps

- [Define entities](/docs/entities) - Learn the entity API
- [Add fields](/docs/fields) - Text, number, boolean, date fields
- [Set up relations](/docs/relations) - hasOne, hasMany, belongsToMany
- [Enable authentication](/docs/authentication) - Protect your API
