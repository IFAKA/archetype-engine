/**
 * OpenAI Function Calling Adapter
 *
 * Converts tool definitions to OpenAI's function calling format.
 *
 * @module ai/adapters/openai
 */

import type { OpenAITool, ManifestBuilder, ToolResult } from '../types'
import { toolDefinitions } from '../tools'

/**
 * Convert a tool definition to OpenAI format
 */
function toOpenAISchema(def: typeof toolDefinitions[string]): OpenAITool {
  const properties: Record<string, unknown> = {}

  for (const [name, param] of Object.entries(def.parameters)) {
    if (name.startsWith('[')) continue // Skip placeholder properties

    const prop: Record<string, unknown> = {
      type: param.type,
      description: param.description,
    }

    if (param.enum) {
      prop.enum = param.enum
    }

    if (param.type === 'array' && param.items) {
      prop.items = { type: param.items.type }
      if (param.items.enum) {
        (prop.items as Record<string, unknown>).enum = param.items.enum
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
 */
export function executeOpenAITool(
  builder: ManifestBuilder,
  functionName: string,
  args: Record<string, unknown>
): ToolResult {
  switch (functionName) {
    case 'add_entity':
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
    execute: (functionName: string, args: Record<string, unknown>) =>
      executeOpenAITool(builder, functionName, args),
  }
}
