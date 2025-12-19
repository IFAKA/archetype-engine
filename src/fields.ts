/**
 * Field builders for entity definitions
 *
 * Each method returns a new immutable object (functional programming pattern).
 * Chain methods to build field configurations fluently.
 *
 * @module fields
 */

export interface Validation {
  type: string
  value?: unknown
}

export interface FieldConfig {
  type: 'text' | 'number' | 'boolean' | 'date'
  required: boolean
  unique: boolean
  default?: unknown
  label?: string
  validations: Validation[]
}

// Base builder interface - generic to preserve type through chain
export interface BaseFieldBuilder<T> {
  readonly _config: FieldConfig
  required(): T
  optional(): T
  unique(): T
  default(value: unknown): T
  label(value: string): T
}

// Specific builder interfaces
export interface TextFieldBuilder extends BaseFieldBuilder<TextFieldBuilder> {
  min(value: number): TextFieldBuilder
  max(value: number): TextFieldBuilder
  email(): TextFieldBuilder
  url(): TextFieldBuilder
  regex(pattern: RegExp): TextFieldBuilder
  oneOf<V extends string>(values: readonly V[]): TextFieldBuilder
  trim(): TextFieldBuilder
  lowercase(): TextFieldBuilder
  uppercase(): TextFieldBuilder
}

export interface NumberFieldBuilder extends BaseFieldBuilder<NumberFieldBuilder> {
  min(value: number): NumberFieldBuilder
  max(value: number): NumberFieldBuilder
  integer(): NumberFieldBuilder
  positive(): NumberFieldBuilder
}

export interface BooleanFieldBuilder extends BaseFieldBuilder<BooleanFieldBuilder> {
  default(value: boolean): BooleanFieldBuilder
}

export interface DateFieldBuilder extends BaseFieldBuilder<DateFieldBuilder> {
  default(value: 'now' | Date): DateFieldBuilder
}

// Union type for any field builder
export type FieldBuilder = TextFieldBuilder | NumberFieldBuilder | BooleanFieldBuilder | DateFieldBuilder

// Builder implementations
function createTextFieldBuilder(config: FieldConfig): TextFieldBuilder {
  return {
    _config: config,
    required: () => createTextFieldBuilder({ ...config, required: true }),
    optional: () => createTextFieldBuilder({ ...config, required: false }),
    unique: () => createTextFieldBuilder({ ...config, unique: true }),
    default: (value: unknown) => createTextFieldBuilder({ ...config, default: value }),
    label: (value: string) => createTextFieldBuilder({ ...config, label: value }),
    min: (value: number) => createTextFieldBuilder({
      ...config,
      validations: [...config.validations, { type: 'minLength', value }]
    }),
    max: (value: number) => createTextFieldBuilder({
      ...config,
      validations: [...config.validations, { type: 'maxLength', value }]
    }),
    email: () => createTextFieldBuilder({
      ...config,
      validations: [...config.validations, { type: 'email' }]
    }),
    url: () => createTextFieldBuilder({
      ...config,
      validations: [...config.validations, { type: 'url' }]
    }),
    regex: (pattern: RegExp) => createTextFieldBuilder({
      ...config,
      validations: [...config.validations, { type: 'regex', value: pattern.source }]
    }),
    oneOf: <V extends string>(values: readonly V[]) => createTextFieldBuilder({
      ...config,
      validations: [...config.validations, { type: 'oneOf', value: values }]
    }),
    trim: () => createTextFieldBuilder({
      ...config,
      validations: [...config.validations, { type: 'trim' }]
    }),
    lowercase: () => createTextFieldBuilder({
      ...config,
      validations: [...config.validations, { type: 'lowercase' }]
    }),
    uppercase: () => createTextFieldBuilder({
      ...config,
      validations: [...config.validations, { type: 'uppercase' }]
    }),
  }
}

function createNumberFieldBuilder(config: FieldConfig): NumberFieldBuilder {
  return {
    _config: config,
    required: () => createNumberFieldBuilder({ ...config, required: true }),
    optional: () => createNumberFieldBuilder({ ...config, required: false }),
    unique: () => createNumberFieldBuilder({ ...config, unique: true }),
    default: (value: unknown) => createNumberFieldBuilder({ ...config, default: value }),
    label: (value: string) => createNumberFieldBuilder({ ...config, label: value }),
    min: (value: number) => createNumberFieldBuilder({
      ...config,
      validations: [...config.validations, { type: 'min', value }]
    }),
    max: (value: number) => createNumberFieldBuilder({
      ...config,
      validations: [...config.validations, { type: 'max', value }]
    }),
    integer: () => createNumberFieldBuilder({
      ...config,
      validations: [...config.validations, { type: 'integer' }]
    }),
    positive: () => createNumberFieldBuilder({
      ...config,
      validations: [...config.validations, { type: 'positive' }]
    }),
  }
}

function createBooleanFieldBuilder(config: FieldConfig): BooleanFieldBuilder {
  return {
    _config: config,
    required: () => createBooleanFieldBuilder({ ...config, required: true }),
    optional: () => createBooleanFieldBuilder({ ...config, required: false }),
    unique: () => createBooleanFieldBuilder({ ...config, unique: true }),
    default: (value: boolean) => createBooleanFieldBuilder({ ...config, default: value }),
    label: (value: string) => createBooleanFieldBuilder({ ...config, label: value }),
  }
}

function createDateFieldBuilder(config: FieldConfig): DateFieldBuilder {
  return {
    _config: config,
    required: () => createDateFieldBuilder({ ...config, required: true }),
    optional: () => createDateFieldBuilder({ ...config, required: false }),
    unique: () => createDateFieldBuilder({ ...config, unique: true }),
    default: (value: 'now' | Date) => createDateFieldBuilder({ ...config, default: value }),
    label: (value: string) => createDateFieldBuilder({ ...config, label: value }),
  }
}

/**
 * Create a text field builder
 *
 * @returns TextFieldBuilder with chainable methods
 *
 * @example
 * ```typescript
 * text()
 *   .required()
 *   .unique()
 *   .email()
 *   .min(5).max(255)
 *   .trim()
 *   .lowercase()
 * ```
 */
export function text(): TextFieldBuilder {
  return createTextFieldBuilder({
    type: 'text',
    required: false,
    unique: false,
    validations: []
  })
}

/**
 * Create a number field builder
 *
 * @returns NumberFieldBuilder with chainable methods
 *
 * @example
 * ```typescript
 * number()
 *   .required()
 *   .min(0).max(100)
 *   .integer()
 *   .positive()
 * ```
 */
export function number(): NumberFieldBuilder {
  return createNumberFieldBuilder({
    type: 'number',
    required: false,
    unique: false,
    validations: []
  })
}

/**
 * Create a boolean field builder
 *
 * @returns BooleanFieldBuilder with chainable methods
 *
 * @example
 * ```typescript
 * boolean().default(false)
 * ```
 */
export function boolean(): BooleanFieldBuilder {
  return createBooleanFieldBuilder({
    type: 'boolean',
    required: false,
    unique: false,
    validations: []
  })
}

/**
 * Create a date field builder
 *
 * @returns DateFieldBuilder with chainable methods
 *
 * @example
 * ```typescript
 * date().default('now')
 * date().required()
 * ```
 */
export function date(): DateFieldBuilder {
  return createDateFieldBuilder({
    type: 'date',
    required: false,
    unique: false,
    validations: []
  })
}
