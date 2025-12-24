/**
 * Validation Module for AI Agent Input
 *
 * Provides structured validation with error codes that AI agents can parse
 * and use to fix their output.
 *
 * @module validation
 */

import { ManifestJSON, EntityJSON, FieldJSON, RelationJSON } from '../json/types'

/**
 * Validation error with structured information for AI parsing
 */
export interface ValidationError {
  /** Error code for programmatic handling */
  code: string
  /** JSON path to the error location */
  path: string
  /** Human-readable error message */
  message: string
  /** Suggestion for how to fix the error */
  suggestion?: string
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether the manifest is valid */
  valid: boolean
  /** Validation errors (blocking) */
  errors: ValidationError[]
  /** Validation warnings (non-blocking) */
  warnings: ValidationError[]
}

// Error codes
export const ValidationCodes = {
  // Entity errors
  INVALID_ENTITY_NAME: 'INVALID_ENTITY_NAME',
  DUPLICATE_ENTITY: 'DUPLICATE_ENTITY',
  MISSING_ENTITY_FIELDS: 'MISSING_ENTITY_FIELDS',

  // Field errors
  INVALID_FIELD_TYPE: 'INVALID_FIELD_TYPE',
  INVALID_FIELD_NAME: 'INVALID_FIELD_NAME',

  // Relation errors
  RELATION_TARGET_NOT_FOUND: 'RELATION_TARGET_NOT_FOUND',
  INVALID_RELATION_TYPE: 'INVALID_RELATION_TYPE',

  // Database errors
  DATABASE_REQUIRED: 'DATABASE_REQUIRED',
  INVALID_DATABASE_TYPE: 'INVALID_DATABASE_TYPE',
  SQLITE_REQUIRES_FILE: 'SQLITE_REQUIRES_FILE',
  POSTGRES_REQUIRES_URL: 'POSTGRES_REQUIRES_URL',

  // Auth errors
  AUTH_REQUIRED_FOR_PROTECTED: 'AUTH_REQUIRED_FOR_PROTECTED',
  INVALID_PROVIDER: 'INVALID_PROVIDER',

  // Mode errors
  INVALID_MODE: 'INVALID_MODE',

  // Protected errors
  INVALID_PROTECTED_VALUE: 'INVALID_PROTECTED_VALUE',

  // Source errors
  EXTERNAL_SOURCE_INVALID: 'EXTERNAL_SOURCE_INVALID',
} as const

/**
 * Check if a string is PascalCase
 */
function isPascalCase(str: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(str)
}

/**
 * Check if a string is camelCase
 */
function isCamelCase(str: string): boolean {
  return /^[a-z][a-zA-Z0-9]*$/.test(str)
}

/**
 * Validate a field definition
 */
function validateField(
  fieldName: string,
  field: FieldJSON,
  entityName: string
): ValidationError[] {
  const errors: ValidationError[] = []
  const path = `${entityName}.fields.${fieldName}`

  // Check field name is camelCase
  if (!isCamelCase(fieldName)) {
    errors.push({
      code: ValidationCodes.INVALID_FIELD_NAME,
      path,
      message: `Field name '${fieldName}' must be camelCase`,
      suggestion: `Rename to '${fieldName.charAt(0).toLowerCase()}${fieldName.slice(1)}'`,
    })
  }

  // Check field type is valid
  const validTypes = ['text', 'number', 'boolean', 'date']
  if (!validTypes.includes(field.type)) {
    errors.push({
      code: ValidationCodes.INVALID_FIELD_TYPE,
      path: `${path}.type`,
      message: `Invalid field type '${field.type}'`,
      suggestion: `Use one of: ${validTypes.join(', ')}`,
    })
  }

  return errors
}

/**
 * Validate a relation definition
 */
function validateRelation(
  relationName: string,
  relation: RelationJSON,
  entityName: string,
  entityNames: Set<string>
): ValidationError[] {
  const errors: ValidationError[] = []
  const path = `${entityName}.relations.${relationName}`

  // Check relation type is valid
  const validTypes = ['hasOne', 'hasMany', 'belongsToMany']
  if (!validTypes.includes(relation.type)) {
    errors.push({
      code: ValidationCodes.INVALID_RELATION_TYPE,
      path: `${path}.type`,
      message: `Invalid relation type '${relation.type}'`,
      suggestion: `Use one of: ${validTypes.join(', ')}`,
    })
  }

  // Check target entity exists
  if (!entityNames.has(relation.entity)) {
    errors.push({
      code: ValidationCodes.RELATION_TARGET_NOT_FOUND,
      path: `${path}.entity`,
      message: `Entity '${relation.entity}' not found in manifest`,
      suggestion: `Add entity '${relation.entity}' to the entities array, or fix the entity name`,
    })
  }

  return errors
}

/**
 * Validate an entity definition
 */
function validateEntity(
  entity: EntityJSON,
  entityNames: Set<string>,
  authEnabled: boolean
): ValidationError[] {
  const errors: ValidationError[] = []
  const path = entity.name

  // Check entity name is PascalCase
  if (!isPascalCase(entity.name)) {
    errors.push({
      code: ValidationCodes.INVALID_ENTITY_NAME,
      path,
      message: `Entity name '${entity.name}' must be PascalCase`,
      suggestion: `Rename to '${entity.name.charAt(0).toUpperCase()}${entity.name.slice(1)}'`,
    })
  }

  // Check entity has fields
  if (!entity.fields || Object.keys(entity.fields).length === 0) {
    errors.push({
      code: ValidationCodes.MISSING_ENTITY_FIELDS,
      path: `${path}.fields`,
      message: `Entity '${entity.name}' must have at least one field`,
      suggestion: `Add fields to the entity`,
    })
  }

  // Validate fields
  if (entity.fields) {
    for (const [fieldName, field] of Object.entries(entity.fields)) {
      errors.push(...validateField(fieldName, field, entity.name))
    }
  }

  // Validate relations
  if (entity.relations) {
    for (const [relationName, relation] of Object.entries(entity.relations)) {
      errors.push(...validateRelation(relationName, relation, entity.name, entityNames))
    }
  }

  // Check protected requires auth (only if explicitly set)
  if (entity.protected !== undefined && entity.protected !== false) {
    // Validate protected value format
    const validProtectedStrings = ['write', 'all']
    if (
      typeof entity.protected !== 'boolean' &&
      typeof entity.protected !== 'object' &&
      !validProtectedStrings.includes(entity.protected)
    ) {
      errors.push({
        code: ValidationCodes.INVALID_PROTECTED_VALUE,
        path: `${path}.protected`,
        message: `Invalid protected value '${entity.protected}'`,
        suggestion: `Use one of: true, false, 'write', 'all', or an object with list/get/create/update/remove`,
      })
    }

    // Only require auth if protected is explicitly enabled
    if (!authEnabled) {
      errors.push({
        code: ValidationCodes.AUTH_REQUIRED_FOR_PROTECTED,
        path: `${path}.protected`,
        message: `Entity '${entity.name}' has protected operations but auth is not enabled`,
        suggestion: `Add auth: { enabled: true } to manifest, or remove protected from entity`,
      })
    }
  }

  // Validate external source
  if (entity.source && !entity.source.baseUrl) {
    errors.push({
      code: ValidationCodes.EXTERNAL_SOURCE_INVALID,
      path: `${path}.source.baseUrl`,
      message: `External source requires baseUrl`,
      suggestion: `Add baseUrl to source, e.g., 'env:API_URL' or 'https://api.example.com'`,
    })
  }

  return errors
}

/**
 * Validate database configuration
 */
function validateDatabase(
  manifest: ManifestJSON
): ValidationError[] {
  const errors: ValidationError[] = []
  const mode = manifest.mode || 'full'

  // Full mode requires database
  if (mode === 'full' && !manifest.database) {
    errors.push({
      code: ValidationCodes.DATABASE_REQUIRED,
      path: 'database',
      message: `Mode 'full' requires database configuration`,
      suggestion: `Add database config or use mode: 'headless'`,
    })
    return errors
  }

  if (manifest.database) {
    const db = manifest.database

    // Check database type
    const validTypes = ['sqlite', 'postgres', 'mysql']
    if (!validTypes.includes(db.type)) {
      errors.push({
        code: ValidationCodes.INVALID_DATABASE_TYPE,
        path: 'database.type',
        message: `Invalid database type '${db.type}'`,
        suggestion: `Use one of: ${validTypes.join(', ')}`,
      })
    }

    // SQLite requires file
    if (db.type === 'sqlite' && !db.file) {
      errors.push({
        code: ValidationCodes.SQLITE_REQUIRES_FILE,
        path: 'database.file',
        message: `SQLite database requires file path`,
        suggestion: `Add file: './sqlite.db' to database config`,
      })
    }

    // Postgres/MySQL requires url
    if ((db.type === 'postgres' || db.type === 'mysql') && !db.url) {
      errors.push({
        code: ValidationCodes.POSTGRES_REQUIRES_URL,
        path: 'database.url',
        message: `${db.type} database requires connection URL`,
        suggestion: `Add url: 'env:DATABASE_URL' or a connection string`,
      })
    }
  }

  return errors
}

/**
 * Validate auth configuration
 */
function validateAuth(manifest: ManifestJSON): ValidationError[] {
  const errors: ValidationError[] = []

  if (manifest.auth?.providers) {
    const validProviders = ['credentials', 'google', 'github', 'discord']
    for (const provider of manifest.auth.providers) {
      if (!validProviders.includes(provider)) {
        errors.push({
          code: ValidationCodes.INVALID_PROVIDER,
          path: 'auth.providers',
          message: `Invalid auth provider '${provider}'`,
          suggestion: `Use one of: ${validProviders.join(', ')}`,
        })
      }
    }
  }

  return errors
}

/**
 * Validate a JSON manifest
 *
 * @param manifest - JSON manifest to validate
 * @returns Validation result with errors and warnings
 *
 * @example
 * ```typescript
 * const result = validateManifest({
 *   entities: [{ name: 'User', fields: { email: { type: 'text' } } }],
 *   database: { type: 'sqlite', file: './app.db' }
 * })
 *
 * if (!result.valid) {
 *   console.log('Errors:', result.errors)
 * }
 * ```
 */
export function validateManifest(manifest: ManifestJSON): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Validate mode
  const validModes = ['full', 'headless', 'api-only']
  if (manifest.mode && !validModes.includes(manifest.mode)) {
    errors.push({
      code: ValidationCodes.INVALID_MODE,
      path: 'mode',
      message: `Invalid mode '${manifest.mode}'`,
      suggestion: `Use one of: ${validModes.join(', ')}`,
    })
  }

  // Validate database
  errors.push(...validateDatabase(manifest))

  // Validate auth
  errors.push(...validateAuth(manifest))

  // Collect entity names for relation validation
  const entityNames = new Set(manifest.entities.map(e => e.name))

  // Check for duplicate entity names
  const seenNames = new Set<string>()
  for (const entity of manifest.entities) {
    if (seenNames.has(entity.name)) {
      errors.push({
        code: ValidationCodes.DUPLICATE_ENTITY,
        path: entity.name,
        message: `Duplicate entity name '${entity.name}'`,
        suggestion: `Rename one of the entities`,
      })
    }
    seenNames.add(entity.name)
  }

  // Validate each entity
  const authEnabled = manifest.auth?.enabled || false
  for (const entity of manifest.entities) {
    errors.push(...validateEntity(entity, entityNames, authEnabled))
  }

  // Validate global source
  if (manifest.source && !manifest.source.baseUrl) {
    errors.push({
      code: ValidationCodes.EXTERNAL_SOURCE_INVALID,
      path: 'source.baseUrl',
      message: `Global external source requires baseUrl`,
      suggestion: `Add baseUrl to source, e.g., 'env:API_URL'`,
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
