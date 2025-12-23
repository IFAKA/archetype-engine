<img width="1280" height="640" alt="image" src="https://github.com/user-attachments/assets/eb752f28-ae21-49e6-b0ff-8adc1f4c5cd5" />

# Archetype Engine

**Define your data model once. Get database, API, validation, and React hooks.**

```typescript
const Task = defineEntity('Task', {
  fields: {
    title: text().required().min(1).max(200),
    done: boolean().default(false),
  }
})
```

Run `npx archetype generate` → get Drizzle schema, tRPC API, Zod validation, React hooks.

---

## Why use this?

| Tool | What it does | What you still write |
|------|--------------|---------------------|
| Prisma | Database schema → Types | API, validation, hooks |
| tRPC | Type-safe API | Schema, validation, CRUD |
| Zod | Validation schemas | Database, API, hooks |
| **Archetype** | **Schema → Everything** | Business logic only |

You're not replacing tools—you're **generating** the boilerplate.

---

## Quick Start

```bash
npx create-next-app my-app && cd my-app
npm install archetype-engine
npx archetype init --yes
npx archetype generate
npx drizzle-kit push && npm run dev
```

### Local Development (npm link)

To use a local unpublished version:

```bash
# In archetype-engine directory
npm run build && npm link

# In your project
npm link archetype-engine
```

**Done.** You now have database tables, type-safe API, validation, and React hooks.

---

## What You Get

```
generated/
├── db/schema.ts           # Drizzle ORM tables
├── schemas/product.ts     # Zod validation
├── trpc/routers/product.ts # CRUD API with pagination + filters
└── hooks/useProduct.ts    # React Query hooks
```

**15 lines of entity definition → 300+ lines of type-safe code.**

---

## Documentation

Full documentation available at **[archetype-engine.dev](https://archetype-engine.dev)**

- [Getting Started](https://archetype-engine.dev/docs/getting-started)
- [Fields & Validation](https://archetype-engine.dev/docs/fields)
- [Relations](https://archetype-engine.dev/docs/relations)
- [Authentication](https://archetype-engine.dev/docs/authentication)
- [Filtering & Search](https://archetype-engine.dev/docs/filtering)
- [Lifecycle Hooks](https://archetype-engine.dev/docs/hooks)
- [Generated Code Reference](https://archetype-engine.dev/docs/generated-code)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for architecture details.

---

## License

MIT
