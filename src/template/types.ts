// Template and Generator interfaces

import type { ManifestIR } from '../manifest'
import type { GeneratorContext } from './context'

/**
 * A generated file with path and content
 */
export interface GeneratedFile {
  /** Relative path from output directory */
  path: string
  /** File content */
  content: string
}

/**
 * Generator output - single file or array of files
 */
export type GeneratorOutput = GeneratedFile | GeneratedFile[]

/**
 * A generator produces code for a specific aspect of the stack
 */
export interface Generator {
  /** Unique identifier */
  name: string
  /** Human-readable description */
  description: string
  /**
   * Generate code from the manifest
   */
  generate(manifest: ManifestIR, ctx: GeneratorContext): GeneratorOutput
}

/**
 * Template metadata for discovery and CLI
 */
export interface TemplateMetadata {
  /** Unique template ID (e.g., "nextjs-drizzle-trpc") */
  id: string
  /** Display name for CLI */
  name: string
  /** Description shown in help */
  description: string
  /** Framework this template targets */
  framework: 'nextjs' | 'sveltekit' | 'remix' | 'astro' | 'generic'
  /** Tech stack components */
  stack: {
    database: 'drizzle' | 'prisma' | 'kysely'
    validation: 'zod' | 'valibot' | 'yup'
    api?: 'trpc' | 'rest' | 'graphql'
    ui?: 'react' | 'svelte' | 'vue' | 'none'
  }
}

/**
 * Configuration for output paths and import aliases
 */
export interface TemplateConfig {
  /** Output directory (default: 'generated') */
  outputDir: string
  /** Import alias mapping (e.g., { '@/generated': './generated' }) */
  importAliases: Record<string, string>
}

/**
 * A template bundles generators for a specific tech stack
 */
export interface Template {
  /** Template metadata */
  meta: TemplateMetadata
  /** Default configuration */
  defaultConfig: TemplateConfig
  /** List of generators in execution order */
  generators: Generator[]
  /**
   * Optional hook to run after all generators complete
   */
  postGenerate?(manifest: ManifestIR, ctx: GeneratorContext): void
}
