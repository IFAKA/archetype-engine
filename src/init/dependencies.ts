// Configuration types and dependencies for archetype init

export type DatabaseType = 'sqlite' | 'postgres' | 'mysql'

export interface InitConfig {
  template: string  // Template ID from registry
  database: DatabaseType
  auth: boolean
  i18n: string[] | null
  includeExamples: boolean
}

// Core dependencies (always installed)
export const coreDependencies = [
  '@trpc/server',
  '@trpc/client',
  '@trpc/react-query',
  '@tanstack/react-query',
  'drizzle-orm',
  'zod',
  'react-hook-form',
  '@hookform/resolvers',
]

// Dev dependencies (always installed)
export const coreDevDependencies = [
  'drizzle-kit',
]

// Database-specific dependencies
export const databaseDependencies: Record<DatabaseType, { deps: string[]; devDeps: string[] }> = {
  sqlite: {
    deps: ['better-sqlite3'],
    devDeps: ['@types/better-sqlite3'],
  },
  postgres: {
    deps: ['postgres'],
    devDeps: [],
  },
  mysql: {
    deps: ['mysql2'],
    devDeps: [],
  },
}

// Get all dependencies for a given config
export function getDependencies(config: InitConfig): { deps: string[]; devDeps: string[] } {
  const deps = [...coreDependencies]
  const devDeps = [...coreDevDependencies]

  // Add database-specific deps
  const dbDeps = databaseDependencies[config.database]
  deps.push(...dbDeps.deps)
  devDeps.push(...dbDeps.devDeps)

  return { deps, devDeps }
}

// Get recommended config - template comes from registry
export function getRecommendedConfig(templateId: string): InitConfig {
  return {
    template: templateId,
    database: 'sqlite',
    auth: false,
    i18n: null,
    includeExamples: true,
  }
}
