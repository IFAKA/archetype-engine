/**
 * Seed Data Generator
 *
 * Generates realistic seed data for development and testing.
 * Creates seed functions for each entity with smart mock data based on field types.
 *
 * Generated files:
 * - seeds/{entity}.ts - Individual entity seed functions
 * - seeds/index.ts - Main orchestrator handling dependencies
 * - seeds/run.ts - CLI script to run seeds
 *
 * Features:
 * - Smart field-to-data mapping (email → valid emails, name → person names)
 * - Respects validation constraints (min/max, enum values)
 * - Handles entity dependencies (creates in correct order)
 * - Configurable quantities
 * - Optional faker.js integration for realistic data
 * - Database reset utilities
 *
 * @module generators/seed
 */

import type { Generator, GeneratedFile } from '../../../template/types'
import type { GeneratorContext } from '../../../template/context'
import type { ManifestIR } from '../../../manifest'
import type { EntityIR } from '../../../entity'
import type { FieldConfig } from '../../../fields'
import { toCamelCase, toSnakeCase, pluralize } from '../../../core/utils'

/**
 * Generate mock value for a field
 */
function generateMockValue(fieldName: string, field: FieldConfig, index: number): string {
  const lowerName = fieldName.toLowerCase()
  
  switch (field.type) {
    case 'text':
      // Email fields
      if (field.validations.some(v => v.type === 'email')) {
        return `faker ? faker.internet.email() : \`user\${i}@example.com\``
      }
      
      // URL fields
      if (field.validations.some(v => v.type === 'url')) {
        return `faker ? faker.internet.url() : \`https://example.com/\${i}\``
      }
      
      // Name fields
      if (lowerName.includes('name') || lowerName === 'title') {
        if (lowerName.includes('first')) {
          return `faker ? faker.person.firstName() : \`FirstName\${i}\``
        }
        if (lowerName.includes('last')) {
          return `faker ? faker.person.lastName() : \`LastName\${i}\``
        }
        if (lowerName.includes('full') || lowerName === 'name') {
          return `faker ? faker.person.fullName() : \`Sample Name \${i}\``
        }
        if (lowerName === 'title') {
          return `faker ? faker.lorem.sentence(5) : \`Sample Title \${i}\``
        }
      }
      
      // Content/description fields
      if (lowerName.includes('content') || lowerName.includes('description') || lowerName.includes('bio')) {
        return `faker ? faker.lorem.paragraphs(2) : \`Sample ${fieldName} content for record \${i}\``
      }
      
      // Address fields
      if (lowerName.includes('address')) {
        return `faker ? faker.location.streetAddress() : \`\${i} Main Street\``
      }
      if (lowerName.includes('city')) {
        return `faker ? faker.location.city() : \`City\${i}\``
      }
      if (lowerName.includes('country')) {
        return `faker ? faker.location.country() : \`Country\${i}\``
      }
      
      // Phone fields
      if (lowerName.includes('phone')) {
        return `faker ? faker.phone.number() : \`+1-555-\${1000 + i}\``
      }
      
      // Slug fields
      if (lowerName.includes('slug')) {
        return `faker ? faker.helpers.slugify(faker.lorem.words(3)).toLowerCase() : \`slug-\${i}\``
      }
      
      // Enum fields
      if ((field as any).enumValues) {
        const values = (field as any).enumValues
        return `faker ? faker.helpers.arrayElement(${JSON.stringify(values)}) : ${JSON.stringify(values)}[i % ${values.length}]`
      }
      
      // Generic text with min length
      const minLength = field.validations.find(v => v.type === 'minLength')?.value as number
      if (minLength) {
        return `faker ? faker.lorem.words(${Math.ceil(minLength / 5)}) : \`${'x'.repeat(minLength)}\${i}\``
      }
      
      // Default text
      return `faker ? faker.lorem.words(3) : \`Sample ${fieldName} \${i}\``
    
    case 'number':
      const min = (field.validations.find(v => v.type === 'min')?.value as number) ?? 0
      const max = (field.validations.find(v => v.type === 'max')?.value as number) ?? 1000
      const isInteger = field.validations.some(v => v.type === 'integer')
      
      if (lowerName.includes('age')) {
        return `faker ? faker.number.int({ min: ${min || 18}, max: ${max || 100} }) : ${min || 18} + (i % ${(max || 100) - (min || 18)})`
      }
      if (lowerName.includes('price') || lowerName.includes('amount')) {
        return `faker ? faker.number.float({ min: ${min}, max: ${max}, precision: 0.01 }) : ${min} + (i * 10)`
      }
      if (lowerName.includes('count') || lowerName.includes('quantity')) {
        return `faker ? faker.number.int({ min: ${min}, max: ${max} }) : i % ${max || 100}`
      }
      
      if (isInteger) {
        return `faker ? faker.number.int({ min: ${min}, max: ${max} }) : ${min} + (i % ${max - min})`
      } else {
        return `faker ? faker.number.float({ min: ${min}, max: ${max} }) : ${min} + (i * 0.5)`
      }
    
    case 'boolean':
      if (lowerName.includes('active') || lowerName.includes('enabled')) {
        return `i % 3 !== 0` // 66% true
      }
      if (lowerName.includes('published')) {
        return `i % 2 === 0` // 50% true
      }
      return `faker ? faker.datatype.boolean() : i % 2 === 0`
    
    case 'date':
      if (lowerName.includes('birth')) {
        return `faker ? faker.date.birthdate() : new Date(1990 + (i % 30), i % 12, 1 + (i % 28))`
      }
      return `faker ? faker.date.recent() : new Date()`
    
    case 'enum':
      const enumValues = (field as any).enumValues || []
      return `faker ? faker.helpers.arrayElement(${JSON.stringify(enumValues)}) : ${JSON.stringify(enumValues)}[i % ${enumValues.length}]`
    
    default:
      return `\`value-\${i}\``
  }
}

/**
 * Generate seed function for an entity
 */
function generateEntitySeedFunction(entity: EntityIR): string {
  const entityName = entity.name
  const routerName = toCamelCase(entityName)
  const tableName = toSnakeCase(pluralize(entityName))
  const lines: string[] = []
  
  // Get non-computed, non-relation fields
  const seedableFields = Object.entries(entity.fields).filter(([_, field]) => 
    (field as any).type !== 'computed'
  )
  
  // Check for relations
  const hasRelations = Object.keys(entity.relations).length > 0
  const foreignKeyFields = Object.entries(entity.relations)
    .filter(([_, rel]) => rel.type === 'hasOne')
    .map(([name, _]) => `${name}Id`)
  
  // Function signature
  const params = hasRelations 
    ? `count = 10, options: { ${foreignKeyFields.map(fk => `${fk}s?: string[]`).join(', ')} } = {}`
    : `count = 10`
  
  lines.push(`/**`)
  lines.push(` * Seed ${entityName} records`)
  if (hasRelations) {
    lines.push(` * @param count - Number of records to create`)
    lines.push(` * @param options - Related entity IDs for foreign keys`)
  }
  lines.push(` */`)
  lines.push(`export async function seed${pluralize(entityName)}(${params}) {`)
  lines.push(`  let faker: any`)
  lines.push(`  try {`)
  lines.push(`    faker = (await import('@faker-js/faker')).faker`)
  lines.push(`  } catch {`)
  lines.push(`    faker = null`)
  lines.push(`  }`)
  lines.push(``)
  lines.push(`  const data = Array.from({ length: count }, (_, i) => ({`)
  
  // Generate field values
  for (const [fieldName, field] of seedableFields) {
    const value = generateMockValue(fieldName, field, 0)
    lines.push(`    ${fieldName}: ${value},`)
  }
  
  // Add foreign keys from relations
  for (const fkField of foreignKeyFields) {
    const baseName = fkField.replace(/Id$/, '')
    lines.push(`    ${fkField}: options.${fkField}s?.[i % (options.${fkField}s?.length || 1)],`)
  }
  
  // Add timestamps if enabled
  if (entity.behaviors.timestamps) {
    lines.push(`    createdAt: faker ? faker.date.recent({ days: 30 }) : new Date(),`)
    lines.push(`    updatedAt: faker ? faker.date.recent({ days: 7 }) : new Date(),`)
  }
  
  lines.push(`  }))`)
  lines.push(``)
  lines.push(`  const created = await db.insert(${tableName}).values(data).returning()`)
  lines.push(`  console.log(\`✓ Created \${created.length} ${pluralize(entityName).toLowerCase()}\`)`)
  lines.push(`  return created`)
  lines.push(`}`)
  
  return lines.join('\n')
}

/**
 * Analyze entity dependencies to determine seed order
 */
function analyzeEntityDependencies(entities: EntityIR[]): EntityIR[] {
  const graph = new Map<string, Set<string>>()
  const entityMap = new Map<string, EntityIR>()
  
  // Build dependency graph
  for (const entity of entities) {
    entityMap.set(entity.name, entity)
    graph.set(entity.name, new Set())
    
    // Check for hasOne relations (foreign keys)
    for (const [_, relation] of Object.entries(entity.relations)) {
      if (relation.type === 'hasOne') {
        graph.get(entity.name)!.add(relation.entity)
      }
    }
  }
  
  // Topological sort
  const sorted: EntityIR[] = []
  const visited = new Set<string>()
  const visiting = new Set<string>()
  
  function visit(entityName: string) {
    if (visited.has(entityName)) return
    if (visiting.has(entityName)) {
      // Circular dependency - just add it
      return
    }
    
    visiting.add(entityName)
    const deps = graph.get(entityName) || new Set()
    
    for (const dep of deps) {
      visit(dep)
    }
    
    visiting.delete(entityName)
    visited.add(entityName)
    sorted.push(entityMap.get(entityName)!)
  }
  
  for (const entity of entities) {
    visit(entity.name)
  }
  
  return sorted
}

/**
 * Generate main seed orchestrator
 */
function generateSeedOrchestrator(manifest: ManifestIR): string {
  const lines: string[] = []
  const orderedEntities = analyzeEntityDependencies(manifest.entities)
  
  lines.push(`/**`)
  lines.push(` * Main seed orchestrator`)
  lines.push(` * `)
  lines.push(` * Seeds all entities in correct dependency order.`)
  lines.push(` */`)
  lines.push(``)
  lines.push(`import { db } from '@/server/db'`)
  
  // Import schemas for reset
  const tableNames = orderedEntities.map(e => toSnakeCase(pluralize(e.name)))
  lines.push(`import { ${tableNames.join(', ')} } from '@/generated/db/schema'`)
  lines.push(``)
  
  // Import seed functions
  for (const entity of orderedEntities) {
    lines.push(`import { seed${pluralize(entity.name)} } from './${toCamelCase(entity.name)}'`)
  }
  lines.push(``)
  
  // Reset function
  lines.push(`/**`)
  lines.push(` * Clear all data from database (in reverse dependency order)`)
  lines.push(` */`)
  lines.push(`export async function resetDatabase() {`)
  lines.push(`  console.log('🗑️  Clearing database...\\n')`)
  lines.push(``)
  
  // Delete in reverse order
  for (const entity of [...orderedEntities].reverse()) {
    const tableName = toSnakeCase(pluralize(entity.name))
    lines.push(`  await db.delete(${tableName})`)
    lines.push(`  console.log(\`✓ Cleared ${pluralize(entity.name).toLowerCase()}\`)`)
  }
  
  lines.push(``)
  lines.push(`  console.log('')`)
  lines.push(`}`)
  lines.push(``)
  
  // Main seed function
  lines.push(`/**`)
  lines.push(` * Seed all entities`)
  lines.push(` */`)
  lines.push(`export async function seedAll(options: { reset?: boolean } = {}) {`)
  lines.push(`  console.log('🌱 Seeding database...\\n')`)
  lines.push(``)
  lines.push(`  if (options.reset) {`)
  lines.push(`    await resetDatabase()`)
  lines.push(`  }`)
  lines.push(``)
  
  // Seed in dependency order
  for (const entity of orderedEntities) {
    const varName = toCamelCase(pluralize(entity.name))
    const hasOneRelations = Object.entries(entity.relations)
      .filter(([_, rel]) => rel.type === 'hasOne')
    
    if (hasOneRelations.length > 0) {
      // Pass related IDs
      const relatedIds = hasOneRelations
        .map(([name, _]) => `${name}Ids: ${toCamelCase(pluralize(name))}.map(x => x.id)`)
        .join(', ')
      lines.push(`  const ${varName} = await seed${pluralize(entity.name)}(10, { ${relatedIds} })`)
    } else {
      lines.push(`  const ${varName} = await seed${pluralize(entity.name)}(10)`)
    }
  }
  
  lines.push(``)
  lines.push(`  console.log('\\n✅ Seeding complete!')`)
  lines.push(`}`)
  
  return lines.join('\n')
}

/**
 * Generate CLI runner script
 */
function generateRunnerScript(): string {
  return `#!/usr/bin/env tsx
/**
 * Seed Database Script
 * 
 * Usage:
 *   npm run seed           # Seed with sample data
 *   npm run seed --reset   # Reset database and seed
 */

import { seedAll } from './index'

const shouldReset = process.argv.includes('--reset')

seedAll({ reset: shouldReset })
  .then(() => {
    console.log('\\n👋 Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\\n❌ Seeding failed:', error)
    process.exit(1)
  })
`
}

/**
 * Seed data generator
 */
export const seedGenerator: Generator = {
  name: 'seed-data',
  description: 'Generates realistic seed data for development and testing',
  
  generate(manifest: ManifestIR, ctx: GeneratorContext): GeneratedFile[] {
    const files: GeneratedFile[] = []
    
    // Generate seed function for each entity
    for (const entity of manifest.entities) {
      const imports = [
        `import { db } from '@/server/db'`,
        `import { ${toSnakeCase(pluralize(entity.name))} } from '@/generated/db/schema'`,
      ]
      
      files.push({
        path: `seeds/${toCamelCase(entity.name)}.ts`,
        content: imports.join('\n') + '\n\n' + generateEntitySeedFunction(entity),
      })
    }
    
    // Generate orchestrator
    files.push({
      path: 'seeds/index.ts',
      content: generateSeedOrchestrator(manifest),
    })
    
    // Generate runner script
    files.push({
      path: 'seeds/run.ts',
      content: generateRunnerScript(),
    })
    
    // Generate README
    files.push({
      path: 'seeds/README.md',
      content: generateSeedReadme(manifest),
    })
    
    return files
  },
}

/**
 * Generate README for seed data
 */
function generateSeedReadme(manifest: ManifestIR): string {
  const lines: string[] = []
  
  lines.push('# Seed Data')
  lines.push('')
  lines.push('Auto-generated seed data for development and testing.')
  lines.push('')
  lines.push('## Usage')
  lines.push('')
  lines.push('```bash')
  lines.push('# Seed database with sample data')
  lines.push('npm run seed')
  lines.push('')
  lines.push('# Reset database and seed')
  lines.push('npm run seed --reset')
  lines.push('```')
  lines.push('')
  lines.push('## What Gets Seeded')
  lines.push('')
  
  const orderedEntities = analyzeEntityDependencies(manifest.entities)
  for (const entity of orderedEntities) {
    lines.push(`- **${pluralize(entity.name)}**: 10 records`)
  }
  
  lines.push('')
  lines.push('## Optional: Faker.js')
  lines.push('')
  lines.push('For more realistic data, install faker.js:')
  lines.push('')
  lines.push('```bash')
  lines.push('npm install --save-dev @faker-js/faker')
  lines.push('```')
  lines.push('')
  lines.push('If installed, faker will generate realistic:')
  lines.push('- Names, emails, addresses')
  lines.push('- Dates, numbers, booleans')
  lines.push('- Lorem ipsum content')
  lines.push('- URLs, phone numbers, etc.')
  lines.push('')
  lines.push('Without faker, simple but valid data is generated.')
  
  return lines.join('\n')
}
