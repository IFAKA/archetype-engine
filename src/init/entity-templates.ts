/**
 * Pre-built entity templates for common use cases
 * Users can copy-paste these to get started quickly
 */

export interface EntityTemplate {
  id: string
  name: string
  description: string
  entities: Array<{ filename: string; code: string }>
}

/**
 * SaaS Multi-Tenant Template
 * Perfect for: Team collaboration apps, project management, SaaS products
 */
export const saasTemplate: EntityTemplate = {
  id: 'saas',
  name: 'SaaS Multi-Tenant',
  description: 'Workspace, Team, Member entities with role-based permissions',
  entities: [
    {
      filename: 'workspace.ts',
      code: `import { defineEntity, text, enumField, hasMany } from 'archetype-engine'

export const Workspace = defineEntity('Workspace', {
  fields: {
    name: text().required().min(2).max(100).label('Workspace Name'),
    slug: text().required().unique().regex(/^[a-z0-9-]+$/).label('URL Slug'),
    plan: enumField(['free', 'pro', 'enterprise'] as const).default('free').label('Plan'),
    status: enumField(['active', 'suspended', 'cancelled'] as const).default('active'),
  },
  relations: {
    members: hasMany('Member'),
    teams: hasMany('Team'),
  },
  behaviors: {
    timestamps: true,
    softDelete: true,
  },
  protected: 'all',
})
`
    },
    {
      filename: 'team.ts',
      code: `import { defineEntity, text, hasOne, hasMany } from 'archetype-engine'

export const Team = defineEntity('Team', {
  fields: {
    name: text().required().min(2).max(100).label('Team Name'),
    description: text().optional().max(500).label('Description'),
  },
  relations: {
    workspace: hasOne('Workspace'),
    members: hasMany('Member'),
  },
  behaviors: {
    timestamps: true,
  },
  protected: 'write',
})
`
    },
    {
      filename: 'member.ts',
      code: `import { defineEntity, text, enumField, hasOne } from 'archetype-engine'

export const Member = defineEntity('Member', {
  fields: {
    email: text().required().email().label('Email'),
    name: text().required().min(2).max(100).label('Name'),
    role: enumField(['owner', 'admin', 'member', 'guest'] as const).default('member').label('Role'),
    status: enumField(['active', 'invited', 'suspended'] as const).default('invited'),
  },
  relations: {
    workspace: hasOne('Workspace'),
    team: hasOne('Team'),
  },
  behaviors: {
    timestamps: true,
  },
  protected: 'all',
})
`
    },
  ],
}

/**
 * E-commerce Template
 * Perfect for: Online stores, marketplaces, product catalogs
 */
export const ecommerceTemplate: EntityTemplate = {
  id: 'ecommerce',
  name: 'E-commerce',
  description: 'Product, Order, Customer entities with inventory tracking',
  entities: [
    {
      filename: 'product.ts',
      code: `import { defineEntity, text, number, boolean, hasMany } from 'archetype-engine'

export const Product = defineEntity('Product', {
  fields: {
    sku: text().required().unique().label('SKU'),
    name: text().required().min(1).max(200).label('Product Name'),
    description: text().optional().max(2000).label('Description'),
    price: number().required().positive().label('Price'),
    compareAtPrice: number().optional().positive().label('Compare at Price'),
    stock: number().required().integer().min(0).default(0).label('Stock'),
    isActive: boolean().default(true).label('Active'),
    isFeatured: boolean().default(false).label('Featured'),
  },
  relations: {
    orderItems: hasMany('OrderItem'),
  },
  behaviors: {
    timestamps: true,
    softDelete: true,
  },
  protected: 'write',
})
`
    },
    {
      filename: 'customer.ts',
      code: `import { defineEntity, text, hasMany } from 'archetype-engine'

export const Customer = defineEntity('Customer', {
  fields: {
    email: text().required().email().unique().label('Email'),
    firstName: text().required().min(1).max(100).label('First Name'),
    lastName: text().required().min(1).max(100).label('Last Name'),
    phone: text().optional().label('Phone'),
  },
  relations: {
    orders: hasMany('Order'),
  },
  behaviors: {
    timestamps: true,
  },
  protected: 'all',
})
`
    },
    {
      filename: 'order.ts',
      code: `import { defineEntity, text, number, enumField, hasOne, hasMany } from 'archetype-engine'

export const Order = defineEntity('Order', {
  fields: {
    orderNumber: text().required().unique().label('Order Number'),
    status: enumField(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'] as const)
      .default('pending')
      .label('Status'),
    subtotal: number().required().positive().label('Subtotal'),
    tax: number().required().min(0).default(0).label('Tax'),
    shipping: number().required().min(0).default(0).label('Shipping'),
    total: number().required().positive().label('Total'),
  },
  relations: {
    customer: hasOne('Customer'),
    items: hasMany('OrderItem'),
  },
  behaviors: {
    timestamps: true,
  },
  protected: 'all',
})
`
    },
    {
      filename: 'order-item.ts',
      code: `import { defineEntity, number, hasOne } from 'archetype-engine'

export const OrderItem = defineEntity('OrderItem', {
  fields: {
    quantity: number().required().integer().min(1).label('Quantity'),
    unitPrice: number().required().positive().label('Unit Price'),
    total: number().required().positive().label('Total'),
  },
  relations: {
    order: hasOne('Order'),
    product: hasOne('Product'),
  },
  behaviors: {
    timestamps: true,
  },
  protected: 'all',
})
`
    },
  ],
}

/**
 * Blog/CMS Template
 * Perfect for: Blogs, news sites, content platforms
 */
export const blogTemplate: EntityTemplate = {
  id: 'blog',
  name: 'Blog/CMS',
  description: 'Post, Author, Comment entities for content management',
  entities: [
    {
      filename: 'author.ts',
      code: `import { defineEntity, text, hasMany } from 'archetype-engine'

export const Author = defineEntity('Author', {
  fields: {
    email: text().required().email().unique().label('Email'),
    name: text().required().min(2).max(100).label('Name'),
    bio: text().optional().max(500).label('Bio'),
    avatar: text().optional().url().label('Avatar URL'),
  },
  relations: {
    posts: hasMany('Post'),
  },
  behaviors: {
    timestamps: true,
  },
  protected: 'write',
})
`
    },
    {
      filename: 'post.ts',
      code: `import { defineEntity, text, boolean, date, enumField, hasOne, hasMany } from 'archetype-engine'

export const Post = defineEntity('Post', {
  fields: {
    title: text().required().min(1).max(200).label('Title'),
    slug: text().required().unique().regex(/^[a-z0-9-]+$/).label('URL Slug'),
    excerpt: text().optional().max(500).label('Excerpt'),
    content: text().required().label('Content'),
    status: enumField(['draft', 'published', 'archived'] as const).default('draft').label('Status'),
    publishedAt: date().optional().label('Published Date'),
    featured: boolean().default(false).label('Featured'),
  },
  relations: {
    author: hasOne('Author'),
    comments: hasMany('Comment'),
  },
  behaviors: {
    timestamps: true,
    softDelete: true,
  },
  protected: 'write',
})
`
    },
    {
      filename: 'comment.ts',
      code: `import { defineEntity, text, boolean, hasOne } from 'archetype-engine'

export const Comment = defineEntity('Comment', {
  fields: {
    content: text().required().min(1).max(2000).label('Comment'),
    authorName: text().required().min(2).max(100).label('Name'),
    authorEmail: text().required().email().label('Email'),
    isApproved: boolean().default(false).label('Approved'),
  },
  relations: {
    post: hasOne('Post'),
  },
  behaviors: {
    timestamps: true,
    softDelete: true,
  },
  protected: 'write',
})
`
    },
  ],
}

/**
 * Task Management Template
 * Perfect for: Todo apps, project management, kanban boards
 */
export const taskTemplate: EntityTemplate = {
  id: 'task',
  name: 'Task Management',
  description: 'Project, Task, Label entities for productivity apps',
  entities: [
    {
      filename: 'project.ts',
      code: `import { defineEntity, text, enumField, hasMany } from 'archetype-engine'

export const Project = defineEntity('Project', {
  fields: {
    name: text().required().min(2).max(100).label('Project Name'),
    description: text().optional().max(500).label('Description'),
    status: enumField(['active', 'on-hold', 'completed', 'archived'] as const)
      .default('active')
      .label('Status'),
    color: text().optional().regex(/^#[0-9A-Fa-f]{6}$/).label('Color'),
  },
  relations: {
    tasks: hasMany('Task'),
  },
  behaviors: {
    timestamps: true,
    softDelete: true,
  },
  protected: 'write',
})
`
    },
    {
      filename: 'task.ts',
      code: `import { defineEntity, text, boolean, date, enumField, hasOne, belongsToMany } from 'archetype-engine'

export const Task = defineEntity('Task', {
  fields: {
    title: text().required().min(1).max(200).label('Title'),
    description: text().optional().max(2000).label('Description'),
    status: enumField(['todo', 'in-progress', 'review', 'done'] as const)
      .default('todo')
      .label('Status'),
    priority: enumField(['low', 'medium', 'high', 'urgent'] as const)
      .default('medium')
      .label('Priority'),
    completed: boolean().default(false).label('Completed'),
    dueDate: date().optional().label('Due Date'),
  },
  relations: {
    project: hasOne('Project'),
    labels: belongsToMany('Label'),
  },
  behaviors: {
    timestamps: true,
    softDelete: true,
  },
  protected: 'write',
})
`
    },
    {
      filename: 'label.ts',
      code: `import { defineEntity, text, belongsToMany } from 'archetype-engine'

export const Label = defineEntity('Label', {
  fields: {
    name: text().required().min(1).max(50).label('Label Name'),
    color: text().optional().regex(/^#[0-9A-Fa-f]{6}$/).label('Color'),
  },
  relations: {
    tasks: belongsToMany('Task'),
  },
  behaviors: {
    timestamps: true,
  },
  protected: 'write',
})
`
    },
  ],
}

/**
 * All available templates
 */
export const entityTemplates: EntityTemplate[] = [
  saasTemplate,
  ecommerceTemplate,
  blogTemplate,
  taskTemplate,
]

/**
 * Get template by ID
 */
export function getEntityTemplate(id: string): EntityTemplate | undefined {
  return entityTemplates.find(t => t.id === id)
}
