// Template registry - discovers and loads templates

import type { Template, TemplateMetadata } from './types'

// Template loaders - lazy import for each template
const templateLoaders: Record<string, () => Promise<Template>> = {
  'nextjs-drizzle-trpc': async () => {
    const mod = await import('../templates/nextjs-drizzle-trpc')
    return mod.default
  },
  // Future templates:
  // 'sveltekit-prisma': async () => (await import('../templates/sveltekit-prisma')).default,
}

/**
 * Get a template by ID
 */
export async function getTemplate(id: string): Promise<Template | null> {
  const loader = templateLoaders[id]
  if (!loader) return null
  return loader()
}

/**
 * List all available templates
 */
export function listTemplates(): TemplateMetadata[] {
  return [
    {
      id: 'nextjs-drizzle-trpc',
      name: 'Next.js + Drizzle + tRPC',
      description: 'Full-stack Next.js with Drizzle ORM, tRPC API, and React hooks',
      framework: 'nextjs',
      stack: {
        database: 'drizzle',
        validation: 'zod',
        api: 'trpc',
        ui: 'react',
      },
    },
  ]
}

/**
 * Check if a template exists
 */
export function hasTemplate(id: string): boolean {
  return id in templateLoaders
}

/**
 * Get default template ID
 */
export function getDefaultTemplateId(): string {
  return 'nextjs-drizzle-trpc'
}
