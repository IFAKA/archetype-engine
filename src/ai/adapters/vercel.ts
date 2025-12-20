/**
 * Vercel AI SDK Adapter
 *
 * Converts tool definitions to Vercel AI SDK format with execute functions.
 *
 * @module ai/adapters/vercel
 */

import type { ManifestBuilder } from '../types'
import { toolDefinitions } from '../tools'
import { z } from 'zod'

/**
 * Field schema for Zod validation
 */
const fieldZodSchema = z.object({
  type: z.enum(['text', 'number', 'boolean', 'date']),
  required: z.boolean().optional(),
  unique: z.boolean().optional(),
  email: z.boolean().optional(),
  url: z.boolean().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  oneOf: z.array(z.string()).optional(),
  integer: z.boolean().optional(),
  positive: z.boolean().optional(),
  default: z.unknown().optional(),
  label: z.string().optional(),
})

/**
 * Relation schema for Zod validation
 */
const relationZodSchema = z.object({
  type: z.enum(['hasOne', 'hasMany', 'belongsToMany']),
  entity: z.string(),
})

/**
 * Create Vercel AI SDK tools bound to a ManifestBuilder
 *
 * @example
 * ```typescript
 * import { createManifestBuilder } from 'archetype-engine/ai'
 * import { getVercelAITools } from 'archetype-engine/ai/adapters/vercel'
 * import { generateText } from 'ai'
 * import { openai } from '@ai-sdk/openai'
 *
 * const builder = createManifestBuilder()
 * const tools = getVercelAITools(builder)
 *
 * const result = await generateText({
 *   model: openai('gpt-4o'),
 *   tools,
 *   prompt: 'Create a blog with users and posts'
 * })
 * ```
 */
export function getVercelAITools(builder: ManifestBuilder) {
  return {
    add_entity: {
      description: toolDefinitions.add_entity.description,
      parameters: z.object({
        name: z.string().describe('Entity name in PascalCase'),
        fields: z.record(fieldZodSchema).describe('Field definitions'),
        relations: z.record(relationZodSchema).optional().describe('Relation definitions'),
        behaviors: z
          .object({
            timestamps: z.boolean().optional(),
            softDelete: z.boolean().optional(),
            audit: z.boolean().optional(),
          })
          .optional(),
        protected: z.union([z.boolean(), z.enum(['write', 'all'])]).optional(),
      }),
      execute: async (params: {
        name: string
        fields: Record<string, z.infer<typeof fieldZodSchema>>
        relations?: Record<string, z.infer<typeof relationZodSchema>>
        behaviors?: { timestamps?: boolean; softDelete?: boolean; audit?: boolean }
        protected?: boolean | 'write' | 'all'
      }) => {
        const result = builder.addEntity(params)
        return result
      },
    },

    update_entity: {
      description: toolDefinitions.update_entity.description,
      parameters: z.object({
        name: z.string().describe('Entity name to update'),
        fields: z.record(fieldZodSchema.partial()).optional(),
        relations: z.record(relationZodSchema).optional(),
        behaviors: z
          .object({
            timestamps: z.boolean().optional(),
            softDelete: z.boolean().optional(),
            audit: z.boolean().optional(),
          })
          .optional(),
        protected: z.union([z.boolean(), z.enum(['write', 'all'])]).optional(),
      }),
      execute: async (params: {
        name: string
        fields?: Record<string, Partial<z.infer<typeof fieldZodSchema>>>
        relations?: Record<string, z.infer<typeof relationZodSchema>>
        behaviors?: { timestamps?: boolean; softDelete?: boolean; audit?: boolean }
        protected?: boolean | 'write' | 'all'
      }) => {
        const result = builder.updateEntity(params as Parameters<typeof builder.updateEntity>[0])
        return result
      },
    },

    remove_entity: {
      description: toolDefinitions.remove_entity.description,
      parameters: z.object({
        name: z.string().describe('Entity name to remove'),
      }),
      execute: async (params: { name: string }) => {
        const result = builder.removeEntity(params)
        return result
      },
    },

    set_database: {
      description: toolDefinitions.set_database.description,
      parameters: z.object({
        type: z.enum(['sqlite', 'postgres', 'mysql']),
        file: z.string().optional().describe('SQLite file path'),
        url: z.string().optional().describe('Connection URL for Postgres/MySQL'),
      }),
      execute: async (params: { type: 'sqlite' | 'postgres' | 'mysql'; file?: string; url?: string }) => {
        const result = builder.setDatabase(params)
        return result
      },
    },

    set_auth: {
      description: toolDefinitions.set_auth.description,
      parameters: z.object({
        enabled: z.boolean(),
        providers: z.array(z.enum(['credentials', 'google', 'github', 'discord'])).optional(),
        sessionStrategy: z.enum(['jwt', 'database']).optional(),
      }),
      execute: async (params: {
        enabled: boolean
        providers?: ('credentials' | 'google' | 'github' | 'discord')[]
        sessionStrategy?: 'jwt' | 'database'
      }) => {
        const result = builder.setAuth(params)
        return result
      },
    },

    validate: {
      description: toolDefinitions.validate.description,
      parameters: z.object({}),
      execute: async () => {
        const result = builder.validate()
        return {
          success: result.valid,
          message: result.valid ? 'Manifest is valid' : `Found ${result.errors.length} error(s)`,
          errors: result.errors,
          warnings: result.warnings,
        }
      },
    },

    generate: {
      description: toolDefinitions.generate.description,
      parameters: z.object({}),
      execute: async () => {
        const result = await builder.generate()
        return {
          success: result.success,
          message: result.success
            ? `Generated ${result.files.length} files`
            : `Generation failed: ${result.errors?.join(', ')}`,
          files: result.files.map(f => f.path),
          errors: result.errors,
        }
      },
    },
  }
}

/**
 * Convenience type for the tools object
 */
export type VercelAITools = ReturnType<typeof getVercelAITools>
