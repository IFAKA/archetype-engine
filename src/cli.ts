#!/usr/bin/env node

import * as fs from 'fs'
import * as path from 'path'
import * as http from 'http'
import { exec } from 'child_process'
import { ManifestIR } from './manifest'
import { generateERDFromIR, saveERDFromIR } from './generators/erd-ir'
import { init } from './init'
import { getTemplate, listTemplates, runTemplate } from './template'

const command = process.argv[2]
const configPath = process.argv[3] || 'archetype.config.ts'

// Parse CLI flags
const args = process.argv.slice(2)
const templateArg = args.find(a => a.startsWith('--template='))
const templateOverride = templateArg?.split('=')[1]
const yesFlag = args.includes('--yes') || args.includes('-y')

/**
 * Load manifest from TypeScript config file
 */
function loadManifest(configFile: string): ManifestIR {
  const absolutePath = path.resolve(configFile)

  // Check if file exists
  if (!fs.existsSync(absolutePath)) {
    // Try common alternatives
    const alternatives = [
      'archetype.config.ts',
      'archetype.config.js',
      'archetype/index.ts',  // Legacy
      'archetype/index.js',  // Legacy
    ]

    for (const alt of alternatives) {
      const altPath = path.resolve(alt)
      if (fs.existsSync(altPath)) {
        console.log(`Using config: ${alt}`)
        return loadManifest(alt)
      }
    }

    console.error(`Config file not found: ${configFile}`)
    console.error('Run "archetype init" to create one, or create manually:')
    console.error('  - archetype.config.ts')
    process.exit(1)
  }

  // Clear require cache for fresh load
  delete require.cache[absolutePath]

  // Register TypeScript if needed
  if (absolutePath.endsWith('.ts')) {
    try {
      require('ts-node').register({
        transpileOnly: true,
        compilerOptions: {
          module: 'commonjs',
          moduleResolution: 'node',
        },
      })
    } catch {
      // ts-node should already be registered if running via ts-node
    }
  }

  // Load the module
  const module = require(absolutePath)
  const manifest = module.default || module

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

function serveERD(mermaidCode: string, port = 3333): void {
  const html = buildHTML(mermaidCode)

  const server = http.createServer((_, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(html)
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

  console.log(`Generating with template: ${templateId}`)
  console.log(`Entities: ${manifest.entities.map(e => e.name).join(', ')}`)
  console.log('')

  // Get template from registry
  const template = await getTemplate(templateId)

  if (!template) {
    console.error(`Template not found: ${templateId}`)
    console.error('')
    console.error('Available templates:')
    for (const t of listTemplates()) {
      console.error(`  - ${t.id}: ${t.description}`)
    }
    process.exit(1)
  }

  // Run template
  await runTemplate(template, manifest)

  // Generate ERD (always generate regardless of template)
  const outputDir = template.defaultConfig.outputDir
  saveERDFromIR(manifest, `${outputDir}/erd.md`)
  console.log(`  Created: ${outputDir}/erd.md`)

  console.log('')
  console.log('Generation complete!')
}

// Main CLI logic
if (command === 'generate') {
  const manifest = loadManifest(configPath)
  runGenerate(manifest).catch(err => {
    console.error('Generation failed:', err.message)
    process.exit(1)
  })
} else if (command === 'view') {
  const manifest = loadManifest(configPath)
  const erd = generateERDFromIR(manifest)
  serveERD(erd)
} else if (command === 'init') {
  // Run the TUI init flow
  init({ yes: yesFlag }).catch(err => {
    console.error('Init failed:', err.message)
    process.exit(1)
  })
} else {
  console.log('Usage:')
  console.log('  archetype init                 - Create config, infrastructure, and install deps')
  console.log('  archetype init --yes           - Quick setup with defaults')
  console.log('  archetype generate [config]    - Generate code from entities')
  console.log('  archetype view [config]        - View ERD diagram in browser')
  console.log('')
  console.log('Config defaults to archetype.config.ts')
  console.log('')
  console.log('Available templates:')
  for (const t of listTemplates()) {
    console.log(`  - ${t.id}: ${t.description}`)
  }
}
