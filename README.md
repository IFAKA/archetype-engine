<img width="1280" height="640" alt="image" src="https://github.com/user-attachments/assets/eb752f28-ae21-49e6-b0ff-8adc1f4c5cd5" />

# Archetype Engine

**Define your data model. Generate the boring parts.**

```typescript
export const Task = defineEntity('Task', {
  fields: {
    title: text().required().min(1).max(200),
    done: boolean().default(false),
  },
  behaviors: { timestamps: true }
})
```

Run `npx archetype generate` → get Drizzle schema, Zod validation, tRPC router, React hooks. Done.

## Quick Start

```bash
npx create-next-app my-app && cd my-app
npm install archetype-engine
npx archetype init --yes
npx archetype generate
npx drizzle-kit push && npm run dev
```

You now have a working fullstack app with a Task entity.

## Why Archetype?

Most frameworks make you wire things up manually: write a schema, then validation, then API routes, then hooks. You become a copy-paste machine.

Archetype flips this. You define the **what** (entities), it generates the **how** (infrastructure). One source of truth. No drift between layers.

**What you define:**
```typescript
email: text().required().unique().email()
```

**What you get:**
- Drizzle column with unique constraint
- Zod schema with email validation
- tRPC router with type-safe CRUD
- React hooks with form validation
- All in sync. Always.

## What Gets Generated

```
generated/
├── db/schema.ts              # Drizzle ORM schema
├── schemas/task.ts           # Zod validation
├── trpc/routers/task.ts      # tRPC CRUD router
├── hooks/useTask.ts          # React Query hooks
└── erd.md                    # Entity diagram
```

## Using the Hooks

```typescript
import { useTasks, useTaskForm, useTaskRemove } from "@/generated/hooks/useTask";

const { data } = useTasks();                    // Fetch all
const { submit, register } = useTaskForm();     // Create with validation
const { remove } = useTaskRemove();             // Delete
```

**All generated hooks:**
| Hook | Purpose |
|------|---------|
| `useTasks()` | Fetch all with React Query caching |
| `useTask(id)` | Fetch single by ID |
| `useTaskForm()` | Create form with Zod validation |
| `useTaskEditForm(id)` | Edit form, pre-filled |
| `useTaskRemove()` | Delete mutation |
| `useCreateTask()` | Raw create mutation |
| `useUpdateTask()` | Raw update mutation |

## Define Entities

```typescript
// archetype/entities/user.ts
import { defineEntity, text, number, boolean, hasMany } from 'archetype-engine'

export const User = defineEntity('User', {
  fields: {
    email: text().required().unique().email(),
    name: text().required().min(2).max(100),
    role: text().default('user').oneOf(['admin', 'user', 'guest']),
    age: number().optional().min(0).integer(),
    isActive: boolean().default(true),
  },
  relations: {
    posts: hasMany('Post'),
  },
  behaviors: {
    timestamps: true,    // createdAt, updatedAt
    softDelete: true,    // deletedAt instead of hard delete
  }
})
```

## Config

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

## Field Types

### text()
```typescript
text()
  .required()           // Not null
  .optional()           // Nullable
  .unique()             // Unique constraint
  .default('value')     // Default value
  .min(5).max(255)      // Length constraints
  .email()              // Email format
  .url()                // URL format
  .regex(/pattern/)     // Custom regex
  .oneOf(['a', 'b'])    // Enum values
  .trim()               // Trim whitespace
  .lowercase()          // Convert to lowercase
  .uppercase()          // Convert to uppercase
  .label('Email')       // Label for error messages
```

### number()
```typescript
number().required().min(0).max(100).integer().positive()
```

### boolean() / date()
```typescript
boolean().default(false)
date().default('now')
```

## Relations

```typescript
import { hasOne, hasMany, belongsToMany } from 'archetype-engine'

relations: {
  author: hasOne('User'),           // FK: authorId
  comments: hasMany('Comment'),     // One-to-many
  tags: belongsToMany('Tag'),       // Many-to-many (junction table)
}
```

## CLI

```bash
npx archetype init             # Interactive setup
npx archetype init --yes       # Defaults (SQLite)
npx archetype init --headless  # No database (external API)
npx archetype generate         # Generate from entities
npx archetype view             # View ERD in browser
```

## Database Options

```typescript
// SQLite (default)
database: { type: 'sqlite', file: './sqlite.db' }

// PostgreSQL
database: { type: 'postgres', url: process.env.DATABASE_URL }

// MySQL
database: { type: 'mysql', url: process.env.DATABASE_URL }
```

---

## Advanced: Headless Mode

For frontends connecting to external APIs instead of a local database.

```typescript
import { defineConfig, external } from 'archetype-engine'

export default defineConfig({
  mode: 'headless',
  source: external('env:API_URL'),
  entities: [Product],
})
```

**Generates:**
```
generated/
├── schemas/product.ts        # Zod validation
├── services/
│   ├── apiClient.ts          # Fetch wrapper
│   └── productService.ts     # CRUD for external API
├── trpc/routers/             # tRPC (using services)
└── hooks/useProduct.ts       # React hooks
```

**Skips:** `db/schema.ts`, `drizzle.config.ts`

### External Source Options

```typescript
external('env:API_URL')                              // Simple
external('env:API_URL', { pathPrefix: '/v1' })       // Path prefix
external('env:API_URL', { resourceName: 'item' })    // Custom resource
external('env:API_URL', { auth: { type: 'bearer' }}) // Auth header

// Override specific endpoints
external('env:LEGACY_API', {
  override: {
    list: 'GET /catalog/search',
    get: 'GET /catalog/item/:sku',
  }
})
```

---

## Contributing

```bash
git clone https://github.com/ifaka/archetype.git
cd archetype
npm install && npm run build
npm link

# In your test project:
npm link archetype-engine
```

```bash
npm run build       # Compile
npm run test:run    # Run tests
```

## License

MIT
