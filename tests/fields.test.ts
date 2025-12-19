import { describe, it, expect } from 'vitest'
import { text, number, boolean, date } from '../src/fields'

describe('Field Builders', () => {
  describe('text()', () => {
    it('creates a basic text field', () => {
      const field = text()
      expect(field._config.type).toBe('text')
      expect(field._config.required).toBe(false)
      expect(field._config.validations).toEqual([])
    })

    it('supports required()', () => {
      const field = text().required()
      expect(field._config.required).toBe(true)
    })

    it('supports optional()', () => {
      const field = text().required().optional()
      expect(field._config.required).toBe(false)
    })

    it('supports unique()', () => {
      const field = text().unique()
      expect(field._config.unique).toBe(true)
    })

    it('supports default value', () => {
      const field = text().default('hello')
      expect(field._config.default).toBe('hello')
    })

    it('supports min/max length', () => {
      const field = text().min(1).max(100)
      expect(field._config.validations).toContainEqual({ type: 'minLength', value: 1 })
      expect(field._config.validations).toContainEqual({ type: 'maxLength', value: 100 })
    })

    it('supports email()', () => {
      const field = text().email()
      expect(field._config.validations).toContainEqual({ type: 'email' })
    })

    it('supports url()', () => {
      const field = text().url()
      expect(field._config.validations).toContainEqual({ type: 'url' })
    })

    it('supports regex()', () => {
      const field = text().regex(/^[a-z]+$/)
      expect(field._config.validations).toContainEqual({ type: 'regex', value: '^[a-z]+$' })
    })

    it('supports oneOf()', () => {
      const field = text().oneOf(['a', 'b', 'c'])
      expect(field._config.validations).toContainEqual({ type: 'oneOf', value: ['a', 'b', 'c'] })
    })

    it('supports trim()', () => {
      const field = text().trim()
      expect(field._config.validations).toContainEqual({ type: 'trim' })
    })

    it('supports lowercase()', () => {
      const field = text().lowercase()
      expect(field._config.validations).toContainEqual({ type: 'lowercase' })
    })

    it('supports uppercase()', () => {
      const field = text().uppercase()
      expect(field._config.validations).toContainEqual({ type: 'uppercase' })
    })

    it('supports label()', () => {
      const field = text().label('Email Address')
      expect(field._config.label).toBe('Email Address')
    })

    it('chains multiple validations immutably', () => {
      const base = text()
      const withRequired = base.required()
      const withEmail = withRequired.email()
      const final = withEmail.min(5).max(255)

      // Original should be unchanged
      expect(base._config.required).toBe(false)
      expect(base._config.validations).toEqual([])

      // Final should have all
      expect(final._config.required).toBe(true)
      expect(final._config.validations).toHaveLength(3)
    })
  })

  describe('number()', () => {
    it('creates a basic number field', () => {
      const field = number()
      expect(field._config.type).toBe('number')
      expect(field._config.required).toBe(false)
    })

    it('supports min/max value', () => {
      const field = number().min(0).max(100)
      expect(field._config.validations).toContainEqual({ type: 'min', value: 0 })
      expect(field._config.validations).toContainEqual({ type: 'max', value: 100 })
    })

    it('supports integer()', () => {
      const field = number().integer()
      expect(field._config.validations).toContainEqual({ type: 'integer' })
    })

    it('supports positive()', () => {
      const field = number().positive()
      expect(field._config.validations).toContainEqual({ type: 'positive' })
    })

    it('supports default value', () => {
      const field = number().default(0)
      expect(field._config.default).toBe(0)
    })
  })

  describe('boolean()', () => {
    it('creates a basic boolean field', () => {
      const field = boolean()
      expect(field._config.type).toBe('boolean')
    })

    it('supports default value', () => {
      const fieldTrue = boolean().default(true)
      const fieldFalse = boolean().default(false)
      expect(fieldTrue._config.default).toBe(true)
      expect(fieldFalse._config.default).toBe(false)
    })
  })

  describe('date()', () => {
    it('creates a basic date field', () => {
      const field = date()
      expect(field._config.type).toBe('date')
    })

    it('supports required()', () => {
      const field = date().required()
      expect(field._config.required).toBe(true)
    })

    it('supports default("now")', () => {
      const field = date().default('now')
      expect(field._config.default).toBe('now')
    })
  })
})
