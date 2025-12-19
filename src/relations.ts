// Relation builders for entity definitions

export type RelationType = 'hasOne' | 'hasMany' | 'belongsToMany'

export interface RelationConfig {
  type: RelationType
  entity: string
  field?: string  // Optional: custom foreign key field name
}

export interface RelationBuilder {
  readonly _config: RelationConfig
  field(name: string): RelationBuilder
}

function createRelationBuilder(config: RelationConfig): RelationBuilder {
  return {
    _config: config,
    field: (name: string) => createRelationBuilder({ ...config, field: name }),
  }
}

// Factory functions
export function hasOne(entity: string): RelationBuilder {
  return createRelationBuilder({
    type: 'hasOne',
    entity,
  })
}

export function hasMany(entity: string): RelationBuilder {
  return createRelationBuilder({
    type: 'hasMany',
    entity,
  })
}

export function belongsToMany(entity: string): RelationBuilder {
  return createRelationBuilder({
    type: 'belongsToMany',
    entity,
  })
}
