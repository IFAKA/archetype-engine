/**
 * Entity definition and compilation to IR
 * @module entity
 */

import { FieldBuilder, FieldConfig } from './fields'
import { RelationBuilder, RelationConfig } from './relations'

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
