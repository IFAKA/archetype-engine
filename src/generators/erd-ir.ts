import * as fs from 'fs'
import { ManifestIR } from '../manifest'
import { EntityIR } from '../entity'
import { RelationType } from '../relations'

/**
 * Generate a Mermaid ERD diagram from the manifest IR.
 */
export function generateERDFromIR(manifest: ManifestIR): string {
  const lines: string[] = ['erDiagram']

  for (const entity of manifest.entities) {
    // Entity block
    lines.push(`    ${entity.name} {`)
    lines.push(`        string id PK`)

    // Fields
    for (const [name, config] of Object.entries(entity.fields)) {
      const type = mapFieldType(config.type)
      const constraints: string[] = []
      if (config.required) constraints.push('required')
      if (config.unique) constraints.push('unique')
      const annotation = constraints.length > 0 ? `"${constraints.join(', ')}"` : ''
      lines.push(`        ${type} ${name} ${annotation}`.trimEnd())
    }

    // Add timestamps if enabled
    if (entity.behaviors.timestamps) {
      lines.push(`        string createdAt`)
      lines.push(`        string updatedAt`)
    }

    // Add soft delete field if enabled
    if (entity.behaviors.softDelete) {
      lines.push(`        string deletedAt`)
    }

    lines.push(`    }`)
  }

  // Relations
  for (const entity of manifest.entities) {
    for (const [relName, rel] of Object.entries(entity.relations)) {
      const symbol = getRelationSymbol(rel.type)
      lines.push(`    ${entity.name} ${symbol} ${rel.entity} : ${relName}`)
    }
  }

  return lines.join('\n')
}

/**
 * Map internal field types to Mermaid ERD types.
 */
function mapFieldType(type: string): string {
  switch (type) {
    case 'text':
      return 'string'
    case 'number':
      return 'int'  // Mermaid uses int/float, we default to int
    case 'boolean':
      return 'boolean'
    case 'date':
      return 'datetime'
    default:
      return 'string'
  }
}

function getRelationSymbol(type: RelationType): string {
  switch (type) {
    case 'hasOne':
      return '||--||'
    case 'hasMany':
      return '||--o{'
    case 'belongsToMany':
      return '}o--o{'
    default:
      return '--'
  }
}

/**
 * Generate and save the ERD to a file.
 */
export function saveERDFromIR(
  manifest: ManifestIR,
  outputPath: string = 'generated/erd.md'
): void {
  const erd = generateERDFromIR(manifest)
  const content = `# Entity Relationship Diagram\n\n\`\`\`mermaid\n${erd}\n\`\`\`\n`

  const dir = outputPath.substring(0, outputPath.lastIndexOf('/'))
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(outputPath, content)
}
