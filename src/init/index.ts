// Archetype init - creates config + infrastructure + installs deps

import * as fs from 'fs'
import * as path from 'path'
import { spawn } from 'child_process'
import type { InitConfig } from './dependencies'
import { getRecommendedConfig, getDependencies } from './dependencies'
import { getAllTemplateFiles, getPackageJsonScripts } from './templates'
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

function writeTemplateFiles(targetDir: string, config: InitConfig): void {
  const files = getAllTemplateFiles(config)

  for (const file of files) {
    const fullPath = path.join(targetDir, file.path)
    const dir = path.dirname(fullPath)

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(fullPath, file.content, 'utf-8')
  }
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

  // Install production dependencies
  if (deps.length > 0) {
    await runNpmInstall(targetDir, deps, false)
  }

  // Install dev dependencies
  if (devDeps.length > 0) {
    await runNpmInstall(targetDir, devDeps, true)
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

export { getRecommendedConfig } from './dependencies'
export type { InitConfig } from './dependencies'
