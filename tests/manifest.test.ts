import { describe, it, expect } from 'vitest'
import { defineManifest } from '../src/manifest'
import { defineEntity } from '../src/entity'
import { text, number } from '../src/fields'
import { hasOne, hasMany } from '../src/relations'

describe('defineManifest()', () => {
  it('creates a basic manifest with sqlite database', () => {
    const Task = defineEntity('Task', {
      fields: {
        title: text().required(),
        done: boolean().default(false),
      },
    })

    const manifest = defineManifest({
      entities: [Task],
      database: {
        type: 'sqlite',
        file: './data.db',
      },
    })

    expect(manifest.entities).toHaveLength(1)
    expect(manifest.entities[0].name).toBe('Task')
    expect(manifest.database.type).toBe('sqlite')
    expect(manifest.database.file).toBe('./data.db')
  })

  it('creates a manifest with postgres database', () => {
    const User = defineEntity('User', {
      fields: {
        email: text().required().email(),
      },
    })

    const manifest = defineManifest({
      entities: [User],
      database: {
        type: 'postgres',
        url: 'postgresql://localhost/test',
      },
    })

    expect(manifest.database.type).toBe('postgres')
    expect(manifest.database.url).toBe('postgresql://localhost/test')
  })

  it('applies default i18n settings', () => {
    const Task = defineEntity('Task', {
      fields: {
        title: text().required(),
      },
    })

    const manifest = defineManifest({
      entities: [Task],
      database: { type: 'sqlite', file: './data.db' },
    })

    // Default i18n
    expect(manifest.i18n.languages).toEqual(['en'])
    expect(manifest.i18n.defaultLanguage).toBe('en')
    expect(manifest.i18n.outputDir).toBe('./messages')
  })

  it('supports custom i18n configuration', () => {
    const Task = defineEntity('Task', {
      fields: {
        title: text().required(),
      },
    })

    const manifest = defineManifest({
      entities: [Task],
      database: { type: 'sqlite', file: './data.db' },
      i18n: {
        languages: ['en', 'es', 'fr'],
        defaultLanguage: 'en',
        outputDir: './locales',
      },
    })

    expect(manifest.i18n.languages).toEqual(['en', 'es', 'fr'])
    expect(manifest.i18n.outputDir).toBe('./locales')
  })

  it('handles multiple entities with relations', () => {
    const User = defineEntity('User', {
      fields: {
        email: text().required().email(),
        name: text().required(),
      },
      relations: {
        posts: hasMany('Post'),
      },
    })

    const Post = defineEntity('Post', {
      fields: {
        title: text().required(),
        content: text(),
      },
      relations: {
        author: hasOne('User'),
      },
    })

    const manifest = defineManifest({
      entities: [User, Post],
      database: { type: 'sqlite', file: './data.db' },
    })

    expect(manifest.entities).toHaveLength(2)
    expect(manifest.entities[0].name).toBe('User')
    expect(manifest.entities[1].name).toBe('Post')
    expect(manifest.entities[0].relations.posts.entity).toBe('Post')
    expect(manifest.entities[1].relations.author.entity).toBe('User')
  })

  it('supports auth configuration', () => {
    const User = defineEntity('User', {
      fields: {
        email: text().required().email(),
      },
    })

    const manifest = defineManifest({
      entities: [User],
      database: { type: 'sqlite', file: './data.db' },
      auth: {
        enabled: true,
        adapter: 'drizzle',
        providers: ['credentials', 'google'],
        sessionStrategy: 'jwt',
      },
    })

    expect(manifest.auth?.enabled).toBe(true)
    expect(manifest.auth?.adapter).toBe('drizzle')
    expect(manifest.auth?.providers).toContain('google')
    expect(manifest.auth?.sessionStrategy).toBe('jwt')
  })

  it('supports tenancy configuration', () => {
    const Organization = defineEntity('Organization', {
      fields: {
        name: text().required(),
      },
    })

    const manifest = defineManifest({
      entities: [Organization],
      database: { type: 'postgres', url: 'postgresql://localhost/test' },
      tenancy: {
        enabled: true,
        field: 'organizationId',
      },
    })

    expect(manifest.tenancy?.enabled).toBe(true)
    expect(manifest.tenancy?.field).toBe('organizationId')
  })

  it('supports observability configuration', () => {
    const Task = defineEntity('Task', {
      fields: {
        title: text().required(),
      },
    })

    const manifest = defineManifest({
      entities: [Task],
      database: { type: 'sqlite', file: './data.db' },
      observability: {
        logging: {
          enabled: true,
          level: 'info',
          format: 'json',
        },
        telemetry: {
          enabled: true,
          events: ['create', 'update', 'remove'],
        },
        audit: {
          enabled: true,
          entity: 'AuditLog',
        },
      },
    })

    expect(manifest.observability?.logging?.enabled).toBe(true)
    expect(manifest.observability?.telemetry?.events).toContain('update')
    expect(manifest.observability?.audit?.entity).toBe('AuditLog')
  })
})

// Helper import for tests that use boolean
import { boolean } from '../src/fields'
