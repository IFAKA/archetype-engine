/**
 * Service Layer Generator
 *
 * Generates service modules for entities backed by external APIs.
 * Only runs when entities have external source configuration.
 *
 * Generated files:
 * - services/apiClient.ts - Reusable HTTP client with typed methods
 * - services/{entity}Service.ts - CRUD operations for each external entity
 * - services/index.ts - Barrel export of all services
 *
 * Features:
 * - Environment variable support for base URLs (env:VARIABLE_NAME syntax)
 * - RESTful endpoint pattern support (GET /products/:id)
 * - Typed request/response handling
 * - Error handling with HTTP status codes
 * - AbortSignal support for request cancellation
 *
 * @module generators/service
 */

import type { Generator, GeneratedFile } from '../../../template/types'
import type { GeneratorContext } from '../../../template/context'
import type { ManifestIR } from '../../../manifest'
import type { EntityIR } from '../../../entity'
import { resolveEndpoints, ExternalSourceConfig } from '../../../source'

/**
 * Parse environment variable syntax in base URL
 *
 * Converts 'env:VARIABLE_NAME' to 'process.env.VARIABLE_NAME' for runtime resolution.
 * Regular URLs are returned as string literals.
 *
 * @param baseUrl - Base URL string, may contain env: prefix
 * @returns JavaScript expression for the URL
 */
function parseEnvUrl(baseUrl: string): string {
  if (baseUrl.startsWith('env:')) {
    const varName = baseUrl.slice(4)
    return `process.env.${varName}`
  }
  return `'${baseUrl}'`
}

/**
 * Parse endpoint string into HTTP method and path
 *
 * @example
 * parseEndpoint('GET /products/:id') // { method: 'GET', path: '/products/:id' }
 * parseEndpoint('/products')         // { method: 'GET', path: '/products' }
 *
 * @param endpoint - Endpoint string with optional method prefix
 * @returns Object with method and path
 */
function parseEndpoint(endpoint: string): { method: string; path: string } {
  const parts = endpoint.split(' ')
  if (parts.length === 2) {
    return { method: parts[0], path: parts[1] }
  }
  // Default to GET if no method specified
  return { method: 'GET', path: endpoint }
}

/**
 * Generate the shared API client module
 *
 * Creates a reusable HTTP client with typed methods for GET, POST, PUT, DELETE.
 * Includes URL building with query parameters and error handling.
 *
 * @returns Generated file for apiClient.ts
 */
function generateApiClient(): GeneratedFile {
  return {
    path: 'services/apiClient.ts',
    content: `// Auto-generated API client
// Do not edit manually - regenerate with: npx archetype generate

export interface RequestConfig {
  headers?: Record<string, string>
  params?: Record<string, unknown>
  signal?: AbortSignal
}

export interface ApiResponse<T> {
  data: T
  status: number
}

class ApiClient {
  private defaultHeaders: Record<string, string>

  constructor(headers: Record<string, string> = {}) {
    this.defaultHeaders = headers
  }

  private buildUrl(baseUrl: string, path: string, params?: Record<string, unknown>): string {
    const url = new URL(path, baseUrl)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value))
        }
      })
    }
    return url.toString()
  }

  async get<T>(baseUrl: string, path: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const url = this.buildUrl(baseUrl, path, config?.params)
    const response = await fetch(url, {
      method: 'GET',
      headers: { ...this.defaultHeaders, ...config?.headers },
      signal: config?.signal,
    })
    if (!response.ok) {
      throw new Error(\`HTTP error \${response.status}: \${response.statusText}\`)
    }
    return { data: await response.json(), status: response.status }
  }

  async post<T>(baseUrl: string, path: string, body: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await fetch(\`\${baseUrl}\${path}\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.defaultHeaders,
        ...config?.headers,
      },
      body: JSON.stringify(body),
      signal: config?.signal,
    })
    if (!response.ok) {
      throw new Error(\`HTTP error \${response.status}: \${response.statusText}\`)
    }
    return { data: await response.json(), status: response.status }
  }

  async put<T>(baseUrl: string, path: string, body: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await fetch(\`\${baseUrl}\${path}\`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.defaultHeaders,
        ...config?.headers,
      },
      body: JSON.stringify(body),
      signal: config?.signal,
    })
    if (!response.ok) {
      throw new Error(\`HTTP error \${response.status}: \${response.statusText}\`)
    }
    return { data: await response.json(), status: response.status }
  }

  async delete<T>(baseUrl: string, path: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await fetch(\`\${baseUrl}\${path}\`, {
      method: 'DELETE',
      headers: { ...this.defaultHeaders, ...config?.headers },
      signal: config?.signal,
    })
    if (!response.ok) {
      throw new Error(\`HTTP error \${response.status}: \${response.statusText}\`)
    }
    return { data: await response.json(), status: response.status }
  }
}

export const apiClient = new ApiClient()
`,
  }
}

/**
 * Generate service module for a single entity with external API source
 *
 * @param entity - Entity IR with source configuration
 * @param source - External source config with base URL and endpoints
 * @param ctx - Generator context
 * @returns Generated file for {entity}Service.ts
 */
function generateEntityService(
  entity: EntityIR,
  source: ExternalSourceConfig,
  ctx: GeneratorContext
): GeneratedFile {
  const name = entity.name
  const lowerName = name.toLowerCase()
  const endpoints = resolveEndpoints(name, source)

  const listEndpoint = parseEndpoint(endpoints.list)
  const getEndpoint = parseEndpoint(endpoints.get)
  const createEndpoint = parseEndpoint(endpoints.create)
  const updateEndpoint = parseEndpoint(endpoints.update)
  const deleteEndpoint = parseEndpoint(endpoints.delete)

  const baseUrlCode = parseEnvUrl(source.baseUrl)

  // Generate path with parameter substitution
  const pathWithId = (path: string) => {
    // Replace :id with ${id}
    return path.replace(/:([a-zA-Z_]+)/g, '${$1}')
  }

  return {
    path: `services/${lowerName}Service.ts`,
    content: `// Auto-generated service for ${name}
// Do not edit manually - regenerate with: npx archetype generate

import { apiClient } from './apiClient'
import type { ${name}Create, ${name}Update } from '../schemas/${lowerName}'

const BASE_URL = ${baseUrlCode}!

export interface ${name}ListParams {
  page?: number
  limit?: number
  [key: string]: unknown
}

export const ${lowerName}Service = {
  /**
   * List all ${name}s
   */
  async list(params?: ${name}ListParams) {
    const response = await apiClient.get<${name}[]>(BASE_URL, '${listEndpoint.path}', { params })
    return response.data
  },

  /**
   * Get a single ${name} by ID
   */
  async get(id: string) {
    const response = await apiClient.get<${name}>(BASE_URL, \`${pathWithId(getEndpoint.path)}\`)
    return response.data
  },

  /**
   * Create a new ${name}
   */
  async create(data: ${name}Create) {
    const response = await apiClient.post<${name}>(BASE_URL, '${createEndpoint.path}', data)
    return response.data
  },

  /**
   * Update an existing ${name}
   */
  async update(id: string, data: ${name}Update) {
    const response = await apiClient.put<${name}>(BASE_URL, \`${pathWithId(updateEndpoint.path)}\`, data)
    return response.data
  },

  /**
   * Delete a ${name}
   */
  async delete(id: string) {
    const response = await apiClient.delete<void>(BASE_URL, \`${pathWithId(deleteEndpoint.path)}\`)
    return response.data
  },
}

// Type for the entity (inferred from schema)
export interface ${name} extends ${name}Create {
  id: string
}
`,
  }
}

/**
 * Generate barrel export file for all services
 *
 * @param entities - Entities with external source to include
 * @returns Generated file for services/index.ts
 */
function generateServiceIndex(entities: EntityIR[]): GeneratedFile {
  const externalEntities = entities.filter(e => e.source?.type === 'external')
  const exports = externalEntities
    .map(e => `export { ${e.name.toLowerCase()}Service } from './${e.name.toLowerCase()}Service'`)
    .join('\n')

  return {
    path: 'services/index.ts',
    content: `// Auto-generated service exports
// Do not edit manually - regenerate with: npx archetype generate

export { apiClient } from './apiClient'
${exports}
`,
  }
}

export const serviceGenerator: Generator = {
  name: 'service-layer',
  description: 'Generate service layer for external APIs',

  generate(manifest: ManifestIR, ctx: GeneratorContext): GeneratedFile[] {
    const files: GeneratedFile[] = []

    // Collect entities with external source (from entity or manifest level)
    const entitiesWithSource: Array<{ entity: EntityIR; source: ExternalSourceConfig }> = []

    for (const entity of manifest.entities) {
      // Entity-level source takes precedence
      const source = entity.source || manifest.source
      if (source?.type === 'external') {
        entitiesWithSource.push({ entity, source })
      }
    }

    // Only generate if we have external entities
    if (entitiesWithSource.length === 0) {
      return files
    }

    // Generate base API client
    files.push(generateApiClient())

    // Generate service for each external entity
    for (const { entity, source } of entitiesWithSource) {
      files.push(generateEntityService(entity, source, ctx))
    }

    // Generate service index
    files.push(generateServiceIndex(entitiesWithSource.map(e => e.entity)))

    return files
  },
}
