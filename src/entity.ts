// Entity definition and compilation to IR

import { FieldBuilder, FieldConfig } from './fields'
import { RelationBuilder, RelationConfig } from './relations'

// Entity definition input (what user writes)
export interface EntityDefinition {
  fields: Record<string, FieldBuilder>
  relations?: Record<string, RelationBuilder>
  behaviors?: EntityBehaviors
  auth?: boolean  // Mark as auth entity (for next-auth integration)
}

export interface EntityBehaviors {
  softDelete?: boolean
  audit?: boolean
  timestamps?: boolean
}

// Entity IR output (what templates consume)
export interface EntityIR {
  name: string
  fields: Record<string, FieldConfig>
  relations: Record<string, RelationConfig>
  behaviors: EntityBehaviors
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

// Main function to define an entity
export function defineEntity<Name extends string>(
  name: Name,
  definition: EntityDefinition
): EntityIR {
  return compileEntity(name, definition)
}
