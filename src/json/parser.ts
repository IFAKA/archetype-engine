/**
 * JSON Parser - converts JSON manifest to IR
 *
 * @module json/parser
 */

import { FieldConfig, Validation } from '../fields'
import { RelationConfig } from '../relations'
import { EntityIR, ProtectedIR, EntityBehaviors, HooksIR } from '../entity'
import { ManifestIR, ModeConfig, normalizeMode } from '../manifest'
import { ExternalSourceConfig } from '../source'
import {
  FieldJSON,
  RelationJSON,
  EntityJSON,
  ManifestJSON,
  ExternalSourceJSON,
  ProtectedJSON,
  HooksJSON,
} from './types'

/**
 * Parse a JSON field definition to FieldConfig
 */
export function parseFieldJSON(field: FieldJSON): FieldConfig {
  const validations: Validation[] = []

  // Text validations
  if (field.min !== undefined) {
    // For text fields, min/max are length validations
    // For number fields, they are value validations
    if (field.type === 'text') {
      validations.push({ type: 'minLength', value: field.min })
    } else if (field.type === 'number') {
      validations.push({ type: 'min', value: field.min })
    }
  }

  if (field.max !== undefined) {
    if (field.type === 'text') {
      validations.push({ type: 'maxLength', value: field.max })
    } else if (field.type === 'number') {
      validations.push({ type: 'max', value: field.max })
    }
  }

  if (field.email) validations.push({ type: 'email' })
  if (field.url) validations.push({ type: 'url' })
  if (field.regex) validations.push({ type: 'regex', value: field.regex })
  if (field.oneOf) validations.push({ type: 'oneOf', value: field.oneOf })
  if (field.trim) validations.push({ type: 'trim' })
  if (field.lowercase) validations.push({ type: 'lowercase' })
  if (field.uppercase) validations.push({ type: 'uppercase' })

  // Number validations
  if (field.integer) validations.push({ type: 'integer' })
  if (field.positive) validations.push({ type: 'positive' })

  // Determine required status
  // Default is true (required) unless optional is true or required is explicitly false
  const required = field.optional === true ? false : (field.required !== false)

  return {
    type: field.type,
    required,
    unique: field.unique || false,
    default: field.default,
    label: field.label,
    validations,
  }
}

/**
 * Parse a JSON relation definition to RelationConfig
 */
export function parseRelationJSON(relation: RelationJSON): RelationConfig {
  return {
    type: relation.type,
    entity: relation.entity,
    field: relation.field,
  }
}

/**
 * Parse a JSON external source to ExternalSourceConfig
 */
export function parseExternalSourceJSON(source: ExternalSourceJSON): ExternalSourceConfig {
  let auth: ExternalSourceConfig['auth'] | undefined
  if (source.auth) {
    auth = {
      type: source.auth.type,
      header: source.auth.header || (source.auth.type === 'api-key' ? 'X-API-Key' : 'Authorization'),
    }
  }

  return {
    type: 'external',
    baseUrl: source.baseUrl,
    pathPrefix: source.pathPrefix || '',
    resourceName: source.resourceName,
    endpoints: {
      list: source.override?.list || '',
      get: source.override?.get || '',
      create: source.override?.create || '',
      update: source.override?.update || '',
      delete: source.override?.delete || '',
    },
    auth,
  }
}

/**
 * Parse a JSON protected option to ProtectedIR
 */
export function parseProtectedJSON(option?: ProtectedJSON): ProtectedIR {
  const allPublic: ProtectedIR = { list: false, get: false, create: false, update: false, remove: false }
  const allProtected: ProtectedIR = { list: true, get: true, create: true, update: true, remove: true }
  const writeProtected: ProtectedIR = { list: false, get: false, create: true, update: true, remove: true }

  if (option === undefined || option === false) return allPublic
  if (option === true || option === 'all') return allProtected
  if (option === 'write') return writeProtected

  // Granular config - merge with allPublic defaults
  return { ...allPublic, ...option }
}

/**
 * Parse a JSON hooks option to HooksIR
 */
export function parseHooksJSON(option?: boolean | HooksJSON): HooksIR {
  const noHooks: HooksIR = {
    beforeCreate: false,
    afterCreate: false,
    beforeUpdate: false,
    afterUpdate: false,
    beforeRemove: false,
    afterRemove: false,
  }
  const allHooks: HooksIR = {
    beforeCreate: true,
    afterCreate: true,
    beforeUpdate: true,
    afterUpdate: true,
    beforeRemove: true,
    afterRemove: true,
  }

  if (option === undefined || option === false) return noHooks
  if (option === true) return allHooks

  // Granular config - merge with noHooks defaults
  return { ...noHooks, ...option }
}

/**
 * Parse a JSON entity definition to EntityIR
 */
export function parseEntityJSON(entity: EntityJSON): EntityIR {
  // Parse fields
  const fields: Record<string, FieldConfig> = {}
  for (const [fieldName, field] of Object.entries(entity.fields)) {
    fields[fieldName] = parseFieldJSON(field)
  }

  // Parse relations
  const relations: Record<string, RelationConfig> = {}
  if (entity.relations) {
    for (const [relationName, relation] of Object.entries(entity.relations)) {
      relations[relationName] = parseRelationJSON(relation)
    }
  }

  // Parse behaviors with defaults
  const behaviors: EntityBehaviors = {
    timestamps: entity.behaviors?.timestamps !== false, // default true
    softDelete: entity.behaviors?.softDelete || false,
    audit: entity.behaviors?.audit || false,
  }

  // Parse source if present
  let source: ExternalSourceConfig | undefined
  if (entity.source) {
    source = parseExternalSourceJSON(entity.source)
  }

  return {
    name: entity.name,
    fields,
    relations,
    behaviors,
    auth: entity.auth || false,
    protected: parseProtectedJSON(entity.protected),
    source,
    hooks: parseHooksJSON(entity.hooks),
  }
}

/**
 * Parse a JSON manifest to ManifestIR
 *
 * @param json - JSON manifest object or string
 * @returns Compiled ManifestIR
 * @throws Error if JSON is invalid or validation fails
 *
 * @example
 * ```typescript
 * const manifest = parseManifestJSON({
 *   entities: [
 *     { name: 'User', fields: { email: { type: 'text', email: true } } }
 *   ],
 *   database: { type: 'sqlite', file: './app.db' }
 * })
 * ```
 */
export function parseManifestJSON(json: ManifestJSON | string): ManifestIR {
  // Parse string if needed
  const manifest: ManifestJSON = typeof json === 'string' ? JSON.parse(json) : json

  // Normalize mode
  const mode: ModeConfig = normalizeMode(manifest.mode)

  // Validate: full mode requires database
  if (mode.type === 'full' && !manifest.database) {
    throw new Error(
      `Mode 'full' requires database configuration.\n` +
      `Fix: Add database config or use mode: 'headless' for frontend-only projects.`
    )
  }

  // Parse entities
  const entities: EntityIR[] = manifest.entities.map(parseEntityJSON)

  // Parse global source if present
  let source: ExternalSourceConfig | undefined
  if (manifest.source) {
    source = parseExternalSourceJSON(manifest.source)
  }

  return {
    template: manifest.template,
    mode,
    entities,
    source,
    database: manifest.database,
    auth: {
      enabled: manifest.auth?.enabled || false,
      adapter: manifest.auth?.adapter || 'drizzle',
      providers: manifest.auth?.providers || [],
      sessionStrategy: manifest.auth?.sessionStrategy || 'jwt',
    },
    i18n: {
      languages: manifest.i18n?.languages || ['en'],
      defaultLanguage: manifest.i18n?.defaultLanguage || 'en',
      outputDir: manifest.i18n?.outputDir || './messages',
    },
    observability: {
      logging: {
        enabled: manifest.observability?.logging?.enabled || false,
        level: manifest.observability?.logging?.level || 'info',
        format: manifest.observability?.logging?.format || 'json',
      },
      telemetry: {
        enabled: manifest.observability?.telemetry?.enabled || false,
        events: manifest.observability?.telemetry?.events || [],
      },
      audit: {
        enabled: manifest.observability?.audit?.enabled || false,
        entity: manifest.observability?.audit?.entity,
      },
    },
    tenancy: {
      enabled: manifest.tenancy?.enabled || false,
      field: manifest.tenancy?.field || 'organizationId',
    },
    defaults: {
      timestamps: manifest.defaults?.timestamps !== false, // default true
      softDelete: manifest.defaults?.softDelete || false,
      audit: manifest.defaults?.audit || false,
    },
  }
}

/**
 * Load manifest from a JSON file
 *
 * @param filePath - Path to JSON file
 * @returns Compiled ManifestIR
 */
export async function loadManifestFromJSONFile(filePath: string): Promise<ManifestIR> {
  const fs = await import('fs/promises')
  const content = await fs.readFile(filePath, 'utf-8')
  return parseManifestJSON(content)
}
