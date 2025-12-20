#!/usr/bin/env node

import * as fs from 'fs'
import * as path from 'path'
import * as http from 'http'
import { exec } from 'child_process'
import { createRequire } from 'module'
import { ManifestIR } from './manifest'
import { generateERDFromIR, saveERDFromIR } from './generators/erd-ir'
import { init } from './init'
import { getTemplate, listTemplates, runTemplate } from './template'
import { parseManifestJSON } from './json/parser'
import { validateManifest, ValidationResult } from './validation'
import { ManifestJSON } from './json/types'

const command = process.argv[2]
// Find config path - first non-flag argument after command
const args = process.argv.slice(2)
const configPath = args.find(a => a !== command && !a.startsWith('-')) || 'archetype.config.ts'

// Parse CLI flags
const templateArg = args.find(a => a.startsWith('--template='))
const templateOverride = templateArg?.split('=')[1]
const yesFlag = args.includes('--yes') || args.includes('-y')
const headlessFlag = args.includes('--headless')
const jsonOutputFlag = args.includes('--json') || args.includes('--output=json')
const stdinFlag = args.includes('--stdin')

/**
 * Output helper - formats output based on --json flag
 */
function output(data: unknown): void {
  if (jsonOutputFlag) {
    console.log(JSON.stringify(data, null, 2))
  } else if (typeof data === 'string') {
    console.log(data)
  } else {
    console.log(data)
  }
}

/**
 * Error output helper
 */
function errorOutput(message: string, data?: Record<string, unknown>): void {
  if (jsonOutputFlag) {
    console.log(JSON.stringify({ success: false, error: message, ...data }, null, 2))
  } else {
    console.error(message)
  }
}

/**
 * Read JSON manifest from stdin
 */
async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', chunk => { data += chunk })
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', reject)
  })
}

/**
 * Load manifest from JSON file or string
 */
function loadManifestFromJSON(jsonContent: string): ManifestIR {
  try {
    return parseManifestJSON(jsonContent)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (jsonOutputFlag) {
      errorOutput('Failed to parse JSON manifest', { parseError: message })
      process.exit(1)
    }
    console.error('Failed to parse JSON manifest:', message)
    process.exit(1)
  }
}

/**
 * Load manifest from TypeScript config file or JSON file
 */
function loadManifest(configFile: string): ManifestIR {
  const absolutePath = path.resolve(configFile)

  // Check if file exists
  if (!fs.existsSync(absolutePath)) {
    // Try common alternatives
    const alternatives = [
      'archetype.config.ts',
      'archetype.config.js',
      'manifest.json',
      'archetype.json',
      'archetype/index.ts',  // Legacy
      'archetype/index.js',  // Legacy
    ]

    for (const alt of alternatives) {
      const altPath = path.resolve(alt)
      if (fs.existsSync(altPath)) {
        if (!jsonOutputFlag) console.log(`Using config: ${alt}`)
        return loadManifest(alt)
      }
    }

    if (jsonOutputFlag) {
      errorOutput(`Config file not found: ${configFile}`)
      process.exit(1)
    }
    console.error(`Config file not found: ${configFile}`)
    console.error('Run "archetype init" to create one, or create manually:')
    console.error('  - archetype.config.ts (TypeScript)')
    console.error('  - manifest.json (JSON for AI agents)')
    process.exit(1)
  }

  // If it's a JSON file, use JSON parser
  if (absolutePath.endsWith('.json')) {
    const content = fs.readFileSync(absolutePath, 'utf-8')
    return loadManifestFromJSON(content)
  }

  // Get the config file's directory for module resolution
  const configDir = path.dirname(absolutePath)

  // Create a require function rooted in the project directory
  // This ensures npm link and local dependencies are resolved correctly
  const projectRequire = createRequire(path.join(configDir, 'package.json'))

  // Clear require cache for fresh load
  delete projectRequire.cache[absolutePath]

  // Register TypeScript if needed
  if (absolutePath.endsWith('.ts')) {
    try {
      // Use the project's ts-node if available, fall back to ours
      let tsNode
      try {
        tsNode = projectRequire('ts-node')
      } catch {
        tsNode = require('ts-node')
      }
      tsNode.register({
        transpileOnly: true,
        cwd: configDir,
        compilerOptions: {
          module: 'commonjs',
          moduleResolution: 'node',
        },
      })
    } catch {
      // ts-node should already be registered if running via ts-node
    }
  }

  // Load the module using the project-rooted require
  const loadedModule = projectRequire(absolutePath)
  const manifest = loadedModule.default || loadedModule

  if (!manifest.entities) {
    console.error('Invalid manifest: missing "entities" property')
    console.error('Make sure your config exports a manifest created with defineManifest()')
    process.exit(1)
  }

  return manifest
}

function openBrowser(url: string): void {
  const cmd = process.platform === 'darwin'
    ? 'open'
    : process.platform === 'win32'
      ? 'start'
      : 'xdg-open'
  exec(`${cmd} "${url}"`)
}

function serveERD(mermaidCode: string, port = 3333, maxAttempts = 10): void {
  const html = buildHTML(mermaidCode)

  const server = http.createServer((_, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(html)
  })

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = port + 1
      if (nextPort - 3333 < maxAttempts) {
        console.log(`Port ${port} is in use, trying ${nextPort}...`)
        serveERD(mermaidCode, nextPort, maxAttempts)
      } else {
        console.error(`Could not find an available port (tried ${3333}-${port})`)
        console.error('Try killing the process using the port:')
        console.error(`  lsof -i :3333 | grep LISTEN | awk '{print $2}' | xargs kill -9`)
        process.exit(1)
      }
    } else {
      console.error('Server error:', err.message)
      process.exit(1)
    }
  })

  server.listen(port, () => {
    console.log(`http://localhost:${port}`)
    console.log('Ctrl+C to stop')
    openBrowser(`http://localhost:${port}`)
  })
}

function buildHTML(mermaidCode: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ERD Viewer</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/panzoom@9/dist/panzoom.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0d1117;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }
    #container {
      width: 100%;
      height: 100%;
    }
    #diagram {
      display: inline-block;
      padding: 48px;
    }
    #diagram svg {
      display: block;
    }
  </style>
</head>
<body>
  <div id="container">
    <div id="diagram">
      <pre class="mermaid">${mermaidCode}</pre>
    </div>
  </div>
  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: 'dark',
      er: { useMaxWidth: false }
    });

    window.addEventListener('load', () => {
      setTimeout(() => {
        const diagram = document.getElementById('diagram');
        const rect = diagram.getBoundingClientRect();

        const padding = 64;
        const scaleX = (window.innerWidth - padding * 2) / rect.width;
        const scaleY = (window.innerHeight - padding * 2) / rect.height;
        const scale = Math.min(scaleX, scaleY, 1);

        const instance = panzoom(diagram, {
          maxZoom: 5,
          minZoom: 0.05,
          bounds: false
        });

        instance.zoomAbs(0, 0, scale);

        setTimeout(() => {
          const newRect = diagram.getBoundingClientRect();
          const x = (window.innerWidth - newRect.width) / 2;
          const y = (window.innerHeight - newRect.height) / 2;
          instance.moveTo(x, y);
        }, 50);
      }, 300);
    });
  </script>
</body>
</html>`
}

async function runGenerate(manifest: ManifestIR): Promise<void> {
  // Determine template: CLI flag > config > error
  const templateId = templateOverride || manifest.template

  if (!templateId) {
    if (jsonOutputFlag) {
      errorOutput('No template specified', {
        suggestion: 'Add template to config or use --template flag',
        availableTemplates: listTemplates().map(t => t.id),
      })
      process.exit(1)
    }
    console.error('No template specified.')
    console.error('')
    console.error('Either:')
    console.error('  1. Set "template" in archetype.config.ts')
    console.error('  2. Use --template flag: archetype generate --template=nextjs-drizzle-trpc')
    console.error('')
    console.error('Available templates:')
    for (const t of listTemplates()) {
      console.error(`  - ${t.id}: ${t.description}`)
    }
    process.exit(1)
  }

  if (!jsonOutputFlag) {
    console.log(`Generating with template: ${templateId}`)
    console.log(`Entities: ${manifest.entities.map(e => e.name).join(', ')}`)
    console.log('')
  }

  // Get template from registry
  const template = await getTemplate(templateId)

  if (!template) {
    if (jsonOutputFlag) {
      errorOutput(`Template not found: ${templateId}`, {
        availableTemplates: listTemplates().map(t => t.id),
      })
      process.exit(1)
    }
    console.error(`Template not found: ${templateId}`)
    console.error('')
    console.error('Available templates:')
    for (const t of listTemplates()) {
      console.error(`  - ${t.id}: ${t.description}`)
    }
    process.exit(1)
  }

  // Run template and collect generated files
  const generatedFiles = await runTemplate(template, manifest, { dryRun: false })

  // Generate ERD (always generate regardless of template)
  const outputDir = template.defaultConfig.outputDir
  saveERDFromIR(manifest, `${outputDir}/erd.md`)

  if (jsonOutputFlag) {
    // Output structured JSON result
    const files = generatedFiles.map(f => f.path)
    files.push(`${outputDir}/erd.md`)
    output({
      success: true,
      template: templateId,
      entities: manifest.entities.map(e => e.name),
      files,
    })
  } else {
    console.log(`  Created: ${outputDir}/erd.md`)
    console.log('')
    console.log('Generation complete!')
  }
}

/**
 * Run validation command
 */
async function runValidate(manifest: ManifestJSON): Promise<void> {
  const result = validateManifest(manifest)

  if (jsonOutputFlag) {
    output(result)
  } else {
    if (result.valid) {
      console.log('Manifest is valid!')
      if (result.warnings.length > 0) {
        console.log('')
        console.log('Warnings:')
        for (const w of result.warnings) {
          console.log(`  - [${w.code}] ${w.path}: ${w.message}`)
          if (w.suggestion) console.log(`    Fix: ${w.suggestion}`)
        }
      }
    } else {
      console.error('Validation failed!')
      console.error('')
      console.error('Errors:')
      for (const e of result.errors) {
        console.error(`  - [${e.code}] ${e.path}: ${e.message}`)
        if (e.suggestion) console.error(`    Fix: ${e.suggestion}`)
      }
      if (result.warnings.length > 0) {
        console.error('')
        console.error('Warnings:')
        for (const w of result.warnings) {
          console.error(`  - [${w.code}] ${w.path}: ${w.message}`)
          if (w.suggestion) console.error(`    Fix: ${w.suggestion}`)
        }
      }
    }
  }

  process.exit(result.valid ? 0 : 1)
}

/**
 * Load JSON manifest for validation (doesn't convert to IR yet)
 */
function loadJSONManifest(configFile: string): ManifestJSON {
  const absolutePath = path.resolve(configFile)

  if (!fs.existsSync(absolutePath)) {
    if (jsonOutputFlag) {
      errorOutput(`File not found: ${configFile}`)
      process.exit(1)
    }
    console.error(`File not found: ${configFile}`)
    process.exit(1)
  }

  // For JSON files, parse and return
  if (absolutePath.endsWith('.json')) {
    const content = fs.readFileSync(absolutePath, 'utf-8')
    try {
      return JSON.parse(content) as ManifestJSON
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      if (jsonOutputFlag) {
        errorOutput('Failed to parse JSON', { parseError: message })
        process.exit(1)
      }
      console.error('Failed to parse JSON:', message)
      process.exit(1)
    }
  }

  // For TypeScript files, load and convert to JSON-like structure
  // (validation works on the JSON structure, not the IR)
  const manifest = loadManifest(configFile)

  // Convert IR back to JSON-like structure for validation
  return {
    entities: manifest.entities.map(e => ({
      name: e.name,
      fields: Object.fromEntries(
        Object.entries(e.fields).map(([name, field]) => [
          name,
          { type: field.type, required: field.required, unique: field.unique }
        ])
      ),
      relations: Object.fromEntries(
        Object.entries(e.relations).map(([name, rel]) => [
          name,
          { type: rel.type, entity: rel.entity, field: rel.field }
        ])
      ),
      behaviors: e.behaviors,
      auth: e.auth,
      protected: e.protected,
    })),
    database: manifest.database,
    mode: manifest.mode.type,
    auth: manifest.auth,
    template: manifest.template,
  } as ManifestJSON
}

// Main CLI logic
async function main() {
  if (command === 'generate') {
    let manifest: ManifestIR

    if (stdinFlag) {
      // Read from stdin
      const jsonContent = await readStdin()
      manifest = loadManifestFromJSON(jsonContent)
    } else {
      manifest = loadManifest(configPath)
    }

    await runGenerate(manifest)
  } else if (command === 'validate') {
    let manifestJSON: ManifestJSON

    if (stdinFlag) {
      // Read from stdin
      const jsonContent = await readStdin()
      try {
        manifestJSON = JSON.parse(jsonContent) as ManifestJSON
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        errorOutput('Failed to parse JSON from stdin', { parseError: message })
        process.exit(1)
      }
    } else {
      manifestJSON = loadJSONManifest(configPath)
    }

    await runValidate(manifestJSON)
  } else if (command === 'view') {
    const manifest = loadManifest(configPath)
    const erd = generateERDFromIR(manifest)
    serveERD(erd)
  } else if (command === 'init') {
    // Run the TUI init flow
    await init({ yes: yesFlag, headless: headlessFlag })
  } else {
    console.log('Usage:')
    console.log('  archetype init                 - Interactive setup with prompts')
    console.log('  archetype init --yes           - Quick setup with defaults (full mode)')
    console.log('  archetype init --headless      - Quick setup for headless mode (no database)')
    console.log('  archetype generate [config]    - Generate code from entities')
    console.log('  archetype validate [config]    - Validate manifest without generating')
    console.log('  archetype view [config]        - View ERD diagram in browser')
    console.log('')
    console.log('Flags:')
    console.log('  --json                         - Output as JSON (for AI agents)')
    console.log('  --stdin                        - Read JSON manifest from stdin')
    console.log('  --template=<id>                - Override template')
    console.log('')
    console.log('Config defaults to archetype.config.ts or manifest.json')
    console.log('')
    console.log('Available templates:')
    for (const t of listTemplates()) {
      console.log(`  - ${t.id}: ${t.description}`)
    }
  }
}

main().catch(err => {
  if (jsonOutputFlag) {
    errorOutput(err.message || 'Unknown error')
  } else {
    console.error('Error:', err.message || err)
  }
  process.exit(1)
})
