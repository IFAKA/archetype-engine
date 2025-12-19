// Generator context with common utilities

import type { ManifestIR } from '../manifest'
import type { TemplateConfig } from './types'
import {
  toSnakeCase,
  pluralize,
  toCamelCase,
  toPascalCase,
  getTableName,
  getColumnName,
} from '../core/utils'

/**
 * Context passed to generators with common utilities
 */
export interface GeneratorContext {
  /** Template configuration */
  config: TemplateConfig

  /** Naming utilities */
  naming: {
    toSnakeCase: typeof toSnakeCase
    pluralize: typeof pluralize
    toCamelCase: typeof toCamelCase
    toPascalCase: typeof toPascalCase
    getTableName: typeof getTableName
    getColumnName: typeof getColumnName
  }

  /** Database info from manifest */
  database: {
    type: 'sqlite' | 'postgres' | 'mysql'
    isSqlite: boolean
    isPostgres: boolean
    isMysql: boolean
  }

  /** Resolve import path using aliases */
  resolvePath: (alias: string) => string
}

/**
 * Create a generator context from manifest and config
 */
export function createContext(
  manifest: ManifestIR,
  config: TemplateConfig
): GeneratorContext {
  const dbType = manifest.database.type

  return {
    config,
    naming: {
      toSnakeCase,
      pluralize,
      toCamelCase,
      toPascalCase,
      getTableName,
      getColumnName,
    },
    database: {
      type: dbType,
      isSqlite: dbType === 'sqlite',
      isPostgres: dbType === 'postgres',
      isMysql: dbType === 'mysql',
    },
    resolvePath: (alias: string) => config.importAliases[alias] || alias,
  }
}
