---
sidebar_position: 4
---

# Fields

Fields define the properties of your entities. Archetype provides four primary field types with a fluent API for validation and constraints.

## Field Types

### text()

String fields with optional validation:

```typescript
import { text } from 'archetype-engine'

// Basic text field
name: text().required()

// With validations
email: text().required().email()
website: text().optional().url()
slug: text().required().regex(/^[a-z0-9-]+$/)
role: text().required().oneOf(['admin', 'user', 'guest'])

// With transformations
username: text().required().trim().lowercase()
code: text().required().uppercase()

// With length constraints
bio: text().optional().min(10).max(500)
title: text().required().length(100)  // max length
```

### number()

Numeric fields:

```typescript
import { number } from 'archetype-engine'

// Basic number
quantity: number().required()

// With constraints
age: number().required().integer().min(0).max(120)
price: number().required().positive()
rating: number().optional().min(1).max(5)
```

### boolean()

Boolean fields:

```typescript
import { boolean } from 'archetype-engine'

isActive: boolean().default(true)
isVerified: boolean().default(false)
acceptedTerms: boolean().required()
```

### date()

Date/timestamp fields:

```typescript
import { date } from 'archetype-engine'

birthDate: date().required()
publishedAt: date().optional()
expiresAt: date().default('now')  // current timestamp
```

## Common Methods

All field types support these methods:

| Method | Description |
|--------|-------------|
| `.required()` | Field must have a value |
| `.optional()` | Field can be null/undefined |
| `.unique()` | Value must be unique in table |
| `.default(value)` | Default value if not provided |
| `.label(string)` | Human-readable label for UI/errors |

## Text-Specific Methods

| Method | Description |
|--------|-------------|
| `.email()` | Must be valid email format |
| `.url()` | Must be valid URL |
| `.regex(pattern)` | Must match regex pattern |
| `.oneOf(values)` | Must be one of the provided values |
| `.trim()` | Trim whitespace |
| `.lowercase()` | Convert to lowercase |
| `.uppercase()` | Convert to uppercase |
| `.min(n)` | Minimum length |
| `.max(n)` | Maximum length |
| `.length(n)` | Alias for `.max(n)` |

## Number-Specific Methods

| Method | Description |
|--------|-------------|
| `.integer()` | Must be a whole number |
| `.positive()` | Must be greater than 0 |
| `.min(n)` | Minimum value |
| `.max(n)` | Maximum value |

## Date-Specific Methods

| Method | Description |
|--------|-------------|
| `.default('now')` | Default to current timestamp |

## Examples

### User Profile

```typescript
export const User = defineEntity('User', {
  fields: {
    email: text().required().unique().email(),
    username: text().required().unique().min(3).max(20).lowercase().trim(),
    displayName: text().required().min(1).max(50),
    bio: text().optional().max(500),
    age: number().optional().integer().min(13).max(120),
    isVerified: boolean().default(false),
    lastLoginAt: date().optional(),
    createdAt: date().default('now'),
  },
})
```

### Product

```typescript
export const Product = defineEntity('Product', {
  fields: {
    sku: text().required().unique().uppercase(),
    name: text().required().min(1).max(200),
    description: text().optional(),
    price: number().required().positive(),
    compareAtPrice: number().optional().positive(),
    quantity: number().required().integer().min(0),
    isActive: boolean().default(true),
    publishedAt: date().optional(),
  },
})
```

## Generated Validation

Fields generate Zod schemas automatically:

```typescript
// Input definition
email: text().required().email()
age: number().optional().integer().min(0)

// Generated Zod schema
z.object({
  email: z.string().email(),
  age: z.number().int().min(0).optional(),
})
```
