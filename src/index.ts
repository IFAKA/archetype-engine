// Core exports

// Field builders
export { text, number, boolean, date } from './fields'
export type {
  FieldBuilder,
  TextFieldBuilder,
  NumberFieldBuilder,
  BooleanFieldBuilder,
  DateFieldBuilder,
  FieldConfig,
  Validation,
} from './fields'

// Relation builders
export { hasOne, hasMany, belongsToMany } from './relations'
export type { RelationBuilder, RelationConfig, RelationType } from './relations'

// Entity definition
export { defineEntity } from './entity'
export type { EntityDefinition, EntityBehaviors, EntityIR } from './entity'

// Manifest definition
export { defineManifest, defineConfig, normalizeMode } from './manifest'
export type {
  ManifestDefinition,
  ManifestIR,
  ModeConfig,
  DatabaseConfig,
  AuthConfig,
  I18nConfig,
  ObservabilityConfig,
  TenancyConfig,
  DefaultBehaviors,
} from './manifest'

// External API source
export { external, resolveEndpoints } from './source'
export type {
  ExternalSourceConfig,
  ExternalSourceOptions,
  DatabaseSourceConfig,
  SourceConfig,
} from './source'

// Legacy type exports (for backwards compatibility)
export { EntityConfig, PropertyConfig, Manifest, isPropertyConfig } from './types'
