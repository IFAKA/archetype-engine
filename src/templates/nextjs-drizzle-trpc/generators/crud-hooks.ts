/**
 * CRUD Hooks Generator
 *
 * Generates type-safe hook files for CRUD operations.
 * Users implement hooks in these files to add custom business logic.
 *
 * Generated files:
 * - hooks/types.ts - Type definitions for all hook signatures
 * - hooks/{entity}.ts - Hook implementations (user-editable)
 *
 * Features:
 * - Type-safe hook signatures with proper input/output types
 * - beforeCreate/afterCreate hooks for create operations
 * - beforeUpdate/afterUpdate hooks for update operations
 * - beforeRemove/afterRemove hooks for delete operations
 * - Hooks can modify input (before*) or perform side effects (after*)
 *
 * @module generators/crud-hooks
 */

import type { Generator, GeneratedFile } from '../../../template/types'
import type { GeneratorContext } from '../../../template/context'
import type { ManifestIR } from '../../../manifest'
import type { EntityIR, HooksIR } from '../../../entity'

/**
 * Check if entity has any hooks enabled
 */
function hasAnyHooks(hooks: HooksIR): boolean {
  return Object.values(hooks).some(v => v)
}

/**
 * Check if manifest has any entities with hooks
 */
function manifestHasHooks(manifest: ManifestIR): boolean {
  return manifest.entities.some(e => hasAnyHooks(e.hooks))
}

/**
 * Generate the shared hooks types file
 */
function generateHooksTypes(manifest: ManifestIR): string {
  const entityTypes: string[] = []

  for (const entity of manifest.entities) {
    if (!hasAnyHooks(entity.hooks)) continue

    const name = entity.name
    const hooks = entity.hooks

    // Build field types for CreateInput
    const createFields = Object.entries(entity.fields)
      .filter(([_, f]) => f.type !== 'computed')
      .map(([fieldName, config]) => {
        const optional = !config.required ? '?' : ''
        let type = 'string'
        if (config.type === 'number') type = 'number'
        if (config.type === 'boolean') type = 'boolean'
        if (config.type === 'enum' && config.enumValues) {
          type = config.enumValues.map(v => `'${v}'`).join(' | ')
        }
        return `  ${fieldName}${optional}: ${type}`
      })
      .join('\n')

    // Build field types for UpdateInput (all optional)
    const updateFields = Object.entries(entity.fields)
      .filter(([_, f]) => f.type !== 'computed')
      .map(([fieldName, config]) => {
        let type = 'string'
        if (config.type === 'number') type = 'number'
        if (config.type === 'boolean') type = 'boolean'
        if (config.type === 'enum' && config.enumValues) {
          type = config.enumValues.map(v => `'${v}'`).join(' | ')
        }
        return `  ${fieldName}?: ${type}`
      })
      .join('\n')

    // Build hook interface members
    const hookMembers: string[] = []
    if (hooks.beforeCreate) {
      hookMembers.push(`  /** Called before creating. Return modified input or throw to abort. */
  beforeCreate?: (input: ${name}CreateInput, ctx: HookContext) => Promise<${name}CreateInput> | ${name}CreateInput`)
    }
    if (hooks.afterCreate) {
      hookMembers.push(`  /** Called after creation. For side effects like sending emails. */
  afterCreate?: (record: ${name}Record, ctx: HookContext) => Promise<void> | void`)
    }
    if (hooks.beforeUpdate) {
      hookMembers.push(`  /** Called before updating. Return modified input or throw to abort. */
  beforeUpdate?: (id: string, input: ${name}UpdateInput, ctx: HookContext) => Promise<${name}UpdateInput> | ${name}UpdateInput`)
    }
    if (hooks.afterUpdate) {
      hookMembers.push(`  /** Called after update. For side effects. */
  afterUpdate?: (record: ${name}Record, ctx: HookContext) => Promise<void> | void`)
    }
    if (hooks.beforeRemove) {
      hookMembers.push(`  /** Called before removal. Throw to abort deletion. */
  beforeRemove?: (id: string, ctx: HookContext) => Promise<void> | void`)
    }
    if (hooks.afterRemove) {
      hookMembers.push(`  /** Called after removal. For cleanup/archival. */
  afterRemove?: (record: ${name}Record, ctx: HookContext) => Promise<void> | void`)
    }

    entityTypes.push(`
// ============ ${name} Hooks ============

export interface ${name}CreateInput {
${createFields}
}

export interface ${name}UpdateInput {
${updateFields}
}

export interface ${name}Record extends ${name}CreateInput {
  id: string
  createdAt: string
  updatedAt: string
}

export interface ${name}Hooks {
${hookMembers.join('\n')}
}`)
  }

  return `// Auto-generated hook types
// Do not edit manually - regenerate with: npx archetype generate

/**
 * Hook context passed to all hooks
 * Contains user session and other request context
 */
export interface HookContext {
  /** User session (if authenticated) */
  user?: {
    id: string
    email?: string
    name?: string
  }
  /** Request headers */
  headers?: Record<string, string>
}
${entityTypes.join('\n')}
`
}

/**
 * Generate a stub hooks file for an entity
 */
function generateEntityHooks(entity: EntityIR): string {
  const name = entity.name
  const lowerName = name.toLowerCase()
  const hooks = entity.hooks

  const imports: string[] = [`${name}Hooks`, 'HookContext']
  if (hooks.beforeCreate || hooks.afterCreate) {
    imports.push(`${name}CreateInput`)
  }
  if (hooks.beforeUpdate) {
    imports.push(`${name}UpdateInput`)
  }
  if (hooks.afterCreate || hooks.afterUpdate || hooks.afterRemove) {
    imports.push(`${name}Record`)
  }

  const hookImplementations: string[] = []

  if (hooks.beforeCreate) {
    hookImplementations.push(`
  async beforeCreate(input, ctx) {
    // Validate business rules or modify input
    // throw new Error('message') to abort
    return input
  },`)
  }

  if (hooks.afterCreate) {
    hookImplementations.push(`
  async afterCreate(record, ctx) {
    // Side effects: send email, audit log, sync external system
  },`)
  }

  if (hooks.beforeUpdate) {
    hookImplementations.push(`
  async beforeUpdate(id, input, ctx) {
    // Validate business rules or modify input
    // throw new Error('message') to abort
    return input
  },`)
  }

  if (hooks.afterUpdate) {
    hookImplementations.push(`
  async afterUpdate(record, ctx) {
    // Side effects: sync external system, invalidate cache
  },`)
  }

  if (hooks.beforeRemove) {
    hookImplementations.push(`
  async beforeRemove(id, ctx) {
    // Check if deletion is allowed
    // throw new Error('message') to abort
  },`)
  }

  if (hooks.afterRemove) {
    hookImplementations.push(`
  async afterRemove(record, ctx) {
    // Cleanup: archive data, remove related records
  },`)
  }

  return `// ${name} CRUD Hooks
// Implement your business logic here
// This file is user-managed - it won't be overwritten by regenerate

import type { ${imports.join(', ')} } from './types'

export const ${lowerName}Hooks: ${name}Hooks = {${hookImplementations.join('')}
}
`
}

export const crudHooksGenerator: Generator = {
  name: 'crud-hooks',
  description: 'Generate CRUD hook files',

  generate(manifest: ManifestIR, ctx: GeneratorContext): GeneratedFile[] {
    // Only generate if at least one entity has hooks
    if (!manifestHasHooks(manifest)) {
      return []
    }

    const files: GeneratedFile[] = []

    // Generate shared types file
    files.push({
      path: 'hooks/types.ts',
      content: generateHooksTypes(manifest),
    })

    // Generate hook implementation files for entities with hooks
    for (const entity of manifest.entities) {
      if (hasAnyHooks(entity.hooks)) {
        files.push({
          path: `hooks/${entity.name.toLowerCase()}.ts`,
          content: generateEntityHooks(entity),
        })
      }
    }

    return files
  },
}
