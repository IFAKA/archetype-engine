import { describe, it, expect, beforeEach } from 'vitest'
import { createManifestBuilder, aiTools } from '../src/ai'
import { toolDefinitions } from '../src/ai/tools'
import { getOpenAITools, executeOpenAITool } from '../src/ai/adapters/openai'
import { getAnthropicTools, executeAnthropicTool } from '../src/ai/adapters/anthropic'
import { getVercelAITools } from '../src/ai/adapters/vercel'
import type { ManifestBuilder } from '../src/ai/types'

describe('AI Module', () => {
  describe('ManifestBuilder', () => {
    let builder: ManifestBuilder

    beforeEach(() => {
      builder = createManifestBuilder()
    })

    describe('addEntity', () => {
      it('adds an entity with fields', () => {
        const result = builder.addEntity({
          name: 'User',
          fields: {
            email: { type: 'text', email: true, unique: true },
            name: { type: 'text', required: true },
          },
        })

        expect(result.success).toBe(true)
        expect(builder.entities).toHaveLength(1)
        expect(builder.entities[0].name).toBe('User')
        expect(builder.entities[0].fields.email.email).toBe(true)
      })

      it('adds an entity with relations', () => {
        builder.addEntity({ name: 'User', fields: { email: { type: 'text' } } })
        const result = builder.addEntity({
          name: 'Post',
          fields: { title: { type: 'text' } },
          relations: { author: { type: 'hasOne', entity: 'User' } },
        })

        expect(result.success).toBe(true)
        expect(builder.entities[1].relations?.author.entity).toBe('User')
      })

      it('adds an entity with behaviors', () => {
        const result = builder.addEntity({
          name: 'Task',
          fields: { title: { type: 'text' } },
          behaviors: { timestamps: true, softDelete: true },
        })

        expect(result.success).toBe(true)
        expect(builder.entities[0].behaviors?.timestamps).toBe(true)
        expect(builder.entities[0].behaviors?.softDelete).toBe(true)
      })

      it('adds an entity with protected setting', () => {
        const result = builder.addEntity({
          name: 'Secret',
          fields: { data: { type: 'text' } },
          protected: 'write',
        })

        expect(result.success).toBe(true)
        expect(builder.entities[0].protected).toBe('write')
      })

      it('rejects duplicate entity names', () => {
        builder.addEntity({ name: 'User', fields: { email: { type: 'text' } } })
        const result = builder.addEntity({ name: 'User', fields: { name: { type: 'text' } } })

        expect(result.success).toBe(false)
        expect(result.errors?.[0].code).toBe('DUPLICATE_ENTITY')
      })
    })

    describe('updateEntity', () => {
      it('updates entity fields', () => {
        builder.addEntity({ name: 'User', fields: { email: { type: 'text' } } })
        const result = builder.updateEntity({
          name: 'User',
          fields: { name: { type: 'text' } },
        })

        expect(result.success).toBe(true)
        expect(builder.entities[0].fields.name).toBeDefined()
        expect(builder.entities[0].fields.email).toBeDefined()
      })

      it('updates entity relations', () => {
        builder.addEntity({ name: 'User', fields: { email: { type: 'text' } } })
        builder.addEntity({ name: 'Post', fields: { title: { type: 'text' } } })
        const result = builder.updateEntity({
          name: 'Post',
          relations: { author: { type: 'hasOne', entity: 'User' } },
        })

        expect(result.success).toBe(true)
        expect(builder.entities[1].relations?.author).toBeDefined()
      })

      it('updates entity behaviors', () => {
        builder.addEntity({ name: 'Task', fields: { title: { type: 'text' } } })
        const result = builder.updateEntity({
          name: 'Task',
          behaviors: { timestamps: true },
        })

        expect(result.success).toBe(true)
        expect(builder.entities[0].behaviors?.timestamps).toBe(true)
      })

      it('fails for non-existent entity', () => {
        const result = builder.updateEntity({
          name: 'NotExists',
          fields: { email: { type: 'text' } },
        })

        expect(result.success).toBe(false)
        expect(result.errors?.[0].code).toBe('ENTITY_NOT_FOUND')
      })
    })

    describe('removeEntity', () => {
      it('removes an existing entity', () => {
        builder.addEntity({ name: 'User', fields: { email: { type: 'text' } } })
        builder.addEntity({ name: 'Post', fields: { title: { type: 'text' } } })

        const result = builder.removeEntity({ name: 'User' })

        expect(result.success).toBe(true)
        expect(builder.entities).toHaveLength(1)
        expect(builder.entities[0].name).toBe('Post')
      })

      it('fails for non-existent entity', () => {
        const result = builder.removeEntity({ name: 'NotExists' })

        expect(result.success).toBe(false)
        expect(result.errors?.[0].code).toBe('ENTITY_NOT_FOUND')
      })
    })

    describe('setDatabase', () => {
      it('sets SQLite database', () => {
        const result = builder.setDatabase({ type: 'sqlite', file: './app.db' })

        expect(result.success).toBe(true)
        expect(builder.database?.type).toBe('sqlite')
        expect(builder.database?.file).toBe('./app.db')
      })

      it('sets PostgreSQL database', () => {
        const result = builder.setDatabase({ type: 'postgres', url: 'env:DATABASE_URL' })

        expect(result.success).toBe(true)
        expect(builder.database?.type).toBe('postgres')
        expect(builder.database?.url).toBe('env:DATABASE_URL')
      })
    })

    describe('setAuth', () => {
      it('enables auth with providers', () => {
        const result = builder.setAuth({
          enabled: true,
          providers: ['credentials', 'google'],
        })

        expect(result.success).toBe(true)
        expect(builder.auth?.enabled).toBe(true)
        expect(builder.auth?.providers).toContain('google')
      })

      it('disables auth', () => {
        const result = builder.setAuth({ enabled: false })

        expect(result.success).toBe(true)
        expect(builder.auth?.enabled).toBe(false)
      })

      it('sets session strategy', () => {
        const result = builder.setAuth({
          enabled: true,
          sessionStrategy: 'database',
        })

        expect(result.success).toBe(true)
        expect(builder.auth?.sessionStrategy).toBe('database')
      })
    })

    describe('toManifest', () => {
      it('returns complete manifest JSON', () => {
        builder.addEntity({ name: 'User', fields: { email: { type: 'text' } } })
        builder.setDatabase({ type: 'sqlite', file: './app.db' })
        builder.setAuth({ enabled: true, providers: ['credentials'] })

        const manifest = builder.toManifest()

        expect(manifest.entities).toHaveLength(1)
        expect(manifest.database?.type).toBe('sqlite')
        expect(manifest.auth?.enabled).toBe(true)
        expect(manifest.template).toBe('nextjs-drizzle-trpc')
      })
    })

    describe('validate', () => {
      it('validates a correct manifest', () => {
        builder.addEntity({ name: 'User', fields: { email: { type: 'text' } } })
        builder.setDatabase({ type: 'sqlite', file: './app.db' })

        const result = builder.validate()

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('detects missing database', () => {
        builder.addEntity({ name: 'User', fields: { email: { type: 'text' } } })

        const result = builder.validate()

        expect(result.valid).toBe(false)
        expect(result.errors.some(e => e.code === 'DATABASE_REQUIRED')).toBe(true)
      })

      it('detects missing relation target', () => {
        builder.addEntity({
          name: 'Post',
          fields: { title: { type: 'text' } },
          relations: { author: { type: 'hasOne', entity: 'User' } },
        })
        builder.setDatabase({ type: 'sqlite', file: './app.db' })

        const result = builder.validate()

        expect(result.valid).toBe(false)
        expect(result.errors.some(e => e.code === 'RELATION_TARGET_NOT_FOUND')).toBe(true)
      })
    })

    describe('reset', () => {
      it('clears all state', () => {
        builder.addEntity({ name: 'User', fields: { email: { type: 'text' } } })
        builder.setDatabase({ type: 'sqlite', file: './app.db' })
        builder.setAuth({ enabled: true })

        builder.reset()

        expect(builder.entities).toHaveLength(0)
        expect(builder.database).toBeUndefined()
        expect(builder.auth).toBeUndefined()
      })
    })
  })

  describe('Tool Definitions', () => {
    it('exports all expected tools', () => {
      const toolNames = Object.keys(toolDefinitions)

      expect(toolNames).toContain('add_entity')
      expect(toolNames).toContain('update_entity')
      expect(toolNames).toContain('remove_entity')
      expect(toolNames).toContain('set_database')
      expect(toolNames).toContain('set_auth')
      expect(toolNames).toContain('validate')
      expect(toolNames).toContain('generate')
    })

    it('add_entity has required parameters', () => {
      const tool = toolDefinitions.add_entity

      expect(tool.required).toContain('name')
      expect(tool.required).toContain('fields')
      expect(tool.parameters.name.type).toBe('string')
      expect(tool.parameters.fields.type).toBe('object')
    })

    it('set_database has type enum', () => {
      const tool = toolDefinitions.set_database

      expect(tool.parameters.type.enum).toContain('sqlite')
      expect(tool.parameters.type.enum).toContain('postgres')
      expect(tool.parameters.type.enum).toContain('mysql')
    })

    it('set_auth has provider enum', () => {
      const tool = toolDefinitions.set_auth

      expect(tool.parameters.providers.items?.enum).toContain('credentials')
      expect(tool.parameters.providers.items?.enum).toContain('google')
      expect(tool.parameters.providers.items?.enum).toContain('github')
    })
  })

  describe('OpenAI Adapter', () => {
    it('converts tools to OpenAI format', () => {
      const tools = getOpenAITools()

      expect(tools.length).toBeGreaterThan(0)
      expect(tools[0].type).toBe('function')
      expect(tools[0].function.name).toBeDefined()
      expect(tools[0].function.parameters.type).toBe('object')
    })

    it('executes add_entity tool', () => {
      const builder = createManifestBuilder()
      const result = executeOpenAITool(builder, 'add_entity', {
        name: 'User',
        fields: { email: { type: 'text' } },
      })

      expect(result.success).toBe(true)
      expect(builder.entities).toHaveLength(1)
    })

    it('executes validate tool', () => {
      const builder = createManifestBuilder()
      builder.addEntity({ name: 'User', fields: { email: { type: 'text' } } })
      builder.setDatabase({ type: 'sqlite', file: './app.db' })

      const result = executeOpenAITool(builder, 'validate', {})

      expect(result.success).toBe(true)
      expect(result.data?.valid).toBe(true)
    })

    it('returns error for unknown function', () => {
      const builder = createManifestBuilder()
      const result = executeOpenAITool(builder, 'unknown_function', {})

      expect(result.success).toBe(false)
      expect(result.errors?.[0].code).toBe('UNKNOWN_FUNCTION')
    })
  })

  describe('Anthropic Adapter', () => {
    it('converts tools to Anthropic format', () => {
      const tools = getAnthropicTools()

      expect(tools.length).toBeGreaterThan(0)
      expect(tools[0].name).toBeDefined()
      expect(tools[0].input_schema.type).toBe('object')
    })

    it('executes add_entity tool', () => {
      const builder = createManifestBuilder()
      const result = executeAnthropicTool(builder, 'add_entity', {
        name: 'Task',
        fields: { title: { type: 'text' } },
      })

      expect(result.success).toBe(true)
      expect(builder.entities).toHaveLength(1)
    })
  })

  describe('Vercel AI SDK Adapter', () => {
    it('returns tools with execute functions', () => {
      const builder = createManifestBuilder()
      const tools = getVercelAITools(builder)

      expect(Object.keys(tools)).toContain('add_entity')
      expect(Object.keys(tools)).toContain('set_database')
      expect(typeof tools.add_entity.execute).toBe('function')
    })

    it('executes add_entity through Vercel tool', async () => {
      const builder = createManifestBuilder()
      const tools = getVercelAITools(builder)

      const result = await tools.add_entity.execute({
        name: 'Project',
        fields: { name: { type: 'text' } },
      })

      expect(result.success).toBe(true)
      expect(builder.entities).toHaveLength(1)
      expect(builder.entities[0].name).toBe('Project')
    })

    it('executes validate through Vercel tool', async () => {
      const builder = createManifestBuilder()
      builder.addEntity({ name: 'User', fields: { email: { type: 'text' } } })
      builder.setDatabase({ type: 'sqlite', file: './app.db' })

      const tools = getVercelAITools(builder)
      const result = await tools.validate.execute({})

      expect(result.success).toBe(true)
    })
  })

  describe('aiTools convenience object', () => {
    it('provides openai adapter', () => {
      const tools = aiTools.openai()

      expect(Array.isArray(tools)).toBe(true)
      expect(tools[0].type).toBe('function')
    })

    it('provides anthropic adapter', () => {
      const tools = aiTools.anthropic()

      expect(Array.isArray(tools)).toBe(true)
      expect(tools[0].name).toBeDefined()
    })

    it('provides vercel adapter bound to builder', () => {
      const builder = createManifestBuilder()
      const tools = aiTools.vercel(builder)

      expect(typeof tools.add_entity.execute).toBe('function')
    })
  })
})
