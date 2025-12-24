#!/usr/bin/env node

/**
 * MCP Server for Archetype Engine
 * 
 * Provides tools for Claude Desktop, Claude Code, Cursor, and other MCP clients
 * to generate backends from entity descriptions.
 * 
 * Usage:
 *   npx archetype-engine mcp
 */

import * as fs from 'fs'
import * as path from 'path'
import { parseManifestJSON } from './json/parser'
import { validateManifest } from './validation'
import { getTemplate, runTemplate } from './template'
import type { ManifestJSON, EntityJSON } from './json/types'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface MCPRequest {
  method: string
  params?: {
    name?: string
    arguments?: Record<string, any>
  }
}

interface MCPResponse {
  content: Array<{
    type: 'text'
    text: string
  }>
}

/**
 * Handle archetype_create_manifest tool
 */
async function handleCreateManifest(args: {
  entities: EntityJSON[]
  database: ManifestJSON['database']
  auth?: ManifestJSON['auth']
}): Promise<MCPResponse> {
  const manifest: ManifestJSON = {
    entities: args.entities,
    database: args.database,
    auth: args.auth,
    template: 'nextjs-drizzle-trpc'
  }

  // Validate first
  const validation = validateManifest(manifest)
  if (!validation.valid) {
    const errors = validation.errors.map(e => `[${e.code}] ${e.path}: ${e.message}`).join('\n')
    return {
      content: [{
        type: 'text',
        text: `❌ Validation failed:\n\n${errors}\n\n${validation.errors.map(e => e.suggestion).filter(Boolean).join('\n')}`
      }]
    }
  }

  // Write manifest.json
  const manifestPath = path.join(process.cwd(), 'manifest.json')
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

  return {
    content: [{
      type: 'text',
      text: `✅ Created manifest.json with ${args.entities.length} entities\n\nNext steps:\n1. Review manifest.json\n2. Run: npx archetype generate manifest.json\n3. Run: npx drizzle-kit push && npm run dev`
    }]
  }
}

/**
 * Handle archetype_validate_manifest tool
 */
async function handleValidate(args: { manifestPath?: string }): Promise<MCPResponse> {
  const manifestPath = path.resolve(args.manifestPath || 'manifest.json')
  
  if (!fs.existsSync(manifestPath)) {
    return {
      content: [{
        type: 'text',
        text: `❌ Manifest not found: ${manifestPath}`
      }]
    }
  }

  const content = fs.readFileSync(manifestPath, 'utf-8')
  const manifest: ManifestJSON = JSON.parse(content)
  const validation = validateManifest(manifest)

  if (validation.valid) {
    const warnings = validation.warnings.length > 0 
      ? `\n\nWarnings:\n${validation.warnings.map(w => `  - [${w.code}] ${w.message}`).join('\n')}`
      : ''
    
    return {
      content: [{
        type: 'text',
        text: `✅ Manifest is valid!${warnings}\n\nReady to generate with: npx archetype generate ${manifestPath}`
      }]
    }
  } else {
    const errors = validation.errors.map(e => 
      `  - [${e.code}] ${e.path}: ${e.message}${e.suggestion ? `\n    Fix: ${e.suggestion}` : ''}`
    ).join('\n')
    
    return {
      content: [{
        type: 'text',
        text: `❌ Validation failed:\n\n${errors}`
      }]
    }
  }
}

/**
 * Handle archetype_generate tool
 */
async function handleGenerate(args: { manifestPath?: string }): Promise<MCPResponse> {
  const manifestPath = path.resolve(args.manifestPath || 'manifest.json')
  
  if (!fs.existsSync(manifestPath)) {
    return {
      content: [{
        type: 'text',
        text: `❌ Manifest not found: ${manifestPath}`
      }]
    }
  }

  const content = fs.readFileSync(manifestPath, 'utf-8')
  const manifest: ManifestJSON = JSON.parse(content)
  
  // Validate
  const validation = validateManifest(manifest)
  if (!validation.valid) {
    const errors = validation.errors.map(e => `[${e.code}] ${e.message}`).join('\n')
    return {
      content: [{
        type: 'text',
        text: `❌ Validation failed:\n\n${errors}\n\nRun: npx archetype validate ${manifestPath}`
      }]
    }
  }

  // Parse and generate
  const ir = parseManifestJSON(manifest)
  const template = await getTemplate('nextjs-drizzle-trpc')
  
  if (!template) {
    return {
      content: [{
        type: 'text',
        text: '❌ Template not found'
      }]
    }
  }

  const files = await runTemplate(template, ir)
  const fileList = files.map(f => f.path).join('\n  - ')

  return {
    content: [{
      type: 'text',
      text: `✅ Generated ${files.length} files:\n  - ${fileList}\n\nNext steps:\n1. Run: npx drizzle-kit push\n2. Run: npm run dev`
    }]
  }
}

/**
 * Handle archetype_view_schema tool
 */
async function handleViewSchema(args: { configPath?: string }): Promise<MCPResponse> {
  const configPath = args.configPath || 'manifest.json'
  
  try {
    const { stdout } = await execAsync(`npx archetype view ${configPath}`)
    return {
      content: [{
        type: 'text',
        text: `✅ Opening ERD viewer in browser...\n\n${stdout}`
      }]
    }
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `❌ Failed to open viewer: ${error.message}`
      }]
    }
  }
}

/**
 * Handle archetype_generate_from_description tool
 * This is a convenience wrapper that uses AI to convert natural language to manifest
 */
async function handleGenerateFromDescription(args: {
  description: string
  database?: 'sqlite' | 'postgres' | 'mysql'
  outputDir?: string
}): Promise<MCPResponse> {
  return {
    content: [{
      type: 'text',
      text: `⚠️  This tool requires an AI model to convert the description to entities.\n\nInstead, I recommend:\n1. Use archetype_create_manifest to define entities explicitly\n2. Or create manifest.json manually based on: ${args.description}\n\nExample entities for "${args.description}":\n- Identify the main data types (User, Post, Product, etc.)\n- Define fields for each entity\n- Add relations between entities\n\nThen use archetype_create_manifest with the entity definitions.`
    }]
  }
}

/**
 * Main MCP server loop
 */
export async function runMCPServer() {
  const stdin = process.stdin
  const stdout = process.stdout

  stdin.setEncoding('utf-8')

  let buffer = ''

  stdin.on('data', async (chunk) => {
    buffer += chunk

    // Process complete JSON messages
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.trim()) continue

      try {
        const request: MCPRequest = JSON.parse(line)

        if (request.method === 'tools/call' && request.params) {
          const toolName = request.params.name
          const args = request.params.arguments || {}

          let response: MCPResponse

          switch (toolName) {
            case 'archetype_create_manifest':
              response = await handleCreateManifest(args as any)
              break
            case 'archetype_validate_manifest':
              response = await handleValidate(args as any)
              break
            case 'archetype_generate':
              response = await handleGenerate(args as any)
              break
            case 'archetype_view_schema':
              response = await handleViewSchema(args as any)
              break
            case 'archetype_generate_from_description':
              response = await handleGenerateFromDescription(args as any)
              break
            default:
              response = {
                content: [{
                  type: 'text',
                  text: `Unknown tool: ${toolName}`
                }]
              }
          }

          stdout.write(JSON.stringify(response) + '\n')
        }
      } catch (error: any) {
        const errorResponse: MCPResponse = {
          content: [{
            type: 'text',
            text: `Error: ${error.message}`
          }]
        }
        stdout.write(JSON.stringify(errorResponse) + '\n')
      }
    }
  })

  stdin.on('end', () => {
    process.exit(0)
  })
}

// Run if called directly
if (require.main === module) {
  runMCPServer().catch(console.error)
}
