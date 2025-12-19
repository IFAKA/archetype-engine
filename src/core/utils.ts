// Shared utilities for code generation

/**
 * Convert camelCase or PascalCase to snake_case
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    .replace(/^_/, '')
}

/**
 * Simple pluralization rules
 */
export function pluralize(name: string): string {
  if (name.endsWith('y')) {
    return name.slice(0, -1) + 'ies'
  }
  if (name.endsWith('s') || name.endsWith('x') ||
      name.endsWith('ch') || name.endsWith('sh')) {
    return name + 'es'
  }
  return name + 's'
}

/**
 * Convert to camelCase (first letter lowercase)
 */
export function toCamelCase(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1)
}

/**
 * Convert to PascalCase (first letter uppercase)
 */
export function toPascalCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Get database table name from entity name
 * Example: "User" -> "users", "Category" -> "categories"
 */
export function getTableName(entityName: string): string {
  return toSnakeCase(pluralize(entityName))
}

/**
 * Get database column name from field name
 * Example: "firstName" -> "first_name"
 */
export function getColumnName(fieldName: string): string {
  return toSnakeCase(fieldName)
}
