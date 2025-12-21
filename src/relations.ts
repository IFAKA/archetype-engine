/**
 * Relation builders for entity definitions
 * @module relations
 */

import type { FieldBuilder, FieldConfig } from './fields'

export type RelationType = 'hasOne' | 'hasMany' | 'belongsToMany'

/**
 * Pivot table configuration for belongsToMany relations
 */
export interface PivotConfig {
  /** Custom name for the junction/pivot table */
  table?: string
  /** Additional fields on the pivot table */
  fields?: Record<string, FieldConfig>
}

export interface RelationConfig {
  type: RelationType
  entity: string
  /** Optional custom foreign key field name */
  field?: string
  /** Pivot table configuration for belongsToMany */
  pivot?: PivotConfig
}

export interface RelationBuilder {
  readonly _config: RelationConfig
  /** Override the default foreign key field name */
  field(name: string): RelationBuilder
}

export interface BelongsToManyBuilder extends RelationBuilder {
  /** Configure pivot table with additional fields */
  through(options: { table?: string; fields: Record<string, FieldBuilder> }): BelongsToManyBuilder
}

function createRelationBuilder(config: RelationConfig): RelationBuilder {
  return {
    _config: config,
    field: (name: string) => createRelationBuilder({ ...config, field: name }),
  }
}

function createBelongsToManyBuilder(config: RelationConfig): BelongsToManyBuilder {
  return {
    _config: config,
    field: (name: string) => createBelongsToManyBuilder({ ...config, field: name }),
    through: (options: { table?: string; fields: Record<string, FieldBuilder> }) => {
      // Extract field configs from builders
      const fieldConfigs: Record<string, FieldConfig> = {}
      for (const [fieldName, builder] of Object.entries(options.fields)) {
        fieldConfigs[fieldName] = builder._config
      }
      return createBelongsToManyBuilder({
        ...config,
        pivot: {
          table: options.table,
          fields: fieldConfigs,
        },
      })
    },
  }
}

/**
 * Create a one-to-one relation (adds foreign key to this entity)
 *
 * @param entity - Target entity name
 * @returns RelationBuilder
 *
 * @example
 * ```typescript
 * relations: {
 *   author: hasOne('User'),
 *   category: hasOne('Category').field('categoryId'),
 * }
 * ```
 */
export function hasOne(entity: string): RelationBuilder {
  return createRelationBuilder({
    type: 'hasOne',
    entity,
  })
}

/**
 * Create a one-to-many relation (target entity has FK to this entity)
 *
 * @param entity - Target entity name
 * @returns RelationBuilder
 *
 * @example
 * ```typescript
 * relations: {
 *   posts: hasMany('Post'),
 *   comments: hasMany('Comment'),
 * }
 * ```
 */
export function hasMany(entity: string): RelationBuilder {
  return createRelationBuilder({
    type: 'hasMany',
    entity,
  })
}

/**
 * Create a many-to-many relation (creates junction table)
 *
 * @param entity - Target entity name
 * @returns BelongsToManyBuilder
 *
 * @example
 * ```typescript
 * // Simple many-to-many
 * relations: {
 *   tags: belongsToMany('Tag'),
 * }
 *
 * // With pivot data (e.g., OrderItem with quantity)
 * relations: {
 *   products: belongsToMany('Product').through({
 *     table: 'order_items',
 *     fields: {
 *       quantity: number().required().min(1),
 *       unitPrice: number().required(),
 *     }
 *   }),
 * }
 * ```
 */
export function belongsToMany(entity: string): BelongsToManyBuilder {
  return createBelongsToManyBuilder({
    type: 'belongsToMany',
    entity,
  })
}
