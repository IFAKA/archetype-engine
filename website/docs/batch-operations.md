---
sidebar_position: 11
---

# Batch Operations

Perform bulk create, update, and delete operations efficiently.

## Available Operations

| Procedure | Description | Limit |
|-----------|-------------|-------|
| `createMany` | Insert multiple records | 100 items |
| `updateMany` | Update multiple records | 100 items |
| `removeMany` | Delete multiple records | 100 items |

## createMany

Insert multiple records in one operation:

```typescript
const { createMany, isPending } = useCreateManyProducts()

// Import products from CSV
const products = parseCSV(csvData)

const result = await createMany(products)
// { created: [...], count: 50 }
```

### Input Format

```typescript
{
  items: [
    { name: 'Product 1', price: 100 },
    { name: 'Product 2', price: 200 },
    { name: 'Product 3', price: 300 },
  ]
}
```

### Response

```typescript
{
  created: [
    { id: '1', name: 'Product 1', price: 100 },
    { id: '2', name: 'Product 2', price: 200 },
    { id: '3', name: 'Product 3', price: 300 },
  ],
  count: 3,
}
```

## updateMany

Update multiple records by ID:

```typescript
const { updateMany } = useUpdateManyProducts()

// Increase all prices by 10%
const updates = products.map(p => ({
  id: p.id,
  data: { price: p.price * 1.1 },
}))

const result = await updateMany(updates)
// { updated: [...], count: 50 }
```

### Input Format

```typescript
{
  items: [
    { id: '1', data: { price: 110 } },
    { id: '2', data: { price: 220 } },
    { id: '3', data: { price: 330 } },
  ]
}
```

### Response

```typescript
{
  updated: [
    { id: '1', name: 'Product 1', price: 110 },
    { id: '2', name: 'Product 2', price: 220 },
    { id: '3', name: 'Product 3', price: 330 },
  ],
  count: 3,
}
```

## removeMany

Delete multiple records by ID:

```typescript
const { removeMany } = useRemoveManyProducts()

// Delete selected items
const selectedIds = ['1', '2', '3']

const result = await removeMany(selectedIds)
// { removed: [...], count: 3 }
```

### Input Format

```typescript
{
  ids: ['1', '2', '3']
}
```

### Response

```typescript
{
  removed: [
    { id: '1', name: 'Product 1', ... },
    { id: '2', name: 'Product 2', ... },
    { id: '3', name: 'Product 3', ... },
  ],
  count: 3,
}
```

## Examples

### Import from CSV

```typescript
function ImportProducts() {
  const { createMany, isPending } = useCreateManyProducts()

  async function handleImport(file: File) {
    const csv = await file.text()
    const products = parseCSV(csv)

    // Batch in chunks of 100
    for (let i = 0; i < products.length; i += 100) {
      const chunk = products.slice(i, i + 100)
      await createMany(chunk)
    }
  }

  return (
    <input
      type="file"
      accept=".csv"
      onChange={e => handleImport(e.target.files[0])}
      disabled={isPending}
    />
  )
}
```

### Bulk Price Update

```typescript
function BulkPriceEditor() {
  const { data: products } = useProducts()
  const { updateMany, isPending } = useUpdateManyProducts()

  async function applyDiscount(percent: number) {
    const updates = products.items.map(p => ({
      id: p.id,
      data: { price: p.price * (1 - percent / 100) },
    }))

    await updateMany(updates)
  }

  return (
    <button onClick={() => applyDiscount(10)} disabled={isPending}>
      Apply 10% Discount
    </button>
  )
}
```

### Delete Selected

```typescript
function ProductTable() {
  const [selected, setSelected] = useState<string[]>([])
  const { removeMany, isPending } = useRemoveManyProducts()

  async function deleteSelected() {
    if (confirm(`Delete ${selected.length} products?`)) {
      await removeMany(selected)
      setSelected([])
    }
  }

  return (
    <>
      <button
        onClick={deleteSelected}
        disabled={isPending || selected.length === 0}
      >
        Delete Selected ({selected.length})
      </button>
      {/* Table with checkboxes */}
    </>
  )
}
```

## Limits

All batch operations are limited to **100 items per request** for safety and performance.

For larger imports, chunk your data:

```typescript
async function importLargeDataset(items: Product[]) {
  const BATCH_SIZE = 100

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE)
    await createMany(batch)

    // Optional: report progress
    console.log(`Imported ${Math.min(i + BATCH_SIZE, items.length)} / ${items.length}`)
  }
}
```
