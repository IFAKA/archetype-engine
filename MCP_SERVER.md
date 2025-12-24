# Archetype MCP Server

**Model Context Protocol** integration for Claude Desktop, Claude Code, Cursor, and other AI coding assistants.

## What is MCP?

MCP (Model Context Protocol) allows AI assistants like Claude to call tools directly without API calls. This makes backend generation **10x faster** for AI coding assistants.

## Quick Setup

### For Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "archetype": {
      "command": "npx",
      "args": ["-y", "archetype-engine@latest", "mcp"]
    }
  }
}
```

### For Cursor / Windsurf

Add to your project's `.cursorrules` or `.windsurfrules`:

```
# Archetype Backend Generator

When user asks to create a backend, use archetype CLI with JSON manifests:

1. Create manifest.json with all entities
2. Run: npx archetype validate manifest.json --json
3. Run: npx archetype generate manifest.json
4. Run: npx drizzle-kit push && npm run dev

See CLAUDE.md for details.
```

## Available Tools

### 1. `archetype_create_manifest`

Create a manifest.json with entity definitions.

**Example:**
```typescript
{
  "entities": [
    {
      "name": "User",
      "fields": {
        "email": { "type": "text", "email": true, "unique": true },
        "name": { "type": "text", "required": true }
      }
    },
    {
      "name": "Post",
      "fields": {
        "title": { "type": "text", "min": 1, "max": 200 },
        "content": { "type": "text" }
      },
      "relations": {
        "author": { "type": "hasOne", "entity": "User" }
      },
      "protected": "write"
    }
  ],
  "database": {
    "type": "sqlite",
    "file": "./app.db"
  }
}
```

### 2. `archetype_validate_manifest`

Validate manifest.json before generating.

**Input:**
- `manifestPath` (optional): Path to manifest file (default: "manifest.json")

### 3. `archetype_generate`

Generate all backend code from manifest.json.

**Input:**
- `manifestPath` (optional): Path to manifest file (default: "manifest.json")

**Generates:**
- `generated/db/schema.ts` - Drizzle ORM schemas
- `generated/schemas/*.ts` - Zod validation
- `generated/trpc/routers/*.ts` - tRPC CRUD APIs
- `generated/hooks/*.ts` - React Query hooks
- `generated/erd.md` - Entity diagram

### 4. `archetype_view_schema`

Open ERD viewer in browser.

**Input:**
- `configPath` (optional): Path to config/manifest (default: "manifest.json")

## Usage Examples

### Example 1: Blog with Users and Posts

**User:** "Create a blog with users and posts"

**Claude calls:**
1. `archetype_create_manifest` with:
```json
{
  "entities": [
    { "name": "User", "fields": { "email": {...}, "name": {...} } },
    { "name": "Post", "fields": { "title": {...}, "content": {...} }, "relations": { "author": { "type": "hasOne", "entity": "User" } } }
  ],
  "database": { "type": "sqlite", "file": "./app.db" }
}
```

2. `archetype_validate_manifest`
3. `archetype_generate`

**Result:** 400+ lines of production-ready code in 3 tool calls.

### Example 2: E-commerce App

**User:** "Build an e-commerce site with products, orders, and customers"

**Claude calls:**
1. `archetype_create_manifest` with Product, Order, Customer, OrderItem entities
2. `archetype_validate_manifest`
3. `archetype_generate`
4. `archetype_view_schema` to visualize

**Result:** Complete backend with:
- Product catalog with pagination/filtering
- Order management with line items
- Customer authentication
- Type-safe APIs and hooks

## Why MCP is Better Than API Calls

### Traditional Approach (Slow)
```typescript
// AI makes 10+ API calls to OpenAI/Anthropic
await generateText({
  model: openai('gpt-4'),
  tools: aiTools.vercel(builder),
  prompt: "Create a blog",
  maxSteps: 10
})
// → $0.50 in API costs, 30 seconds
```

### MCP Approach (Fast)
```
User: "Create a blog"
Claude: [calls archetype_create_manifest directly]
Claude: [calls archetype_generate]
→ FREE, 2 seconds, no API round-trips
```

## Comparison

| Aspect | API (OpenAI/Anthropic) | MCP Server |
|--------|----------------------|------------|
| **Speed** | 30+ seconds | 2 seconds |
| **Cost** | $0.20-0.50 per generation | FREE |
| **Round-trips** | 10+ API calls | Direct function calls |
| **Reliability** | Rate limits, network errors | Local execution |
| **Setup** | API keys, billing | One config line |

## Architecture

```
┌─────────────┐
│ Claude Code │
│  / Cursor   │
└──────┬──────┘
       │ stdio/JSON-RPC
       │
┌──────▼──────────┐
│  MCP Server     │
│  (archetype)    │
└──────┬──────────┘
       │
       │ Direct function calls
       │
┌──────▼──────────┐
│  Archetype      │
│  Core Engine    │
└──────┬──────────┘
       │
       │ Write files
       │
┌──────▼──────────┐
│  Project Files  │
│  (generated/)   │
└─────────────────┘
```

## Development

To test the MCP server locally:

```bash
# Build
npm run build

# Test MCP server
echo '{"method":"tools/call","params":{"name":"archetype_create_manifest","arguments":{...}}}' | node dist/src/mcp-server.js
```

## Troubleshooting

### Claude Desktop not seeing tools

1. Check config location: `~/Library/Application Support/Claude/claude_desktop_config.json`
2. Restart Claude Desktop completely
3. Check logs: `~/Library/Logs/Claude/mcp*.log`

### "Command not found: npx"

Ensure Node.js 20+ is installed:
```bash
node --version  # Should be v20+
which npx      # Should show path
```

### MCP server crashes

Check stderr output in Claude Desktop logs:
```bash
tail -f ~/Library/Logs/Claude/mcp-server-archetype.log
```

## Learn More

- [MCP Specification](https://modelcontextprotocol.io)
- [Archetype Docs](https://archetype-engine.vercel.app)
- [CLAUDE.md](./CLAUDE.md) - Guidance for Claude Code
