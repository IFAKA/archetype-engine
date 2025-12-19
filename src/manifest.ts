// Manifest definition - collects all entities and settings

import { EntityIR } from './entity'

// Database configuration
export interface DatabaseConfig {
  type: 'sqlite' | 'postgres' | 'mysql'
  file?: string  // For SQLite
  url?: string   // For PostgreSQL/MySQL
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
    events?: ('create' | 'update' | 'delete')[]
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
  template?: string  // Template ID (e.g., 'nextjs-drizzle-trpc')
  entities: EntityIR[]
  database: DatabaseConfig
  auth?: AuthConfig
  i18n?: I18nConfig
  observability?: ObservabilityConfig
  tenancy?: TenancyConfig
  defaults?: DefaultBehaviors
}

// Manifest IR output (what CLI and templates consume)
export interface ManifestIR {
  template?: string  // Template ID - CLI validates if provided
  entities: EntityIR[]
  database: DatabaseConfig
  auth: AuthConfig
  i18n: I18nConfig
  observability: ObservabilityConfig
  tenancy: TenancyConfig
  defaults: DefaultBehaviors
}

// Compile manifest definition to IR
function compileManifest(definition: ManifestDefinition): ManifestIR {
  return {
    template: definition.template,
    entities: definition.entities,
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

// Main function to define a manifest
export function defineManifest(definition: ManifestDefinition): ManifestIR {
  return compileManifest(definition)
}

// Alias for config file usage (archetype.config.ts)
export const defineConfig = defineManifest
