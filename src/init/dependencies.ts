// Configuration types and dependencies for archetype init

export type DatabaseType = 'sqlite' | 'postgres' | 'mysql'
export type ModeType = 'full' | 'headless'

export interface InitConfig {
  template: string  // Template ID from registry
  mode: ModeType    // Full (with DB) or headless (external APIs)
  database?: DatabaseType  // Optional - only for full mode
  externalApiUrl?: string  // Optional - for headless mode
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

// Headless mode dependencies (no DB, external APIs)
export const headlessDependencies = [
  '@trpc/server',
  '@trpc/client',
  '@trpc/react-query',
  '@tanstack/react-query',
  'zod',
  'react-hook-form',
  '@hookform/resolvers',
]

// Get all dependencies for a given config
export function getDependencies(config: InitConfig): { deps: string[]; devDeps: string[] } {
  // Headless mode - no database deps
  if (config.mode === 'headless') {
    return {
      deps: [...headlessDependencies],
      devDeps: [],
    }
  }

  // Full mode - include database deps
  const deps = [...coreDependencies]
  const devDeps = [...coreDevDependencies]

  // Add database-specific deps
  if (config.database) {
    const dbDeps = databaseDependencies[config.database]
    deps.push(...dbDeps.deps)
    devDeps.push(...dbDeps.devDeps)
  }

  return { deps, devDeps }
}

// Get recommended config - template comes from registry
export function getRecommendedConfig(templateId: string, mode: ModeType = 'full'): InitConfig {
  if (mode === 'headless') {
    return {
      template: templateId,
      mode: 'headless',
      externalApiUrl: 'env:API_URL',
      auth: false,
      i18n: null,
      includeExamples: true,
    }
  }

  return {
    template: templateId,
    mode: 'full',
    database: 'sqlite',
    auth: false,
    i18n: null,
    includeExamples: true,
  }
}
