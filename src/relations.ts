/**
 * Relation builders for entity definitions
 * @module relations
 */

export type RelationType = 'hasOne' | 'hasMany' | 'belongsToMany'

export interface RelationConfig {
  type: RelationType
  entity: string
  /** Optional custom foreign key field name */
  field?: string
}

export interface RelationBuilder {
  readonly _config: RelationConfig
  /** Override the default foreign key field name */
  field(name: string): RelationBuilder
}

function createRelationBuilder(config: RelationConfig): RelationBuilder {
  return {
    _config: config,
    field: (name: string) => createRelationBuilder({ ...config, field: name }),
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
 * @returns RelationBuilder
 *
 * @example
 * ```typescript
 * relations: {
 *   tags: belongsToMany('Tag'),
 *   categories: belongsToMany('Category'),
 * }
 * ```
 */
export function belongsToMany(entity: string): RelationBuilder {
  return createRelationBuilder({
    type: 'belongsToMany',
    entity,
  })
}
