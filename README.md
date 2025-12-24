<img width="1280" height="640" alt="image" src="https://github.com/user-attachments/assets/eb752f28-ae21-49e6-b0ff-8adc1f4c5cd5" />

# Archetype Engine

[![npm version](https://badge.fury.io/js/archetype-engine.svg)](https://www.npmjs.com/package/archetype-engine)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**The missing backend layer for AI-generated frontends.**

Define entities in TypeScript. Get production-ready backends instantly.

```typescript
const Product = defineEntity('Product', {
  fields: {
    name: text().required().min(1).max(200),
    price: number().required().positive(),
    stock: number().integer().min(0).default(0),
  }
})
```

Run `npx archetype generate` → get:
- ✅ **Drizzle ORM schemas** (type-safe database)
- ✅ **tRPC routers** (CRUD + pagination + filters)
- ✅ **Zod validation** (runtime safety)
- ✅ **React hooks** (useProduct, useCreateProduct, etc.)

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

## Quick Start (2 minutes)

```bash
# 1. Create a new Next.js project
npx create-next-app@latest my-app && cd my-app

# 2. Install Archetype
npm install archetype-engine

# 3. Initialize with a template
npx archetype init

# Choose from:
# - SaaS Multi-Tenant (Workspace, Team, Member)
# - E-commerce (Product, Order, Customer)
# - Blog/CMS (Post, Author, Comment)
# - Task Management (Project, Task, Label)

# 4. Generate code
npx archetype generate

# 5. Push to database and run
npx drizzle-kit push
npm run dev
```

**🎉 Done!** You now have a fully functional backend with type-safe APIs.

---

## What You Get

From a single entity definition, Archetype generates:

```
generated/
├── db/
│   └── schema.ts              # Drizzle ORM tables (type-safe SQL)
├── schemas/
│   └── product.ts             # Zod validation schemas
├── trpc/routers/
│   ├── product.ts             # Full CRUD API:
│   │                          #   - list (with pagination, filters, search)
│   │                          #   - get (by ID)
│   │                          #   - create, createMany
│   │                          #   - update, updateMany
│   │                          #   - remove, removeMany
│   └── index.ts               # Router aggregation
└── hooks/
    └── useProduct.ts          # React Query hooks:
                               #   - useProducts(), useProduct(id)
                               #   - useCreateProduct(), useUpdateProduct()
                               #   - useRemoveProduct(), etc.
```

**15 lines of entity code → 400+ lines of production-ready backend.**

### Live Example

**Define once:**
```typescript
const Order = defineEntity('Order', {
  fields: {
    orderNumber: text().required().unique(),
    status: enumField(['pending', 'paid', 'shipped'] as const),
    total: number().required().positive(),
  },
  relations: {
    customer: hasOne('Customer'),
    items: hasMany('OrderItem'),
  },
  behaviors: {
    timestamps: true,
  },
  protected: 'all',  // Requires authentication
})
```

**Use immediately:**
```typescript
// In your React component
const { data: orders } = useOrders({ 
  where: { status: 'pending' },
  orderBy: { field: 'createdAt', direction: 'desc' }
})

const { mutate: createOrder } = useCreateOrder()
createOrder({ 
  orderNumber: 'ORD-001',
  status: 'pending',
  total: 99.99 
})
```

No API boilerplate. No manual validation. No CRUD repetition. Just works.

---

## Features

- 🎯 **Type-Safe Everything** - Database ↔ API ↔ Frontend sync guaranteed
- 🚀 **Production-Ready Templates** - SaaS, E-commerce, Blog, Task Management
- 🔐 **Built-in Auth** - NextAuth v5 integration with multiple providers
- 🔍 **Smart Filtering** - Pagination, search, sorting out of the box
- 🪝 **Lifecycle Hooks** - Add business logic before/after CRUD operations
- 📊 **Auto ERD** - Visual database diagrams with `npx archetype view`
- 🌍 **i18n Ready** - Multi-language support for generated code
- ⚡ **Fast** - Generate 1000+ lines of code in seconds

## Use Cases

| Template | Perfect For | Entities Included |
|----------|-------------|-------------------|
| **SaaS Multi-Tenant** | Team collaboration apps | Workspace, Team, Member + roles |
| **E-commerce** | Online stores, marketplaces | Product, Customer, Order, OrderItem |
| **Blog/CMS** | Content platforms, news sites | Post, Author, Comment |
| **Task Management** | Todo apps, kanban boards | Project, Task, Label |

## Documentation

📚 **Full docs:** [archetype-engine.vercel.app](https://archetype-engine.vercel.app)

**Popular guides:**
- [Getting Started](https://archetype-engine.vercel.app/docs/getting-started) - 5-minute tutorial
- [Fields & Validation](https://archetype-engine.vercel.app/docs/fields) - text(), number(), date(), etc.
- [Relations](https://archetype-engine.vercel.app/docs/relations) - hasOne, hasMany, belongsToMany
- [Authentication](https://archetype-engine.vercel.app/docs/authentication) - Protect routes & entities
- [Filtering & Search](https://archetype-engine.vercel.app/docs/filtering) - Build admin panels
- [Lifecycle Hooks](https://archetype-engine.vercel.app/docs/hooks) - Custom business logic
- [AI Integration](https://archetype-engine.vercel.app/docs/ai-module) - Build AI app builders

---

## Why Archetype?

### The Problem: AI Tools Generate Incomplete Backends

Tools like **v0.dev**, **Bolt.new**, and **Cursor** generate beautiful UIs but:
- ❌ Hardcoded mock data
- ❌ No database integration
- ❌ No type safety
- ❌ No production-ready APIs

You get a gorgeous frontend that doesn't connect to anything real.

### The Solution: Archetype Completes the Stack

Archetype generates the **missing backend layer**:
- ✅ Real database schemas (Drizzle ORM)
- ✅ Type-safe APIs (tRPC)
- ✅ Runtime validation (Zod)
- ✅ React hooks for data fetching

**Use case:** Generate UI with v0 → Add backend with Archetype → Deploy to production.

---

## Roadmap

- [x] Core entity system with relations
- [x] Pagination, filtering, search
- [x] Authentication integration (NextAuth v5)
- [x] CRUD lifecycle hooks
- [x] Batch operations (createMany, updateMany, removeMany)
- [x] Computed fields
- [x] Enum support
- [ ] Multi-tenancy utilities (Q1 2026)
- [ ] RBAC/permissions framework (Q1 2026)
- [ ] Rate limiting (Q2 2026)
- [ ] Admin UI generator (Q2 2026)

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Architecture overview
- Development setup
- How to add features
- Testing guidelines

---

## License

MIT - Use freely in commercial and open-source projects.

---

## Support

- 📖 **Docs:** [archetype-engine.vercel.app](https://archetype-engine.vercel.app)
- 🐛 **Issues:** [GitHub Issues](https://github.com/IFAKA/archetype-engine/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/IFAKA/archetype-engine/discussions)
- 🐦 **Updates:** Follow [@archetype_dev](https://twitter.com/archetype_dev)

---

**Built with ❤️ for developers tired of writing boilerplate.**
