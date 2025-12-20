/**
 * AI Module
 *
 * Ready-to-use tool definitions for AI frameworks (OpenAI, Anthropic, Vercel AI SDK).
 *
 * @module ai
 *
 * @example
 * ```typescript
 * // With Vercel AI SDK
 * import { createManifestBuilder, aiTools } from 'archetype-engine/ai'
 * import { generateText } from 'ai'
 * import { openai } from '@ai-sdk/openai'
 *
 * const builder = createManifestBuilder()
 *
 * const result = await generateText({
 *   model: openai('gpt-4o'),
 *   tools: aiTools.vercel(builder),
 *   system: 'You are an app builder. Use the tools to build the app.',
 *   prompt: 'Create a blog with users and posts',
 *   maxSteps: 10
 * })
 *
 * // After AI finishes calling tools, generate the app
 * const { files, success } = await builder.generate()
 * ```
 */

// Types
export type {
  ToolDefinition,
  ToolParameter,
  ToolResult,
  ManifestBuilder,
  AddEntityParams,
  UpdateEntityParams,
  RemoveEntityParams,
  SetDatabaseParams,
  SetAuthParams,
  OpenAITool,
  AnthropicTool,
  VercelAITool,
} from './types'

// State
export { createManifestBuilder } from './state'

// Tool definitions
export { toolDefinitions } from './tools'

// OpenAI adapter
export { getOpenAITools, executeOpenAITool, createOpenAIHandler } from './adapters/openai'

// Anthropic adapter
export { getAnthropicTools, executeAnthropicTool, createAnthropicHandler } from './adapters/anthropic'

// Vercel AI SDK adapter
export { getVercelAITools } from './adapters/vercel'
export type { VercelAITools } from './adapters/vercel'

// Import for aiTools convenience object
import { getOpenAITools } from './adapters/openai'
import { getAnthropicTools } from './adapters/anthropic'
import { getVercelAITools as _getVercelAITools } from './adapters/vercel'
import type { ManifestBuilder } from './types'

/**
 * Convenience object for getting tools in different formats
 */
export const aiTools = {
  /**
   * Get tools for OpenAI function calling
   */
  openai: () => getOpenAITools(),

  /**
   * Get tools for Anthropic tool use
   */
  anthropic: () => getAnthropicTools(),

  /**
   * Get tools for Vercel AI SDK (requires builder instance)
   */
  vercel: (builder: ManifestBuilder) => _getVercelAITools(builder),
}
