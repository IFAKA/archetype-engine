---
sidebar_position: 16
---

# External Sources (Headless Mode)

Connect Archetype to existing REST APIs instead of generating database schemas. Perfect for:
- Headless CMS integration (Contentful, Sanity, Strapi)
- Legacy API modernization
- Microservices frontends
- Third-party API wrappers

## Quick Example

```typescript
import { defineConfig, defineEntity, text, number, external } from 'archetype-engine'

// Define Product entity that maps to an external API
const Product = defineEntity('Product', {
  fields: {
    name: text().required(),
    price: number().required(),
  },
  source: external('env:API_URL', {
    pathPrefix: '/v1',
  }),
})

export default defineConfig({
  mode: 'headless',  // Skip database generation
  entities: [Product],
})
```

Generated code:
- ✅ tRPC routers calling the external API
- ✅ Zod validation schemas
- ✅ React hooks
- ✅ TypeScript types
- ❌ No database schema

## Basic Setup

### 1. Define External Source

```typescript
import { external } from 'archetype-engine'

const Product = defineEntity('Product', {
  fields: {
    name: text().required(),
    price: number().required(),
  },
  source: external('https://api.example.com'),
})
```

This generates API calls:
- `GET https://api.example.com/products` (list)
- `GET https://api.example.com/products/:id` (get)
- `POST https://api.example.com/products` (create)
- `PUT https://api.example.com/products/:id` (update)
- `DELETE https://api.example.com/products/:id` (remove)

### 2. Environment Variables

Use `env:` prefix for environment-based URLs:

```typescript
source: external('env:API_URL')
```

Then in `.env`:
```bash
API_URL=https://api.staging.example.com
```

## Configuration Options

### Path Prefix

Add version or namespace to all endpoints:

```typescript
source: external('env:API_URL', {
  pathPrefix: '/v1',
})
// Generates: /v1/products, /v1/products/:id
```

### Custom Resource Name

Override auto-pluralization:

```typescript
source: external('env:API_URL', {
  resourceName: 'inventory',
})
// Generates: /inventory, /inventory/:id (instead of /products)
```

### Endpoint Overrides

For non-REST APIs:

```typescript
source: external('env:LEGACY_API', {
  override: {
    list: 'GET /catalog/search',
    get: 'GET /catalog/item/:sku',
    create: 'POST /admin/new-item',
    update: 'PATCH /admin/item/:sku',
    delete: 'DELETE /admin/item/:sku',
  },
})
```

### Authentication

#### Bearer Token

```typescript
source: external('env:API_URL', {
  auth: {
    type: 'bearer',
  },
})
// Adds header: Authorization: Bearer {token}
```

#### API Key

```typescript
source: external('env:API_URL', {
  auth: {
    type: 'api-key',
  },
})
// Adds header: X-API-Key: {key}
```

#### Custom Header

```typescript
source: external('env:API_URL', {
  auth: {
    type: 'api-key',
    header: 'X-Custom-API-Key',
  },
})
```

## Global vs Entity-Level Sources

### Global Source (All Entities)

```typescript
export default defineConfig({
  mode: 'headless',
  source: external('env:CMS_API', { pathPrefix: '/api' }),
  entities: [Product, Category],  // Both use CMS_API
})
```

### Per-Entity Source

```typescript
const Product = defineEntity('Product', {
  fields: { ... },
  source: external('env:PRODUCT_API'),
})

const User = defineEntity('User', {
  fields: { ... },
  source: external('env:AUTH_API'),
})

export default defineConfig({
  mode: 'headless',
  entities: [Product, User],  // Each uses different API
})
```

### Mixed Sources

```typescript
export default defineConfig({
  mode: 'headless',
  source: external('env:DEFAULT_API'),  // Fallback for entities
  entities: [
    Product,  // Uses DEFAULT_API
    User,     // Uses DEFAULT_API
    Order.withSource(external('env:ORDER_API')),  // Overrides
  ],
})
```

## Generated Service Layer

Archetype generates service functions for each entity:

```typescript
// generated/services/productService.ts
import { ProductCreateInput, ProductUpdateInput } from '../schemas/product'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const productService = {
  async list(): Promise<Product[]> {
    const res = await fetch(`${API_URL}/v1/products`)
    if (!res.ok) throw new Error('Failed to fetch products')
    return res.json()
  },

  async get(id: string): Promise<Product> {
    const res = await fetch(`${API_URL}/v1/products/${id}`)
    if (!res.ok) throw new Error('Product not found')
    return res.json()
  },

  async create(data: ProductCreateInput): Promise<Product> {
    const res = await fetch(`${API_URL}/v1/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to create product')
    return res.json()
  },

  async update(id: string, data: ProductUpdateInput): Promise<Product> {
    const res = await fetch(`${API_URL}/v1/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to update product')
    return res.json()
  },

  async remove(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/v1/products/${id}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Failed to delete product')
  },
}
```

tRPC routers automatically call these services.

## Use Cases

### Headless CMS (Contentful)

```typescript
const Article = defineEntity('Article', {
  fields: {
    title: text().required(),
    body: text(),
    publishedAt: date(),
  },
  source: external('env:CONTENTFUL_API', {
    pathPrefix: '/spaces/your-space/entries',
    auth: {
      type: 'bearer',
    },
  }),
})
```

### Legacy API Modernization

```typescript
const Customer = defineEntity('Customer', {
  fields: {
    customerId: text().required(),
    name: text(),
  },
  source: external('env:LEGACY_SYSTEM', {
    resourceName: 'customer_master',
    override: {
      list: 'GET /api/customers/list',
      get: 'GET /api/customers/get_by_id/:id',
      create: 'POST /api/customers/create',
      update: 'POST /api/customers/update/:id',
      delete: 'POST /api/customers/delete/:id',
    },
  }),
})
```

### Microservices Frontend

```typescript
export default defineConfig({
  mode: 'headless',
  entities: [
    Product.withSource(external('env:CATALOG_SERVICE')),
    Order.withSource(external('env:ORDER_SERVICE')),
    User.withSource(external('env:AUTH_SERVICE')),
    Payment.withSource(external('env:PAYMENT_SERVICE')),
  ],
})
```

## Limitations

- **No migrations** - External APIs own their schemas
- **No foreign keys** - Relations are logical, not enforced
- **API-dependent filters** - Filtering depends on API support
- **No transactions** - Cross-entity operations aren't atomic

## Hybrid Mode

Combine database and external sources:

```typescript
export default defineConfig({
  mode: 'full',  // Database available
  database: { type: 'postgres', url: 'postgresql://...' },
  entities: [
    User,       // Stored in database (no source)
    Product,    // Stored in database
    Inventory.withSource(external('env:WAREHOUSE_API')),  // External
  ],
})
```

- `User` and `Product` generate database tables
- `Inventory` calls external API
- All get tRPC routers and React hooks

## Environment Setup

```bash
# .env.local
API_URL=https://api.example.com
CMS_API=https://cms.example.com
PRODUCT_API=https://products.api.example.com
AUTH_API=https://auth.api.example.com

# For authenticated APIs
API_TOKEN=your-bearer-token
API_KEY=your-api-key
```

Use in services:
```typescript
headers: {
  Authorization: `Bearer ${process.env.API_TOKEN}`,
}
```

## Related

- [Modes](/docs/modes) - Full vs Headless vs API-only
- [Entities](/docs/entities) - Entity definitions
- [JSON Manifest](/docs/json-manifest) - Define external sources in JSON
