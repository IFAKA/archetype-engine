export interface PropertyConfig {
  type: 'text' | 'number' | 'boolean' | 'date';  // Extend as needed
  required?: boolean;
  optional?: boolean;
  default?: any;
}

export type RelationType = 'one-to-one' | 'one-to-many' | 'many-to-many';

export interface RelationConfig {
  entity: string;        // Target entity name
  type: RelationType;    // Relation type
  field?: string;        // Foreign key field name (auto-generated if not specified)
}

export interface EntityConfig {
  name: string;
  properties: Record<string, PropertyConfig>;
  relations?: Record<string, RelationConfig>;
}

export interface Manifest {
  entities: EntityConfig[];
  database?: {
    type: 'sqlite';
    file: string;
  };
  // Add tenancy, permissions, etc., later
}

// Runtime type guard for safe property access
function isPropertyConfig(config: unknown): config is PropertyConfig {
  return typeof config === 'object' && config !== null && 'type' in config;
}
export { isPropertyConfig };
