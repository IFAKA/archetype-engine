import { useState, type ReactNode } from 'react'
import Link from '@docusaurus/Link'
import Layout from '@theme/Layout'
import CodeBlock from '@theme/CodeBlock'

import styles from './index.module.css'

// Input code example
const inputCode = `const Product = defineEntity('Product', {
  fields: {
    name: text().required(),
    price: number().positive(),
    description: text().optional(),
  },
  relations: {
    reviews: hasMany('Review'),
  },
  behaviors: { timestamps: true },
})`

// Generated code examples for each output
const generatedCode = {
  fullStack: {
    database: `import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  price: integer('price').notNull(),
  description: text('description'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})`,
    validation: `import { z } from 'zod'

export const productCreateSchema = z.object({
  name: z.string().min(1, { message: 'name is required' }),
  price: z.number().positive({ message: 'price must be positive' }),
  description: z.string().optional(),
})

export const productUpdateSchema = productCreateSchema.partial()

export type ProductCreate = z.input<typeof productCreateSchema>
export type ProductUpdate = z.input<typeof productUpdateSchema>`,
    api: `import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '@/server/trpc'
import { db } from '@/server/db'
import { products } from '@/generated/db/schema'
import { productCreateSchema, productUpdateSchema } from '@/generated/schemas/product'
import { eq, and, count, like, asc, desc, type SQL } from 'drizzle-orm'

// List input schema with pagination, filtering, sorting, and search
const listInput = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  where: z.object({
    name: z.union([z.string(), z.object({
      eq: z.string().optional(),
      contains: z.string().optional(),
      startsWith: z.string().optional(),
    })]).optional(),
    price: z.union([z.number(), z.object({
      eq: z.number().optional(),
      gt: z.number().optional(),
      lt: z.number().optional(),
    })]).optional(),
  }).optional(),
  orderBy: z.object({
    field: z.enum(['name', 'price', 'createdAt', 'updatedAt']),
    direction: z.enum(['asc', 'desc']).default('asc'),
  }).optional(),
  search: z.string().optional(),
}).optional()

export const productRouter = router({
  // List Products with pagination, filtering, sorting, and search
  list: publicProcedure
    .input(listInput)
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1
      const limit = input?.limit ?? 20
      const offset = (page - 1) * limit

      const filterConditions = buildFilters(input?.where)
      const searchCondition = buildSearch(input?.search)
      const orderByClause = buildOrderBy(input?.orderBy)

      const allConditions = [...filterConditions]
      if (searchCondition) allConditions.push(searchCondition)
      const whereClause = allConditions.length > 0 ? and(...allConditions) : undefined

      let query = db.select().from(products)
      if (whereClause) query = query.where(whereClause) as typeof query
      if (orderByClause) query = query.orderBy(orderByClause) as typeof query

      const items = await query.limit(limit).offset(offset)

      let countQuery = db.select({ total: count() }).from(products)
      if (whereClause) countQuery = countQuery.where(whereClause) as typeof countQuery
      const [{ total }] = await countQuery

      return { items, total, page, limit, hasMore: offset + items.length < total }
    }),

  // Get single Product by ID
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await db.select().from(products)
        .where(eq(products.id, input.id))
        .limit(1)
      return result[0] ?? null
    }),

  // Create new Product
  create: protectedProcedure
    .input(productCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString()
      const result = await db.insert(products).values({
        id: crypto.randomUUID(),
        ...input,
        createdAt: now,
        updatedAt: now,
      }).returning()
      return result[0]
    }),

  // Update Product
  update: protectedProcedure
    .input(z.object({ id: z.string(), data: productUpdateSchema }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.update(products)
        .set({ ...input.data, updatedAt: new Date().toISOString() })
        .where(eq(products.id, input.id))
        .returning()
      return result[0]
    }),

  // Remove Product
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.delete(products)
        .where(eq(products.id, input.id))
        .returning()
      return result[0]
    }),

  // Batch operations: createMany, updateMany, removeMany
  createMany: protectedProcedure
    .input(z.object({ items: z.array(productCreateSchema).min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString()
      const values = input.items.map(item => ({
        id: crypto.randomUUID(),
        ...item,
        createdAt: now,
        updatedAt: now,
      }))
      const result = await db.insert(products).values(values).returning()
      return { created: result, count: result.length }
    }),
})`,
    hooks: `'use client'

import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { trpc } from '@/lib/trpc'
import { productCreateSchema, productUpdateSchema, ProductCreate, ProductUpdate } from '@/generated/schemas/product'

// Filter operators for Product
export interface ProductFilter {
  name?: string | { eq?: string; contains?: string; startsWith?: string; endsWith?: string }
  price?: number | { eq?: number; gt?: number; gte?: number; lt?: number; lte?: number }
  description?: string | { eq?: string; contains?: string }
}

// OrderBy options for Product
export interface ProductOrderBy {
  field: 'name' | 'price' | 'description' | 'createdAt' | 'updatedAt'
  direction?: 'asc' | 'desc'
}

// List with pagination, filtering, sorting, and search
export interface UseProductsOptions {
  page?: number
  limit?: number
  where?: ProductFilter
  orderBy?: ProductOrderBy
  search?: string
}

export function useProducts(options?: UseProductsOptions) {
  return trpc.product.list.useQuery({
    page: options?.page ?? 1,
    limit: options?.limit ?? 20,
    where: options?.where,
    orderBy: options?.orderBy,
    search: options?.search,
  })
}

export function useProduct(id: string) {
  return trpc.product.get.useQuery({ id }, { enabled: !!id })
}

export function useProductForm() {
  const utils = trpc.useUtils()

  const form = useForm<ProductCreate>({
    resolver: zodResolver(productCreateSchema),
  })

  const mutation = trpc.product.create.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate()
      form.reset()
    },
  })

  return {
    ...form,
    submit: form.handleSubmit((data) => mutation.mutate(data)),
    isPending: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  }
}

export function useProductEditForm(id: string) {
  const utils = trpc.useUtils()
  const { data: product, isLoading } = trpc.product.get.useQuery({ id })

  const mutation = trpc.product.update.useMutation({
    onSuccess: () => utils.product.invalidate(),
  })

  const form = useForm<ProductUpdate>({
    resolver: zodResolver(productUpdateSchema),
    values: product as ProductUpdate | undefined,
  })

  return {
    ...form,
    submit: form.handleSubmit((data) => mutation.mutate({ id, data })),
    isPending: mutation.isPending,
    isLoading,
    error: mutation.error,
  }
}

export function useProductRemove() {
  const utils = trpc.useUtils()
  const mutation = trpc.product.remove.useMutation({
    onSuccess: () => utils.product.list.invalidate(),
  })

  return {
    remove: (id: string) => mutation.mutate({ id }),
    isPending: mutation.isPending,
    error: mutation.error,
  }
}

export function useCreateProduct() {
  const utils = trpc.useUtils()
  return trpc.product.create.useMutation({
    onSuccess: () => utils.product.list.invalidate(),
  })
}

export function useUpdateProduct() {
  const utils = trpc.useUtils()
  return trpc.product.update.useMutation({
    onSuccess: () => utils.product.invalidate(),
  })
}

// Batch operations
export function useCreateManyProducts() {
  const utils = trpc.useUtils()
  const mutation = trpc.product.createMany.useMutation({
    onSuccess: () => utils.product.list.invalidate(),
  })
  return { createMany: (items: ProductCreate[]) => mutation.mutate({ items }), ...mutation }
}`,
    auth: `// src/server/auth.ts
import NextAuth from 'next-auth'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import { db } from './db'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
})`,
  },
  headless: {
    validation: `import { z } from 'zod'

export const productCreateSchema = z.object({
  name: z.string().min(1, { message: 'name is required' }),
  price: z.number().positive({ message: 'price must be positive' }),
  description: z.string().optional(),
})

export const productUpdateSchema = productCreateSchema.partial()

export type ProductCreate = z.input<typeof productCreateSchema>
export type ProductUpdate = z.input<typeof productUpdateSchema>`,
    services: `import { apiClient } from './apiClient'
import type { ProductCreate, ProductUpdate } from '../schemas/product'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL!

export interface ProductListParams {
  page?: number
  limit?: number
  [key: string]: unknown
}

export const productService = {
  /**
   * List all Products
   */
  async list(params?: ProductListParams) {
    const response = await apiClient.get<Product[]>(BASE_URL, '/products', { params })
    return response.data
  },

  /**
   * Get a single Product by ID
   */
  async get(id: string) {
    const response = await apiClient.get<Product>(BASE_URL, \`/products/\${id}\`)
    return response.data
  },

  /**
   * Create a new Product
   */
  async create(data: ProductCreate) {
    const response = await apiClient.post<Product>(BASE_URL, '/products', data)
    return response.data
  },

  /**
   * Update an existing Product
   */
  async update(id: string, data: ProductUpdate) {
    const response = await apiClient.put<Product>(BASE_URL, \`/products/\${id}\`, data)
    return response.data
  },

  /**
   * Delete a Product
   */
  async delete(id: string) {
    const response = await apiClient.delete<void>(BASE_URL, \`/products/\${id}\`)
    return response.data
  },
}

export interface Product extends ProductCreate {
  id: string
}`,
    api: `import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '@/server/trpc'
import { productService } from '@/generated/services/productService'
import { productCreateSchema, productUpdateSchema } from '@/generated/schemas/product'

const listInput = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  where: z.object({
    name: z.string().optional(),
    price: z.number().optional(),
  }).optional(),
  search: z.string().optional(),
}).optional()

export const productRouter = router({
  list: publicProcedure
    .input(listInput)
    .query(async ({ input }) => {
      const page = input?.page ?? 1
      const limit = input?.limit ?? 20
      return productService.list({ page, limit, where: input?.where, search: input?.search })
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return productService.get(input.id)
    }),

  create: protectedProcedure
    .input(productCreateSchema)
    .mutation(async ({ input }) => {
      return productService.create(input)
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: productUpdateSchema }))
    .mutation(async ({ input }) => {
      return productService.update(input.id, input.data)
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return productService.delete(input.id)
    }),
})`,
    hooks: `'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { trpc } from '@/lib/trpc'
import { productCreateSchema, productUpdateSchema, ProductCreate, ProductUpdate } from '@/generated/schemas/product'

export interface UseProductsOptions {
  page?: number
  limit?: number
  where?: { name?: string; price?: number }
  search?: string
}

export function useProducts(options?: UseProductsOptions) {
  return trpc.product.list.useQuery({
    page: options?.page ?? 1,
    limit: options?.limit ?? 20,
    where: options?.where,
    search: options?.search,
  })
}

export function useProduct(id: string) {
  return trpc.product.get.useQuery({ id }, { enabled: !!id })
}

export function useProductForm() {
  const utils = trpc.useUtils()

  const form = useForm<ProductCreate>({
    resolver: zodResolver(productCreateSchema),
  })

  const mutation = trpc.product.create.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate()
      form.reset()
    },
  })

  return {
    ...form,
    submit: form.handleSubmit((data) => mutation.mutate(data)),
    isPending: mutation.isPending,
    error: mutation.error,
  }
}

export function useCreateProduct() {
  const utils = trpc.useUtils()
  return trpc.product.create.useMutation({
    onSuccess: () => utils.product.list.invalidate(),
  })
}

export function useUpdateProduct() {
  const utils = trpc.useUtils()
  return trpc.product.update.useMutation({
    onSuccess: () => utils.product.invalidate(),
  })
}`,
  },
}

type Mode = 'fullStack' | 'headless'

interface OutputItem {
  key: string
  label: string
  desc: string
}

const outputItems: Record<Mode, OutputItem[]> = {
  fullStack: [
    { key: 'database', label: 'Database', desc: 'Drizzle schema' },
    { key: 'validation', label: 'Validation', desc: 'Zod schemas' },
    { key: 'api', label: 'API', desc: 'tRPC routers' },
    { key: 'hooks', label: 'Hooks', desc: 'React Query' },
    { key: 'auth', label: 'Auth', desc: 'NextAuth.js' },
  ],
  headless: [
    { key: 'validation', label: 'Validation', desc: 'Zod schemas' },
    { key: 'services', label: 'Services', desc: 'API clients' },
    { key: 'api', label: 'API', desc: 'tRPC routers' },
    { key: 'hooks', label: 'Hooks', desc: 'React Query' },
  ],
}

function Hero() {
  return (
    <section className={styles.hero}>
      <h1 className={styles.title}>Archetype</h1>
      <p className={styles.tagline}>Define once. Generate everything.</p>
      <Link className={styles.cta} to="/docs">
        Get Started
      </Link>
    </section>
  )
}

interface CodeModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  code: string
}

function CodeModal({ isOpen, onClose, title, code }: CodeModalProps) {
  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>{title} <span style={{ opacity: 0.5, fontWeight: 400 }}>(Do not edit manually)</span></span>
          <button className={styles.modalClose} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles.modalBody}>
          <CodeBlock language="typescript">{code}</CodeBlock>
        </div>
      </div>
    </div>
  )
}

function ShowTheMagic() {
  const [mode, setMode] = useState<Mode>('fullStack')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalContent, setModalContent] = useState({ title: '', code: '' })

  const handleItemClick = (item: OutputItem) => {
    const code = generatedCode[mode][item.key as keyof (typeof generatedCode)[typeof mode]]
    if (code) {
      setModalContent({ title: `Generated ${item.label}`, code })
      setModalOpen(true)
    }
  }

  return (
    <section className={styles.magic}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${mode === 'fullStack' ? styles.tabActive : ''}`}
          onClick={() => setMode('fullStack')}
        >
          Full Stack
        </button>
        <button
          className={`${styles.tab} ${mode === 'headless' ? styles.tabActive : ''}`}
          onClick={() => setMode('headless')}
        >
          Headless
        </button>
      </div>

      <div className={styles.magicGrid}>
        <div className={styles.input}>
          <span className={styles.label}>You write</span>
          <CodeBlock language="typescript">{inputCode}</CodeBlock>
        </div>
        <div className={styles.arrow}>
          <span className={styles.arrowIcon}>→</span>
        </div>
        <div className={styles.output}>
          <span className={styles.label}>You get</span>
          <div className={styles.outputList}>
            {outputItems[mode].map((item) => (
              <button
                key={item.key}
                className={styles.outputItem}
                onClick={() => handleItemClick(item)}
              >
                <span className={styles.outputLabel}>{item.label}</span>
                <span className={styles.outputDesc}>{item.desc}</span>
                <span className={styles.outputArrow}>→</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <CodeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalContent.title}
        code={modalContent.code}
      />
    </section>
  )
}

function Features() {
  return (
    <section className={styles.features}>
      <div className={styles.feature}>
        <span className={styles.featureIcon}>ts</span>
        <span className={styles.featureText}>Type-safe end to end</span>
      </div>
      <div className={styles.feature}>
        <span className={styles.featureIcon}>0</span>
        <span className={styles.featureText}>Zero boilerplate</span>
      </div>
      <div className={styles.feature}>
        <span className={styles.featureIcon}>*</span>
        <span className={styles.featureText}>Filtering, pagination, batch ops</span>
      </div>
    </section>
  )
}

function QuickStart() {
  return (
    <section className={styles.quickstart}>
      <code className={styles.command}>npx archetype init</code>
    </section>
  )
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="Declarative Data Engine"
      description="Define entities, generate everything. Type-safe CRUD infrastructure for TypeScript."
    >
      <main className={styles.main}>
        <Hero />
        <ShowTheMagic />
        <Features />
        <QuickStart />
      </main>
    </Layout>
  )
}
