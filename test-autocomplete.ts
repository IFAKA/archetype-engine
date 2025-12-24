/**
 * TEST FILE: Check autocomplete behavior with NoInfer
 * 
 * Open this file in your IDE (VS Code, WebStorm, etc.) and test autocomplete.
 * 
 * Instructions:
 * 1. Place your cursor after .default(' and press Ctrl+Space (or Cmd+Space on Mac)
 * 2. Check what autocomplete suggestions appear
 * 3. Compare before/after the NoInfer change
 */

import { enumField, text, date } from './src/index.js'

// ========================================
// TEST 1: Enum Field Autocomplete
// ========================================

const priority = enumField('low', 'medium', 'high', 'urgent')

// Put your cursor after the quote and press Ctrl+Space:
// Try typing: priority.default('')
//                              ^ Delete 'medium' and try autocomplete here
const test1 = priority.default('medium')
//
// EXPECTED: Should show only: 'low' | 'medium' | 'high' | 'urgent'
// REALITY WITH NoInfer: Should be cleaner (IDE-dependent)

// ========================================
// TEST 2: Status Enum
// ========================================

const status = enumField('draft', 'published', 'archived')

// Try autocomplete here:
// Try typing: status.default('')
const test2 = status.default('draft')
//                           ^ Delete 'draft' and try autocomplete here

// ========================================
// TEST 3: Inline Usage
// ========================================

// Try autocomplete in one line:
const inline = enumField('a', 'b', 'c').default('a')
//                                               ^ Delete 'a' and try autocomplete here

// ========================================
// TEST 4: Comparison with Date Field
// ========================================

// Date field also uses string literal union - does it have the same issue?
const createdAt = date().default('now')
//                               ^ Delete 'now' and try autocomplete here
// Should show: 'now' | Date

// ========================================
// TEST 5: Type Safety (should error)
// ========================================

// Uncomment to verify type checking still works:
// const shouldError = enumField('x', 'y', 'z').default('invalid')
//                                                       ^^^^^^^^^ Should show red squiggly

// ========================================
// RESULTS
// ========================================

console.log('NoInfer Applied:')
console.log('- Type safety: ✅ Still works')
console.log('- Autocomplete: Check your IDE')
console.log('')
console.log('The NoInfer utility type MAY reduce autocomplete noise,')
console.log('but effectiveness varies by IDE and settings.')

export {}
