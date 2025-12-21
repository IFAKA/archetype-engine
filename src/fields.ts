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
  type: 'text' | 'number' | 'boolean' | 'date' | 'computed' | 'enum'
  required: boolean
  unique: boolean
  default?: unknown
  label?: string
  validations: Validation[]
  /** For computed fields: the return type */
  returnType?: 'text' | 'number' | 'boolean' | 'date'
  /** For computed fields: source fields used in computation */
  sourceFields?: string[]
  /** For computed fields: the computation expression */
  expression?: string
  /** For enum fields: the allowed values */
  enumValues?: readonly string[]
  /** For enum fields: custom enum type name (optional) */
  enumName?: string
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

export interface EnumFieldBuilder<T extends readonly string[]> extends BaseFieldBuilder<EnumFieldBuilder<T>> {
  /** Set the default value (must be one of the enum values) */
  default(value: T[number]): EnumFieldBuilder<T>
}

export interface ComputedFieldBuilder {
  readonly _config: FieldConfig
  /** Set a label for the field */
  label(value: string): ComputedFieldBuilder
}

// Union type for any field builder
export type FieldBuilder = TextFieldBuilder | NumberFieldBuilder | BooleanFieldBuilder | DateFieldBuilder | EnumFieldBuilder<readonly string[]> | ComputedFieldBuilder

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

function createEnumFieldBuilder<T extends readonly string[]>(config: FieldConfig): EnumFieldBuilder<T> {
  return {
    _config: config,
    required: () => createEnumFieldBuilder({ ...config, required: true }),
    optional: () => createEnumFieldBuilder({ ...config, required: false }),
    unique: () => createEnumFieldBuilder({ ...config, unique: true }),
    default: (value: T[number]) => createEnumFieldBuilder({ ...config, default: value }),
    label: (value: string) => createEnumFieldBuilder({ ...config, label: value }),
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

/**
 * Create an enum field builder with type-safe values
 *
 * Enum fields create native database enum types (PostgreSQL) or
 * CHECK constraints (SQLite/MySQL) and generate proper Zod enums.
 *
 * @param values - Array of allowed string values (use `as const` for type safety)
 * @returns EnumFieldBuilder with chainable methods
 *
 * @example
 * ```typescript
 * // Basic enum
 * status: enumField(['draft', 'published', 'archived'])
 *
 * // With type safety (recommended)
 * status: enumField(['draft', 'published', 'archived'] as const)
 *   .required()
 *   .default('draft')
 *
 * // Order status with default
 * orderStatus: enumField(['pending', 'processing', 'shipped', 'delivered'] as const)
 *   .required()
 *   .default('pending')
 * ```
 */
export function enumField<T extends readonly string[]>(values: T): EnumFieldBuilder<T> {
  return createEnumFieldBuilder({
    type: 'enum',
    required: false,
    unique: false,
    validations: [],
    enumValues: values,
  })
}

function createComputedFieldBuilder(config: FieldConfig): ComputedFieldBuilder {
  return {
    _config: config,
    label: (value: string) => createComputedFieldBuilder({ ...config, label: value }),
  }
}

/**
 * Computed field configuration
 */
export interface ComputedOptions {
  /** The return type of the computed field */
  type: 'text' | 'number' | 'boolean' | 'date'
  /** Source fields used in the computation */
  from: string[]
  /**
   * The computation expression. Use field names as variables.
   *
   * For text concatenation: `"${firstName} ${lastName}"`
   * For math: `"price * quantity"`
   * For conditionals: `"stock > 0 ? 'In Stock' : 'Out of Stock'"`
   */
  get: string
}

/**
 * Create a computed/virtual field
 *
 * Computed fields are derived from other fields at runtime.
 * They are included in API responses but excluded from create/update inputs.
 * They are NOT stored in the database.
 *
 * @param options - Configuration for the computed field
 * @returns ComputedFieldBuilder
 *
 * @example
 * ```typescript
 * // Full name from first + last
 * fullName: computed({
 *   type: 'text',
 *   from: ['firstName', 'lastName'],
 *   get: '`${firstName} ${lastName}`'
 * })
 *
 * // Total price
 * totalPrice: computed({
 *   type: 'number',
 *   from: ['price', 'quantity'],
 *   get: 'price * quantity'
 * })
 *
 * // Stock status
 * inStock: computed({
 *   type: 'boolean',
 *   from: ['quantity'],
 *   get: 'quantity > 0'
 * })
 * ```
 */
export function computed(options: ComputedOptions): ComputedFieldBuilder {
  return createComputedFieldBuilder({
    type: 'computed',
    returnType: options.type,
    sourceFields: options.from,
    expression: options.get,
    required: false,
    unique: false,
    validations: [],
  })
}
