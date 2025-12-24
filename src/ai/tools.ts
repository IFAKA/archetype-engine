/**
 * Framework-agnostic tool definitions
 *
 * These definitions can be converted to OpenAI, Anthropic, or Vercel AI SDK formats.
 *
 * @module ai/tools
 */

import type { ToolDefinition } from './types'

/**
 * Field type JSON schema
 * Note: Type assertion required because of deeply nested schema structure
 */
const fieldSchema = {
  type: 'object' as const,
  description: 'Field definition',
  properties: {
    type: {
      type: 'string' as const,
      description: 'Field data type',
      enum: ['text', 'number', 'boolean', 'date'],
    },
    required: {
      type: 'boolean' as const,
      description: 'Whether the field is required (default: true)',
    },
    unique: {
      type: 'boolean' as const,
      description: 'Add unique constraint',
    },
    email: {
      type: 'boolean' as const,
      description: 'Validate as email (text fields only)',
    },
    url: {
      type: 'boolean' as const,
      description: 'Validate as URL (text fields only)',
    },
    min: {
      type: 'number' as const,
      description: 'Minimum length (text) or value (number)',
    },
    max: {
      type: 'number' as const,
      description: 'Maximum length (text) or value (number)',
    },
    oneOf: {
      type: 'array' as const,
      description: 'Enum values - field must be one of these',
      items: { type: 'string' as const },
    },
    integer: {
      type: 'boolean' as const,
      description: 'Must be integer (number fields only)',
    },
    positive: {
      type: 'boolean' as const,
      description: 'Must be positive (number fields only)',
    },
    default: {
      type: 'string' as const,
      description: 'Default value',
    },
    label: {
      type: 'string' as const,
      description: 'Display label for UI',
    },
  },
  required: ['type'],
}

/**
 * Relation type JSON schema
 * Note: Type assertion required because of deeply nested schema structure
 */
const relationSchema = {
  type: 'object' as const,
  description: 'Relation definition',
  properties: {
    type: {
      type: 'string' as const,
      description: 'Relation type',
      enum: ['hasOne', 'hasMany', 'belongsToMany'],
    },
    entity: {
      type: 'string' as const,
      description: 'Target entity name (PascalCase)',
    },
  },
  required: ['type', 'entity'],
}

/**
 * All available tools
 */
export const toolDefinitions: Record<string, ToolDefinition> = {
  add_entity: {
    name: 'add_entity',
    description:
      'Add a new entity to the app. Entities represent data types like User, Post, Product. Each entity will get a database table, API endpoints, and React hooks.',
    parameters: {
      name: {
        type: 'string',
        description: 'Entity name in PascalCase (e.g., User, BlogPost, ProductCategory)',
        required: true,
      },
      fields: {
        type: 'object',
        description:
          'Field definitions. Keys are field names in camelCase. Values define type and validations.',
        required: true,
        properties: {
          '[fieldName]': fieldSchema as unknown as ToolParameter,
        },
      },
      relations: {
        type: 'object',
        description:
          'Relations to other entities. hasOne = foreign key on this entity, hasMany = foreign key on target, belongsToMany = junction table.',
        properties: {
          '[relationName]': relationSchema as unknown as ToolParameter,
        },
      },
      behaviors: {
        type: 'object',
        description: 'Entity behaviors',
        properties: {
          timestamps: {
            type: 'boolean',
            description: 'Add createdAt/updatedAt fields (default: true)',
          },
          softDelete: {
            type: 'boolean',
            description: 'Use deletedAt instead of hard delete',
          },
          audit: {
            type: 'boolean',
            description: 'Log all changes',
          },
        },
      },
      protected: {
        type: 'string',
        description:
          'Auth protection level. false=public, true=all protected, "write"=read public/write protected',
        enum: ['false', 'true', 'write', 'all'],
      },
    },
    required: ['name', 'fields'],
  },

  update_entity: {
    name: 'update_entity',
    description: 'Update an existing entity. Use this to add/modify fields or relations.',
    parameters: {
      name: {
        type: 'string',
        description: 'Name of the entity to update',
        required: true,
      },
      fields: {
        type: 'object',
        description: 'Fields to add or update',
        properties: {
          '[fieldName]': fieldSchema as unknown as ToolParameter,
        },
      },
      relations: {
        type: 'object',
        description: 'Relations to add or update',
        properties: {
          '[relationName]': relationSchema as unknown as ToolParameter,
        },
      },
      behaviors: {
        type: 'object',
        description: 'Behaviors to update',
        properties: {
          timestamps: { type: 'boolean', description: 'Add createdAt/updatedAt' },
          softDelete: { type: 'boolean', description: 'Use soft delete' },
          audit: { type: 'boolean', description: 'Enable audit logging' },
        },
      },
      protected: {
        type: 'string',
        description: 'Auth protection level',
        enum: ['false', 'true', 'write', 'all'],
      },
    },
    required: ['name'],
  },

  remove_entity: {
    name: 'remove_entity',
    description: 'Remove an entity from the app.',
    parameters: {
      name: {
        type: 'string',
        description: 'Name of the entity to remove',
        required: true,
      },
    },
    required: ['name'],
  },

  set_database: {
    name: 'set_database',
    description: 'Configure the database. Required before generating the app.',
    parameters: {
      type: {
        type: 'string',
        description: 'Database type',
        required: true,
        enum: ['sqlite', 'postgres', 'mysql'],
      },
      file: {
        type: 'string',
        description: 'SQLite file path (required for SQLite, e.g., "./app.db")',
      },
      url: {
        type: 'string',
        description:
          'Connection URL for Postgres/MySQL. Use env: prefix for env vars (e.g., "env:DATABASE_URL")',
      },
    },
    required: ['type'],
  },

  set_auth: {
    name: 'set_auth',
    description:
      'Configure authentication. Enables user login with various providers.',
    parameters: {
      enabled: {
        type: 'boolean',
        description: 'Whether to enable authentication',
        required: true,
      },
      providers: {
        type: 'array',
        description: 'Login providers to enable',
        items: {
          type: 'string',
          description: 'Provider name',
          enum: ['credentials', 'google', 'github', 'discord'],
        },
      },
      sessionStrategy: {
        type: 'string',
        description: 'Session storage strategy',
        enum: ['jwt', 'database'],
      },
    },
    required: ['enabled'],
  },

  validate: {
    name: 'validate',
    description:
      'Validate the current manifest. Returns structured errors with suggestions. Call this before generate to check for issues.',
    parameters: {},
    required: [],
  },

  generate: {
    name: 'generate',
    description:
      'Generate the app. Creates all files: database schema, API routes, React hooks, validation schemas. Call validate first to check for errors.',
    parameters: {},
    required: [],
  },
}

// Need to import this for the type
import type { ToolParameter } from './types'
