# ADR 002: String Template Code Generation

## Status
Accepted (Current) - Under Review for Future Refactor

## Context
Archetype generates TypeScript code for routers, schemas, hooks, and services. We need a code generation approach that is:
1. Fast to implement (MVP constraint)
2. Maintainable
3. Generates readable, formatted code
4. Handles complex template logic (conditionals, loops)

## Decision
Use string template concatenation for code generation in MVP.

### Implementation
```typescript
function generateRouter(entity: EntityIR): string {
  return `
export const ${entity.name.toLowerCase()}Router = {
  list: publicProcedure.query(async () => {
    ${entity.protected.list ? 'const user = await requireAuth()' : ''}
    return db.select().from(${tableName})
  })
}
`
}
```

## Consequences

### Positive
- Fast to implement (MVP shipped in 2 months)
- Easy to read generated code (what you see is what you get)
- No additional dependencies
- Flexible (can generate any code pattern)

### Negative
- **Fragile indentation** - Whitespace errors common
- **No syntax validation** - Errors only caught when compiling generated code
- **Hard to refactor** - Changes require manual string manipulation
- **Limited type safety** - Template variables are just strings
- **Maintenance burden** - Large 931-line api.ts file

### Neutral
- Requires Prettier/ESLint to format generated code

## Alternatives Considered

### 1. TypeScript Compiler API (ts-morph)
```typescript
import { Project } from 'ts-morph'
const file = project.createSourceFile('router.ts')
file.addFunction({
  name: 'list',
  returnType: 'Promise<Entity[]>',
  statements: 'return db.select()...'
})
```

**Pros**:
- Full type safety
- Automatic formatting
- Refactoring support
- Syntax validation at generation time

**Cons**:
- Steep learning curve
- Adds 5MB to bundle
- Slower generation
- Overkill for simple templates

**Decision**: Defer to v3.0 when we add multi-framework support

### 2. Template Engines (Handlebars, EJS)
```typescript
const template = Handlebars.compile(`
export const {{lowercase name}}Router = {
  {{#if protected}}auth required{{/if}}
}
`)
```

**Pros**:
- Separation of logic and templates
- Familiar syntax

**Cons**:
- Another dependency
- Poor TypeScript integration
- Still generates strings (same fragility)
- Less flexible than plain TypeScript

**Decision**: Rejected - doesn't solve core issues

### 3. Code Builders (jscodeshift, recast)
Similar to ts-morph but AST-focused.

**Decision**: Same as ts-morph - future consideration

## Migration Path

### Phase 1 (v2.x - Current)
- ✅ Use string templates
- ✅ Add helper functions to reduce duplication
- ✅ Comprehensive tests for generated code

### Phase 2 (v3.0 - Planned)
- Migrate to TypeScript Compiler API
- Benefits:
  - Support multiple frameworks (Express, Fastify, NestJS)
  - Refactor generated code programmatically
  - Better error messages
  - AST-based transforms

### Acceptance Criteria for Phase 2
- All 209 tests still pass
- Generated code is identical (or better)
- Generation time < 2x slower
- Bundle size increase < 10MB

## References
- Prisma uses string templates (similar scale)
- GraphQL Code Generator uses ts-morph (larger scale)
- Drizzle Kit uses string templates (similar approach)
