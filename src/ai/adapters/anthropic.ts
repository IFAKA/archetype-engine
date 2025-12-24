/**
 * Anthropic Tool Use Adapter
 *
 * Converts tool definitions to Anthropic's tool use format.
 *
 * @module ai/adapters/anthropic
 */

import type { AnthropicTool, ManifestBuilder, ToolResult, SchemaProperty } from '../types'
import { toolDefinitions } from '../tools'
import { executeOpenAITool } from './openai'

/**
 * Convert a tool definition to Anthropic format
 */
function toAnthropicSchema(def: typeof toolDefinitions[string]): AnthropicTool {
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
    name: def.name,
    description: def.description,
    input_schema: {
      type: 'object',
      properties,
      required: def.required,
    },
  }
}

/**
 * Get all tools in Anthropic format
 */
export function getAnthropicTools(): AnthropicTool[] {
  return Object.values(toolDefinitions).map(toAnthropicSchema)
}

/**
 * Tool input parameters
 */
export interface ToolInput {
  [key: string]: unknown
}

/**
 * Execute a tool call and return the result
 * Reuses OpenAI execution logic since the interface is the same
 */
export function executeAnthropicTool(
  builder: ManifestBuilder,
  toolName: string,
  input: ToolInput
): ToolResult {
  return executeOpenAITool(builder, toolName, input)
}

/**
 * Create a handler for Anthropic tool calls
 */
export function createAnthropicHandler(builder: ManifestBuilder) {
  return {
    tools: getAnthropicTools(),
    execute: (toolName: string, input: ToolInput) =>
      executeAnthropicTool(builder, toolName, input),
  }
}
