// Archetype init - creates config + infrastructure + installs deps

import * as fs from 'fs'
import * as path from 'path'
import { spawn } from 'child_process'
import type { InitConfig } from './dependencies'
import { getRecommendedConfig, getDependencies } from './dependencies'
import { getAllTemplateFiles, getPackageJsonScripts, ProjectStructure } from './templates'
import {
  runPrompts,
  displayConfigSummary,
  displaySuccess,
  displayError,
  createSpinner,
} from './prompts'
import { listTemplates } from '../template/registry'

export interface InitOptions {
  yes?: boolean // Use recommended defaults without prompts
  template?: string // Template ID (for --yes mode or --template flag)
  directory?: string // Target directory (default: current)
}

export async function init(options: InitOptions = {}): Promise<void> {
  const targetDir = options.directory || process.cwd()

  // Check if archetype.config.ts already exists
  const configPath = path.join(targetDir, 'archetype.config.ts')
  if (fs.existsSync(configPath)) {
    displayError('archetype.config.ts already exists. Remove it first to reinitialize.')
    process.exit(1)
  }

  // Get configuration
  let config: InitConfig | null

  if (options.yes) {
    // Use specified template or first available
    const templates = listTemplates()
    if (templates.length === 0) {
      displayError('No templates available.')
      process.exit(1)
    }
    const templateId = options.template || templates[0].id
    config = getRecommendedConfig(templateId)
  } else {
    config = await runPrompts()
  }

  if (!config) {
    process.exit(0)
  }

  displayConfigSummary(config)

  const s = createSpinner()

  try {
    // Write template files
    s.start('Creating archetype config and infrastructure')
    writeTemplateFiles(targetDir, config)
    s.stop('Created archetype config and infrastructure')

    // Update package.json scripts if it exists
    const packageJsonPath = path.join(targetDir, 'package.json')
    if (fs.existsSync(packageJsonPath)) {
      s.start('Adding npm scripts')
      updatePackageJson(packageJsonPath)
      s.stop('Added npm scripts')
    }

    // Install dependencies
    s.start('Installing dependencies')
    await installDependencies(targetDir, config)
    s.stop('Installed dependencies')

    displaySuccess()
  } catch (error) {
    s.stop('Error occurred')
    displayError(error instanceof Error ? error.message : 'Unknown error')
    process.exit(1)
  }
}

/**
 * Detect project structure - whether it uses src/ directory or root-level
 * Next.js projects can have either /app or /src/app
 */
function detectProjectStructure(targetDir: string): ProjectStructure {
  // Check if src/app exists (src-based structure)
  const srcAppPath = path.join(targetDir, 'src', 'app')
  if (fs.existsSync(srcAppPath)) {
    return { useSrcDir: true }
  }

  // Check if root /app exists (root-based structure)
  const rootAppPath = path.join(targetDir, 'app')
  if (fs.existsSync(rootAppPath)) {
    return { useSrcDir: false }
  }

  // Default to src-based if neither exists (new project)
  return { useSrcDir: true }
}

function writeTemplateFiles(targetDir: string, config: InitConfig): void {
  const structure = detectProjectStructure(targetDir)
  const files = getAllTemplateFiles(config, structure)

  for (const file of files) {
    const fullPath = path.join(targetDir, file.path)
    const dir = path.dirname(fullPath)

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(fullPath, file.content, 'utf-8')
  }

  // Update existing layout.tsx to wrap children with Providers
  updateLayoutWithProviders(targetDir, structure)
}

/**
 * Update the existing layout.tsx to wrap children with Providers
 * This enables tRPC context for the entire app
 */
function updateLayoutWithProviders(targetDir: string, structure: ProjectStructure): void {
  const prefix = structure.useSrcDir ? 'src/' : ''
  const layoutPath = path.join(targetDir, `${prefix}app/layout.tsx`)

  if (!fs.existsSync(layoutPath)) return

  let content = fs.readFileSync(layoutPath, 'utf-8')

  // Skip if already has Providers
  if (content.includes('Providers')) return

  // Add import for Providers after other imports
  const importStatement = 'import { Providers } from "./providers";\n'

  // Find the last import statement and add after it
  const importRegex = /^import .+$/gm
  let lastImportMatch: RegExpExecArray | null = null
  let match: RegExpExecArray | null

  while ((match = importRegex.exec(content)) !== null) {
    lastImportMatch = match
  }

  if (lastImportMatch) {
    const insertPos = lastImportMatch.index + lastImportMatch[0].length
    content = content.slice(0, insertPos) + '\n' + importStatement + content.slice(insertPos)
  }

  // Wrap {children} with <Providers>{children}</Providers>
  // Handle both {children} and { children } patterns
  content = content.replace(
    /(\s*)\{(\s*)children(\s*)\}(\s*)/g,
    '$1<Providers>{children}</Providers>$4'
  )

  fs.writeFileSync(layoutPath, content, 'utf-8')
}

function updatePackageJson(packageJsonPath: string): void {
  const content = fs.readFileSync(packageJsonPath, 'utf-8')
  const packageJson = JSON.parse(content)

  const scripts = getPackageJsonScripts()
  packageJson.scripts = {
    ...(packageJson.scripts as Record<string, string> || {}),
    ...scripts,
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8')
}

async function installDependencies(targetDir: string, config: InitConfig): Promise<void> {
  const { deps, devDeps } = getDependencies(config)

  // Check if archetype-engine is symlinked (npm link) before installing
  // npm install can remove manually linked packages
  const archetypeLinkPath = path.join(targetDir, 'node_modules', 'archetype-engine')
  let wasSymlinked = false
  try {
    const stat = fs.lstatSync(archetypeLinkPath)
    wasSymlinked = stat.isSymbolicLink()
  } catch {
    // Path doesn't exist, not linked
  }

  // Install production dependencies
  if (deps.length > 0) {
    await runNpmInstall(targetDir, deps, false)
  }

  // Install dev dependencies
  if (devDeps.length > 0) {
    await runNpmInstall(targetDir, devDeps, true)
  }

  // Restore npm link if it was removed by npm install
  if (wasSymlinked) {
    try {
      fs.lstatSync(archetypeLinkPath)
    } catch {
      // Link was removed, restore it
      await runNpmLink(targetDir)
    }
  }
}

function runNpmInstall(targetDir: string, packages: string[], isDev: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = ['install', ...(isDev ? ['--save-dev'] : []), ...packages]

    const child = spawn('npm', args, {
      cwd: targetDir,
      stdio: 'pipe',
    })

    let stderr = ''

    child.stderr?.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`npm install failed: ${stderr}`))
      }
    })

    child.on('error', (error) => {
      reject(error)
    })
  })
}

function runNpmLink(targetDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['link', 'archetype-engine'], {
      cwd: targetDir,
      stdio: 'pipe',
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        // Non-fatal - user can manually run npm link
        resolve()
      }
    })

    child.on('error', () => {
      // Non-fatal
      resolve()
    })
  })
}

export { getRecommendedConfig } from './dependencies'
export type { InitConfig } from './dependencies'
