// Template runner - orchestrates generators and writes files

import * as fs from 'fs'
import * as path from 'path'
import type { ManifestIR } from '../manifest'
import type { Template, GeneratedFile } from './types'
import { createContext } from './context'

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

  // Run each generator
  for (const generator of template.generators) {
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
