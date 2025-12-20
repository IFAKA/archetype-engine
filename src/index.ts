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
export type {
  EntityDefinition,
  EntityBehaviors,
  EntityIR,
  ProtectedShorthand,
  ProtectedConfig,
  ProtectedOption,
  ProtectedIR,
} from './entity'

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

// Template system
export { getTemplate, listTemplates, hasTemplate, runTemplate, createContext } from './template'
export type { Template, Generator, GeneratedFile, TemplateConfig } from './template/types'

// JSON input for AI agents
export { parseManifestJSON, parseEntityJSON, parseFieldJSON, loadManifestFromJSONFile } from './json/parser'
export type {
  ManifestJSON,
  EntityJSON,
  FieldJSON,
  RelationJSON,
  BehaviorsJSON,
  ProtectedJSON,
  ProtectedConfigJSON,
  ExternalSourceJSON,
  ExternalAuthJSON,
  EndpointOverrideJSON,
  DatabaseJSON,
  AuthJSON,
  I18nJSON,
  ObservabilityJSON,
  TenancyJSON,
  DefaultsJSON,
} from './json/types'

// Validation for AI agents
export { validateManifest, ValidationCodes } from './validation'
export type { ValidationError, ValidationResult } from './validation'

// AI tools (for modern AI frameworks)
// Import from 'archetype-engine/ai' for full AI toolkit
export { createManifestBuilder, aiTools } from './ai'
export type { ManifestBuilder, ToolResult } from './ai/types'
