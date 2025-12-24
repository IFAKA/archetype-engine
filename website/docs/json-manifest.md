---
sidebar_position: 15
---

# JSON Manifest (AI-Optimized)

Generate complete backends from a single JSON file. Perfect for AI agents, rapid prototyping, and full-app scaffolding.

## Why JSON Manifest?

The JSON manifest format is **10x faster** than traditional TypeScript files when building complete apps:

| Approach | Steps | Files Created |
|----------|-------|---------------|
| **JSON Manifest** | 1. Create `manifest.json`<br/>2. Run `generate` | 1 file |
| **TypeScript Files** | 1. Create `archetype.config.ts`<br/>2. Create entity files<br/>3. Import entities<br/>4. Run `generate` | 3+ files |

**When to use JSON:**
- Building complete apps from scratch
- AI-powered app generation
- Rapid prototyping
- Working in environments without TypeScript

**When to use TypeScript:**
- Incremental changes to existing entities
- Need TypeScript IDE autocomplete
- Modifying one field/relation

## Quick Example

Create a blog platform in one file:

```json
{
  "entities": [
    {
      "name": "User",
      "fields": {
        "email": { "type": "text", "email": true, "required": true, "unique": true },
        "name": { "type": "text", "required": true },
        "bio": { "type": "text", "max": 500 }
      }
    },
    {
      "name": "Post",
      "fields": {
        "title": { "type": "text", "required": true, "min": 1, "max": 200 },
        "content": { "type": "text", "required": true },
        "published": { "type": "boolean", "default": false },
        "publishedAt": { "type": "date" }
      },
      "relations": {
        "author": { "type": "hasOne", "entity": "User" }
      },
      "behaviors": {
        "timestamps": true
      },
      "protected": "write"
    }
  ],
  "database": {
    "type": "sqlite",
    "file": "./blog.db"
  }
}
```

Generate everything:

```bash
npx archetype generate manifest.json
npx drizzle-kit push
npm run dev
```

## Field Definitions

### Basic Fields

```json
{
  "name": "Product",
  "fields": {
    "name": { "type": "text", "required": true },
    "price": { "type": "number", "required": true, "positive": true },
    "inStock": { "type": "boolean", "default": true },
    "launchedAt": { "type": "date" }
  }
}
```

### Field Types

| Type | Description | Example |
|------|-------------|---------|
| `text` | String field | `{ "type": "text" }` |
| `number` | Numeric field | `{ "type": "number" }` |
| `boolean` | Boolean field | `{ "type": "boolean" }` |
| `date` | Date/timestamp | `{ "type": "date" }` |

### Common Properties

```json
{
  "email": {
    "type": "text",
    "required": true,    // Field must have a value
    "unique": true,      // Value must be unique
    "default": "guest",  // Default value if not provided
    "label": "Email Address"  // Human-readable label
  }
}
```

### Text Validations

```json
{
  "username": {
    "type": "text",
    "required": true,
    "min": 3,           // Minimum length
    "max": 20,          // Maximum length
    "lowercase": true,  // Convert to lowercase
    "trim": true        // Trim whitespace
  },
  "email": {
    "type": "text",
    "email": true,      // Must be valid email
    "unique": true
  },
  "website": {
    "type": "text",
    "url": true         // Must be valid URL
  },
  "code": {
    "type": "text",
    "regex": "^[A-Z]{3}-\\d{4}$"  // Custom pattern
  },
  "role": {
    "type": "text",
    "oneOf": ["admin", "user", "guest"]  // Enum-like
  }
}
```

### Number Validations

```json
{
  "age": {
    "type": "number",
    "integer": true,    // Must be whole number
    "min": 0,           // Minimum value
    "max": 120          // Maximum value
  },
  "price": {
    "type": "number",
    "positive": true,   // Must be > 0
    "required": true
  }
}
```

### Date Fields

```json
{
  "createdAt": {
    "type": "date",
    "default": "now"    // Default to current timestamp
  },
  "birthDate": {
    "type": "date",
    "required": true
  }
}
```

## Relations

### hasOne (One-to-One)

```json
{
  "name": "Profile",
  "relations": {
    "user": { "type": "hasOne", "entity": "User" }
  }
}
```

Generates: `userId` foreign key on Profile table.

### hasMany (One-to-Many)

```json
{
  "name": "User",
  "relations": {
    "posts": { "type": "hasMany", "entity": "Post" }
  }
}
```

No column created on User. Post has `userId` foreign key.

### belongsToMany (Many-to-Many)

```json
{
  "name": "Post",
  "relations": {
    "tags": { "type": "belongsToMany", "entity": "Tag" }
  }
}
```

Generates `post_tags` junction table with `postId` and `tagId`.

## Behaviors

```json
{
  "name": "Document",
  "behaviors": {
    "timestamps": true,   // Adds createdAt, updatedAt
    "softDelete": true,   // Adds deletedAt instead of hard delete
    "audit": false        // (Future) Audit logging
  }
}
```

## Protection

Control authentication requirements:

```json
{
  "name": "Post",
  "protected": "write"  // list/get public, mutations require auth
}
```

Options:
- `false` - All operations public (default)
- `true` or `"all"` - All operations require auth
- `"write"` - Reads public, writes protected (most common)
- Granular object:

```json
{
  "protected": {
    "list": false,
    "get": false,
    "create": true,
    "update": true,
    "remove": true
  }
}
```

## Hooks

Enable lifecycle hooks:

```json
{
  "name": "Order",
  "hooks": true  // Enable all hooks
}
```

Or granular:

```json
{
  "hooks": {
    "beforeCreate": true,
    "afterCreate": true,
    "beforeUpdate": true,
    "afterUpdate": true,
    "beforeRemove": true,
    "afterRemove": true
  }
}
```

## Database Configuration

### SQLite

```json
{
  "database": {
    "type": "sqlite",
    "file": "./app.db"
  }
}
```

### PostgreSQL

```json
{
  "database": {
    "type": "postgres",
    "url": "postgresql://user:pass@localhost:5432/mydb"
  }
}
```

### MySQL

```json
{
  "database": {
    "type": "mysql",
    "url": "mysql://user:pass@localhost:3306/mydb"
  }
}
```

## Authentication

```json
{
  "auth": {
    "enabled": true,
    "providers": ["credentials", "google", "github"],
    "sessionStrategy": "jwt"
  }
}
```

Available providers: `credentials`, `google`, `github`, `discord`

## Complete Example: E-commerce

```json
{
  "entities": [
    {
      "name": "Customer",
      "fields": {
        "email": { "type": "text", "email": true, "unique": true, "required": true },
        "name": { "type": "text", "required": true },
        "phone": { "type": "text" }
      },
      "relations": {
        "orders": { "type": "hasMany", "entity": "Order" }
      },
      "behaviors": {
        "timestamps": true
      }
    },
    {
      "name": "Product",
      "fields": {
        "sku": { "type": "text", "unique": true, "required": true },
        "name": { "type": "text", "required": true },
        "price": { "type": "number", "positive": true, "required": true },
        "stock": { "type": "number", "integer": true, "min": 0, "default": 0 }
      }
    },
    {
      "name": "Order",
      "fields": {
        "orderNumber": { "type": "text", "unique": true, "required": true },
        "status": { "type": "text", "oneOf": ["pending", "paid", "shipped"], "default": "pending" },
        "total": { "type": "number", "positive": true, "required": true }
      },
      "relations": {
        "customer": { "type": "hasOne", "entity": "Customer" },
        "items": { "type": "hasMany", "entity": "OrderItem" }
      },
      "behaviors": {
        "timestamps": true,
        "softDelete": true
      },
      "protected": "all",
      "hooks": true
    },
    {
      "name": "OrderItem",
      "fields": {
        "quantity": { "type": "number", "integer": true, "min": 1, "required": true },
        "unitPrice": { "type": "number", "positive": true, "required": true }
      },
      "relations": {
        "order": { "type": "hasOne", "entity": "Order" },
        "product": { "type": "hasOne", "entity": "Product" }
      }
    }
  ],
  "database": {
    "type": "postgres",
    "url": "postgresql://localhost/ecommerce"
  },
  "auth": {
    "enabled": true,
    "providers": ["credentials"]
  }
}
```

## CLI Commands

### Generate

```bash
# Generate from JSON manifest
npx archetype generate manifest.json

# Generate from TypeScript config (default)
npx archetype generate
npx archetype generate archetype.config.ts
```

### Validate

Check your manifest before generating:

```bash
npx archetype validate manifest.json --json
```

Returns validation errors with helpful messages:
- Missing required fields
- Invalid field types
- Unknown relation targets
- Database config issues

## Migration from TypeScript

Convert existing TypeScript config to JSON:

**Before (TypeScript):**
```typescript
// archetype.config.ts
import { defineConfig } from 'archetype-engine'
import { User } from './archetype/entities/user'

export default defineConfig({
  entities: [User],
  database: { type: 'sqlite', file: './app.db' }
})
```

**After (JSON):**
```json
{
  "entities": [
    {
      "name": "User",
      "fields": {
        "email": { "type": "text", "email": true, "unique": true }
      }
    }
  ],
  "database": {
    "type": "sqlite",
    "file": "./app.db"
  }
}
```

## AI Integration

The JSON format is optimized for AI code generation. AI agents can:

1. Parse user requirements
2. Generate valid JSON manifest
3. Validate with `npx archetype validate`
4. Generate code with `npx archetype generate`

See [AI Module](/docs/ai-module) for building AI-powered app builders.
