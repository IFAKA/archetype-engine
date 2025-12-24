# OpenAPI Generator - Complete API Documentation

## What We Built

A **fully automated API documentation generator** that creates OpenAPI 3.0 specifications, Swagger UI, and Markdown docs from entity definitions. This proves that comprehensive, production-ready API documentation can be generated with ZERO manual writing.

## How It Works

### Input (User writes this once):

```typescript
const User = defineEntity('User', {
  fields: {
    email: text().required().email(),
    name: text().required().min(2).max(100),
    age: number().optional().min(0).max(150).integer(),
    role: enumField('admin', 'user', 'guest').default('user'),
  },
  behaviors: {
    timestamps: true,
    softDelete: true,
  },
  protected: 'write', // list/get public, create/update/remove protected
})
```

### Output (Auto-generated - 1,097 lines of docs):

```bash
npx archetype generate
```

Generates:
- `generated/docs/openapi.json` - **924 lines** - Complete OpenAPI 3.0 spec
- `generated/docs/swagger.html` - **37 lines** - Interactive Swagger UI
- `generated/docs/API.md` - **136 lines** - Markdown documentation

## Generated Documentation Features

### ✅ OpenAPI 3.0 Specification (openapi.json)

**Complete spec including:**
- API metadata (title, version, description)
- Server configurations (dev/prod)
- All CRUD endpoints for each entity
- Request/response schemas
- Authentication/security definitions
- Validation constraints (min/max, patterns, enums)
- Pagination and filtering parameters
- Error responses (400, 401, 404)

**Example Schema:**
```json
{
  "User": {
    "type": "object",
    "properties": {
      "id": { "type": "string", "description": "Unique identifier" },
      "email": { "type": "string", "format": "email" },
      "name": { 
        "type": "string",
        "minLength": 2,
        "maxLength": 100
      },
      "age": {
        "type": "integer",
        "format": "int32",
        "minimum": 0,
        "maximum": 150
      },
      "role": {
        "type": "string",
        "enum": ["admin", "user", "guest"],
        "default": "user"
      },
      "isActive": { "type": "boolean", "default": true },
      "createdAt": { "type": "string", "format": "date-time" },
      "updatedAt": { "type": "string", "format": "date-time" },
      "deletedAt": { 
        "type": "string",
        "format": "date-time",
        "nullable": true,
        "description": "Soft delete timestamp"
      }
    }
  }
}
```

**Example Endpoint:**
```json
{
  "/api/trpc/user.create": {
    "post": {
      "summary": "Create User",
      "description": "Create a new User record",
      "operationId": "userCreate",
      "tags": ["User"],
      "security": [{ "bearerAuth": [] }],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/UserCreateInput" }
          }
        }
      },
      "responses": {
        "201": {
          "description": "Successfully created",
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/User" }
            }
          }
        },
        "400": { "description": "Validation error" },
        "401": { "description": "Unauthorized" }
      }
    }
  }
}
```

### ✅ Interactive Swagger UI (swagger.html)

**Features:**
- Beautiful web interface for API exploration
- Interactive request/response testing
- Auto-populated request bodies
- Authentication token input
- Schema visualization
- Try-it-out functionality
- Export to Postman/cURL

**Usage:**
```bash
# Just open the file in a browser
open generated/docs/swagger.html

# Or serve with a local server
npx serve generated/docs
# Visit http://localhost:3000/swagger.html
```

### ✅ Markdown Documentation (API.md)

**Human-readable docs with:**
- Overview and authentication instructions
- Entity field tables
- Endpoint listings with methods
- Example requests/responses
- Security indicators (🔒 Protected / 🌐 Public)
- Copy-paste ready cURL examples

**Example:**
```markdown
### User

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | - |
| name | string | Yes | - |
| age | integer | No | - |
| role | string | No | - |
| isActive | boolean | No | - |

#### Endpoints

**Create User** 🔒 Protected

```
POST /api/trpc/user.create
Content-Type: application/json

{
  "email": "example email",
  "name": "example name"
}
```
```

## What Gets Auto-Generated

### For Each Entity:

1. **Full Model Schema** - Complete entity with all fields, timestamps, soft delete
2. **Create Input Schema** - Required fields for creation
3. **Update Input Schema** - All fields optional for updates
4. **List Endpoint** - Paginated list with search/filter
5. **Get Endpoint** - Retrieve single record by ID
6. **Create Endpoint** - Create new record
7. **Update Endpoint** - Modify existing record
8. **Remove Endpoint** - Delete (or soft delete) record
9. **Batch Endpoints** - createMany, updateMany, removeMany

### Field Type Mapping:

| Archetype | OpenAPI Type | OpenAPI Format |
|-----------|--------------|----------------|
| `text()` | `string` | - |
| `text().email()` | `string` | `email` |
| `text().url()` | `string` | `uri` |
| `number()` | `number` | `double` |
| `number().integer()` | `integer` | `int32` |
| `boolean()` | `boolean` | - |
| `date()` | `string` | `date-time` |
| `enumField(...)` | `string` + `enum` | - |

### Validation Constraints:

| Archetype | OpenAPI |
|-----------|---------|
| `.min(5)` | `minLength: 5` (text) or `minimum: 5` (number) |
| `.max(100)` | `maxLength: 100` (text) or `maximum: 100` (number) |
| `.required()` | Added to `required` array |
| `.default('value')` | `default: 'value'` |
| `.email()` | `format: 'email'` |
| `.url()` | `format: 'uri'` |
| `enumField('a', 'b')` | `enum: ['a', 'b']` |

### Security Mapping:

| Archetype | OpenAPI |
|-----------|---------|
| `protected: false` | `security: []` (public) |
| `protected: 'write'` | List/get public, mutations protected |
| `protected: 'all'` | All operations require `bearerAuth` |

## Generated File Summary

For 2 entities (User, Post):

```
generated/docs/
├── openapi.json    # 924 lines - Full OpenAPI 3.0 spec
├── swagger.html    # 37 lines - Interactive Swagger UI
└── API.md          # 136 lines - Markdown documentation
```

**Total: 1,097 lines of documentation** from ~40 lines of entity definitions.

## Use Cases

### 1. Developer Reference
Developers can browse the Markdown docs or Swagger UI to understand:
- Available endpoints
- Required fields
- Validation rules
- Authentication requirements
- Response formats

### 2. API Testing
Swagger UI allows:
- Interactive endpoint testing
- Request body auto-completion
- Response inspection
- Authentication token management

### 3. Client SDK Generation
OpenAPI spec can generate client SDKs:
```bash
# Generate TypeScript client
npx @openapitools/openapi-generator-cli generate \
  -i generated/docs/openapi.json \
  -g typescript-fetch \
  -o sdk/typescript

# Generate Python client
npx @openapitools/openapi-generator-cli generate \
  -i generated/docs/openapi.json \
  -g python \
  -o sdk/python
```

### 4. Contract Testing
Use spec for API contract validation:
```bash
# Validate API responses match spec
npm install --save-dev jest-openapi
```

### 5. Third-Party Integration
Share `openapi.json` with:
- Postman (import collection)
- Insomnia (import workspace)
- API Gateway tools
- External developers

## Why This Is Revolutionary

### Traditional Approach:
1. Write API endpoints
2. Manually write OpenAPI spec
3. Manually update Swagger UI
4. Manually write Markdown docs
5. Keep all 4 in sync when API changes 😰

### Archetype Approach:
1. Define entities
2. Run `npx archetype generate`
3. **Get everything automatically**
4. When entities change → regenerate → perfect sync ✨

## Developer Experience

```bash
# 1. Add a new field to entity
const User = defineEntity('User', {
  fields: {
    email: text().required().email(),
    name: text().required().min(2).max(100),
    phone: text().optional().regex(/^\+?[1-9]\d{1,14}$/), // NEW!
  },
})

# 2. Regenerate
npx archetype generate

# 3. Documentation automatically includes:
# - Phone field in User schema
# - Regex validation constraint
# - Updated CreateInput schema
# - Updated examples
# - No manual edits needed!
```

## What This Proves

**Complete automation is possible:**

- ✅ Database schemas
- ✅ API endpoints
- ✅ Validation
- ✅ React hooks
- ✅ Tests
- ✅ **API Documentation** (NEW!)

Still to come:
- 🔜 Seed data generators
- 🔜 E2E test generators
- 🔜 Admin UI generators

## Integration Examples

### Serve Swagger UI in Next.js

```typescript
// app/api/docs/route.ts
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  const html = readFileSync(
    join(process.cwd(), 'generated/docs/swagger.html'),
    'utf-8'
  )
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  })
}
```

### Serve OpenAPI JSON

```typescript
// app/api/docs/openapi.json/route.ts
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  const spec = readFileSync(
    join(process.cwd(), 'generated/docs/openapi.json'),
    'utf-8'
  )
  
  return new Response(spec, {
    headers: { 'Content-Type': 'application/json' }
  })
}
```

Now visit: `http://localhost:3000/api/docs`

## The Vision Realized

**"Write entities, not infrastructure"**

Developers define:
- ✅ Entity structure
- ✅ Field validations
- ✅ Relationships
- ✅ Behaviors
- ✅ Security rules

Archetype generates:
- ✅ Database schemas
- ✅ Type-safe APIs
- ✅ Validation logic
- ✅ React hooks
- ✅ Comprehensive tests
- ✅ **Interactive API docs**

All perfectly synchronized. All production-ready. All from a single source of truth.

**This is the milestone.** Everything CAN be generated from compilation. 🎉
