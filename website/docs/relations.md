---
sidebar_position: 5
---

# Relations

Relations define how entities connect to each other. Archetype supports three relation types that generate foreign keys, junction tables, and proper TypeScript types.

## Relation Types

### belongsTo()

Creates a foreign key to another entity. Use for "many-to-one" or "one-to-one" relationships.

```typescript
import { defineEntity, text, belongsTo } from 'archetype-engine'

export const Post = defineEntity('Post', {
  fields: {
    title: text().required(),
  },
  relations: {
    author: belongsTo('User'),      // Creates author_id column
    category: belongsTo('Category'), // Creates category_id column
  },
})
```

**Generated schema:**
```typescript
export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  authorId: text('author_id').references(() => users.id),
  categoryId: text('category_id').references(() => categories.id),
})
```

### hasOne()

Indicates a one-to-one relationship. Creates a foreign key on the related entity.

```typescript
export const User = defineEntity('User', {
  fields: {
    email: text().required().email(),
  },
  relations: {
    profile: hasOne('Profile'),  // Profile has userId column
  },
})

export const Profile = defineEntity('Profile', {
  fields: {
    bio: text().optional(),
  },
  relations: {
    user: belongsTo('User'),  // Creates user_id column
  },
})
```

### hasMany()

Indicates a one-to-many relationship. No column created on this entity.

```typescript
export const User = defineEntity('User', {
  fields: {
    name: text().required(),
  },
  relations: {
    posts: hasMany('Post'),    // User has many posts
    comments: hasMany('Comment'),
  },
})
```

### belongsToMany()

Creates a many-to-many relationship with a junction table.

```typescript
export const Post = defineEntity('Post', {
  fields: {
    title: text().required(),
  },
  relations: {
    tags: belongsToMany('Tag'),  // Creates post_tags junction table
  },
})

export const Tag = defineEntity('Tag', {
  fields: {
    name: text().required(),
  },
  relations: {
    posts: belongsToMany('Post'),  // References same junction table
  },
})
```

**Generated junction table:**
```typescript
export const postTags = sqliteTable('post_tags', {
  postId: text('post_id').notNull().references(() => posts.id),
  tagId: text('tag_id').notNull().references(() => tags.id),
})
```

## Optional Relations

By default, `belongsTo` creates a required foreign key. Make it optional:

```typescript
relations: {
  category: belongsTo('Category').optional(),  // category_id can be null
}
```

## Pivot Data with through()

For many-to-many relations that need extra data on the junction, use `.through()`:

```typescript
export const Order = defineEntity('Order', {
  fields: {
    orderNumber: text().required(),
  },
  relations: {
    products: belongsToMany('Product').through({
      table: 'order_items',  // Optional custom table name
      fields: {
        quantity: number().required().min(1),
        unitPrice: number().required(),
        discount: number().default(0),
      },
    }),
  },
})
```

**Generated junction table:**
```typescript
export const orderItems = sqliteTable('order_items', {
  orderId: text('order_id').notNull().references(() => orders.id),
  productId: text('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
  discount: integer('discount').default(0),
})
```

## Example: E-commerce Schema

```typescript
export const Customer = defineEntity('Customer', {
  fields: {
    email: text().required().email(),
    name: text().required(),
  },
  relations: {
    orders: hasMany('Order'),
    addresses: hasMany('Address'),
  },
})

export const Order = defineEntity('Order', {
  fields: {
    orderNumber: text().required().unique(),
    total: number().required(),
    status: text().default('pending'),
  },
  relations: {
    customer: belongsTo('Customer'),
    shippingAddress: belongsTo('Address').optional(),
    items: hasMany('OrderItem'),
  },
})

export const Product = defineEntity('Product', {
  fields: {
    name: text().required(),
    price: number().required().positive(),
  },
  relations: {
    category: belongsTo('Category'),
    orderItems: hasMany('OrderItem'),
  },
})

export const OrderItem = defineEntity('OrderItem', {
  fields: {
    quantity: number().required().integer().min(1),
    unitPrice: number().required(),
  },
  relations: {
    order: belongsTo('Order'),
    product: belongsTo('Product'),
  },
})
```
