# ADR 001: Fluent API Design with Immutable Builders

## Status
Accepted

## Context
Entity and field definitions need to be:
1. Type-safe at compile time
2. Easy to read and write
3. Self-documenting
4. Chainable for ergonomic DX

Early versions used plain objects which lacked discoverability and type safety.

## Decision
Implement fluent builder pattern with immutable objects for all field and entity definitions.

### Field Builders
```typescript
const email = text()
  .required()
  .unique()
  .email()
  .max(255)
  .label('Email Address')
```

### Key Principles
1. **Immutability** - Each method returns a new object, never mutates
2. **Type Preservation** - Generics ensure chaining maintains correct type
3. **Defaults** - Fields are `required` and `notNull` unless explicitly made `.optional()`
4. **Semantic Methods** - `.email()` over `.regex(/^.+@.+$/)`

## Consequences

### Positive
- Excellent IDE autocomplete
- Impossible to create invalid field configurations
- Self-documenting code (`.email().unique()` is obvious)
- Functional programming patterns (no mutations)

### Negative
- Slightly more memory usage (creates intermediate objects)
- More complex implementation than plain objects
- Bundle size ~2KB larger than plain objects

### Neutral
- Users must learn fluent API (but it's intuitive)

## Alternatives Considered

### 1. Plain Object Configuration
```typescript
{ type: 'text', required: true, validations: ['email', 'unique'] }
```
**Rejected**: No type safety, no autocomplete, error-prone

### 2. Class-based Builders with Mutations
```typescript
const field = new TextField()
field.setRequired(true) // mutates
field.setUnique(true)
```
**Rejected**: Mutations make reasoning harder, less functional

## References
- Inspired by Drizzle ORM's column builders
- Similar to Prisma's field attributes
- Follows Builder Pattern from GoF Design Patterns
