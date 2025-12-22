---
sidebar_position: 10
---

# Filtering & Search

List endpoints support filtering, searching, sorting, and pagination out of the box.

## Basic Usage

```typescript
const { data } = useProducts({
  where: { category: 'electronics' },
  orderBy: { field: 'price', direction: 'asc' },
  search: 'laptop',
  page: 1,
  limit: 20,
})
```

## Pagination

All list endpoints return paginated results:

```typescript
const { data } = useProducts({ page: 2, limit: 50 })

// Response shape:
{
  items: [...],       // Array of records
  total: 150,         // Total count matching filters
  page: 2,            // Current page
  limit: 50,          // Items per page
  hasMore: true,      // Whether more pages exist
}
```

Default: `page: 1`, `limit: 20`

## Filtering with where

### Simple Equality

```typescript
// Shorthand - implicit 'eq' operator
where: { status: 'active' }
where: { categoryId: '123' }

// Explicit operator
where: { status: { eq: 'active' } }
```

### Text Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equals | `{ name: { eq: 'iPhone' } }` |
| `ne` | Not equals | `{ status: { ne: 'deleted' } }` |
| `contains` | Contains substring | `{ name: { contains: 'phone' } }` |
| `startsWith` | Starts with | `{ sku: { startsWith: 'ELEC-' } }` |
| `endsWith` | Ends with | `{ email: { endsWith: '@gmail.com' } }` |

### Number/Date Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equals | `{ price: { eq: 100 } }` |
| `ne` | Not equals | `{ quantity: { ne: 0 } }` |
| `gt` | Greater than | `{ price: { gt: 50 } }` |
| `gte` | Greater or equal | `{ stock: { gte: 10 } }` |
| `lt` | Less than | `{ price: { lt: 100 } }` |
| `lte` | Less or equal | `{ rating: { lte: 3 } }` |

### Boolean

```typescript
where: { isActive: true }
where: { isPublished: false }
```

### Multiple Conditions

All conditions are AND'd together:

```typescript
where: {
  category: 'electronics',
  price: { lt: 500 },
  isActive: true,
}
// WHERE category = 'electronics' AND price < 500 AND is_active = true
```

## Full-Text Search

The `search` parameter searches across all text fields:

```typescript
const { data } = useProducts({ search: 'wireless headphones' })
```

This generates:
```sql
WHERE name LIKE '%wireless headphones%'
   OR description LIKE '%wireless headphones%'
   OR sku LIKE '%wireless headphones%'
```

## Sorting

```typescript
const { data } = useProducts({
  orderBy: { field: 'price', direction: 'asc' },
})

// Or descending
orderBy: { field: 'createdAt', direction: 'desc' }
```

Valid directions: `'asc'` | `'desc'`

## Complete Example

```typescript
function ProductList() {
  const [filters, setFilters] = useState({
    category: 'electronics',
    page: 1,
  })

  const { data, isLoading } = useProducts({
    where: {
      category: filters.category,
      price: { lt: 1000 },
      isActive: true,
    },
    orderBy: { field: 'price', direction: 'asc' },
    search: filters.search,
    page: filters.page,
    limit: 20,
  })

  if (isLoading) return <Spinner />

  return (
    <div>
      <p>Showing {data.items.length} of {data.total} products</p>

      {data.items.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}

      {data.hasMore && (
        <button onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>
          Load More
        </button>
      )}
    </div>
  )
}
```

## tRPC Direct Usage

```typescript
// Server-side or in API routes
const products = await trpc.product.list.query({
  where: {
    category: { eq: 'electronics' },
    price: { gte: 100, lte: 500 },
  },
  orderBy: { field: 'name', direction: 'asc' },
  page: 1,
  limit: 50,
})
```
