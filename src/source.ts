/**
 * External API source configuration
 * @module source
 */

import { pluralize } from './core/utils'

/**
 * Options for external API source configuration
 */
export interface ExternalSourceOptions {
  /** Path prefix like '/v1' or '/api' - prepended to all endpoints */
  pathPrefix?: string
  /** Override auto-pluralization: 'product' instead of 'products' */
  resourceName?: string
  /** Override specific endpoints when API doesn't follow REST conventions */
  override?: {
    list?: string    // e.g., 'GET /catalog/search'
    get?: string     // e.g., 'GET /items/:sku'
    create?: string
    update?: string
    delete?: string
  }
  /** Auth config for this API */
  auth?: {
    type: 'bearer' | 'api-key'
    header?: string
  }
}

/**
 * Compiled external source configuration
 */
export interface ExternalSourceConfig {
  type: 'external'
  /** Base URL - can use 'env:VARIABLE_NAME' syntax */
  baseUrl: string
  /** Path prefix */
  pathPrefix: string
  /** Resource name (pluralized entity name) */
  resourceName?: string
  /** Resolved endpoints */
  endpoints: {
    list: string
    get: string
    create: string
    update: string
    delete: string
  }
  /** Auth configuration */
  auth?: {
    type: 'bearer' | 'api-key'
    header: string
  }
}

/**
 * Database source configuration (default when no external source)
 */
export interface DatabaseSourceConfig {
  type: 'database'
}

/**
 * Entity source configuration - either database or external API
 */
export type SourceConfig = DatabaseSourceConfig | ExternalSourceConfig

/**
 * Generate REST endpoints from entity name and options
 */
function generateEndpoints(
  entityName: string,
  options: ExternalSourceOptions = {}
): ExternalSourceConfig['endpoints'] {
  const resource = options.resourceName || pluralize(entityName.toLowerCase())
  const prefix = options.pathPrefix || ''

  return {
    list:   options.override?.list   || `GET ${prefix}/${resource}`,
    get:    options.override?.get    || `GET ${prefix}/${resource}/:id`,
    create: options.override?.create || `POST ${prefix}/${resource}`,
    update: options.override?.update || `PUT ${prefix}/${resource}/:id`,
    delete: options.override?.delete || `DELETE ${prefix}/${resource}/:id`,
  }
}

/**
 * Create an external API source configuration
 *
 * @param baseUrl - Base URL for the API. Supports 'env:VARIABLE_NAME' syntax.
 * @param options - Optional configuration for path prefix, resource name, endpoint overrides
 * @returns ExternalSourceConfig for use in entity or manifest source field
 *
 * @example
 * ```typescript
 * // Simple - all defaults
 * source: external('env:API_URL')
 * // Generates: GET/POST /products, GET/PUT/DELETE /products/:id
 *
 * // With version prefix
 * source: external('env:API_URL', { pathPrefix: '/v1' })
 * // Generates: /v1/products, /v1/products/:id
 *
 * // Override weird endpoints
 * source: external('env:LEGACY_API', {
 *   override: {
 *     list: 'GET /catalog/search',
 *     get: 'GET /catalog/item/:sku',
 *   }
 * })
 * ```
 */
export function external(
  baseUrl: string,
  options: ExternalSourceOptions = {}
): ExternalSourceConfig {
  // Generate default auth header based on type
  let auth: ExternalSourceConfig['auth'] | undefined
  if (options.auth) {
    auth = {
      type: options.auth.type,
      header: options.auth.header || (options.auth.type === 'api-key' ? 'X-API-Key' : 'Authorization'),
    }
  }

  return {
    type: 'external',
    baseUrl,
    pathPrefix: options.pathPrefix || '',
    resourceName: options.resourceName,
    // Endpoints will be generated per-entity when compiled
    // Using placeholder - actual generation happens in resolveEntitySource
    endpoints: {
      list: options.override?.list || '',
      get: options.override?.get || '',
      create: options.override?.create || '',
      update: options.override?.update || '',
      delete: options.override?.delete || '',
    },
    auth,
  }
}

/**
 * Resolve the final endpoints for an entity, using its name for pluralization
 */
export function resolveEndpoints(
  entityName: string,
  source: ExternalSourceConfig
): ExternalSourceConfig['endpoints'] {
  const resource = source.resourceName || pluralize(entityName.toLowerCase())
  const prefix = source.pathPrefix

  return {
    list:   source.endpoints.list   || `GET ${prefix}/${resource}`,
    get:    source.endpoints.get    || `GET ${prefix}/${resource}/:id`,
    create: source.endpoints.create || `POST ${prefix}/${resource}`,
    update: source.endpoints.update || `PUT ${prefix}/${resource}/:id`,
    delete: source.endpoints.delete || `DELETE ${prefix}/${resource}/:id`,
  }
}
