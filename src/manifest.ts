/**
 * Manifest definition - collects all entities and settings
 * @module manifest
 */

import { EntityIR } from './entity'
import { ExternalSourceConfig } from './source'

/**
 * Generation mode configuration
 */
export interface ModeConfig {
  /**
   * 'full' - Generate database schema, API, validation, hooks (default)
   * 'headless' - Skip database schema, generate validation, hooks, services only
   * 'api-only' - Generate API layer only (for backend services)
   */
  type: 'full' | 'headless' | 'api-only'

  /**
   * When headless, optionally specify which generators to include
   * Default: ['validation', 'hooks', 'services', 'i18n']
   */
  include?: ('validation' | 'hooks' | 'types' | 'services' | 'i18n')[]
}

/**
 * Normalize mode config from shorthand or full config
 */
export function normalizeMode(mode?: ModeConfig | 'full' | 'headless' | 'api-only'): ModeConfig {
  if (!mode || mode === 'full') {
    return { type: 'full' }
  }
  if (mode === 'headless') {
    return { type: 'headless', include: ['validation', 'hooks', 'services', 'i18n'] }
  }
  if (mode === 'api-only') {
    return { type: 'api-only', include: ['validation', 'services'] }
  }
  return mode
}

/**
 * Database connection configuration
 */
export interface DatabaseConfig {
  /** Database type */
  type: 'sqlite' | 'postgres' | 'mysql'
  /** SQLite file path (for SQLite only) */
  file?: string
  /** Connection URL (for PostgreSQL/MySQL) */
  url?: string
}

// Auth configuration (next-auth integration)
export interface AuthConfig {
  enabled: boolean
  adapter?: 'drizzle'
  providers?: ('credentials' | 'google' | 'github' | 'discord')[]
  sessionStrategy?: 'jwt' | 'database'
}

// i18n configuration
export interface I18nConfig {
  languages: string[]
  defaultLanguage: string
  outputDir?: string  // Default: './messages'
}

// Observability configuration
export interface ObservabilityConfig {
  logging?: {
    enabled: boolean
    level?: 'debug' | 'info' | 'warn' | 'error'
    format?: 'json' | 'pretty'
  }
  telemetry?: {
    enabled: boolean
    events?: ('create' | 'update' | 'remove')[]
  }
  audit?: {
    enabled: boolean
    entity?: string  // Entity to store audit logs
  }
}

// Tenancy configuration
export interface TenancyConfig {
  enabled: boolean
  field: string  // Field to filter by (e.g., 'organizationId')
}

// Default behaviors for all entities
export interface DefaultBehaviors {
  timestamps?: boolean
  softDelete?: boolean
  audit?: boolean
}

// Manifest input (what user writes)
export interface ManifestDefinition {
  /** Template ID (e.g., 'nextjs-drizzle-trpc') */
  template?: string
  /**
   * Generation mode - 'full' | 'headless' | 'api-only' or ModeConfig object
   * - 'full': Generate database schema, API, validation, hooks (default)
   * - 'headless': Skip database schema, generate validation, hooks, services only
   * - 'api-only': Generate API layer only
   */
  mode?: ModeConfig | 'full' | 'headless' | 'api-only'
  /** Entity definitions */
  entities: EntityIR[]
  /**
   * Global default source for all entities.
   * Individual entities can override this with their own source.
   */
  source?: ExternalSourceConfig
  /** Database configuration (required for 'full' mode, optional for 'headless') */
  database?: DatabaseConfig
  auth?: AuthConfig
  i18n?: I18nConfig
  observability?: ObservabilityConfig
  tenancy?: TenancyConfig
  defaults?: DefaultBehaviors
}

// Manifest IR output (what CLI and templates consume)
export interface ManifestIR {
  /** Template ID - CLI validates if provided */
  template?: string
  /** Normalized mode configuration */
  mode: ModeConfig
  /** Entity definitions */
  entities: EntityIR[]
  /** Global default source for entities (optional) */
  source?: ExternalSourceConfig
  /** Database configuration (optional for headless mode) */
  database?: DatabaseConfig
  auth: AuthConfig
  i18n: I18nConfig
  observability: ObservabilityConfig
  tenancy: TenancyConfig
  defaults: DefaultBehaviors
}

// Compile manifest definition to IR
function compileManifest(definition: ManifestDefinition): ManifestIR {
  const mode = normalizeMode(definition.mode)

  // Validate: full mode requires database
  if (mode.type === 'full' && !definition.database) {
    throw new Error(
      `Mode 'full' requires database configuration.\n` +
      `Fix: Add database config or use mode: 'headless' for frontend-only projects.`
    )
  }

  return {
    template: definition.template,
    mode,
    entities: definition.entities,
    source: definition.source,
    database: definition.database,
    auth: {
      enabled: false,
      adapter: 'drizzle',
      providers: [],
      sessionStrategy: 'jwt',
      ...definition.auth,
    },
    i18n: {
      languages: ['en'],
      defaultLanguage: 'en',
      outputDir: './messages',
      ...definition.i18n,
    },
    observability: {
      logging: { enabled: false, level: 'info', format: 'json' },
      telemetry: { enabled: false, events: [] },
      audit: { enabled: false },
      ...definition.observability,
    },
    tenancy: {
      enabled: false,
      field: 'organizationId',
      ...definition.tenancy,
    },
    defaults: {
      timestamps: true,
      softDelete: false,
      audit: false,
      ...definition.defaults,
    },
  }
}

/**
 * Define a manifest with entities and configuration
 *
 * @param definition - Manifest configuration
 * @returns Compiled ManifestIR for use by CLI and generators
 *
 * @example
 * ```typescript
 * const manifest = defineManifest({
 *   template: 'nextjs-drizzle-trpc',
 *   entities: [User, Post],
 *   database: { type: 'sqlite', file: './sqlite.db' },
 * })
 * ```
 */
export function defineManifest(definition: ManifestDefinition): ManifestIR {
  return compileManifest(definition)
}

/**
 * Alias for defineManifest - use in archetype.config.ts
 *
 * @example
 * ```typescript
 * // archetype.config.ts
 * import { defineConfig } from 'archetype-engine'
 *
 * export default defineConfig({
 *   template: 'nextjs-drizzle-trpc',
 *   entities: [User, Post],
 *   database: { type: 'postgres', url: process.env.DATABASE_URL },
 * })
 * ```
 */
export const defineConfig = defineManifest
