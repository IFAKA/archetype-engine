# AI Integration Guide

Use archetype-engine in AI workflows to let users describe apps in natural language and have AI generate the code.

## Why Use Archetype with AI?

| Without Archetype | With Archetype |
|-------------------|----------------|
| AI generates 10+ files per entity | AI generates 1 JSON file |
| AI must keep files in sync | Engine guarantees sync |
| Errors are text strings | Structured JSON errors |
| Security depends on AI | Safety is built-in |

## Quick Start

```bash
# 1. AI generates a JSON manifest
cat > manifest.json << 'EOF'
{
  "entities": [
    {
      "name": "User",
      "fields": {
        "email": { "type": "text", "email": true, "unique": true },
        "name": { "type": "text" }
      }
    }
  ],
  "database": { "type": "sqlite", "file": "./app.db" }
}
EOF

# 2. Validate (optional but recommended)
npx archetype validate manifest.json --json
# Returns: { "valid": true, "errors": [], "warnings": [] }

# 3. Generate all code
npx archetype generate manifest.json --json
# Returns: { "success": true, "files": [...] }
```

## CLI Commands

### Validate

Check if a manifest is valid before generating:

```bash
npx archetype validate manifest.json --json
```

Output on success:
```json
{
  "valid": true,
  "errors": [],
  "warnings": []
}
```

Output on failure:
```json
{
  "valid": false,
  "errors": [
    {
      "code": "RELATION_TARGET_NOT_FOUND",
      "path": "Post.relations.author.entity",
      "message": "Entity 'User' not found in manifest",
      "suggestion": "Add entity 'User' to the entities array, or fix the entity name"
    }
  ],
  "warnings": []
}
```

### Generate

Generate code from a manifest:

```bash
npx archetype generate manifest.json --json
```

Output:
```json
{
  "success": true,
  "template": "nextjs-drizzle-trpc",
  "entities": ["User", "Post"],
  "files": [
    "generated/db/schema.ts",
    "generated/schemas/user.ts",
    "generated/hooks/useUser.ts"
  ]
}
```

### Read from stdin

Pipe JSON directly without creating a file:

```bash
echo '{"entities": [...], "database": {...}}' | npx archetype generate --stdin --json
```

## JSON Schema Reference

### Field Types

```json
{
  "type": "text" | "number" | "boolean" | "date",
  "required": true,      // default: true
  "optional": true,      // shorthand for required: false
  "unique": false,
  "default": "value",
  "label": "Display Name",

  // Text validations
  "min": 5,              // minimum length
  "max": 100,            // maximum length
  "email": true,
  "url": true,
  "regex": "^[a-z]+$",
  "oneOf": ["a", "b"],
  "trim": true,
  "lowercase": true,
  "uppercase": true,

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
  "field": "customFieldName"  // optional
}
```

### Entity

```json
{
  "name": "User",
  "fields": {
    "email": { "type": "text", "email": true }
  },
  "relations": {
    "posts": { "type": "hasMany", "entity": "Post" }
  },
  "behaviors": {
    "timestamps": true,     // adds createdAt, updatedAt (default: true)
    "softDelete": false,    // adds deletedAt (default: false)
    "audit": false          // enable audit logging (default: false)
  },
  "auth": false,            // mark as auth entity
  "protected": "write"      // see protection options below
}
```

### Protection Options

```json
// Shorthand
"protected": false        // all public (default)
"protected": true         // all operations require auth
"protected": "all"        // same as true
"protected": "write"      // list/get public, create/update/remove protected

// Granular
"protected": {
  "list": false,
  "get": false,
  "create": true,
  "update": true,
  "remove": true
}
```

### Manifest

```json
{
  "entities": [...],
  "template": "nextjs-drizzle-trpc",
  "mode": "full" | "headless" | "api-only",

  "database": {
    "type": "sqlite" | "postgres" | "mysql",
    "file": "./app.db",    // SQLite only
    "url": "env:DATABASE_URL"  // Postgres/MySQL
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

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_ENTITY_NAME` | Entity name must be PascalCase |
| `DUPLICATE_ENTITY` | Entity name already exists |
| `INVALID_FIELD_TYPE` | Field type must be text/number/boolean/date |
| `INVALID_FIELD_NAME` | Field name must be camelCase |
| `RELATION_TARGET_NOT_FOUND` | Referenced entity doesn't exist |
| `DATABASE_REQUIRED` | Mode 'full' requires database config |
| `AUTH_REQUIRED_FOR_PROTECTED` | Protected entities need auth enabled |
| `INVALID_DATABASE_TYPE` | Database type must be sqlite/postgres/mysql |
| `SQLITE_REQUIRES_FILE` | SQLite needs file path |
| `POSTGRES_REQUIRES_URL` | Postgres/MySQL need connection URL |
| `INVALID_PROVIDER` | Auth provider not recognized |
| `INVALID_MODE` | Mode must be full/headless/api-only |

## Example System Prompt

Use this prompt template for AI agents:

```
You are an app builder. When users describe their app, generate a JSON manifest.

## Schema

Fields:
- text: { type: "text", email?, url?, min?, max?, oneOf?, unique? }
- number: { type: "number", min?, max?, integer?, positive? }
- boolean: { type: "boolean", default? }
- date: { type: "date", default?: "now" }

Relations:
- hasOne: Foreign key on this entity
- hasMany: Foreign key on target entity
- belongsToMany: Creates junction table

## Workflow

1. Generate manifest.json based on user description
2. Run: npx archetype validate manifest.json --json
3. If errors, fix and retry
4. Run: npx archetype generate manifest.json --json
5. Run: npx drizzle-kit push
6. Run: npm run dev

## Example

User: "I want a blog with users and posts"

{
  "entities": [
    {
      "name": "User",
      "fields": {
        "email": { "type": "text", "email": true, "unique": true },
        "name": { "type": "text" }
      },
      "behaviors": { "timestamps": true }
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
  "auth": { "enabled": true, "providers": ["credentials"] },
  "template": "nextjs-drizzle-trpc"
}
```

## Building a "Talk to Build" Product

Here's a complete example of how to build a product where users describe their app and AI generates it:

### 1. Set Up Next.js with Archetype

```bash
npx create-next-app my-ai-builder
cd my-ai-builder
npm install archetype-engine
```

### 2. Create the AI Generation Endpoint

```typescript
// app/api/generate/route.ts
import { parseManifestJSON, validateManifest } from 'archetype-engine'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(req: Request) {
  const { manifest } = await req.json()

  // 1. Validate the manifest
  const validation = validateManifest(manifest)
  if (!validation.valid) {
    return Response.json({
      success: false,
      errors: validation.errors
    }, { status: 400 })
  }

  // 2. Write manifest to file
  await fs.writeFile('manifest.json', JSON.stringify(manifest, null, 2))

  // 3. Run archetype generate
  const { stdout, stderr } = await execAsync(
    'npx archetype generate manifest.json --json'
  )

  return Response.json(JSON.parse(stdout))
}
```

### 3. Create the Chat Interface

```typescript
// app/page.tsx
'use client'

import { useState } from 'react'

export default function Builder() {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState(null)

  async function handleGenerate() {
    // 1. Send prompt to AI to generate manifest
    const aiResponse = await fetch('/api/ai', {
      method: 'POST',
      body: JSON.stringify({ prompt })
    })
    const { manifest } = await aiResponse.json()

    // 2. Generate code from manifest
    const genResponse = await fetch('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ manifest })
    })
    const result = await genResponse.json()

    setResult(result)
  }

  return (
    <div>
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Describe your app..."
      />
      <button onClick={handleGenerate}>Generate</button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  )
}
```

## Programmatic API

You can also use archetype-engine programmatically:

```typescript
import {
  parseManifestJSON,
  validateManifest,
  getTemplate,
  runTemplate,
} from 'archetype-engine'

// 1. Parse JSON to IR
const manifest = parseManifestJSON({
  entities: [
    { name: 'User', fields: { email: { type: 'text' } } }
  ],
  database: { type: 'sqlite', file: './app.db' }
})

// 2. Validate
const validation = validateManifest(manifestJSON)
if (!validation.valid) {
  console.error('Errors:', validation.errors)
  process.exit(1)
}

// 3. Get template
const template = await getTemplate('nextjs-drizzle-trpc')

// 4. Generate (dry run to preview)
const files = await runTemplate(template, manifest, { dryRun: true })
console.log('Will generate:', files.map(f => f.path))

// 5. Generate for real
await runTemplate(template, manifest)
```

## Target Audience

This integration is designed for:

- **AI-powered product builders** - Let users describe apps in natural language
- **No-code platform developers** - Add AI-generated backends to visual builders
- **AI coding assistants** - Scaffold full-stack apps from prompts
- **Rapid prototyping tools** - Generate working apps from specifications
