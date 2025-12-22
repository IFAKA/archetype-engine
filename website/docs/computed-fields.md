---
sidebar_position: 12
---

# Computed Fields

Computed fields are derived from other fields at runtime. They're not stored in the database but included in all API responses.

## Definition

```typescript
import { defineEntity, text, number, computed } from 'archetype-engine'

export const Person = defineEntity('Person', {
  fields: {
    firstName: text().required(),
    lastName: text().required(),
    fullName: computed({
      type: 'text',
      from: ['firstName', 'lastName'],
      get: '`${firstName} ${lastName}`',
    }),
  },
})
```

## Options

| Option | Description |
|--------|-------------|
| `type` | Return type: `'text'`, `'number'`, `'boolean'` |
| `from` | Array of field names this computed field depends on |
| `get` | JavaScript expression to compute the value |

## Examples

### Full Name

```typescript
fullName: computed({
  type: 'text',
  from: ['firstName', 'lastName'],
  get: '`${firstName} ${lastName}`',
})
```

### Order Total

```typescript
export const OrderLine = defineEntity('OrderLine', {
  fields: {
    price: number().required(),
    quantity: number().required().integer(),
    discount: number().default(0),
    total: computed({
      type: 'number',
      from: ['price', 'quantity', 'discount'],
      get: 'price * quantity * (1 - discount / 100)',
    }),
  },
})
```

### Status Label

```typescript
export const Task = defineEntity('Task', {
  fields: {
    status: text().required().oneOf(['todo', 'in_progress', 'done']),
    statusLabel: computed({
      type: 'text',
      from: ['status'],
      get: '({ todo: "To Do", in_progress: "In Progress", done: "Done" })[status]',
    }),
  },
})
```

### Age from Birth Date

```typescript
export const User = defineEntity('User', {
  fields: {
    birthDate: date().required(),
    age: computed({
      type: 'number',
      from: ['birthDate'],
      get: 'Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))',
    }),
  },
})
```

## Generated Code

### Schema

Computed fields are **not** added to the Drizzle schema:

```typescript
// generated/db/schema.ts
export const persons = sqliteTable('persons', {
  id: text('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  // fullName is NOT here - it's computed at runtime
})
```

### Validation

Computed fields are **excluded** from create/update schemas:

```typescript
// generated/schemas/person.ts
export const personCreateSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  // No fullName - can't be set directly
})
```

### Router

A helper function computes values for all responses:

```typescript
// generated/trpc/routers/person.ts
function withComputedFields<T extends { firstName: string; lastName: string }>(record: T) {
  return {
    ...record,
    fullName: `${record.firstName} ${record.lastName}`,
  }
}

export const personRouter = router({
  list: publicProcedure.query(async () => {
    const items = await db.select().from(persons)
    return {
      items: items.map(withComputedFields),
      // ...
    }
  }),

  get: publicProcedure.input(z.string()).query(async ({ input }) => {
    const [person] = await db.select().from(persons).where(eq(persons.id, input))
    return withComputedFields(person)
  }),

  // create and update also return computed fields
})
```

## Usage

Computed fields appear in all API responses:

```typescript
const { data } = usePerson('123')
console.log(data.fullName)  // "John Doe"

const persons = usePersons()
persons.items.forEach(p => console.log(p.fullName))
```

## Limitations

- The `get` expression runs in JavaScript, not SQL
- Complex expressions may impact performance for large lists
- Cannot be used in `where` filters or `orderBy`
