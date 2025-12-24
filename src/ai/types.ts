/**
 * AI Module Types
 *
 * Type definitions for AI tool integrations.
 *
 * @module ai/types
 */

import type { EntityJSON, DatabaseJSON, AuthJSON, ManifestJSON } from '../json/types'
import type { ValidationResult } from '../validation'
import type { GeneratedFile } from '../template/types'

/**
 * Tool parameter definition
 */
export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description: string
  required?: boolean
  enum?: string[]
  properties?: Record<string, ToolParameter>
  items?: ToolParameter
}

/**
 * JSON Schema property (for tool schemas)
 */
export interface SchemaProperty {
  type: string
  description: string
  enum?: string[]
  items?: SchemaProperty
  additionalProperties?: boolean
}

/**
 * Tool definition (framework-agnostic)
 */
export interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, ToolParameter>
  required?: string[]
}

/**
 * Result of a tool execution
 */
export interface ToolResult {
  success: boolean
  message?: string
  data?: unknown
  errors?: Array<{ code: string; message: string; suggestion?: string }>
}

/**
 * Add entity parameters
 */
export interface AddEntityParams {
  name: string
  fields: Record<string, {
    type: 'text' | 'number' | 'boolean' | 'date'
    required?: boolean
    unique?: boolean
    email?: boolean
    url?: boolean
    min?: number
    max?: number
    oneOf?: string[]
    integer?: boolean
    positive?: boolean
    default?: unknown
    label?: string
  }>
  relations?: Record<string, {
    type: 'hasOne' | 'hasMany' | 'belongsToMany'
    entity: string
  }>
  behaviors?: {
    timestamps?: boolean
    softDelete?: boolean
    audit?: boolean
  }
  protected?: boolean | 'write' | 'all'
}

/**
 * Update entity parameters
 */
export interface UpdateEntityParams {
  name: string
  fields?: Record<string, {
    type?: 'text' | 'number' | 'boolean' | 'date'
    required?: boolean
    unique?: boolean
    email?: boolean
    url?: boolean
    min?: number
    max?: number
    oneOf?: string[]
    integer?: boolean
    positive?: boolean
    default?: unknown
    label?: string
  }>
  relations?: Record<string, {
    type: 'hasOne' | 'hasMany' | 'belongsToMany'
    entity: string
  }>
  behaviors?: {
    timestamps?: boolean
    softDelete?: boolean
    audit?: boolean
  }
  protected?: boolean | 'write' | 'all'
}

/**
 * Remove entity parameters
 */
export interface RemoveEntityParams {
  name: string
}

/**
 * Set database parameters
 */
export interface SetDatabaseParams {
  type: 'sqlite' | 'postgres' | 'mysql'
  file?: string
  url?: string
}

/**
 * Set auth parameters
 */
export interface SetAuthParams {
  enabled: boolean
  providers?: ('credentials' | 'google' | 'github' | 'discord')[]
  sessionStrategy?: 'jwt' | 'database'
}

/**
 * ManifestBuilder interface for tracking state across tool calls
 */
export interface ManifestBuilder {
  // State
  readonly entities: EntityJSON[]
  readonly database: DatabaseJSON | undefined
  readonly auth: AuthJSON | undefined

  // Entity operations
  addEntity(params: AddEntityParams): ToolResult
  updateEntity(params: UpdateEntityParams): ToolResult
  removeEntity(params: RemoveEntityParams): ToolResult

  // Config operations
  setDatabase(params: SetDatabaseParams): ToolResult
  setAuth(params: SetAuthParams): ToolResult

  // Output operations
  toManifest(): ManifestJSON
  validate(): ValidationResult
  generate(): Promise<{ files: GeneratedFile[]; success: boolean; errors?: string[] }>

  // Reset
  reset(): void
}

/**
 * OpenAI function calling format
 */
export interface OpenAITool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, unknown>
      required?: string[]
    }
  }
}

/**
 * Anthropic tool use format
 */
export interface AnthropicTool {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

/**
 * Vercel AI SDK tool format
 */
export interface VercelAITool {
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
  execute: (params: unknown) => Promise<unknown>
}
