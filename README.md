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

Run `npx archetype generate` → get Drizzle schema, Zod validation, tRPC router, React hooks.

## Quick Start

```bash
npx create-next-app my-app && cd my-app
npm install archetype-engine
npx archetype init --yes
```

This creates:
```
archetype.config.ts          # Your config
archetype/entities/task.ts   # Example Task entity
lib/                         # Database + tRPC infrastructure
```

Now generate and run:
```bash
npx archetype generate
npx drizzle-kit push && npm run dev
```

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

```tsx
'use client'
import { useTasks, useTaskForm, useTaskRemove } from "@/generated/hooks/useTask"

export default function TaskList() {
  const { data: tasks } = useTasks()
  const { submit, register } = useTaskForm()
  const { remove } = useTaskRemove()

  return (
    <div>
      <form onSubmit={submit}>
        <input {...register('title')} placeholder="New task" />
        <button type="submit">Add</button>
      </form>
      <ul>
        {tasks?.map(task => (
          <li key={task.id}>
            {task.title}
            <button onClick={() => remove(task.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
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

## Defining Entities

```typescript
// archetype/entities/task.ts
import { defineEntity, text, boolean, date } from 'archetype-engine'

export const Task = defineEntity('Task', {
  fields: {
    title: text().required().min(1).max(200),
    description: text().optional(),
    done: boolean().default(false),
    dueDate: date().optional(),
  },
  behaviors: {
    timestamps: true,    // adds createdAt, updatedAt
    softDelete: true,    // adds deletedAt instead of hard delete
  }
})
```

Register entities in your config:

```typescript
// archetype.config.ts
import { defineConfig } from 'archetype-engine'
import { Task } from './archetype/entities/task'

export default defineConfig({
  entities: [Task],
  database: { type: 'sqlite', file: './sqlite.db' },
})
```

## Field Types

```typescript
// text
text().required().unique().default('value')
text().min(5).max(255).label('Title')
text().email()                    // email format
text().url()                      // URL format
text().regex(/pattern/)           // custom regex
text().oneOf(['draft', 'published']) // enum
text().trim().lowercase()         // transforms

// number
number().required().min(0).max(100)
number().integer().positive()

// boolean
boolean().default(false)

// date
date().optional()
date().default('now')             // current timestamp
```

## Relations

Relations go inside an entity definition. The relation key becomes the foreign key name.

```typescript
// archetype/entities/post.ts
export const Post = defineEntity('Post', {
  fields: {
    title: text().required(),
    body: text().required(),
  },
  relations: {
    // Creates authorId column pointing to User
    author: hasOne('User'),

    // Post has many Comments (Comment needs postId)
    comments: hasMany('Comment'),

    // Creates PostTag junction table
    tags: belongsToMany('Tag'),
  }
})
```

```typescript
import { hasOne, hasMany, belongsToMany } from 'archetype-engine'
```

## CLI

```bash
npx archetype init             # Interactive setup
npx archetype init --yes       # Defaults (SQLite)
npx archetype generate         # Generate from entities
npx archetype view             # View ERD in browser
```

## Database Options

```typescript
database: { type: 'sqlite', file: './sqlite.db' }
database: { type: 'postgres', url: process.env.DATABASE_URL }
database: { type: 'mysql', url: process.env.DATABASE_URL }
```

## Headless Mode

For frontends connecting to external APIs instead of a local database:

```bash
npx archetype init --headless
```

```typescript
import { defineConfig, external } from 'archetype-engine'

export default defineConfig({
  mode: 'headless',
  source: external('env:API_URL'),
  entities: [Task],
})
```

Generates services and hooks but skips database schema. See [headless docs](docs/headless.md) for external source options.

## Contributing

```bash
git clone https://github.com/ifaka/archetype.git && cd archetype
npm install && npm run build
npm link

# In test project:
npm link archetype-engine
```

## License

MIT
