/**
 * i18n Translation Files Generator
 *
 * Generates JSON translation files for internationalized validation messages.
 * Only runs when multiple languages are configured in the manifest.
 *
 * Generated files:
 * - i18n/{lang}/validation.json - Validation error messages
 * - i18n/{lang}/fields.json - Field labels per entity
 * - i18n/{lang}/entities.json - Entity display names
 *
 * Supported languages (with built-in translations):
 * - en (English), es (Spanish), fr (French), de (German)
 * - pt (Portuguese), it (Italian), ja (Japanese), zh (Chinese), ko (Korean)
 *
 * Features:
 * - Parameterized message templates ({field}, {min}, {max}, {values})
 * - Compatible with next-intl ICU message format
 * - Falls back to English for unsupported languages
 *
 * @module generators/i18n
 */

import type { Generator, GeneratedFile } from '../../../template/types'
import type { GeneratorContext } from '../../../template/context'
import type { ManifestIR } from '../../../manifest'
import type { EntityIR } from '../../../entity'

// Default validation messages per language
const defaultValidationMessages: Record<string, Record<string, string>> = {
  en: {
    required: '{field} is required',
    email: 'Invalid email address',
    url: 'Invalid URL',
    min: '{field} must be at least {min}',
    max: '{field} must be at most {max}',
    minLength: '{field} must be at least {min} characters',
    maxLength: '{field} must be at most {max} characters',
    oneOf: '{field} must be one of: {values}',
    pattern: '{field} format is invalid',
    integer: '{field} must be a whole number',
    positive: '{field} must be positive',
  },
  es: {
    required: '{field} es requerido',
    email: 'Correo electrónico inválido',
    url: 'URL inválida',
    min: '{field} debe ser al menos {min}',
    max: '{field} debe ser como máximo {max}',
    minLength: '{field} debe tener al menos {min} caracteres',
    maxLength: '{field} debe tener como máximo {max} caracteres',
    oneOf: '{field} debe ser uno de: {values}',
    pattern: 'Formato de {field} inválido',
    integer: '{field} debe ser un número entero',
    positive: '{field} debe ser positivo',
  },
  fr: {
    required: '{field} est requis',
    email: 'Adresse e-mail invalide',
    url: 'URL invalide',
    min: '{field} doit être au moins {min}',
    max: '{field} doit être au plus {max}',
    minLength: '{field} doit contenir au moins {min} caractères',
    maxLength: '{field} doit contenir au plus {max} caractères',
    oneOf: '{field} doit être l\'un des: {values}',
    pattern: 'Format de {field} invalide',
    integer: '{field} doit être un nombre entier',
    positive: '{field} doit être positif',
  },
  de: {
    required: '{field} ist erforderlich',
    email: 'Ungültige E-Mail-Adresse',
    url: 'Ungültige URL',
    min: '{field} muss mindestens {min} sein',
    max: '{field} darf höchstens {max} sein',
    minLength: '{field} muss mindestens {min} Zeichen haben',
    maxLength: '{field} darf höchstens {max} Zeichen haben',
    oneOf: '{field} muss eines von: {values} sein',
    pattern: 'Format von {field} ist ungültig',
    integer: '{field} muss eine ganze Zahl sein',
    positive: '{field} muss positiv sein',
  },
  pt: {
    required: '{field} é obrigatório',
    email: 'Endereço de e-mail inválido',
    url: 'URL inválida',
    min: '{field} deve ser pelo menos {min}',
    max: '{field} deve ser no máximo {max}',
    minLength: '{field} deve ter pelo menos {min} caracteres',
    maxLength: '{field} deve ter no máximo {max} caracteres',
    oneOf: '{field} deve ser um de: {values}',
    pattern: 'Formato de {field} inválido',
    integer: '{field} deve ser um número inteiro',
    positive: '{field} deve ser positivo',
  },
  it: {
    required: '{field} è richiesto',
    email: 'Indirizzo email non valido',
    url: 'URL non valido',
    min: '{field} deve essere almeno {min}',
    max: '{field} deve essere al massimo {max}',
    minLength: '{field} deve contenere almeno {min} caratteri',
    maxLength: '{field} deve contenere al massimo {max} caratteri',
    oneOf: '{field} deve essere uno tra: {values}',
    pattern: 'Formato di {field} non valido',
    integer: '{field} deve essere un numero intero',
    positive: '{field} deve essere positivo',
  },
  ja: {
    required: '{field}は必須です',
    email: '無効なメールアドレス',
    url: '無効なURL',
    min: '{field}は{min}以上である必要があります',
    max: '{field}は{max}以下である必要があります',
    minLength: '{field}は{min}文字以上である必要があります',
    maxLength: '{field}は{max}文字以下である必要があります',
    oneOf: '{field}は次のいずれかである必要があります: {values}',
    pattern: '{field}の形式が無効です',
    integer: '{field}は整数である必要があります',
    positive: '{field}は正の数である必要があります',
  },
  zh: {
    required: '{field}是必填项',
    email: '无效的电子邮件地址',
    url: '无效的URL',
    min: '{field}必须至少为{min}',
    max: '{field}必须最多为{max}',
    minLength: '{field}必须至少为{min}个字符',
    maxLength: '{field}必须最多为{max}个字符',
    oneOf: '{field}必须是以下之一: {values}',
    pattern: '{field}格式无效',
    integer: '{field}必须是整数',
    positive: '{field}必须是正数',
  },
  ko: {
    required: '{field}은(는) 필수입니다',
    email: '유효하지 않은 이메일 주소',
    url: '유효하지 않은 URL',
    min: '{field}은(는) 최소 {min}이어야 합니다',
    max: '{field}은(는) 최대 {max}이어야 합니다',
    minLength: '{field}은(는) 최소 {min}자 이상이어야 합니다',
    maxLength: '{field}은(는) 최대 {max}자 이하이어야 합니다',
    oneOf: '{field}은(는) 다음 중 하나여야 합니다: {values}',
    pattern: '{field} 형식이 유효하지 않습니다',
    integer: '{field}은(는) 정수여야 합니다',
    positive: '{field}은(는) 양수여야 합니다',
  },
}

/**
 * Generate field labels mapping from entities
 *
 * Extracts labels from field configurations, falling back to field names.
 *
 * @param entities - Array of entity IRs with field definitions
 * @returns Nested object of entity -> field -> label
 */
function generateFieldLabels(entities: EntityIR[]): Record<string, Record<string, string>> {
  const labels: Record<string, Record<string, string>> = {}

  for (const entity of entities) {
    const entityLabels: Record<string, string> = {}
    for (const [fieldName, config] of Object.entries(entity.fields)) {
      entityLabels[fieldName] = config.label || fieldName
    }
    labels[entity.name.toLowerCase()] = entityLabels
  }

  return labels
}

export const i18nGenerator: Generator = {
  name: 'i18n-files',
  description: 'Generate i18n translation files',

  generate(manifest: ManifestIR, ctx: GeneratorContext): GeneratedFile[] {
    const files: GeneratedFile[] = []

    // Only generate if multiple languages are configured
    if (manifest.i18n.languages.length <= 1) {
      return files
    }

    for (const lang of manifest.i18n.languages) {
      // Validation messages
      const validationMessages = defaultValidationMessages[lang] || defaultValidationMessages.en
      files.push({
        path: `i18n/${lang}/validation.json`,
        content: JSON.stringify(validationMessages, null, 2),
      })

      // Field labels
      const fieldLabels = generateFieldLabels(manifest.entities)
      files.push({
        path: `i18n/${lang}/fields.json`,
        content: JSON.stringify(fieldLabels, null, 2),
      })

      // Entity names (for UI)
      const entityNames: Record<string, string> = {}
      for (const entity of manifest.entities) {
        entityNames[entity.name.toLowerCase()] = entity.name
      }
      files.push({
        path: `i18n/${lang}/entities.json`,
        content: JSON.stringify(entityNames, null, 2),
      })
    }

    return files
  },
}
