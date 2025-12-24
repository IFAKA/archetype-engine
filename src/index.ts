/**
 * Archetype Engine - Main API
 *
 * This is the primary interface most users need.
 * For advanced usage (templates, JSON parsing, AI tools), see namespace exports below.
 *
 * @packageDocumentation
 */

// ============================================================================
// PRIMARY API - Use these in archetype.config.ts
// ============================================================================

// Entity definition
export { defineEntity } from './entity'
export type { EntityDefinition, EntityBehaviors } from './entity'

// Manifest/Config definition
export { defineManifest, defineConfig } from './manifest'
export type { ManifestDefinition } from './manifest'

// Field builders
export { text, number, boolean, date, enumField, computed } from './fields'
export type { FieldBuilder, ComputedOptions } from './fields'

// Relation builders
export { hasOne, hasMany, belongsToMany } from './relations'
export type { RelationBuilder, RelationType } from './relations'

// External API source
export { external } from './source'
export type { ExternalSourceConfig } from './source'

// ============================================================================
// ADVANCED API - For framework internals & tooling
// ============================================================================

// Protection & hooks configuration
export type {
  ProtectedShorthand,
  ProtectedConfig,
  ProtectedOption,
  HooksConfig,
} from './entity'

// Manifest configuration types
export type {
  ModeConfig,
  DatabaseConfig,
  AuthConfig,
  I18nConfig,
  ObservabilityConfig,
  TenancyConfig,
  DefaultBehaviors,
} from './manifest'

// Field builder types (for advanced usage)
export type {
  TextFieldBuilder,
  NumberFieldBuilder,
  BooleanFieldBuilder,
  DateFieldBuilder,
  EnumFieldBuilder,
  ComputedFieldBuilder,
  Validation,
} from './fields'

// Source configuration
export { resolveEndpoints } from './source'
export type {
  ExternalSourceOptions,
  DatabaseSourceConfig,
  SourceConfig,
} from './source'

// ============================================================================
// NAMESPACED EXPORTS - Opt-in for advanced features
// ============================================================================

/**
 * Internal IR (Intermediate Representation) types
 * Use these when building tools that consume compiled entities/manifests
 */
export type { EntityIR, ProtectedIR, HooksIR } from './entity'
export type { ManifestIR } from './manifest'
export { normalizeMode } from './manifest'

/**
 * Template system
 * For building custom code generators
 */
export { getTemplate, listTemplates, hasTemplate, runTemplate, createContext } from './template'
export type { Template, Generator, GeneratedFile, TemplateConfig } from './template/types'

/**
 * JSON parser & validation
 * For AI agents and JSON-based configuration
 */
export * as json from './json'
export { validateManifest, ValidationCodes } from './validation'
export type { ValidationError, ValidationResult } from './validation'

/**
 * AI tools
 * For building AI-powered app builders
 * Also available via: import { ... } from 'archetype-engine/ai'
 */
export { createManifestBuilder, aiTools } from './ai'
export type { ManifestBuilder, ToolResult } from './ai/types'
