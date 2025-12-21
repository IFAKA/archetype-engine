/**
 * JSON Schema Types for AI Agent Input
 *
 * These types define the JSON format that AI agents can use to generate
 * archetype manifests without writing TypeScript code.
 *
 * @module json/types
 */

// ============ FIELD TYPES ============

/**
 * JSON representation of a field definition
 */
export interface FieldJSON {
  /** Field type */
  type: 'text' | 'number' | 'boolean' | 'date'

  /** Mark field as required (default: true) */
  required?: boolean

  /** Mark field as optional (shorthand for required: false) */
  optional?: boolean

  /** Add unique constraint */
  unique?: boolean

  /** Default value for the field */
  default?: unknown

  /** Display label for the field */
  label?: string

  // Text-specific validations
  /** Minimum length for text fields */
  min?: number
  /** Maximum length for text fields */
  max?: number
  /** Validate as email format */
  email?: boolean
  /** Validate as URL format */
  url?: boolean
  /** Validate against regex pattern (as string) */
  regex?: string
  /** Enum: value must be one of these */
  oneOf?: string[]
  /** Trim whitespace */
  trim?: boolean
  /** Convert to lowercase */
  lowercase?: boolean
  /** Convert to uppercase */
  uppercase?: boolean

  // Number-specific validations
  /** Must be integer */
  integer?: boolean
  /** Must be positive */
  positive?: boolean
}

// ============ RELATION TYPES ============

/**
 * JSON representation of a relation definition
 */
export interface RelationJSON {
  /** Relation type */
  type: 'hasOne' | 'hasMany' | 'belongsToMany'

  /** Target entity name */
  entity: string

  /** Custom foreign key field name */
  field?: string
}

// ============ ENTITY TYPES ============

/**
 * Entity behaviors configuration
 */
export interface BehaviorsJSON {
  /** Add createdAt and updatedAt timestamps (default: true) */
  timestamps?: boolean
  /** Use soft delete instead of hard delete (default: false) */
  softDelete?: boolean
  /** Enable audit logging (default: false) */
  audit?: boolean
}

/**
 * Granular protection configuration per CRUD operation
 */
export interface ProtectedConfigJSON {
  list?: boolean
  get?: boolean
  create?: boolean
  update?: boolean
  remove?: boolean
}

/**
 * Protection option - shorthand or granular
 * - false: all public (default)
 * - true or 'all': all operations require auth
 * - 'write': list/get public, create/update/remove protected
 * - object: granular control per operation
 */
export type ProtectedJSON = boolean | 'write' | 'all' | ProtectedConfigJSON

/**
 * External source auth configuration
 */
export interface ExternalAuthJSON {
  type: 'bearer' | 'api-key'
  /** Custom header name (default: 'Authorization' for bearer, 'X-API-Key' for api-key) */
  header?: string
}

/**
 * External source endpoint overrides
 */
export interface EndpointOverrideJSON {
  /** e.g., 'GET /catalog/search' */
  list?: string
  /** e.g., 'GET /items/:sku' */
  get?: string
  /** e.g., 'POST /items' */
  create?: string
  /** e.g., 'PUT /items/:id' */
  update?: string
  /** e.g., 'DELETE /items/:id' */
  delete?: string
}

/**
 * External API source configuration
 */
export interface ExternalSourceJSON {
  /** Base URL - supports 'env:VARIABLE_NAME' syntax */
  baseUrl: string
  /** Path prefix like '/v1' or '/api' */
  pathPrefix?: string
  /** Override auto-pluralization (e.g., 'product' instead of 'products') */
  resourceName?: string
  /** Override specific endpoints */
  override?: EndpointOverrideJSON
  /** Auth configuration */
  auth?: ExternalAuthJSON
}

/**
 * JSON representation of an entity definition
 */
export interface EntityJSON {
  /** Entity name in PascalCase */
  name: string

  /** Field definitions */
  fields: Record<string, FieldJSON>

  /** Relation definitions */
  relations?: Record<string, RelationJSON>

  /** Entity behaviors */
  behaviors?: BehaviorsJSON

  /** Mark as auth entity for next-auth integration */
  auth?: boolean

  /** Protection level for CRUD operations */
  protected?: ProtectedJSON

  /** External API source (overrides manifest source) */
  source?: ExternalSourceJSON

  /** CRUD hooks configuration */
  hooks?: boolean | HooksJSON
}

/**
 * Hooks configuration for JSON input
 */
export interface HooksJSON {
  beforeCreate?: boolean
  afterCreate?: boolean
  beforeUpdate?: boolean
  afterUpdate?: boolean
  beforeRemove?: boolean
  afterRemove?: boolean
}

// ============ MANIFEST TYPES ============

/**
 * Database configuration
 */
export interface DatabaseJSON {
  /** Database type */
  type: 'sqlite' | 'postgres' | 'mysql'
  /** SQLite file path (for SQLite only) */
  file?: string
  /** Connection URL (for PostgreSQL/MySQL) */
  url?: string
}

/**
 * Auth configuration
 */
export interface AuthJSON {
  enabled: boolean
  adapter?: 'drizzle'
  providers?: ('credentials' | 'google' | 'github' | 'discord')[]
  sessionStrategy?: 'jwt' | 'database'
}

/**
 * i18n configuration
 */
export interface I18nJSON {
  languages: string[]
  defaultLanguage: string
  outputDir?: string
}

/**
 * Logging configuration
 */
export interface LoggingJSON {
  enabled: boolean
  level?: 'debug' | 'info' | 'warn' | 'error'
  format?: 'json' | 'pretty'
}

/**
 * Telemetry configuration
 */
export interface TelemetryJSON {
  enabled: boolean
  events?: ('create' | 'update' | 'remove')[]
}

/**
 * Audit configuration
 */
export interface AuditJSON {
  enabled: boolean
  entity?: string
}

/**
 * Observability configuration
 */
export interface ObservabilityJSON {
  logging?: LoggingJSON
  telemetry?: TelemetryJSON
  audit?: AuditJSON
}

/**
 * Tenancy configuration
 */
export interface TenancyJSON {
  enabled: boolean
  /** Field to filter by (e.g., 'organizationId') */
  field: string
}

/**
 * Default behaviors for all entities
 */
export interface DefaultsJSON {
  timestamps?: boolean
  softDelete?: boolean
  audit?: boolean
}

/**
 * JSON representation of a manifest/config
 *
 * This is the main type that AI agents should generate.
 *
 * @example
 * ```json
 * {
 *   "entities": [
 *     {
 *       "name": "User",
 *       "fields": {
 *         "email": { "type": "text", "email": true, "unique": true },
 *         "name": { "type": "text" }
 *       }
 *     }
 *   ],
 *   "database": { "type": "sqlite", "file": "./app.db" }
 * }
 * ```
 */
export interface ManifestJSON {
  /** Entity definitions */
  entities: EntityJSON[]

  /** Template ID (e.g., 'nextjs-drizzle-trpc') */
  template?: string

  /** Generation mode */
  mode?: 'full' | 'headless' | 'api-only'

  /** Database configuration (required for 'full' mode) */
  database?: DatabaseJSON

  /** Global default source for all entities */
  source?: ExternalSourceJSON

  /** Authentication configuration */
  auth?: AuthJSON

  /** Internationalization configuration */
  i18n?: I18nJSON

  /** Observability configuration */
  observability?: ObservabilityJSON

  /** Multi-tenancy configuration */
  tenancy?: TenancyJSON

  /** Default behaviors for all entities */
  defaults?: DefaultsJSON
}
