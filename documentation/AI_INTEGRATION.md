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

## Example: Building an AI App Builder

This example walks through building an "AI App Builder" - a product where users describe an app and get working code.

---

### Part 1: Building the AI App Builder

Create a Next.js app that will be your AI Builder:

```bash
npx create-next-app@latest ai-app-builder
cd ai-app-builder
npm install archetype-engine openai
```

#### File 1: The Generation Logic

```typescript
// lib/generate-app.ts
import { validateManifest, parseManifestJSON, getTemplate, runTemplate } from 'archetype-engine'
import type { ManifestIR } from 'archetype-engine'
import OpenAI from 'openai'

const openai = new OpenAI()

// Convert natural language to archetype manifest
async function createManifest(description: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: description }
    ]
  })
  return JSON.parse(response.choices[0].message.content!)
}

// Generate UI components from manifest
function generateUIPages(manifest: ManifestIR) {
  const pages: { path: string; content: string }[] = []

  for (const entity of manifest.entities) {
    const name = entity.name
    const nameLower = name.toLowerCase()
    const fields = Object.keys(entity.fields)

    // List page
    pages.push({
      path: `app/(generated)/${nameLower}/page.tsx`,
      content: `'use client'
import { use${name}s } from '@/generated/hooks/use${name}'
import Link from 'next/link'

export default function ${name}List() {
  const { data, isLoading } = use${name}s()
  if (isLoading) return <p>Loading...</p>
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">${name}s</h1>
        <Link href="/${nameLower}/new" className="bg-blue-500 text-white px-4 py-2 rounded">
          Add ${name}
        </Link>
      </div>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            ${fields.map(f => `<th className="p-2 text-left">${f}</th>`).join('\n            ')}
          </tr>
        </thead>
        <tbody>
          {data?.map(item => (
            <tr key={item.id} className="border-t">
              ${fields.map(f => `<td className="p-2">{String(item.${f})}</td>`).join('\n              ')}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}`
    })

    // Create form page
    pages.push({
      path: `app/(generated)/${nameLower}/new/page.tsx`,
      content: `'use client'
import { useCreate${name} } from '@/generated/hooks/use${name}'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Create${name}() {
  const router = useRouter()
  const create = useCreate${name}()
  const [form, setForm] = useState({ ${fields.map(f => `${f}: ''`).join(', ')} })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await create.mutateAsync(form)
    router.push('/${nameLower}')
  }

  return (
    <div className="p-8 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Create ${name}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        ${fields.map(f => `<input
          className="w-full border p-2 rounded"
          placeholder="${f}"
          value={form.${f}}
          onChange={e => setForm({ ...form, ${f}: e.target.value })}
        />`).join('\n        ')}
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded w-full">
          Create
        </button>
      </form>
    </div>
  )
}`
    })
  }

  return pages
}

// Main function: generate complete app
export async function generateApp(description: string) {
  // 1. AI creates manifest from description
  const manifestJSON = await createManifest(description)

  // 2. Validate manifest
  const validation = validateManifest(manifestJSON)
  if (!validation.valid) {
    return { success: false, errors: validation.errors }
  }

  // 3. archetype-engine generates backend
  const manifest = parseManifestJSON(manifestJSON)
  const template = await getTemplate('nextjs-drizzle-trpc')
  const backendFiles = await runTemplate(template!, manifest)

  // 4. Generate UI pages using the hooks
  const uiPages = generateUIPages(manifest)

  return {
    success: true,
    files: [...backendFiles, ...uiPages],
    entities: manifest.entities.map(e => e.name),
    manifest: manifestJSON
  }
}

const SYSTEM_PROMPT = `You convert app descriptions into archetype-engine JSON manifests.

Return ONLY valid JSON:
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
      "name": "Task",
      "fields": {
        "title": { "type": "text" },
        "done": { "type": "boolean", "default": false }
      },
      "relations": {
        "assignee": { "type": "hasOne", "entity": "User" }
      }
    }
  ],
  "database": { "type": "sqlite", "file": "./app.db" },
  "auth": { "enabled": true, "providers": ["credentials"] }
}

Field types: text, number, boolean, date
Text validations: email, url, min, max, unique, oneOf
Number validations: min, max, integer, positive`
```

#### File 2: API Endpoint

```typescript
// app/api/generate/route.ts
import { generateApp } from '@/lib/generate-app'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: Request) {
  const { description, outputDir = './generated-app' } = await req.json()

  const result = await generateApp(description)

  if (!result.success) {
    return Response.json(result, { status: 400 })
  }

  // Write files to disk
  for (const file of result.files) {
    const filePath = path.join(outputDir, file.path)
    await mkdir(path.dirname(filePath), { recursive: true })
    await writeFile(filePath, file.content)
  }

  return Response.json({
    success: true,
    entities: result.entities,
    filesWritten: result.files.length,
    outputDir
  })
}
```

#### File 3: Simple Chat UI

```typescript
// app/page.tsx
'use client'
import { useState } from 'react'

export default function AIAppBuilder() {
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<'idle' | 'generating' | 'done'>('idle')
  const [result, setResult] = useState<any>(null)

  async function handleGenerate() {
    setStatus('generating')
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: input })
    })
    const data = await res.json()
    setResult(data)
    setStatus('done')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">AI App Builder</h1>
        <p className="text-gray-600 mb-6">Describe your app and get working code.</p>

        <textarea
          className="w-full h-32 p-4 border rounded-lg mb-4"
          placeholder="I want a task manager where users can create projects and assign tasks to team members..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />

        <button
          onClick={handleGenerate}
          disabled={status === 'generating'}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
        >
          {status === 'generating' ? 'Generating...' : 'Generate App'}
        </button>

        {result && (
          <div className="mt-6 p-4 bg-white rounded-lg border">
            <h2 className="font-bold text-lg mb-2">
              {result.success ? '✅ App Generated!' : '❌ Error'}
            </h2>
            {result.success ? (
              <>
                <p className="text-gray-600 mb-2">
                  Created {result.filesWritten} files with entities: {result.entities.join(', ')}
                </p>
                <code className="block bg-gray-100 p-2 rounded text-sm">
                  cd {result.outputDir} && npm install && npx drizzle-kit push && npm run dev
                </code>
              </>
            ) : (
              <ul className="text-red-600">
                {result.errors.map((e: any, i: number) => (
                  <li key={i}>{e.message}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

Your AI App Builder is ready. Run it with `npm run dev`.

---

### Part 2: Using the AI App Builder

A user opens your AI App Builder and types:

> "I want a project management app where teams can create projects, add tasks with priorities (low, medium, high), assign tasks to members, and track due dates"

The AI App Builder:
1. Sends this to OpenAI → gets a manifest
2. Validates with archetype-engine
3. Generates backend (schema, API, hooks)
4. Generates UI pages (list, create forms)
5. Writes all files to `./generated-app`

---

### Part 3: The Generated App

The user gets a complete Next.js app:

```
generated-app/
├── generated/
│   ├── db/
│   │   └── schema.ts              # Drizzle tables
│   ├── schemas/
│   │   ├── team.ts                # Zod validation
│   │   ├── project.ts
│   │   ├── task.ts
│   │   └── member.ts
│   ├── trpc/routers/
│   │   ├── team.ts                # CRUD endpoints
│   │   ├── project.ts
│   │   ├── task.ts
│   │   └── member.ts
│   └── hooks/
│       ├── useTeam.ts             # React Query hooks
│       ├── useProject.ts
│       ├── useTask.ts
│       └── useMember.ts
├── app/(generated)/
│   ├── team/
│   │   ├── page.tsx               # Team list
│   │   └── new/page.tsx           # Create team form
│   ├── project/
│   │   ├── page.tsx               # Project list
│   │   └── new/page.tsx           # Create project form
│   ├── task/
│   │   ├── page.tsx               # Task list with priority
│   │   └── new/page.tsx           # Create task form
│   └── member/
│       ├── page.tsx               # Member list
│       └── new/page.tsx           # Add member form
└── package.json
```

The user runs:

```bash
cd generated-app
npm install
npx drizzle-kit push
npm run dev
```

And they have a working app:

```
┌─────────────────────────────────────────────────────────────┐
│  Tasks                                           [Add Task] │
├─────────────────────────────────────────────────────────────┤
│  title          │ priority │ dueDate    │ assignee         │
├─────────────────────────────────────────────────────────────┤
│  Setup database │ high     │ 2024-01-15 │ Alice            │
│  Write tests    │ medium   │ 2024-01-20 │ Bob              │
│  Deploy app     │ low      │ 2024-01-25 │ Charlie          │
└─────────────────────────────────────────────────────────────┘
```

---

### Why archetype-engine Makes This Work

| Without archetype-engine | With archetype-engine |
|--------------------------|----------------------|
| AI generates 15+ files that must stay in sync | AI generates 1 JSON manifest |
| You write schema → validation → API → hooks manually | Engine generates all of it |
| Errors are unstructured strings | Structured errors with suggestions |
| Type safety depends on AI | Types guaranteed by engine |

**archetype-engine handles the hard part**: keeping database schema, validation, API, and hooks perfectly in sync. Your AI App Builder just needs to generate the manifest and simple UI pages

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
