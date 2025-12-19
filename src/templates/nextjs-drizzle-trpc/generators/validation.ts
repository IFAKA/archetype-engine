// Zod schema generator with i18n support

import type { Generator, GeneratedFile } from '../../../template/types'
import type { GeneratorContext } from '../../../template/context'
import type { ManifestIR } from '../../../manifest'
import type { EntityIR } from '../../../entity'
import type { FieldConfig, Validation } from '../../../fields'

function generateFieldSchema(
  fieldName: string,
  config: FieldConfig,
  useI18n: boolean
): string {
  const parts: string[] = []
  const label = config.label || fieldName

  // Base type
  switch (config.type) {
    case 'text': parts.push('z.string()'); break
    case 'number': parts.push('z.number()'); break
    case 'boolean': parts.push('z.boolean()'); break
    case 'date': parts.push('z.string()'); break
  }

  // Required check for text (must come before validations and optional)
  if (config.required && config.type === 'text') {
    if (useI18n) {
      parts.push(`.min(1, { message: t('required', { field: '${label}' }) })`)
    } else {
      parts.push(`.min(1, { message: '${label} is required' })`)
    }
  }

  // Validations (must come before optional)
  for (const validation of config.validations) {
    parts.push(generateValidation(validation, label, useI18n))
  }

  // Optional (must come after validations)
  if (!config.required) {
    parts.push('.optional()')
  }

  // Default (must come after optional)
  if (config.default !== undefined && !config.required) {
    if (typeof config.default === 'string') {
      parts.push(`.default('${config.default}')`)
    } else {
      parts.push(`.default(${config.default})`)
    }
  }

  return parts.join('')
}

function generateValidation(v: Validation, label: string, useI18n: boolean): string {
  const msg = (key: string, params: Record<string, unknown> = {}) => {
    if (useI18n) {
      const paramStr = Object.entries({ field: label, ...params })
        .map(([k, val]) => {
          if (typeof val === 'string') return `${k}: '${val}'`
          if (Array.isArray(val)) return `${k}: '${(val as string[]).join(', ')}'`
          return `${k}: ${val}`
        })
        .join(', ')
      return `{ message: t('${key}', { ${paramStr} }) }`
    }
    // Static messages
    const messages: Record<string, string> = {
      minLength: `${label} must be at least ${params.min} characters`,
      maxLength: `${label} must be at most ${params.max} characters`,
      min: `${label} must be at least ${params.min}`,
      max: `${label} must be at most ${params.max}`,
      email: `Invalid email address`,
      url: `Invalid URL`,
      integer: `${label} must be a whole number`,
      positive: `${label} must be positive`,
      pattern: `${label} format is invalid`,
      oneOf: `${label} must be one of: ${(params.values as string[])?.join(', ')}`,
    }
    return `{ message: '${messages[key] || `Invalid ${label}`}' }`
  }

  switch (v.type) {
    case 'minLength': return `.min(${v.value}, ${msg('minLength', { min: v.value })})`
    case 'maxLength': return `.max(${v.value}, ${msg('maxLength', { max: v.value })})`
    case 'min': return `.min(${v.value}, ${msg('min', { min: v.value })})`
    case 'max': return `.max(${v.value}, ${msg('max', { max: v.value })})`
    case 'email': return `.email(${msg('email')})`
    case 'url': return `.url(${msg('url')})`
    case 'regex': return `.regex(/${v.value}/, ${msg('pattern')})`
    case 'integer': return `.int(${msg('integer')})`
    case 'positive': return `.positive(${msg('positive')})`
    case 'oneOf':
      const values = v.value as string[]
      return `.refine(v => ${JSON.stringify(values)}.includes(v), ${msg('oneOf', { values })})`
    case 'trim': return '.trim()'
    case 'lowercase': return '.toLowerCase()'
    case 'uppercase': return '.toUpperCase()'
    default: return ''
  }
}

function generateEntitySchema(entity: EntityIR, useI18n: boolean): string {
  const name = entity.name
  const lowerName = name.toLowerCase()

  const staticFields: string[] = []
  for (const [fieldName, config] of Object.entries(entity.fields)) {
    staticFields.push(`    ${fieldName}: ${generateFieldSchema(fieldName, config, false)},`)
  }

  for (const [relName, rel] of Object.entries(entity.relations)) {
    if (rel.type === 'hasOne') {
      const fkField = rel.field || `${relName}Id`
      staticFields.push(`    ${fkField}: z.string().optional(),`)
    }
  }

  if (useI18n) {
    const i18nFields: string[] = []
    for (const [fieldName, config] of Object.entries(entity.fields)) {
      i18nFields.push(`    ${fieldName}: ${generateFieldSchema(fieldName, config, true)},`)
    }
    for (const [relName, rel] of Object.entries(entity.relations)) {
      if (rel.type === 'hasOne') {
        const fkField = rel.field || `${relName}Id`
        i18nFields.push(`    ${fkField}: z.string().optional(),`)
      }
    }

    return `// Auto-generated Zod schema for ${name}
// Do not edit manually - regenerate with: npx archetype generate

import { z } from 'zod'
import { useTranslations } from 'next-intl'

type TranslationFn = ReturnType<typeof useTranslations<'validation'>>

export const ${lowerName}CreateSchema = z.object({
${staticFields.join('\n')}
})

export const ${lowerName}UpdateSchema = ${lowerName}CreateSchema.partial()

export function ${lowerName}CreateSchemaI18n(t: TranslationFn) {
  return z.object({
${i18nFields.join('\n')}
  })
}

export function ${lowerName}UpdateSchemaI18n(t: TranslationFn) {
  return ${lowerName}CreateSchemaI18n(t).partial()
}

export type ${name}Create = z.input<typeof ${lowerName}CreateSchema>
export type ${name}Update = z.input<typeof ${lowerName}UpdateSchema>
`
  }

  return `// Auto-generated Zod schema for ${name}
// Do not edit manually - regenerate with: npx archetype generate

import { z } from 'zod'

export const ${lowerName}CreateSchema = z.object({
${staticFields.join('\n')}
})

export const ${lowerName}UpdateSchema = ${lowerName}CreateSchema.partial()

export type ${name}Create = z.input<typeof ${lowerName}CreateSchema>
export type ${name}Update = z.input<typeof ${lowerName}UpdateSchema>
`
}

export const validationGenerator: Generator = {
  name: 'zod-schemas',
  description: 'Generate Zod validation schemas',

  generate(manifest: ManifestIR, ctx: GeneratorContext): GeneratedFile[] {
    const useI18n = manifest.i18n.languages.length > 1

    return manifest.entities.map(entity => ({
      path: `schemas/${entity.name.toLowerCase()}.ts`,
      content: generateEntitySchema(entity, useI18n),
    }))
  },
}
