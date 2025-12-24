/**
 * OpenAPI/Swagger Documentation Generator
 *
 * Generates OpenAPI 3.0 specification from entity definitions and tRPC routers.
 * Provides interactive API documentation via Swagger UI.
 *
 * Generated files:
 * - docs/openapi.json - OpenAPI 3.0 specification
 * - docs/swagger.html - Interactive Swagger UI
 *
 * Features:
 * - Complete API documentation for all CRUD endpoints
 * - Request/response schemas derived from Zod validation
 * - Authentication/authorization documentation
 * - Filter, search, and pagination parameter docs
 * - Batch operation endpoints
 * - Interactive testing via Swagger UI
 *
 * @module generators/openapi
 */

import type { Generator, GeneratedFile } from '../../../template/types'
import type { GeneratorContext } from '../../../template/context'
import type { ManifestIR } from '../../../manifest'
import type { EntityIR, ProtectedIR } from '../../../entity'
import type { FieldConfig } from '../../../fields'
import { toCamelCase, toSnakeCase } from '../../../core/utils'

/**
 * OpenAPI 3.0 specification structure
 */
interface OpenAPISpec {
  openapi: string
  info: {
    title: string
    description: string
    version: string
  }
  servers: Array<{ url: string; description: string }>
  paths: Record<string, any>
  components: {
    schemas: Record<string, any>
    securitySchemes?: Record<string, any>
  }
  security?: Array<Record<string, string[]>>
}

/**
 * Map field type to OpenAPI type
 */
function getOpenAPIType(field: FieldConfig): { type: string; format?: string } {
  switch (field.type) {
    case 'text':
      if (field.validations.some(v => v.type === 'email')) {
        return { type: 'string', format: 'email' }
      }
      if (field.validations.some(v => v.type === 'url')) {
        return { type: 'string', format: 'uri' }
      }
      if ((field as any).enumValues) {
        return { type: 'string' }
      }
      return { type: 'string' }
    
    case 'number':
      if (field.validations.some(v => v.type === 'integer')) {
        return { type: 'integer', format: 'int32' }
      }
      return { type: 'number', format: 'double' }
    
    case 'boolean':
      return { type: 'boolean' }
    
    case 'date':
      return { type: 'string', format: 'date-time' }
    
    case 'enum':
      return { type: 'string' }
    
    default:
      return { type: 'string' }
  }
}

/**
 * Generate OpenAPI schema for a field
 */
function generateFieldSchema(fieldName: string, field: FieldConfig): any {
  const schema: any = getOpenAPIType(field)
  
  // Add enum values
  if ((field as any).enumValues) {
    schema.enum = (field as any).enumValues
  }
  
  // Add description from label
  if (field.label) {
    schema.description = field.label
  }
  
  // Add validation constraints
  if (field.type === 'text') {
    const minLength = field.validations.find(v => v.type === 'minLength')
    const maxLength = field.validations.find(v => v.type === 'maxLength')
    if (minLength) schema.minLength = minLength.value
    if (maxLength) schema.maxLength = maxLength.value
  }
  
  if (field.type === 'number') {
    const min = field.validations.find(v => v.type === 'min')
    const max = field.validations.find(v => v.type === 'max')
    if (min) schema.minimum = min.value
    if (max) schema.maximum = max.value
  }
  
  // Add default value
  if (field.default !== undefined) {
    schema.default = field.default
  }
  
  return schema
}

/**
 * Generate OpenAPI schema for entity create input
 */
function generateCreateSchema(entity: EntityIR): any {
  const properties: Record<string, any> = {}
  const required: string[] = []
  
  for (const [fieldName, field] of Object.entries(entity.fields)) {
    // Skip computed fields
    if ((field as any).type === 'computed') continue
    
    properties[fieldName] = generateFieldSchema(fieldName, field)
    
    if (field.required) {
      required.push(fieldName)
    }
  }
  
  return {
    type: 'object',
    properties,
    required: required.length > 0 ? required : undefined,
  }
}

/**
 * Generate OpenAPI schema for entity (full model with ID and timestamps)
 */
function generateEntitySchema(entity: EntityIR): any {
  const properties: Record<string, any> = {
    id: { type: 'string', description: 'Unique identifier' },
  }
  
  // Add all fields including computed
  for (const [fieldName, field] of Object.entries(entity.fields)) {
    properties[fieldName] = generateFieldSchema(fieldName, field)
  }
  
  // Add timestamps if enabled
  if (entity.behaviors.timestamps) {
    properties.createdAt = { type: 'string', format: 'date-time' }
    properties.updatedAt = { type: 'string', format: 'date-time' }
  }
  
  // Add soft delete field
  if (entity.behaviors.softDelete) {
    properties.deletedAt = { 
      type: 'string', 
      format: 'date-time',
      nullable: true,
      description: 'Soft delete timestamp'
    }
  }
  
  return {
    type: 'object',
    properties,
    required: ['id'],
  }
}

/**
 * Generate filter parameter schema for a field
 */
function generateFilterSchema(fieldName: string, field: FieldConfig): any {
  const baseType = getOpenAPIType(field)
  
  switch (field.type) {
    case 'text':
      return {
        oneOf: [
          { type: 'string' },
          {
            type: 'object',
            properties: {
              eq: { type: 'string' },
              ne: { type: 'string' },
              contains: { type: 'string' },
              startsWith: { type: 'string' },
              endsWith: { type: 'string' },
            }
          }
        ]
      }
    
    case 'number':
      return {
        oneOf: [
          { type: 'number' },
          {
            type: 'object',
            properties: {
              eq: { type: 'number' },
              ne: { type: 'number' },
              gt: { type: 'number' },
              gte: { type: 'number' },
              lt: { type: 'number' },
              lte: { type: 'number' },
            }
          }
        ]
      }
    
    case 'boolean':
      return { type: 'boolean' }
    
    case 'date':
      return {
        oneOf: [
          { type: 'string', format: 'date-time' },
          {
            type: 'object',
            properties: {
              eq: { type: 'string', format: 'date-time' },
              ne: { type: 'string', format: 'date-time' },
              gt: { type: 'string', format: 'date-time' },
              gte: { type: 'string', format: 'date-time' },
              lt: { type: 'string', format: 'date-time' },
              lte: { type: 'string', format: 'date-time' },
            }
          }
        ]
      }
    
    default:
      return baseType
  }
}

/**
 * Generate security requirement for operation
 */
function getSecurityRequirement(isProtected: boolean): any[] {
  return isProtected ? [{ bearerAuth: [] }] : []
}

/**
 * Generate OpenAPI paths for an entity
 */
function generateEntityPaths(entity: EntityIR, baseUrl: string): Record<string, any> {
  const routerName = toCamelCase(entity.name)
  const paths: Record<string, any> = {}
  
  // List operation
  paths[`${baseUrl}/${routerName}.list`] = {
    get: {
      summary: `List ${entity.name} records`,
      description: `Retrieve a paginated list of ${entity.name} records with optional filtering and search`,
      operationId: `${routerName}List`,
      tags: [entity.name],
      security: getSecurityRequirement(entity.protected.list),
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', minimum: 1, default: 1 },
          description: 'Page number for pagination'
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          description: 'Number of items per page'
        },
        {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
          description: 'Search across all text fields'
        },
      ],
      responses: {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  items: {
                    type: 'array',
                    items: { $ref: `#/components/schemas/${entity.name}` }
                  },
                  total: { type: 'integer', description: 'Total number of records' },
                  page: { type: 'integer', description: 'Current page number' },
                  limit: { type: 'integer', description: 'Items per page' },
                  hasMore: { type: 'boolean', description: 'Whether more pages exist' },
                }
              }
            }
          }
        },
        '401': entity.protected.list ? { description: 'Unauthorized' } : undefined,
      }
    }
  }
  
  // Get operation
  paths[`${baseUrl}/${routerName}.get`] = {
    get: {
      summary: `Get ${entity.name} by ID`,
      description: `Retrieve a single ${entity.name} record by its unique identifier`,
      operationId: `${routerName}Get`,
      tags: [entity.name],
      security: getSecurityRequirement(entity.protected.get),
      parameters: [
        {
          name: 'id',
          in: 'query',
          required: true,
          schema: { type: 'string' },
          description: 'Unique identifier'
        }
      ],
      responses: {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${entity.name}` }
            }
          }
        },
        '401': entity.protected.get ? { description: 'Unauthorized' } : undefined,
        '404': { description: 'Record not found' },
      }
    }
  }
  
  // Create operation
  paths[`${baseUrl}/${routerName}.create`] = {
    post: {
      summary: `Create ${entity.name}`,
      description: `Create a new ${entity.name} record`,
      operationId: `${routerName}Create`,
      tags: [entity.name],
      security: getSecurityRequirement(entity.protected.create),
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: `#/components/schemas/${entity.name}CreateInput` }
          }
        }
      },
      responses: {
        '201': {
          description: 'Successfully created',
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${entity.name}` }
            }
          }
        },
        '400': { description: 'Validation error' },
        '401': entity.protected.create ? { description: 'Unauthorized' } : undefined,
      }
    }
  }
  
  // Update operation
  paths[`${baseUrl}/${routerName}.update`] = {
    patch: {
      summary: `Update ${entity.name}`,
      description: `Update an existing ${entity.name} record`,
      operationId: `${routerName}Update`,
      tags: [entity.name],
      security: getSecurityRequirement(entity.protected.update),
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Record ID to update' },
                data: { $ref: `#/components/schemas/${entity.name}UpdateInput` }
              },
              required: ['id', 'data']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Successfully updated',
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${entity.name}` }
            }
          }
        },
        '400': { description: 'Validation error' },
        '401': entity.protected.update ? { description: 'Unauthorized' } : undefined,
        '404': { description: 'Record not found' },
      }
    }
  }
  
  // Remove operation
  paths[`${baseUrl}/${routerName}.remove`] = {
    delete: {
      summary: `Delete ${entity.name}`,
      description: entity.behaviors.softDelete 
        ? `Soft delete a ${entity.name} record (sets deletedAt timestamp)`
        : `Permanently delete a ${entity.name} record`,
      operationId: `${routerName}Remove`,
      tags: [entity.name],
      security: getSecurityRequirement(entity.protected.remove),
      parameters: [
        {
          name: 'id',
          in: 'query',
          required: true,
          schema: { type: 'string' },
          description: 'Record ID to delete'
        }
      ],
      responses: {
        '200': {
          description: 'Successfully deleted',
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${entity.name}` }
            }
          }
        },
        '401': entity.protected.remove ? { description: 'Unauthorized' } : undefined,
        '404': { description: 'Record not found' },
      }
    }
  }
  
  // Batch operations
  paths[`${baseUrl}/${routerName}.createMany`] = {
    post: {
      summary: `Bulk create ${entity.name} records`,
      description: `Create multiple ${entity.name} records in a single request (max 100)`,
      operationId: `${routerName}CreateMany`,
      tags: [entity.name],
      security: getSecurityRequirement(entity.protected.create),
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                  items: { $ref: `#/components/schemas/${entity.name}CreateInput` },
                  maxItems: 100
                }
              },
              required: ['items']
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Successfully created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  created: {
                    type: 'array',
                    items: { $ref: `#/components/schemas/${entity.name}` }
                  },
                  count: { type: 'integer' }
                }
              }
            }
          }
        },
        '400': { description: 'Validation error' },
        '401': entity.protected.create ? { description: 'Unauthorized' } : undefined,
      }
    }
  }
  
  return paths
}

/**
 * Generate complete OpenAPI specification
 */
function generateOpenAPISpec(manifest: ManifestIR): OpenAPISpec {
  const baseUrl = '/api/trpc'
  const spec: OpenAPISpec = {
    openapi: '3.0.0',
    info: {
      title: 'Generated API Documentation',
      description: 'Auto-generated API documentation from Archetype entity definitions',
      version: '1.0.0',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development server' },
      { url: 'https://api.example.com', description: 'Production server' },
    ],
    paths: {},
    components: {
      schemas: {},
    },
  }
  
  // Add security schemes if auth is enabled
  if (manifest.auth.enabled) {
    spec.components.securitySchemes = {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token from authentication'
      }
    }
  }
  
  // Generate schemas and paths for each entity
  for (const entity of manifest.entities) {
    // Add entity schemas
    spec.components.schemas[entity.name] = generateEntitySchema(entity)
    spec.components.schemas[`${entity.name}CreateInput`] = generateCreateSchema(entity)
    spec.components.schemas[`${entity.name}UpdateInput`] = {
      ...generateCreateSchema(entity),
      required: undefined, // All fields optional for updates
    }
    
    // Add entity paths
    const entityPaths = generateEntityPaths(entity, baseUrl)
    Object.assign(spec.paths, entityPaths)
  }
  
  return spec
}

/**
 * Generate Swagger UI HTML page
 */
function generateSwaggerUI(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation - Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: './openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: 'StandaloneLayout',
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
      });
    };
  </script>
</body>
</html>
`
}

/**
 * Generate Markdown documentation as alternative to Swagger UI
 */
function generateMarkdownDocs(manifest: ManifestIR): string {
  const lines: string[] = []
  
  lines.push('# API Documentation')
  lines.push('')
  lines.push('Auto-generated API documentation from Archetype entity definitions.')
  lines.push('')
  lines.push('## Base URL')
  lines.push('')
  lines.push('```')
  lines.push('http://localhost:3000/api/trpc')
  lines.push('```')
  lines.push('')
  
  if (manifest.auth.enabled) {
    lines.push('## Authentication')
    lines.push('')
    lines.push('Protected endpoints require a JWT token in the Authorization header:')
    lines.push('')
    lines.push('```')
    lines.push('Authorization: Bearer <your-jwt-token>')
    lines.push('```')
    lines.push('')
  }
  
  lines.push('## Entities')
  lines.push('')
  
  for (const entity of manifest.entities) {
    const routerName = toCamelCase(entity.name)
    
    lines.push(`### ${entity.name}`)
    lines.push('')
    
    // Fields
    lines.push('#### Fields')
    lines.push('')
    lines.push('| Field | Type | Required | Description |')
    lines.push('|-------|------|----------|-------------|')
    
    for (const [fieldName, field] of Object.entries(entity.fields)) {
      const type = getOpenAPIType(field)
      const required = field.required ? 'Yes' : 'No'
      const description = field.label || '-'
      lines.push(`| ${fieldName} | ${type.type} | ${required} | ${description} |`)
    }
    
    lines.push('')
    
    // Endpoints
    lines.push('#### Endpoints')
    lines.push('')
    
    // List
    const listAuth = entity.protected.list ? '🔒 Protected' : '🌐 Public'
    lines.push(`**List ${entity.name}s** ${listAuth}`)
    lines.push('')
    lines.push('```')
    lines.push(`GET /api/trpc/${routerName}.list?page=1&limit=10`)
    lines.push('```')
    lines.push('')
    
    // Get
    const getAuth = entity.protected.get ? '🔒 Protected' : '🌐 Public'
    lines.push(`**Get ${entity.name} by ID** ${getAuth}`)
    lines.push('')
    lines.push('```')
    lines.push(`GET /api/trpc/${routerName}.get?id=<id>`)
    lines.push('```')
    lines.push('')
    
    // Create
    const createAuth = entity.protected.create ? '🔒 Protected' : '🌐 Public'
    lines.push(`**Create ${entity.name}** ${createAuth}`)
    lines.push('')
    lines.push('```')
    lines.push(`POST /api/trpc/${routerName}.create`)
    lines.push('Content-Type: application/json')
    lines.push('')
    
    // Generate example
    const exampleFields: string[] = []
    for (const [fieldName, field] of Object.entries(entity.fields)) {
      if ((field as any).type === 'computed') continue
      if (!field.required) continue
      
      let exampleValue = 'value'
      if (field.type === 'text') exampleValue = `"example ${fieldName}"`
      if (field.type === 'number') exampleValue = '42'
      if (field.type === 'boolean') exampleValue = 'true'
      if ((field as any).enumValues) exampleValue = `"${(field as any).enumValues[0]}"`
      
      exampleFields.push(`  "${fieldName}": ${exampleValue}`)
    }
    
    lines.push('{')
    lines.push(exampleFields.join(',\n'))
    lines.push('}')
    lines.push('```')
    lines.push('')
    
    // Update
    const updateAuth = entity.protected.update ? '🔒 Protected' : '🌐 Public'
    lines.push(`**Update ${entity.name}** ${updateAuth}`)
    lines.push('')
    lines.push('```')
    lines.push(`PATCH /api/trpc/${routerName}.update`)
    lines.push('Content-Type: application/json')
    lines.push('')
    lines.push('{')
    lines.push('  "id": "<id>",')
    lines.push('  "data": { /* fields to update */ }')
    lines.push('}')
    lines.push('```')
    lines.push('')
    
    // Delete
    const deleteAuth = entity.protected.remove ? '🔒 Protected' : '🌐 Public'
    lines.push(`**Delete ${entity.name}** ${deleteAuth}`)
    lines.push('')
    lines.push('```')
    lines.push(`DELETE /api/trpc/${routerName}.remove?id=<id>`)
    lines.push('```')
    lines.push('')
    
    lines.push('---')
    lines.push('')
  }
  
  return lines.join('\n')
}

/**
 * OpenAPI documentation generator
 */
export const openapiGenerator: Generator = {
  name: 'openapi-docs',
  description: 'Generates OpenAPI specification and interactive Swagger UI documentation',
  
  generate(manifest: ManifestIR, ctx: GeneratorContext): GeneratedFile[] {
    const files: GeneratedFile[] = []
    
    // Generate OpenAPI JSON spec
    const spec = generateOpenAPISpec(manifest)
    files.push({
      path: 'docs/openapi.json',
      content: JSON.stringify(spec, null, 2),
    })
    
    // Generate Swagger UI HTML
    files.push({
      path: 'docs/swagger.html',
      content: generateSwaggerUI(),
    })
    
    // Generate Markdown documentation
    files.push({
      path: 'docs/API.md',
      content: generateMarkdownDocs(manifest),
    })
    
    return files
  },
}
