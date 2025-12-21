# AI Integration

**Describe your app. Generate the backend.**

```typescript
import { createManifestBuilder, aiTools } from 'archetype-engine/ai'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

const builder = createManifestBuilder()

await generateText({
  model: openai('gpt-4o'),
  tools: aiTools.vercel(builder),
  prompt: 'Create a blog with users and posts',
  maxSteps: 10
})

const { files } = await builder.generate()
// → generated/db/schema.ts, generated/hooks/useUser.ts, ...
```

## Quick Start (CLI)

```bash
# AI generates JSON manifest
cat > manifest.json << 'EOF'
{
  "entities": [
    { "name": "User", "fields": { "email": { "type": "text", "email": true } } },
    { "name": "Post", "fields": { "title": { "type": "text" } },
      "relations": { "author": { "type": "hasOne", "entity": "User" } } }
  ],
  "database": { "type": "sqlite", "file": "./app.db" }
}
EOF

# Validate
npx archetype validate manifest.json --json
# → { "valid": true, "errors": [] }

# Generate
npx archetype generate manifest.json --json
# → { "success": true, "files": ["generated/db/schema.ts", ...] }
```

**CLI flags for AI:**
| Flag | Purpose |
|------|---------|
| `--json` | Structured JSON output |
| `--stdin` | Read manifest from stdin |

## AI Toolkit

Ready-to-use tools for AI frameworks. Import from `archetype-engine/ai`.

### Vercel AI SDK

```typescript
import { createManifestBuilder, aiTools } from 'archetype-engine/ai'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

const builder = createManifestBuilder()

const result = await generateText({
  model: openai('gpt-4o'),
  tools: aiTools.vercel(builder),  // Tools with Zod schemas
  system: 'You are an app builder. Use the tools to build what the user describes.',
  prompt: userInput,
  maxSteps: 10
})

// Validate before generating
const validation = builder.validate()
if (!validation.valid) {
  console.error(validation.errors)
  return
}

// Generate all files
const { files, success } = await builder.generate()
```

### OpenAI / Anthropic

```typescript
import { aiTools, createManifestBuilder, executeOpenAITool } from 'archetype-engine/ai'

// Get tools in framework format
const openaiTools = aiTools.openai()      // OpenAI function calling
const anthropicTools = aiTools.anthropic() // Anthropic tool use

// Execute tool calls manually
const builder = createManifestBuilder()
const result = executeOpenAITool(builder, 'add_entity', {
  name: 'User',
  fields: { email: { type: 'text', email: true } }
})
```

### Available Tools

| Tool | Description |
|------|-------------|
| `add_entity` | Add entity with fields, relations, behaviors |
| `update_entity` | Modify existing entity |
| `remove_entity` | Remove entity |
| `set_database` | Configure database (sqlite/postgres/mysql) |
| `set_auth` | Enable authentication with providers |
| `validate` | Check manifest for errors |
| `generate` | Generate all code |

## JSON Schema

### Fields

```typescript
{
  "type": "text" | "number" | "boolean" | "date",
  "required": true,           // default
  "optional": true,           // shorthand for required: false
  "unique": false,
  "default": "value",
  "label": "Display Name",

  // text only
  "min": 5,                   // min length
  "max": 100,                 // max length
  "email": true,
  "url": true,
  "regex": "^[a-z]+$",
  "oneOf": ["draft", "published"],
  "trim": true,
  "lowercase": true,

  // number only
  "integer": true,
  "positive": true
}
```

### Relations

```typescript
{
  "type": "hasOne" | "hasMany" | "belongsToMany",
  "entity": "TargetEntity"
}
```

| Type | Creates |
|------|---------|
| `hasOne` | Foreign key on this entity |
| `hasMany` | Foreign key on target entity |
| `belongsToMany` | Junction table |

### Entity

```typescript
{
  "name": "Post",
  "fields": {
    "title": { "type": "text", "min": 1, "max": 200 },
    "published": { "type": "boolean", "default": false }
  },
  "relations": {
    "author": { "type": "hasOne", "entity": "User" }
  },
  "behaviors": {
    "timestamps": true,    // createdAt, updatedAt
    "softDelete": false    // deletedAt instead of hard delete
  },
  "protected": "write"     // list/get public, mutations require auth
}
```

### Protection

```typescript
protected: false      // all public (default)
protected: true       // all require auth
protected: "all"      // same as true
protected: "write"    // list/get public, create/update/remove protected

// granular
protected: {
  list: false,
  get: false,
  create: true,
  update: true,
  remove: true
}
```

### Manifest

```typescript
{
  "entities": [...],
  "database": {
    "type": "sqlite",          // sqlite | postgres | mysql
    "file": "./app.db"         // sqlite only
    // "url": "env:DATABASE_URL"  // postgres/mysql
  },
  "auth": {
    "enabled": true,
    "providers": ["credentials", "google", "github", "discord"],
    "sessionStrategy": "jwt"   // jwt | database
  },
  "template": "nextjs-drizzle-trpc",
  "mode": "full"               // full | headless | api-only
}
```

## Error Codes

| Code | Fix |
|------|-----|
| `INVALID_ENTITY_NAME` | Use PascalCase (User, BlogPost) |
| `DUPLICATE_ENTITY` | Rename one of the duplicate entities |
| `INVALID_FIELD_TYPE` | Use text/number/boolean/date |
| `INVALID_FIELD_NAME` | Use camelCase (firstName, createdAt) |
| `RELATION_TARGET_NOT_FOUND` | Add the referenced entity first |
| `DATABASE_REQUIRED` | Add database config for full mode |
| `AUTH_REQUIRED_FOR_PROTECTED` | Enable auth to use protected entities |
| `SQLITE_REQUIRES_FILE` | Add file path for SQLite |
| `POSTGRES_REQUIRES_URL` | Add url for Postgres/MySQL |

## System Prompt

Use this for AI agents:

```
You are an app builder. Generate JSON manifests for archetype-engine.

Fields:
- text: { type: "text", email?, url?, min?, max?, oneOf?, unique? }
- number: { type: "number", min?, max?, integer?, positive? }
- boolean: { type: "boolean", default? }
- date: { type: "date", default?: "now" }

Relations:
- hasOne: FK on this entity (Post.author → Post has authorId)
- hasMany: FK on target (User.posts → Post has userId)
- belongsToMany: junction table (Post.tags → PostTag table)

Example - "blog with users and posts":

{
  "entities": [
    {
      "name": "User",
      "fields": {
        "email": { "type": "text", "email": true, "unique": true },
        "name": { "type": "text" }
      }
    },
    {
      "name": "Post",
      "fields": {
        "title": { "type": "text", "min": 1, "max": 200 },
        "content": { "type": "text" },
        "published": { "type": "boolean", "default": false }
      },
      "relations": { "author": { "type": "hasOne", "entity": "User" } },
      "protected": "write"
    }
  ],
  "database": { "type": "sqlite", "file": "./app.db" }
}

After generating, tell user to run:
npx drizzle-kit push && npm run dev
```

## Programmatic API

```typescript
import { parseManifestJSON, validateManifest, getTemplate, runTemplate } from 'archetype-engine'

// Parse JSON to internal representation
const manifest = parseManifestJSON(jsonFromAI)

// Validate
const { valid, errors } = validateManifest(jsonFromAI)
if (!valid) throw new Error(errors[0].message)

// Generate
const template = await getTemplate('nextjs-drizzle-trpc')
const files = await runTemplate(template, manifest)
```

## What Gets Generated

```
generated/
├── db/schema.ts           # Drizzle ORM tables
├── schemas/user.ts        # Zod validation
├── trpc/routers/user.ts   # CRUD endpoints
├── hooks/useUser.ts       # React Query hooks
└── erd.md                 # Entity diagram
```

**Note:** Archetype generates backend infrastructure and hooks. It does not generate UI components. The AI (or developer) writes React components that import the generated hooks:

```tsx
import { useUsers, useUserForm } from '@/generated/hooks/useUser'
```
