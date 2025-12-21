/**
 * Drizzle ORM Schema Generator
 *
 * Generates database table definitions for Drizzle ORM from entity definitions.
 * Supports SQLite, PostgreSQL, and MySQL databases.
 *
 * Generated files:
 * - db/schema.ts - All entity table definitions and junction tables
 *
 * Features:
 * - Maps field types to appropriate database column types
 * - Handles required/optional fields with notNull()
 * - Creates foreign key references for hasOne relations
 * - Generates junction tables for belongsToMany relations
 * - Adds timestamp fields (createdAt, updatedAt) when behaviors.timestamps is true
 * - Adds deletedAt field when behaviors.softDelete is true
 *
 * @module generators/schema
 */

import type { Generator, GeneratedFile } from '../../../template/types'
import type { GeneratorContext } from '../../../template/context'
import type { ManifestIR } from '../../../manifest'
import type { EntityIR } from '../../../entity'
import type { FieldConfig } from '../../../fields'

/**
 * Map entity field type to Drizzle column type
 *
 * @param config - Field configuration from entity definition
 * @param isSqlite - Whether target database is SQLite
 * @returns Drizzle column type name
 */
function mapFieldType(config: FieldConfig, isSqlite: boolean): string {
  switch (config.type) {
    case 'text': return 'text'
    case 'number': return 'integer'
    case 'boolean': return isSqlite ? 'integer' : 'boolean'
    case 'date': return 'text'
    case 'enum': return 'text' // Enum uses text for SQLite, pgEnum for PG (handled separately)
    default: return 'text'
  }
}

/**
 * Generate enum type name from field name
 */
function getEnumTypeName(entityName: string, fieldName: string): string {
  return `${entityName.toLowerCase()}${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}Enum`
}

/**
 * Collect all enum fields from entities and generate pgEnum definitions
 */
function generateEnumDefinitions(manifest: ManifestIR): string {
  const enums: string[] = []
  const generated = new Set<string>()

  for (const entity of manifest.entities) {
    for (const [fieldName, config] of Object.entries(entity.fields)) {
      if (config.type === 'enum' && config.enumValues) {
        const enumName = config.enumName || getEnumTypeName(entity.name, fieldName)
        if (!generated.has(enumName)) {
          generated.add(enumName)
          const values = config.enumValues.map(v => `'${v}'`).join(', ')
          enums.push(`export const ${enumName} = pgEnum('${enumName}', [${values}])`)
        }
      }
    }
  }

  return enums.join('\n')
}

/**
 * Generate a single field definition line for the schema
 *
 * @param fieldName - Name of the field in the entity
 * @param config - Field configuration with type, validations, etc.
 * @param isSqlite - Whether target database is SQLite
 * @param ctx - Generator context with naming utilities
 * @param entityName - Entity name for enum type naming
 * @returns Drizzle field definition code (e.g., "email: text('email').notNull().unique(),")
 */
function generateFieldDefinition(
  fieldName: string,
  config: FieldConfig,
  isSqlite: boolean,
  ctx: GeneratorContext,
  entityName?: string
): string {
  const columnName = ctx.naming.getColumnName(fieldName)
  const parts: string[] = []

  // Handle enum fields specially
  if (config.type === 'enum' && config.enumValues) {
    if (isSqlite) {
      // SQLite: use text column (validation enforced by Zod)
      parts.push(`text('${columnName}')`)
    } else {
      // PostgreSQL: use pgEnum reference
      const enumName = config.enumName || (entityName ? getEnumTypeName(entityName, fieldName) : `${fieldName}Enum`)
      parts.push(`${enumName}('${columnName}')`)
    }
  } else if (config.type === 'boolean' && isSqlite) {
    parts.push(`integer('${columnName}', { mode: 'boolean' })`)
  } else {
    const type = mapFieldType(config, isSqlite)
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

/**
 * Generate complete table definition for an entity
 *
 * @param entity - Compiled entity IR with fields, relations, and behaviors
 * @param isSqlite - Whether target database is SQLite
 * @param ctx - Generator context with naming utilities
 * @returns Complete Drizzle table definition code
 */
function generateEntity(entity: EntityIR, isSqlite: boolean, ctx: GeneratorContext): string {
  const tableName = ctx.naming.getTableName(entity.name)
  const tableFunc = isSqlite ? 'sqliteTable' : 'pgTable'

  const lines: string[] = []
  lines.push(`export const ${tableName} = ${tableFunc}('${tableName}', {`)
  lines.push(`  id: text('id').primaryKey(),`)

  // User-defined fields (skip computed fields - they're not stored in DB)
  for (const [fieldName, config] of Object.entries(entity.fields)) {
    if (config.type === 'computed') continue
    lines.push(generateFieldDefinition(fieldName, config, isSqlite, ctx, entity.name))
  }

  // Foreign keys for hasOne relations
  for (const [relName, rel] of Object.entries(entity.relations)) {
    if (rel.type === 'hasOne') {
      const fkField = rel.field || `${relName}Id`
      const fkColumn = ctx.naming.getColumnName(fkField)
      const targetTable = ctx.naming.getTableName(rel.entity)
      const notNull = rel.optional ? '' : '.notNull()'
      lines.push(`  ${fkField}: text('${fkColumn}').references(() => ${targetTable}.id)${notNull},`)
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

/**
 * Generate pivot fields for junction tables
 *
 * @param fields - Pivot field configurations
 * @param isSqlite - Whether target database is SQLite
 * @param ctx - Generator context
 * @returns Array of field definition lines
 */
function generatePivotFields(
  fields: Record<string, FieldConfig> | undefined,
  isSqlite: boolean,
  ctx: GeneratorContext
): string[] {
  if (!fields) return []
  return Object.entries(fields).map(([fieldName, config]) =>
    generateFieldDefinition(fieldName, config, isSqlite, ctx)
  )
}

/**
 * Generate junction tables for many-to-many relations
 *
 * Creates tables for belongsToMany relations. Handles both regular many-to-many
 * and self-referential relations (e.g., User following User).
 * Supports pivot fields for additional data on the relation.
 *
 * @param manifest - Compiled manifest with all entities
 * @param isSqlite - Whether target database is SQLite
 * @param ctx - Generator context with naming utilities
 * @returns Junction table definitions code
 */
function generateJunctionTables(manifest: ManifestIR, isSqlite: boolean, ctx: GeneratorContext): string {
  const tableFunc = isSqlite ? 'sqliteTable' : 'pgTable'
  const tables: string[] = []
  const generated = new Set<string>()

  for (const entity of manifest.entities) {
    for (const [relName, rel] of Object.entries(entity.relations)) {
      if (rel.type === 'belongsToMany') {
        const table1 = ctx.naming.getTableName(entity.name)
        const table2 = ctx.naming.getTableName(rel.entity)

        // Generate pivot fields if defined
        const pivotFields = generatePivotFields(rel.pivot?.fields, isSqlite, ctx)
        const pivotFieldsStr = pivotFields.length > 0 ? '\n' + pivotFields.join('\n') : ''

        if (entity.name === rel.entity) {
          // Self-referential
          const junctionName = rel.pivot?.table || `${entity.name.toLowerCase()}_${ctx.naming.toSnakeCase(relName)}`
          if (!generated.has(junctionName)) {
            generated.add(junctionName)
            tables.push(`
export const ${ctx.naming.toCamelCase(junctionName)} = ${tableFunc}('${junctionName}', {
  sourceId: text('source_id').notNull().references(() => ${table1}.id),
  targetId: text('target_id').notNull().references(() => ${table2}.id),${pivotFieldsStr}
})`)
          }
        } else if (entity.name < rel.entity) {
          // Custom table name from pivot config or default
          const junctionName = rel.pivot?.table || `${entity.name.toLowerCase()}_${rel.entity.toLowerCase()}`
          if (!generated.has(junctionName)) {
            generated.add(junctionName)
            tables.push(`
export const ${ctx.naming.toCamelCase(junctionName)} = ${tableFunc}('${junctionName}', {
  ${entity.name.toLowerCase()}Id: text('${ctx.naming.toSnakeCase(entity.name)}_id').notNull().references(() => ${table1}.id),
  ${rel.entity.toLowerCase()}Id: text('${ctx.naming.toSnakeCase(rel.entity)}_id').notNull().references(() => ${table2}.id),${pivotFieldsStr}
})`)
          }
        }
      }
    }
  }

  return tables.join('\n')
}

/**
 * Check if manifest has any enum fields
 */
function hasEnumFields(manifest: ManifestIR): boolean {
  return manifest.entities.some(entity =>
    Object.values(entity.fields).some(f => f.type === 'enum')
  )
}

export const schemaGenerator: Generator = {
  name: 'drizzle-schema',
  description: 'Generate Drizzle ORM schema',

  generate(manifest: ManifestIR, ctx: GeneratorContext): GeneratedFile {
    const isSqlite = ctx.database.isSqlite
    const hasEnums = hasEnumFields(manifest)

    // Build imports based on database type and features used
    let imports: string
    if (isSqlite) {
      imports = `import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'`
    } else {
      const pgImports = ['pgTable', 'text', 'integer', 'boolean', 'timestamp']
      if (hasEnums) pgImports.push('pgEnum')
      imports = `import { ${pgImports.join(', ')} } from 'drizzle-orm/pg-core'`
    }

    // Generate enum definitions for PostgreSQL
    const enumDefs = !isSqlite && hasEnums ? generateEnumDefinitions(manifest) + '\n\n' : ''

    const entities = manifest.entities
      .map(entity => generateEntity(entity, isSqlite, ctx))
      .join('\n\n')

    const junctionTables = generateJunctionTables(manifest, isSqlite, ctx)

    return {
      path: 'db/schema.ts',
      content: `// Auto-generated Drizzle schema
// Do not edit manually - regenerate with: npx archetype generate

${imports}

${enumDefs}${entities}
${junctionTables}
`,
    }
  },
}
