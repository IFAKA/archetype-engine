/**
 * ManifestBuilder - State manager for AI tool calls
 *
 * Tracks the manifest being built across multiple AI tool calls.
 *
 * @module ai/state
 */

import type { EntityJSON, DatabaseJSON, AuthJSON, ManifestJSON, FieldJSON, RelationJSON } from '../json/types'
import type { GeneratedFile } from '../template/types'
import type {
  ManifestBuilder as IManifestBuilder,
  AddEntityParams,
  UpdateEntityParams,
  RemoveEntityParams,
  SetDatabaseParams,
  SetAuthParams,
  ToolResult,
} from './types'
import { validateManifest } from '../validation'
import { parseManifestJSON } from '../json/parser'
import { getTemplate, runTemplate } from '../template'

/**
 * Create a new ManifestBuilder instance
 */
export function createManifestBuilder(): IManifestBuilder {
  let entities: EntityJSON[] = []
  let database: DatabaseJSON | undefined
  let auth: AuthJSON | undefined

  const builder: IManifestBuilder = {
    get entities() {
      return [...entities]
    },

    get database() {
      return database
    },

    get auth() {
      return auth
    },

    addEntity(params: AddEntityParams): ToolResult {
      // Check if entity already exists
      const existing = entities.find(e => e.name === params.name)
      if (existing) {
        return {
          success: false,
          message: `Entity '${params.name}' already exists. Use update_entity to modify it.`,
          errors: [{ code: 'DUPLICATE_ENTITY', message: `Entity '${params.name}' already exists` }],
        }
      }

      // Convert params to EntityJSON
      const fields: Record<string, FieldJSON> = {}
      for (const [name, field] of Object.entries(params.fields)) {
        fields[name] = {
          type: field.type,
          required: field.required,
          unique: field.unique,
          email: field.email,
          url: field.url,
          min: field.min,
          max: field.max,
          oneOf: field.oneOf,
          integer: field.integer,
          positive: field.positive,
          default: field.default,
          label: field.label,
        }
      }

      const relations: Record<string, RelationJSON> | undefined = params.relations
        ? Object.fromEntries(
            Object.entries(params.relations).map(([name, rel]) => [
              name,
              { type: rel.type, entity: rel.entity },
            ])
          )
        : undefined

      const entity: EntityJSON = {
        name: params.name,
        fields,
        relations,
        behaviors: params.behaviors,
        protected: params.protected,
      }

      entities.push(entity)

      return {
        success: true,
        message: `Entity '${params.name}' added with ${Object.keys(fields).length} fields.`,
        data: { entities: entities.map(e => e.name) },
      }
    },

    updateEntity(params: UpdateEntityParams): ToolResult {
      const index = entities.findIndex(e => e.name === params.name)
      if (index === -1) {
        return {
          success: false,
          message: `Entity '${params.name}' not found. Use add_entity to create it first.`,
          errors: [{ code: 'ENTITY_NOT_FOUND', message: `Entity '${params.name}' not found` }],
        }
      }

      const entity = entities[index]

      // Update fields if provided
      if (params.fields) {
        for (const [name, field] of Object.entries(params.fields)) {
          entity.fields[name] = {
            ...entity.fields[name],
            type: field.type ?? entity.fields[name]?.type ?? 'text',
            required: field.required,
            unique: field.unique,
            email: field.email,
            url: field.url,
            min: field.min,
            max: field.max,
            oneOf: field.oneOf,
            integer: field.integer,
            positive: field.positive,
            default: field.default,
            label: field.label,
          }
        }
      }

      // Update relations if provided
      if (params.relations) {
        entity.relations = entity.relations ?? {}
        for (const [name, rel] of Object.entries(params.relations)) {
          entity.relations[name] = { type: rel.type, entity: rel.entity }
        }
      }

      // Update behaviors if provided
      if (params.behaviors) {
        entity.behaviors = { ...entity.behaviors, ...params.behaviors }
      }

      // Update protected if provided
      if (params.protected !== undefined) {
        entity.protected = params.protected
      }

      return {
        success: true,
        message: `Entity '${params.name}' updated.`,
        data: { entity: entity.name, fields: Object.keys(entity.fields) },
      }
    },

    removeEntity(params: RemoveEntityParams): ToolResult {
      const index = entities.findIndex(e => e.name === params.name)
      if (index === -1) {
        return {
          success: false,
          message: `Entity '${params.name}' not found.`,
          errors: [{ code: 'ENTITY_NOT_FOUND', message: `Entity '${params.name}' not found` }],
        }
      }

      entities.splice(index, 1)

      return {
        success: true,
        message: `Entity '${params.name}' removed.`,
        data: { entities: entities.map(e => e.name) },
      }
    },

    setDatabase(params: SetDatabaseParams): ToolResult {
      database = {
        type: params.type,
        file: params.file,
        url: params.url,
      }

      return {
        success: true,
        message: `Database configured: ${params.type}`,
        data: { database },
      }
    },

    setAuth(params: SetAuthParams): ToolResult {
      auth = {
        enabled: params.enabled,
        providers: params.providers,
        sessionStrategy: params.sessionStrategy,
      }

      return {
        success: true,
        message: params.enabled
          ? `Auth enabled with providers: ${params.providers?.join(', ') ?? 'credentials'}`
          : 'Auth disabled',
        data: { auth },
      }
    },

    toManifest(): ManifestJSON {
      return {
        entities,
        database,
        auth,
        template: 'nextjs-drizzle-trpc',
      }
    },

    validate() {
      return validateManifest(this.toManifest())
    },

    async generate() {
      const manifest = this.toManifest()
      const validation = validateManifest(manifest)

      if (!validation.valid) {
        return {
          files: [],
          success: false,
          errors: validation.errors.map(e => e.message),
        }
      }

      const ir = parseManifestJSON(manifest)
      const template = await getTemplate('nextjs-drizzle-trpc')

      if (!template) {
        return {
          files: [],
          success: false,
          errors: ['Template not found'],
        }
      }

      const files = await runTemplate(template, ir)

      return {
        files,
        success: true,
      }
    },

    reset() {
      entities = []
      database = undefined
      auth = undefined
    },
  }

  return builder
}
