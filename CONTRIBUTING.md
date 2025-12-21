# Contributing to Archetype Engine

This guide helps you understand the codebase architecture so you can contribute effectively.

## Architecture Overview

```
                    ┌─────────────────┐
                    │   User Input    │
                    │ archetype.config│
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Fluent API    │
                    │ defineEntity()  │
                    │ text(), number()│
                    │ hasMany(), etc. │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  IR Compilation │
                    │ EntityDefinition│
                    │       ↓         │
                    │    EntityIR     │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
     ┌────────▼────────┐          ┌────────▼────────┐
     │   ManifestIR    │          │   CLI (cli.ts)  │
     │   (compiled)    │◄─────────│ init / generate │
     └────────┬────────┘          └────────┬────────┘
              │                            │
              │                   ┌────────▼────────┐
              │                   │ Template System │
              │                   │    registry     │
              │                   │     runner      │
              │                   └────────┬────────┘
              │                            │
              └────────────┬───────────────┘
                           │
              ┌────────────▼────────────┐
              │       Generators        │
              │  schema, api, hooks,    │
              │ validation, auth, i18n  │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │    Generated Output     │
              │   generated/db/         │
              │   generated/schemas/    │
              │   generated/trpc/       │
              │   generated/hooks/      │
              └─────────────────────────┘
```

## Core Concepts

### 1. IR Compilation Pattern

The codebase uses an **Intermediate Representation (IR)** pattern that separates user-facing APIs from internal processing.

**Why?** This decouples the fluent builder API from what generators consume, allowing either side to evolve independently.

```
┌─────────────────────┐     compile()     ┌─────────────────────┐
│  EntityDefinition   │ ────────────────► │      EntityIR       │
│  (user writes this) │                   │ (generators use this)│
└─────────────────────┘                   └─────────────────────┘
```

**Example flow:**

```typescript
// User writes (EntityDefinition)
const User = defineEntity('User', {
  fields: {
    email: text().required().email(),
  },
})

// Internally compiled to (EntityIR)
{
  name: 'User',
  fields: {
    email: {
      type: 'text',
      required: true,
      unique: false,
      validations: [{ type: 'email' }]
    }
  },
  relations: {},
  behaviors: { timestamps: true, softDelete: false, audit: false },
  auth: false,
  protected: { list: false, get: false, create: false, update: false, remove: false }
}
```

### 2. Immutable Builders

All field builders return new objects instead of mutating:

```typescript
// Each method returns a NEW object
function createTextFieldBuilder(config: FieldConfig): TextFieldBuilder {
  return {
    _config: config,
    required: () => createTextFieldBuilder({ ...config, required: true }),
    email: () => createTextFieldBuilder({
      ...config,
      validations: [...config.validations, { type: 'email' }]
    }),
    // ... other methods
  }
}
```

### 3. Generator Interface

Generators are simple functions that receive compiled IR and return files:

```typescript
interface Generator {
  name: string
  description: string
  generate(manifest: ManifestIR, ctx: GeneratorContext): GeneratorOutput
}

// GeneratorOutput is either:
type GeneratorOutput = GeneratedFile | GeneratedFile[]
```

### 4. Template System

Templates bundle generators for a specific tech stack:

```typescript
const template: Template = {
  meta: { id: 'nextjs-drizzle-trpc', ... },
  defaultConfig: { outputDir: 'generated', ... },
  generators: [
    schemaGenerator,     // Drizzle ORM tables
    validationGenerator, // Zod schemas
    apiGenerator,        // tRPC routers
    hooksGenerator,      // React hooks
    // ...
  ],
}
```

## How to Add a New Field Type

### Step 1: Define the interface in `src/fields.ts`

```typescript
// Add to the builder interfaces section
export interface JsonFieldBuilder extends BaseFieldBuilder<JsonFieldBuilder> {
  // Add any JSON-specific methods
  schema(zodSchema: string): JsonFieldBuilder
}
```

### Step 2: Create the builder implementation

```typescript
function createJsonFieldBuilder(config: FieldConfig): JsonFieldBuilder {
  return {
    _config: config,
    required: () => createJsonFieldBuilder({ ...config, required: true }),
    optional: () => createJsonFieldBuilder({ ...config, required: false }),
    unique: () => createJsonFieldBuilder({ ...config, unique: true }),
    default: (value: unknown) => createJsonFieldBuilder({ ...config, default: value }),
    label: (value: string) => createJsonFieldBuilder({ ...config, label: value }),
    schema: (zodSchema: string) => createJsonFieldBuilder({
      ...config,
      validations: [...config.validations, { type: 'jsonSchema', value: zodSchema }]
    }),
  }
}
```

### Step 3: Export the factory function

```typescript
/**
 * Create a JSON field builder
 *
 * @returns JsonFieldBuilder with chainable methods
 *
 * @example
 * ```typescript
 * json().schema('z.object({ foo: z.string() })')
 * ```
 */
export function json(): JsonFieldBuilder {
  return createJsonFieldBuilder({
    type: 'json',  // Add to FieldConfig type union
    required: false,
    unique: false,
    validations: []
  })
}
```

### Step 4: Update the FieldConfig type

```typescript
export interface FieldConfig {
  type: 'text' | 'number' | 'boolean' | 'date' | 'json'  // Add 'json'
  // ...
}
```

### Step 5: Update generators to handle the new type

In `src/templates/nextjs-drizzle-trpc/generators/schema.ts`:

```typescript
function mapFieldType(config: FieldConfig, isSqlite: boolean): string {
  switch (config.type) {
    case 'json': return 'text'  // Store as JSON string
    // ...
  }
}
```

### Step 6: Export from index.ts

```typescript
export { text, number, boolean, date, json } from './fields'
```

## Recent Features Added

### `.length()` for Text Fields (Dec 2024)
Exact-length validation for fields like country codes, card numbers:
```typescript
countryCode: text().required().length(2)  // Exactly 2 characters
```
Internally adds both `minLength` and `maxLength` validations.

### `.optional()` for Relations (Dec 2024)
Nullable foreign keys for optional relationships:
```typescript
customer: hasOne('Customer').optional()  // Guest checkout support
parent: hasOne('Category').optional()    // Top-level categories
```
The schema generator respects this by NOT adding `.notNull()` to the FK column.

### Step 7: Add tests

Create tests in `tests/fields.test.ts`:

```typescript
describe('json field', () => {
  it('creates json field with defaults', () => {
    const field = json()
    expect(field._config.type).toBe('json')
    expect(field._config.required).toBe(false)
  })

  it('supports schema validation', () => {
    const field = json().schema('z.object({})')
    expect(field._config.validations).toContainEqual({
      type: 'jsonSchema',
      value: 'z.object({})'
    })
  })
})
```

## How to Create a New Generator

### Step 1: Create the generator file

Create `src/templates/nextjs-drizzle-trpc/generators/myfeature.ts`:

```typescript
/**
 * MyFeature generator
 *
 * Generates [description of what this generates].
 *
 * @module generators/myfeature
 */

import type { Generator, GeneratedFile } from '../../../template/types'
import type { GeneratorContext } from '../../../template/context'
import type { ManifestIR } from '../../../manifest'

/**
 * Generate content for a single entity
 */
function generateEntityContent(entity: EntityIR, manifest: ManifestIR): string {
  // Your generation logic here
  return `// Generated content for ${entity.name}`
}

/**
 * MyFeature generator - generates [description]
 *
 * Generated files:
 * - myfeature/{entity}.ts - [description]
 */
export const myFeatureGenerator: Generator = {
  name: 'my-feature',
  description: 'Generate [description]',

  generate(manifest: ManifestIR, ctx: GeneratorContext): GeneratedFile[] {
    return manifest.entities.map(entity => ({
      path: `myfeature/${entity.name.toLowerCase()}.ts`,
      content: generateEntityContent(entity, manifest),
    }))
  },
}
```

### Step 2: Register in the template

In `src/templates/nextjs-drizzle-trpc/index.ts`:

```typescript
import { myFeatureGenerator } from './generators/myfeature'

export const template: Template = {
  // ...
  generators: [
    schemaGenerator,
    validationGenerator,
    myFeatureGenerator,  // Add here
    // ...
  ],
}
```

### Step 3: Use GeneratorContext utilities

The `ctx` parameter provides helpful utilities:

```typescript
generate(manifest: ManifestIR, ctx: GeneratorContext): GeneratedFile[] {
  // Naming utilities
  const tableName = ctx.naming.getTableName('BlogPost')  // 'blog_posts'
  const columnName = ctx.naming.getColumnName('firstName')  // 'first_name'

  // Database type checks
  if (ctx.database.isSqlite) { /* SQLite-specific code */ }
  if (ctx.database.isPostgres) { /* PostgreSQL-specific code */ }

  // ...
}
```

## How to Create a New Template

Templates live in `src/templates/`. To create a new one:

### Step 1: Create the directory structure

```
src/templates/my-new-template/
├── index.ts           # Template definition
└── generators/
    ├── schema.ts      # Database schema generator
    ├── validation.ts  # Validation generator
    └── ...
```

### Step 2: Define the template in index.ts

```typescript
import type { Template } from '../../template/types'
import { schemaGenerator } from './generators/schema'

export const template: Template = {
  meta: {
    id: 'my-new-template',
    name: 'My New Template',
    description: 'Description for CLI help',
    framework: 'nextjs',  // or 'sveltekit', 'remix', etc.
    stack: {
      database: 'drizzle',
      validation: 'zod',
      api: 'trpc',
      ui: 'react',
    },
  },
  defaultConfig: {
    outputDir: 'generated',
    importAliases: {
      '@/generated': 'generated',
    },
  },
  generators: [
    schemaGenerator,
    // Add your generators here
  ],
}

export default template
```

### Step 3: Register in the template registry

In `src/template/registry.ts`:

```typescript
const templates: Record<string, () => Promise<Template>> = {
  'nextjs-drizzle-trpc': async () =>
    (await import('../templates/nextjs-drizzle-trpc')).default,
  'my-new-template': async () =>
    (await import('../templates/my-new-template')).default,
}
```

## Directory Structure

```
src/
├── index.ts           # Package entry point, exports public API
├── cli.ts             # CLI entry point (init, generate, view commands)
├── fields.ts          # Field builders (text, number, boolean, date)
├── relations.ts       # Relation builders (hasOne, hasMany, belongsToMany)
├── entity.ts          # Entity definition and IR compilation
├── manifest.ts        # Manifest definition and IR compilation
├── source.ts          # External source configuration
├── core/
│   └── utils.ts       # Shared utilities (naming, pluralization)
├── template/
│   ├── index.ts       # Template system exports
│   ├── types.ts       # Template & Generator interfaces
│   ├── context.ts     # GeneratorContext with utilities
│   ├── runner.ts      # Template execution
│   └── registry.ts    # Template lazy-loading registry
├── templates/
│   └── nextjs-drizzle-trpc/
│       ├── index.ts   # Template definition
│       └── generators/
│           ├── schema.ts      # Drizzle ORM schema
│           ├── auth.ts        # Auth.js integration
│           ├── validation.ts  # Zod schemas
│           ├── api.ts         # tRPC routers
│           ├── hooks.ts       # React hooks
│           ├── service.ts     # External API services
│           └── i18n.ts        # Translation files
├── init/              # Init command implementation
├── validation/        # Structured validation with error codes
├── json/              # JSON input parsing for AI agents
├── ai/                # AI toolkit (ManifestBuilder, adapters)
└── generators/        # Standalone generators (ERD)
```

## Testing

Run tests with:

```bash
npm run test:run   # Single run
npm run test       # Watch mode
```

Tests are in `tests/` and use Vitest. Each module has its own test file:

- `entity.test.ts` - Entity definition tests
- `fields.test.ts` - Field builder tests
- `relations.test.ts` - Relation tests
- `manifest.test.ts` - Manifest compilation
- `validation.test.ts` - Validation rules
- `json-input.test.ts` - JSON parsing
- `ai.test.ts` - AI module tests

## Code Style

- **Immutable patterns** - Return new objects, don't mutate
- **Functional style** - Pure functions where possible
- **Explicit types** - Use TypeScript interfaces for public APIs
- **JSDoc comments** - Document public functions with examples
- **Consistent naming**:
  - PascalCase for types/interfaces: `EntityIR`, `FieldConfig`
  - camelCase for functions/variables: `defineEntity`, `createTextFieldBuilder`
  - snake_case for database columns: `created_at`, `organization_id`

## Making a Pull Request

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Add tests for new functionality
5. Run tests: `npm run test:run`
6. Build: `npm run build`
7. Commit with a clear message
8. Open a PR against `main`

## Questions?

Open an issue on GitHub or check CLAUDE.md for additional project context.
