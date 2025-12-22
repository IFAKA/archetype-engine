---
sidebar_position: 14
---

# AI Module

Build AI-powered app builders that generate Archetype entities through natural language.

## Overview

The AI module provides tools for LLMs to create and modify entity definitions. Use it to build:

- AI coding assistants
- Natural language to schema converters
- App generation tools
- No-code builders

## Installation

```typescript
import { createManifestBuilder, aiTools } from 'archetype-engine/ai'
```

## Quick Start

```typescript
import { createManifestBuilder, aiTools } from 'archetype-engine/ai'

// Create a builder to track entities across tool calls
const builder = createManifestBuilder()

// Get tools in your preferred format
const tools = aiTools.vercel(builder)   // Vercel AI SDK
// or: aiTools.openai(builder)          // OpenAI function calling
// or: aiTools.anthropic(builder)       // Anthropic tool use
```

## Tool Formats

### Vercel AI SDK

```typescript
import { generateText } from 'ai'
import { createManifestBuilder, aiTools } from 'archetype-engine/ai'

const builder = createManifestBuilder()
const tools = aiTools.vercel(builder)

const result = await generateText({
  model: yourModel,
  tools,
  messages: [
    { role: 'user', content: 'Create a blog with posts and comments' },
  ],
})
```

### OpenAI

```typescript
import OpenAI from 'openai'
import { createManifestBuilder, aiTools } from 'archetype-engine/ai'

const builder = createManifestBuilder()
const tools = aiTools.openai(builder)

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  tools,
  messages: [...],
})
```

### Anthropic

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { createManifestBuilder, aiTools } from 'archetype-engine/ai'

const builder = createManifestBuilder()
const tools = aiTools.anthropic(builder)

const response = await anthropic.messages.create({
  model: 'claude-3-opus-20240229',
  tools,
  messages: [...],
})
```

## Available Tools

### add_entity

Create a new entity with fields and relations.

```json
{
  "name": "add_entity",
  "arguments": {
    "name": "Post",
    "fields": [
      { "name": "title", "type": "text", "required": true },
      { "name": "content", "type": "text" },
      { "name": "published", "type": "boolean", "default": false }
    ],
    "relations": [
      { "name": "author", "type": "belongsTo", "target": "User" },
      { "name": "comments", "type": "hasMany", "target": "Comment" }
    ]
  }
}
```

### update_entity

Modify an existing entity.

```json
{
  "name": "update_entity",
  "arguments": {
    "name": "Post",
    "addFields": [
      { "name": "likes", "type": "number", "default": 0 }
    ],
    "removeFields": ["draft"]
  }
}
```

### remove_entity

Delete an entity.

```json
{
  "name": "remove_entity",
  "arguments": {
    "name": "Comment"
  }
}
```

### set_database

Configure the database.

```json
{
  "name": "set_database",
  "arguments": {
    "type": "postgres",
    "url": "DATABASE_URL"
  }
}
```

### set_auth

Configure authentication.

```json
{
  "name": "set_auth",
  "arguments": {
    "enabled": true,
    "providers": ["credentials", "google"]
  }
}
```

### get_manifest

Get the current manifest state.

```json
{
  "name": "get_manifest",
  "arguments": {}
}
```

## ManifestBuilder

The builder maintains state across multiple tool calls:

```typescript
const builder = createManifestBuilder()

// Tools modify the builder's state
await tools.add_entity({ name: 'User', fields: [...] })
await tools.add_entity({ name: 'Post', fields: [...] })

// Get the final manifest
const manifest = builder.getManifest()
// {
//   entities: [User, Post],
//   database: { type: 'sqlite', file: './sqlite.db' },
// }

// Generate code
await generate(manifest)
```

## Field Types

| Type | Description |
|------|-------------|
| `text` | String field |
| `number` | Numeric field |
| `boolean` | Boolean field |
| `date` | Date/timestamp field |
| `enum` | Constrained string (include `values` array) |

## Relation Types

| Type | Description |
|------|-------------|
| `belongsTo` | Foreign key to another entity |
| `hasOne` | One-to-one relationship |
| `hasMany` | One-to-many relationship |
| `belongsToMany` | Many-to-many with junction table |

## Example: Chat-Based App Builder

```typescript
import { createManifestBuilder, aiTools, generate } from 'archetype-engine/ai'
import { streamText } from 'ai'

const builder = createManifestBuilder()
const tools = aiTools.vercel(builder)

async function handleChat(userMessage: string) {
  const result = await streamText({
    model: yourModel,
    system: `You are an app builder. Use the provided tools to create
             database schemas based on user requests.`,
    tools,
    messages: [{ role: 'user', content: userMessage }],
  })

  // After conversation, generate the code
  const manifest = builder.getManifest()
  await generate(manifest)
}

// User: "Create a task management app with projects and tasks"
// AI calls: add_entity(Project), add_entity(Task with belongsTo Project)
// Result: Generated Drizzle schema, tRPC routers, React hooks
```
