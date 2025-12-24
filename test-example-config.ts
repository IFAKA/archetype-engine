import { defineConfig, defineEntity, text, number, boolean, enumField, hasMany } from './src/index'

// Example User entity with various features
const User = defineEntity('User', {
  fields: {
    email: text().required().email(),
    name: text().required().min(2).max(100),
    age: number().optional().min(0).max(150).integer(),
    role: enumField('admin', 'user', 'guest').default('user'),
    isActive: boolean().default(true),
  },
  relations: {
    posts: hasMany('Post'),
  },
  behaviors: {
    timestamps: true,
    softDelete: true,
  },
  protected: 'write', // list/get public, create/update/remove protected
})

// Example Post entity
const Post = defineEntity('Post', {
  fields: {
    title: text().required().min(5).max(200),
    content: text().required().min(10),
    slug: text().required().unique(),
    published: boolean().default(false),
    viewCount: number().default(0).min(0),
  },
  behaviors: {
    timestamps: true,
  },
  protected: 'all', // All operations require auth
})

export default defineConfig({
  entities: [User, Post],
  database: {
    type: 'sqlite',
    file: './test.db',
  },
  auth: {
    enabled: true,
    providers: ['credentials'],
  },
})
