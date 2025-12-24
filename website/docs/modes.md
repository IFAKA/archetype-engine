---
sidebar_position: 3
---

# Modes

Archetype supports two generation modes. Pick based on your backend.

## Quick Comparison

| | Full Stack | Headless |
|---|---|---|
| **Use when** | You own the database | API is external |
| **Database** | SQLite, Postgres, MySQL | None |
| **Generates** | Schema + Routers + Hooks | Services + Routers + Hooks |
| **Init command** | `npx archetype init --yes` | `npx archetype init --headless` |

---

## Full Stack Mode

**You own the database.** Archetype generates everything from schema to hooks.

```bash
npx archetype init --yes
```

### What you get

```
generated/
├── db/schema.ts              ← Drizzle tables
├── schemas/product.ts        ← Zod validation
├── trpc/routers/             ← CRUD API
├── hooks/useProduct.ts       ← React Query hooks
├── tests/product.test.ts     ← Vitest tests
├── docs/openapi.json         ← API documentation
├── seeds/product.ts          ← Sample data
└── i18n/en/product.json      ← Translation keys
```

### Config example

```typescript
// archetype.config.ts
export default defineConfig({
  entities: [Product],
  database: {
    type: 'sqlite',       // or 'postgres', 'mysql'
    file: './sqlite.db',
  },
})
```

---

## Headless Mode

**Database is external.** You're connecting to a CMS, third-party API, or existing backend.

```bash
npx archetype init --headless
```

### What you get

```
generated/
├── schemas/product.ts         ← Zod validation
├── services/productService.ts ← API client stubs
├── trpc/routers/              ← Routers call services
├── hooks/useProduct.ts        ← React Query hooks
├── tests/product.test.ts      ← Vitest tests (no DB tests)
├── docs/openapi.json          ← API documentation
└── i18n/en/product.json       ← Translation keys
```

### Config example

```typescript
// archetype.config.ts
export default defineConfig({
  mode: 'headless',
  entities: [Product],
  // No database config needed
})
```

### Service layer

Headless mode generates service stubs you fill in:

```typescript
// generated/services/productService.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL

export const productService = {
  async list(): Promise<Product[]> {
    const res = await fetch(`${API_URL}/products`)
    return res.json()
  },

  async get(id: string): Promise<Product> {
    const res = await fetch(`${API_URL}/products/${id}`)
    return res.json()
  },

  async create(data: ProductCreate): Promise<Product> {
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return res.json()
  },
}
```

---

## When to use which

### Use Full Stack when:
- Building a new app from scratch
- You control the database
- Using SQLite, Postgres, or MySQL

### Use Headless when:
- Connecting to a headless CMS (Contentful, Sanity)
- Consuming an existing REST/GraphQL API
- Building a frontend for an existing backend
- Deploying to edge/serverless without database access
