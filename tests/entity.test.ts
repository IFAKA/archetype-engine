import { describe, it, expect } from 'vitest'
import { defineEntity } from '../src/entity'
import { text, number, boolean, date } from '../src/fields'
import { hasOne, hasMany, belongsToMany } from '../src/relations'

describe('defineEntity()', () => {
  it('creates a basic entity with fields', () => {
    const User = defineEntity('User', {
      fields: {
        email: text().required().email(),
        name: text().required(),
      },
    })

    expect(User.name).toBe('User')
    expect(Object.keys(User.fields)).toEqual(['email', 'name'])
    expect(User.fields.email.type).toBe('text')
    expect(User.fields.email.required).toBe(true)
    expect(User.fields.email.validations).toContainEqual({ type: 'email' })
  })

  it('creates an entity with relations', () => {
    const Post = defineEntity('Post', {
      fields: {
        title: text().required(),
      },
      relations: {
        author: hasOne('User'),
        tags: belongsToMany('Tag'),
      },
    })

    expect(Post.relations.author.type).toBe('hasOne')
    expect(Post.relations.author.entity).toBe('User')
    expect(Post.relations.tags.type).toBe('belongsToMany')
    expect(Post.relations.tags.entity).toBe('Tag')
  })

  it('applies default behaviors', () => {
    const Task = defineEntity('Task', {
      fields: {
        title: text().required(),
      },
    })

    // timestamps defaults to true
    expect(Task.behaviors.timestamps).toBe(true)
    // softDelete defaults to false
    expect(Task.behaviors.softDelete).toBe(false)
    // audit defaults to false
    expect(Task.behaviors.audit).toBe(false)
  })

  it('overrides behaviors when specified', () => {
    const AuditedEntity = defineEntity('AuditedEntity', {
      fields: {
        data: text(),
      },
      behaviors: {
        timestamps: false,
        softDelete: true,
        audit: true,
      },
    })

    expect(AuditedEntity.behaviors.timestamps).toBe(false)
    expect(AuditedEntity.behaviors.softDelete).toBe(true)
    expect(AuditedEntity.behaviors.audit).toBe(true)
  })

  it('handles all field types', () => {
    const AllTypes = defineEntity('AllTypes', {
      fields: {
        textField: text().required(),
        numberField: number().default(0),
        boolField: boolean().default(false),
        dateField: date().optional(),
      },
    })

    expect(AllTypes.fields.textField.type).toBe('text')
    expect(AllTypes.fields.numberField.type).toBe('number')
    expect(AllTypes.fields.boolField.type).toBe('boolean')
    expect(AllTypes.fields.dateField.type).toBe('date')
  })

  it('handles complex validations', () => {
    const ValidatedEntity = defineEntity('ValidatedEntity', {
      fields: {
        email: text().required().email().min(5).max(255).trim().lowercase(),
        status: text().default('active').oneOf(['active', 'inactive', 'pending']),
        age: number().required().min(0).max(150).integer(),
        price: number().required().min(0).positive(),
        slug: text().required().regex(/^[a-z0-9-]+$/).lowercase(),
      },
    })

    expect(ValidatedEntity.fields.email.validations).toHaveLength(5)
    expect(ValidatedEntity.fields.status.validations).toContainEqual({
      type: 'oneOf',
      value: ['active', 'inactive', 'pending'],
    })
    expect(ValidatedEntity.fields.age.validations).toContainEqual({ type: 'integer' })
    expect(ValidatedEntity.fields.price.validations).toContainEqual({ type: 'positive' })
  })

  it('handles self-referential relations', () => {
    const Category = defineEntity('Category', {
      fields: {
        name: text().required(),
      },
      relations: {
        parent: hasOne('Category'),
        children: hasMany('Category'),
      },
    })

    expect(Category.relations.parent.entity).toBe('Category')
    expect(Category.relations.children.entity).toBe('Category')
  })
})
