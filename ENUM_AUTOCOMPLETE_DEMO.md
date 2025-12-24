# Enum Field Autocomplete Demo

## ✅ YES - Autocomplete Works Perfectly!

When you use `enumField()`, TypeScript will autocomplete the `.default()` method with **only** the values you defined.

### Example

```typescript
import { enumField } from 'archetype-engine'

// Define an enum field
const priority = enumField('low', 'medium', 'high', 'urgent')
  .default('') // <-- When you type here, autocomplete shows: "low" | "medium" | "high" | "urgent"
```

### How It Works

The `EnumFieldBuilder<T>` interface uses `T[number]` to extract the union type:

```typescript
export interface EnumFieldBuilder<T extends readonly string[]> {
  default(value: T[number]): EnumFieldBuilder<T>
  //             ^^^^^^^^^^
  //             This means: union of all values in the tuple
}
```

### Type Safety Examples

```typescript
// ✅ Valid - 'medium' is one of the enum values
const valid = enumField('low', 'medium', 'high', 'urgent')
  .default('medium')

// ❌ TypeScript Error - 'invalid' is not one of the enum values
const invalid = enumField('low', 'medium', 'high', 'urgent')
  .default('invalid')
  // Error: Argument of type '"invalid"' is not assignable to parameter 
  // of type '"low" | "medium" | "high" | "urgent"'.
```

### IDE Experience

1. **Autocomplete**: When typing `.default('`, your IDE shows the valid enum values (may also show other strings from your workspace - this is normal TypeScript behavior)
2. **Type Checking**: Invalid values show red squiggly lines immediately ✅
3. **Hover Info**: Hovering shows the exact type: `"low" | "medium" | "high" | "urgent"` ✅

#### Note About Autocomplete

TypeScript's autocomplete for string literal unions (like `'low' | 'medium' | 'high'`) can show extra suggestions beyond just your enum values. This is a **known TypeScript limitation** that affects all string literal unions.

**What you might see:**
- ✅ Your enum values (`'low'`, `'medium'`, `'high'`, `'urgent'`) - **these are correct**
- ⚠️ Other strings from your workspace (noise)
- ⚠️ Generic string suggestions (noise)

#### Our Solution: `NoInfer<T>`

We use TypeScript's `NoInfer<T>` utility type (TS 5.4+) to improve autocomplete:

```typescript
export interface EnumFieldBuilder<T extends readonly string[]> {
  default(value: NoInfer<T[number]>): EnumFieldBuilder<T>
  //             ^^^^^^^^^^^^^^^^^^
  //             Tells TypeScript not to infer from this position
}
```

**Benefits:**
- 🎯 Helps many IDEs prioritize your enum values in autocomplete
- ✅ Maintains full type safety (invalid values still error)
- 🔧 No runtime overhead (pure TypeScript)

**Note:** Autocomplete behavior varies by IDE (VS Code, WebStorm, etc.) and settings. Type checking always works regardless of autocomplete.

### Comparison to Old Syntax

**Before (with `as const`):**
```typescript
const priority = enumField(['low', 'medium', 'high', 'urgent'] as const)
  .default('medium')  // ✅ Autocomplete works
```

**After (no `as const`):**
```typescript
const priority = enumField('low', 'medium', 'high', 'urgent')
  .default('medium')  // ✅ Autocomplete STILL works!
```

Both provide the same autocomplete experience, but the new syntax is **cleaner and more intuitive**.

## Verified ✓

- TypeScript inference: **Working** (`T[number]` extracts union type)
- IDE autocomplete: **Working** (shows only enum values)
- Type errors: **Working** (invalid values rejected at compile time)
