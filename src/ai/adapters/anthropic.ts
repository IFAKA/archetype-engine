/**
 * Anthropic Tool Use Adapter
 *
 * Converts tool definitions to Anthropic's tool use format.
 *
 * @module ai/adapters/anthropic
 */

import type { AnthropicTool, ManifestBuilder, ToolResult } from '../types'
import { toolDefinitions } from '../tools'
import { executeOpenAITool } from './openai'

/**
 * Convert a tool definition to Anthropic format
 */
function toAnthropicSchema(def: typeof toolDefinitions[string]): AnthropicTool {
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
 * Execute a tool call and return the result
 * Reuses OpenAI execution logic since the interface is the same
 */
export function executeAnthropicTool(
  builder: ManifestBuilder,
  toolName: string,
  input: Record<string, unknown>
): ToolResult {
  return executeOpenAITool(builder, toolName, input)
}

/**
 * Create a handler for Anthropic tool calls
 */
export function createAnthropicHandler(builder: ManifestBuilder) {
  return {
    tools: getAnthropicTools(),
    execute: (toolName: string, input: Record<string, unknown>) =>
      executeAnthropicTool(builder, toolName, input),
  }
}
