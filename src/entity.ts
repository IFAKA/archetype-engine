/**
 * Entity definition and compilation to IR
 * @module entity
 */

import { FieldBuilder, FieldConfig } from './fields'
import { RelationBuilder, RelationConfig } from './relations'
import { ExternalSourceConfig } from './source'

/**
 * Shorthand protection options for common patterns
 */
export type ProtectedShorthand = 'write' | 'all' | boolean

/**
 * Granular protection config per CRUD operation
 */
export interface ProtectedConfig {
  list?: boolean
  get?: boolean
  create?: boolean
  update?: boolean
  remove?: boolean
}

/**
 * Protection option - shorthand or granular
 * @example
 * protected: 'write'  // list/get public, mutations protected (most common)
 * protected: 'all'    // everything requires auth
 * protected: true     // alias for 'all'
 * protected: false    // everything public (default)
 * protected: { list: false, get: false, create: true, update: true, remove: true }
 */
export type ProtectedOption = ProtectedShorthand | ProtectedConfig

/**
 * Normalized protection config (always granular)
 */
export interface ProtectedIR {
  list: boolean
  get: boolean
  create: boolean
  update: boolean
  remove: boolean
}

/**
 * Entity definition input - what you write when defining an entity
 */
export interface EntityDefinition {
  /** Fields for this entity, using field builders like `text()`, `number()` */
  fields: Record<string, FieldBuilder>
  /** Relations to other entities using `hasOne()`, `hasMany()`, `belongsToMany()` */
  relations?: Record<string, RelationBuilder>
  /** Entity behaviors like timestamps, soft delete, audit logging */
  behaviors?: EntityBehaviors
  /** Mark as auth entity for next-auth integration */
  auth?: boolean
  /**
   * Protection level for CRUD operations (requires auth.enabled in config)
   * - 'write': list/get public, create/update/remove protected (most common)
   * - 'all' or true: all operations require auth
   * - false: all operations public (default)
   * - object: granular control per operation
   */
  protected?: ProtectedOption
  /**
   * External API source for this entity.
   * If not specified, inherits from manifest.source or uses database.
   */
  source?: ExternalSourceConfig
}

/**
 * Configurable behaviors for an entity
 */
export interface EntityBehaviors {
  /** Enable soft delete (adds `deletedAt` field instead of hard delete) */
  softDelete?: boolean
  /** Enable audit logging for all changes */
  audit?: boolean
  /** Add `createdAt` and `updatedAt` timestamps (default: true) */
  timestamps?: boolean
}

/**
 * Compiled entity intermediate representation - consumed by templates
 */
export interface EntityIR {
  /** Entity name in PascalCase */
  name: string
  /** Compiled field configurations */
  fields: Record<string, FieldConfig>
  /** Compiled relation configurations */
  relations: Record<string, RelationConfig>
  /** Entity behaviors */
  behaviors: EntityBehaviors
  /** Whether this is an auth entity */
  auth: boolean
  /** Normalized protection config for CRUD operations */
  protected: ProtectedIR
  /** External API source (optional - inherits from manifest if not specified) */
  source?: ExternalSourceConfig
}

/**
 * Normalize protection option to granular config
 */
function normalizeProtected(option?: ProtectedOption): ProtectedIR {
  const allPublic: ProtectedIR = { list: false, get: false, create: false, update: false, remove: false }
  const allProtected: ProtectedIR = { list: true, get: true, create: true, update: true, remove: true }
  const writeProtected: ProtectedIR = { list: false, get: false, create: true, update: true, remove: true }

  if (option === undefined || option === false) return allPublic
  if (option === true || option === 'all') return allProtected
  if (option === 'write') return writeProtected

  // Granular config - merge with allPublic defaults
  return { ...allPublic, ...option }
}

// Compile entity definition to IR
function compileEntity(name: string, definition: EntityDefinition): EntityIR {
  // Extract field configs from builders
  const fields: Record<string, FieldConfig> = {}
  for (const [fieldName, builder] of Object.entries(definition.fields)) {
    fields[fieldName] = builder._config
  }

  // Extract relation configs from builders
  const relations: Record<string, RelationConfig> = {}
  if (definition.relations) {
    for (const [relationName, builder] of Object.entries(definition.relations)) {
      relations[relationName] = builder._config
    }
  }

  return {
    name,
    fields,
    relations,
    behaviors: {
      timestamps: true,  // Default: true
      softDelete: false,
      audit: false,
      ...definition.behaviors,
    },
    auth: definition.auth || false,
    protected: normalizeProtected(definition.protected),
    source: definition.source,
  }
}

/**
 * Define an entity with fields, relations, and behaviors
 *
 * @param name - Entity name in PascalCase (e.g., 'User', 'BlogPost')
 * @param definition - Entity configuration with fields, relations, and behaviors
 * @returns Compiled EntityIR for use by generators
 *
 * @example
 * ```typescript
 * const User = defineEntity('User', {
 *   fields: {
 *     email: text().required().unique().email(),
 *     name: text().required().min(2).max(100),
 *     age: number().optional().min(0).integer(),
 *   },
 *   relations: {
 *     posts: hasMany('Post'),
 *   },
 *   behaviors: {
 *     timestamps: true,
 *     softDelete: true,
 *   }
 * })
 * ```
 */
export function defineEntity<Name extends string>(
  name: Name,
  definition: EntityDefinition
): EntityIR {
  return compileEntity(name, definition)
}
