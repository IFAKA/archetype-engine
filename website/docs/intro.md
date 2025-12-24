---
sidebar_position: 1
slug: /
---

# Archetype

**TL;DR:** Define your data model once. Get database, validation, API, and hooks generated automatically.

```typescript
// You write this
const User = defineEntity('User', {
  fields: {
    email: text().required().email(),
    name: text().required(),
  },
  protected: 'write',
})
```

```
// You get this
generated/
├── db/schema.ts              → Drizzle tables
├── schemas/user.ts           → Zod validation
├── trpc/routers/user.ts      → CRUD API
├── hooks/useUser.ts          → React hooks
├── tests/user.test.ts        → Comprehensive tests
├── docs/openapi.json         → API documentation
├── seeds/user.ts             → Sample data
└── i18n/en/user.json         → Translation keys
```

---

## What It Generates

| You Define | You Get |
|------------|---------|
| `text().email()` | Email column + Zod `.email()` validation |
| `hasMany('Post')` | Foreign keys + joined queries |
| `protected: 'write'` | Public reads, auth-protected mutations |
| `behaviors: { timestamps: true }` | `createdAt` + `updatedAt` columns |

---

## 30-Second Start

```bash
npx create-next-app my-app && cd my-app
npm install archetype-engine
npx archetype init --yes
npx archetype generate
npx drizzle-kit push && npm run dev
```

---

## Why Use This?

**Without Archetype:**
1. Write Drizzle schema
2. Write Zod schema (duplicate field definitions)
3. Write tRPC router (duplicate again)
4. Write React hooks
5. Keep all 4 in sync manually

**With Archetype:**
1. Define entity once
2. Run `npx archetype generate`
3. Done

---

## Next: [Getting Started](/docs/getting-started)
