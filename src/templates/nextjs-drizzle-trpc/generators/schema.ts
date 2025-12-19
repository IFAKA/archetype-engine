// Drizzle ORM schema generator

import type { Generator, GeneratedFile } from '../../../template/types'
import type { GeneratorContext } from '../../../template/context'
import type { ManifestIR } from '../../../manifest'
import type { EntityIR } from '../../../entity'
import type { FieldConfig } from '../../../fields'

function mapFieldType(config: FieldConfig, isSqlite: boolean): string {
  switch (config.type) {
    case 'text': return 'text'
    case 'number': return 'integer'
    case 'boolean': return isSqlite ? 'integer' : 'boolean'
    case 'date': return 'text'
    default: return 'text'
  }
}

function generateFieldDefinition(
  fieldName: string,
  config: FieldConfig,
  isSqlite: boolean,
  ctx: GeneratorContext
): string {
  const columnName = ctx.naming.getColumnName(fieldName)
  const type = mapFieldType(config, isSqlite)
  const parts: string[] = []

  if (config.type === 'boolean' && isSqlite) {
    parts.push(`${type}('${columnName}', { mode: 'boolean' })`)
  } else {
    parts.push(`${type}('${columnName}')`)
  }

  if (config.required) parts.push('.notNull()')
  if (config.unique) parts.push('.unique()')

  if (config.default !== undefined) {
    if (typeof config.default === 'string') {
      parts.push(`.default('${config.default}')`)
    } else {
      parts.push(`.default(${config.default})`)
    }
  }

  return `  ${fieldName}: ${parts.join('')},`
}

function generateEntity(entity: EntityIR, isSqlite: boolean, ctx: GeneratorContext): string {
  const tableName = ctx.naming.getTableName(entity.name)
  const tableFunc = isSqlite ? 'sqliteTable' : 'pgTable'

  const lines: string[] = []
  lines.push(`export const ${tableName} = ${tableFunc}('${tableName}', {`)
  lines.push(`  id: text('id').primaryKey(),`)

  // User-defined fields
  for (const [fieldName, config] of Object.entries(entity.fields)) {
    lines.push(generateFieldDefinition(fieldName, config, isSqlite, ctx))
  }

  // Foreign keys for hasOne relations
  for (const [relName, rel] of Object.entries(entity.relations)) {
    if (rel.type === 'hasOne') {
      const fkField = rel.field || `${relName}Id`
      const fkColumn = ctx.naming.getColumnName(fkField)
      const targetTable = ctx.naming.getTableName(rel.entity)
      lines.push(`  ${fkField}: text('${fkColumn}').references(() => ${targetTable}.id),`)
    }
  }

  // Timestamps
  if (entity.behaviors.timestamps) {
    lines.push(`  createdAt: text('created_at').notNull(),`)
    lines.push(`  updatedAt: text('updated_at').notNull(),`)
  }

  // Soft delete
  if (entity.behaviors.softDelete) {
    lines.push(`  deletedAt: text('deleted_at'),`)
  }

  lines.push('})')
  return lines.join('\n')
}

function generateJunctionTables(manifest: ManifestIR, isSqlite: boolean, ctx: GeneratorContext): string {
  const tableFunc = isSqlite ? 'sqliteTable' : 'pgTable'
  const tables: string[] = []
  const generated = new Set<string>()

  for (const entity of manifest.entities) {
    for (const [relName, rel] of Object.entries(entity.relations)) {
      if (rel.type === 'belongsToMany') {
        const table1 = ctx.naming.getTableName(entity.name)
        const table2 = ctx.naming.getTableName(rel.entity)

        if (entity.name === rel.entity) {
          // Self-referential
          const junctionName = `${entity.name.toLowerCase()}_${ctx.naming.toSnakeCase(relName)}`
          if (!generated.has(junctionName)) {
            generated.add(junctionName)
            tables.push(`
export const ${junctionName} = ${tableFunc}('${junctionName}', {
  sourceId: text('source_id').notNull().references(() => ${table1}.id),
  targetId: text('target_id').notNull().references(() => ${table2}.id),
})`)
          }
        } else if (entity.name < rel.entity) {
          const junctionName = `${entity.name.toLowerCase()}_${rel.entity.toLowerCase()}`
          if (!generated.has(junctionName)) {
            generated.add(junctionName)
            tables.push(`
export const ${junctionName} = ${tableFunc}('${junctionName}', {
  ${entity.name.toLowerCase()}Id: text('${ctx.naming.toSnakeCase(entity.name)}_id').notNull().references(() => ${table1}.id),
  ${rel.entity.toLowerCase()}Id: text('${ctx.naming.toSnakeCase(rel.entity)}_id').notNull().references(() => ${table2}.id),
})`)
          }
        }
      }
    }
  }

  return tables.join('\n')
}

export const schemaGenerator: Generator = {
  name: 'drizzle-schema',
  description: 'Generate Drizzle ORM schema',

  generate(manifest: ManifestIR, ctx: GeneratorContext): GeneratedFile {
    const isSqlite = ctx.database.isSqlite

    const imports = isSqlite
      ? `import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'`
      : `import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core'`

    const entities = manifest.entities
      .map(entity => generateEntity(entity, isSqlite, ctx))
      .join('\n\n')

    const junctionTables = generateJunctionTables(manifest, isSqlite, ctx)

    return {
      path: 'db/schema.ts',
      content: `// Auto-generated Drizzle schema
// Do not edit manually - regenerate with: npx archetype generate

${imports}

${entities}
${junctionTables}
`,
    }
  },
}
