# AI Integration Guide

Use archetype-engine with AI to generate full-stack apps from natural language descriptions.

## What Archetype Generates

When you run `npx archetype generate`, archetype creates backend infrastructure:

```
generated/
├── db/schema.ts           # Drizzle ORM schema
├── schemas/*.ts           # Zod validation schemas
├── trpc/routers/*.ts      # tRPC CRUD endpoints
├── hooks/use*.ts          # React Query + React Hook Form hooks
└── erd.md                 # Entity relationship diagram
```

**Archetype does NOT generate UI components.** It generates hooks that your UI (or AI-generated UI) can import:

```tsx
import { useTasks, useTaskForm } from '@/generated/hooks/useTask'
```

---

## AI Toolkit

The simplest way to use archetype with AI. Import ready-to-use tools for your AI framework.

### Vercel AI SDK

```typescript
import { createManifestBuilder, aiTools } from 'archetype-engine/ai'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

const builder = createManifestBuilder()

const result = await generateText({
  model: openai('gpt-4o'),
  tools: aiTools.vercel(builder),
  system: 'You are an app builder. Use the tools to build what the user describes.',
  prompt: 'Create a blog with users and posts',
  maxSteps: 10
})

// Validate and generate
const validation = builder.validate()
if (!validation.valid) {
  console.error(validation.errors)
} else {
  const { files, success } = await builder.generate()
}
```

### Available Adapters

| Adapter | Usage |
|---------|-------|
| `aiTools.vercel(builder)` | Vercel AI SDK - returns tools with Zod schemas |
| `aiTools.openai()` | OpenAI function calling format |
| `aiTools.anthropic()` | Anthropic tool use format |

### Available Tools

| Tool | Description |
|------|-------------|
| `add_entity` | Add entity with fields, relations, behaviors |
| `update_entity` | Modify existing entity |
| `remove_entity` | Remove entity |
| `set_database` | Configure database (sqlite, postgres, mysql) |
| `set_auth` | Enable authentication with providers |
| `validate` | Check manifest for errors |
| `generate` | Generate all code |

---

## CLI for AI Agents

AI agents can use the CLI with `--json` flag for structured output.

### Validate

```bash
npx archetype validate manifest.json --json
```

Success:
```json
{ "valid": true, "errors": [], "warnings": [] }
```

Failure:
```json
{
  "valid": false,
  "errors": [{
    "code": "RELATION_TARGET_NOT_FOUND",
    "path": "Post.relations.author.entity",
    "message": "Entity 'User' not found",
    "suggestion": "Add entity 'User' or fix the name"
  }]
}
```

### Generate

```bash
npx archetype generate manifest.json --json
```

Output:
```json
{
  "success": true,
  "template": "nextjs-drizzle-trpc",
  "entities": ["User", "Post"],
  "files": ["generated/db/schema.ts", "generated/hooks/useUser.ts"]
}
```

### Stdin Mode

Pipe JSON directly:

```bash
echo '{"entities": [...], "database": {...}}' | npx archetype generate --stdin --json
```

---

## JSON Schema Reference

### Field Types

```json
{
  "type": "text" | "number" | "boolean" | "date",
  "required": true,
  "optional": true,
  "unique": false,
  "default": "value",
  "label": "Display Name",

  // Text validations
  "min": 5,
  "max": 100,
  "email": true,
  "url": true,
  "regex": "^[a-z]+$",
  "oneOf": ["draft", "published"],
  "trim": true,
  "lowercase": true,

  // Number validations
  "integer": true,
  "positive": true
}
```

### Relations

```json
{
  "type": "hasOne" | "hasMany" | "belongsToMany",
  "entity": "TargetEntity",
  "field": "customFieldName"
}
```

### Entity

```json
{
  "name": "User",
  "fields": {
    "email": { "type": "text", "email": true, "unique": true },
    "name": { "type": "text" }
  },
  "relations": {
    "posts": { "type": "hasMany", "entity": "Post" }
  },
  "behaviors": {
    "timestamps": true,
    "softDelete": false,
    "audit": false
  },
  "protected": "write"
}
```

### Protection Options

```json
"protected": false        // All public (default)
"protected": true         // All require auth
"protected": "all"        // Same as true
"protected": "write"      // list/get public, mutations protected

// Granular
"protected": {
  "list": false,
  "get": false,
  "create": true,
  "update": true,
  "remove": true
}
```

### Complete Manifest

```json
{
  "entities": [...],
  "template": "nextjs-drizzle-trpc",
  "mode": "full" | "headless" | "api-only",

  "database": {
    "type": "sqlite" | "postgres" | "mysql",
    "file": "./app.db",
    "url": "env:DATABASE_URL"
  },

  "auth": {
    "enabled": true,
    "providers": ["credentials", "google", "github", "discord"],
    "sessionStrategy": "jwt" | "database"
  },

  "i18n": {
    "languages": ["en", "es"],
    "defaultLanguage": "en"
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_ENTITY_NAME` | Entity name must be PascalCase |
| `DUPLICATE_ENTITY` | Entity name already exists |
| `INVALID_FIELD_TYPE` | Must be text/number/boolean/date |
| `INVALID_FIELD_NAME` | Field name must be camelCase |
| `RELATION_TARGET_NOT_FOUND` | Referenced entity doesn't exist |
| `DATABASE_REQUIRED` | Mode 'full' requires database config |
| `AUTH_REQUIRED_FOR_PROTECTED` | Protected entities need auth enabled |
| `INVALID_DATABASE_TYPE` | Must be sqlite/postgres/mysql |
| `SQLITE_REQUIRES_FILE` | SQLite needs file path |
| `POSTGRES_REQUIRES_URL` | Postgres/MySQL need connection URL |
| `INVALID_PROVIDER` | Auth provider not recognized |
| `INVALID_MODE` | Must be full/headless/api-only |

---

## System Prompt Template

Use this for AI agents generating manifests:

```
You are an app builder. When users describe their app, generate a JSON manifest.

## Schema

Fields:
- text: { type: "text", email?, url?, min?, max?, oneOf?, unique? }
- number: { type: "number", min?, max?, integer?, positive? }
- boolean: { type: "boolean", default? }
- date: { type: "date", default?: "now" }

Relations:
- hasOne: Foreign key on this entity (e.g., Post hasOne User = authorId on Post)
- hasMany: Foreign key on target (e.g., User hasMany Post)
- belongsToMany: Creates junction table (e.g., Post belongsToMany Tag)

## Example

User: "I want a blog with users and posts"

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
      "relations": {
        "author": { "type": "hasOne", "entity": "User" }
      },
      "protected": "write"
    }
  ],
  "database": { "type": "sqlite", "file": "./app.db" },
  "auth": { "enabled": true, "providers": ["credentials"] }
}

## Workflow

1. Generate manifest based on user description
2. Run: npx archetype validate manifest.json --json
3. If errors, fix and retry
4. Run: npx archetype generate manifest.json --json
5. Tell user to run: npx drizzle-kit push && npm run dev
```

---

## Programmatic API

For direct control without AI frameworks:

```typescript
import {
  parseManifestJSON,
  validateManifest,
  getTemplate,
  runTemplate,
} from 'archetype-engine'

// 1. Parse JSON to internal representation
const manifest = parseManifestJSON({
  entities: [
    { name: 'User', fields: { email: { type: 'text', email: true } } }
  ],
  database: { type: 'sqlite', file: './app.db' }
})

// 2. Validate
const validation = validateManifest(manifestJSON)
if (!validation.valid) {
  console.error('Errors:', validation.errors)
  process.exit(1)
}

// 3. Get template and generate
const template = await getTemplate('nextjs-drizzle-trpc')
const files = await runTemplate(template, manifest)
```

---

## Why Use Archetype with AI?

| Without Archetype | With Archetype |
|-------------------|----------------|
| AI generates 10+ files per entity | AI generates 1 JSON manifest |
| AI must keep files in sync | Engine guarantees sync |
| Errors are text strings | Structured JSON errors with suggestions |
| Type safety depends on AI | Types guaranteed by engine |

**The division of labor:**
- **archetype-engine**: Generates backend (schema, validation, API, hooks)
- **AI**: Describes entities and optionally generates UI that uses the hooks

The AI doesn't need to understand Drizzle, Zod, or tRPC. It describes entities, and archetype ensures the generated hooks work correctly.

---

## Appendix: Direct JSON Approach

An alternative to the AI Toolkit. The AI generates the complete JSON manifest in one shot:

```typescript
import { validateManifest, parseManifestJSON, getTemplate, runTemplate } from 'archetype-engine'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function generateFromDescription(description: string) {
  // 1. AI generates manifest JSON directly
  const result = await generateText({
    model: openai('gpt-4o'),
    system: MANIFEST_PROMPT, // Use the system prompt template above
    prompt: description
  })

  const manifestJSON = JSON.parse(result.text)

  // 2. Validate
  const validation = validateManifest(manifestJSON)
  if (!validation.valid) {
    return { success: false, errors: validation.errors }
  }

  // 3. Generate
  const manifest = parseManifestJSON(manifestJSON)
  const template = await getTemplate('nextjs-drizzle-trpc')
  const files = await runTemplate(template!, manifest)

  return { success: true, files }
}
```

**Comparison:**

| AI Toolkit (Function Calling) | Direct JSON |
|-------------------------------|-------------|
| Interactive, step-by-step | Single-shot generation |
| AI can ask clarifying questions | AI must infer everything upfront |
| Better for complex apps | Better for simple apps |
| Uses `aiTools.vercel(builder)` | Uses `parseManifestJSON()` |
