/**
 * OpenAI Function Calling Adapter
 *
 * Converts tool definitions to OpenAI's function calling format.
 *
 * @module ai/adapters/openai
 */

import type { OpenAITool, ManifestBuilder, ToolResult, SchemaProperty } from '../types'
import { toolDefinitions } from '../tools'

/**
 * Tool input parameters
 */
export interface ToolInput {
  [key: string]: unknown
}

/**
 * Convert a tool definition to OpenAI format
 */
function toOpenAISchema(def: typeof toolDefinitions[string]): OpenAITool {
  const properties: Record<string, SchemaProperty> = {}

  for (const [name, param] of Object.entries(def.parameters)) {
    if (name.startsWith('[')) continue // Skip placeholder properties

    const prop: SchemaProperty = {
      type: param.type,
      description: param.description,
    }

    if (param.enum) {
      prop.enum = param.enum
    }

    if (param.type === 'array' && param.items) {
      prop.items = {
        type: param.items.type,
        description: param.items.description,
      }
      if (param.items.enum) {
        prop.items.enum = param.items.enum
      }
    }

    if (param.type === 'object' && param.properties) {
      prop.additionalProperties = true
    }

    properties[name] = prop
  }

  return {
    type: 'function',
    function: {
      name: def.name,
      description: def.description,
      parameters: {
        type: 'object',
        properties,
        required: def.required,
      },
    },
  }
}

/**
 * Get all tools in OpenAI format
 */
export function getOpenAITools(): OpenAITool[] {
  return Object.values(toolDefinitions).map(toOpenAISchema)
}

/**
 * Execute a tool call and return the result
 *
 * Note: AI frameworks send untyped JSON. We trust the AI to provide correctly-shaped data
 * and rely on runtime validation within the builder methods to catch errors.
 */
export function executeOpenAITool(
  builder: ManifestBuilder,
  functionName: string,
  args: ToolInput
): ToolResult {
  switch (functionName) {
    case 'add_entity':
      // AI sends untyped JSON - type assertion required
      return builder.addEntity(args as unknown as Parameters<typeof builder.addEntity>[0])

    case 'update_entity':
      return builder.updateEntity(args as unknown as Parameters<typeof builder.updateEntity>[0])

    case 'remove_entity':
      return builder.removeEntity(args as unknown as Parameters<typeof builder.removeEntity>[0])

    case 'set_database':
      return builder.setDatabase(args as unknown as Parameters<typeof builder.setDatabase>[0])

    case 'set_auth':
      return builder.setAuth(args as unknown as Parameters<typeof builder.setAuth>[0])

    case 'validate': {
      const result = builder.validate()
      return {
        success: result.valid,
        message: result.valid
          ? 'Manifest is valid'
          : `Found ${result.errors.length} error(s)`,
        data: result,
        errors: result.errors.map(e => ({
          code: e.code,
          message: e.message,
          suggestion: e.suggestion,
        })),
      }
    }

    case 'generate':
      // Note: This is async but we return a sync result for compatibility
      // Caller should handle the promise
      return {
        success: true,
        message: 'Generation started. Call builder.generate() to get files.',
        data: { manifest: builder.toManifest() },
      }

    default:
      return {
        success: false,
        message: `Unknown function: ${functionName}`,
        errors: [{ code: 'UNKNOWN_FUNCTION', message: `Unknown function: ${functionName}` }],
      }
  }
}

/**
 * Create a handler for OpenAI tool calls
 */
export function createOpenAIHandler(builder: ManifestBuilder) {
  return {
    tools: getOpenAITools(),
    execute: (functionName: string, args: ToolInput) =>
      executeOpenAITool(builder, functionName, args),
  }
}
