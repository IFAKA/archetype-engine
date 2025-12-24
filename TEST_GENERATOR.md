# Test Generator - Proof of Concept

## What We Built

A **fully automated test generator** that creates comprehensive Vitest test suites from entity definitions. This proves that **everything can be generated from compilation** with ZERO manual test writing.

## How It Works

### Input (User writes this once):

```typescript
const User = defineEntity('User', {
  fields: {
    email: text().required().email(),
    name: text().required().min(2).max(100),
    age: number().optional().min(0).max(150).integer(),
  },
  behaviors: {
    timestamps: true,
    softDelete: true,
  },
  protected: 'write', // list/get public, create/update/remove protected
})
```

### Output (Auto-generated - 206 lines of tests):

```bash
npx archetype generate
```

Generates `generated/tests/user.test.ts` with:

## Generated Test Coverage

### ✅ CRUD Operation Tests
- **Create**: Valid data creates record with all fields
- **List**: Returns paginated results with proper structure
- **Get**: Returns single record by ID
- **Update**: Modifies existing record
- **Remove**: Deletes record (or soft deletes)

### ✅ Validation Tests  
- **Required fields**: Rejects missing required fields
- **Email validation**: `email: 'invalid-email'` → throws error
- **Min/Max length**: `name: 'x'` → throws (below min of 2)
- **Number constraints**: Integer, positive, min/max validations
- **Enum values**: Rejects values outside allowed list

### ✅ Authentication Tests
- **Protected operations**: Public caller → UNAUTHORIZED error
- **Authenticated operations**: Auth caller → succeeds
- **Mixed protection**: List public, create protected

### ✅ Filter/Search/Pagination Tests
- **Filtering**: `where: { email: { contains: 'test' } }`
- **Search**: `search: 'test'` searches across text fields
- **Pagination**: `page: 1, limit: 10` with proper response

### ✅ Batch Operation Tests
- **createMany**: Creates multiple records
- **updateMany**: Updates multiple records  
- **removeMany**: Deletes multiple records

### ✅ Behavior Tests
- **Timestamps**: `createdAt`, `updatedAt` auto-generated
- **Soft delete**: `deletedAt` set instead of hard delete
- **Computed fields**: Verified in responses

## Example Generated Tests

```typescript
describe('User Router', () => {
  const publicCaller = createCaller(mockPublicContext)
  const authCaller = createCaller(mockAuthContext)

  const validData = {
    email: 'test-email@example.com',
    name: 'Test User',
  }

  describe('create', () => {
    it('should require authentication', async () => {
      await expect(
        publicCaller.user.create(validData)
      ).rejects.toThrow(/UNAUTHORIZED|unauthorized/)
    })

    it('should create User when authenticated', async () => {
      const result = await authCaller.user.create(validData)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.email).toBe(validData.email)
      expect(result.name).toBe(validData.name)
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
    })

    it('should reject invalid email (invalid email format)', async () => {
      const invalidData = { ...validData, email: 'invalid-email' }

      await expect(
        authCaller.user.create(invalidData)
      ).rejects.toThrow()
    })

    it('should reject invalid name (below minimum length of 2)', async () => {
      const invalidData = { ...validData, name: 'x' }

      await expect(
        authCaller.user.create(invalidData)
      ).rejects.toThrow()
    })
  })

  describe('batch operations', () => {
    it('should create multiple Users', async () => {
      const items = [validData, validData, validData]
      const result = await authCaller.user.createMany({ items })

      expect(result.created).toHaveLength(3)
      expect(result.count).toBe(3)
    })
  })
})
```

## Generated Files

For 2 entities (User, Post):

```
generated/
├── tests/
│   ├── user.test.ts    # 206 lines - comprehensive User tests
│   ├── post.test.ts    # 228 lines - comprehensive Post tests
│   └── setup.ts        # 26 lines - test configuration
```

**Total: 434 lines of test code** generated from ~40 lines of entity definitions.

## Why This Is Revolutionary

### Traditional Workflow:
1. Write entity definition
2. Write database schema
3. Write API endpoints
4. **Write 200+ lines of tests manually**
5. Update all 4 when entity changes

### Archetype Workflow:
1. Write entity definition
2. Run `npx archetype generate`
3. **Get tests automatically**
4. When entity changes → regenerate → TypeScript guides fixes

## What This Proves

**YES - EVERYTHING CAN BE GENERATED FROM COMPILATION!**

- ✅ Database schemas
- ✅ API endpoints (tRPC routers)
- ✅ Validation (Zod)
- ✅ React hooks
- ✅ **Tests (NEW!)** 
- 🔜 API documentation (OpenAPI)
- 🔜 Seed data
- 🔜 E2E tests
- 🔜 Admin UI

## Developer Experience

```bash
# Define your entity once
vim archetype/entities/user.ts

# Get EVERYTHING
npx archetype generate

# Run the auto-generated tests
npm test
```

**Zero manual test writing. Zero maintenance burden.**

When you add a field:
```typescript
age: number().required().min(18) // NEW FIELD
```

Regenerate:
```bash
npx archetype generate
```

Automatically adds:
- ✅ Database column
- ✅ Validation rule
- ✅ API field
- ✅ Test for missing age
- ✅ Test for age < 18
- ✅ Test for valid age

## Next Steps

1. **OpenAPI Generator** - Auto-generate API documentation
2. **Seed Generator** - Sample data for development
3. **E2E Generator** - Playwright/Cypress full-flow tests
4. **Admin UI Generator** - Full CRUD dashboard

All following the same pattern: **define entities once, generate everything.**

## The Vision

**"Write entities, not infrastructure"**

Developers should focus on:
- Business logic (entity definitions)
- Custom behaviors (hooks)
- User experience

NOT:
- Boilerplate tests
- Repetitive CRUD code
- Manual synchronization

Archetype handles the rest. Automatically. Deterministically. Perfectly synced.
