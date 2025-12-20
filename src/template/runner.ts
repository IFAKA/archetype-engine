// Template runner - orchestrates generators and writes files

import * as fs from 'fs'
import * as path from 'path'
import type { ManifestIR, ModeConfig } from '../manifest'
import type { Template, GeneratedFile, Generator } from './types'
import { createContext } from './context'

/**
 * Generator names that should be skipped in headless mode
 */
const SKIP_IN_HEADLESS = ['drizzle-schema']

/**
 * Generator name mapping to include categories
 */
const GENERATOR_CATEGORIES: Record<string, string> = {
  'drizzle-schema': 'schema',
  'zod-schemas': 'validation',
  'trpc-routers': 'api',
  'react-hooks': 'hooks',
  'i18n': 'i18n',
  'service-layer': 'services',
}

/**
 * Check if a generator should run based on mode
 */
function shouldRunGenerator(generator: Generator, mode: ModeConfig): boolean {
  const name = generator.name

  // Full mode runs everything
  if (mode.type === 'full') {
    return true
  }

  // Headless mode skips database-related generators
  if (mode.type === 'headless') {
    if (SKIP_IN_HEADLESS.includes(name)) {
      return false
    }

    // If include list is specified, check if generator category is included
    if (mode.include) {
      const category = GENERATOR_CATEGORIES[name]
      // If we don't know the category, include it by default
      if (!category) return true
      return mode.include.includes(category as any)
    }

    return true
  }

  // API-only mode runs schema, validation, and API generators
  if (mode.type === 'api-only') {
    const category = GENERATOR_CATEGORIES[name]
    const apiOnlyCategories = ['schema', 'validation', 'api', 'services']
    if (!category) return true
    return apiOnlyCategories.includes(category)
  }

  return true
}

/**
 * Run a template against a manifest and write output files
 */
export async function runTemplate(
  template: Template,
  manifest: ManifestIR,
  options: { dryRun?: boolean } = {}
): Promise<GeneratedFile[]> {
  const config = template.defaultConfig
  const ctx = createContext(manifest, config)
  const allFiles: GeneratedFile[] = []
  const mode = manifest.mode

  // Filter generators based on mode
  const activeGenerators = template.generators.filter(g => shouldRunGenerator(g, mode))

  // Log mode info
  console.log(`  Mode: ${mode.type}`)

  // Run each active generator
  for (const generator of activeGenerators) {
    console.log(`  Running ${generator.name}...`)

    const result = generator.generate(manifest, ctx)
    const files = Array.isArray(result) ? result : [result]
    allFiles.push(...files)
  }

  // Run post-generate hook if defined
  if (template.postGenerate) {
    template.postGenerate(manifest, ctx)
  }

  // Write files (unless dry run)
  if (!options.dryRun) {
    for (const file of allFiles) {
      const fullPath = path.join(config.outputDir, file.path)
      ensureDir(path.dirname(fullPath))
      fs.writeFileSync(fullPath, file.content)
      console.log(`  Created: ${fullPath}`)
    }
  }

  return allFiles
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}
