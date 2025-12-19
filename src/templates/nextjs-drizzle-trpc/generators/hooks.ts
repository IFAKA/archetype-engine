// React hooks generator with React Hook Form integration

import type { Generator, GeneratedFile } from '../../../template/types'
import type { GeneratorContext } from '../../../template/context'
import type { ManifestIR } from '../../../manifest'
import type { EntityIR } from '../../../entity'

function generateEntityHooks(entity: EntityIR, manifest: ManifestIR): string {
  const name = entity.name
  const lowerName = name.toLowerCase()
  const useI18n = manifest.i18n.languages.length > 1

  // Schema imports
  const schemaImport = useI18n
    ? `import { ${lowerName}CreateSchemaI18n, ${lowerName}UpdateSchemaI18n, ${name}Create, ${name}Update } from '@/generated/schemas/${lowerName}'`
    : `import { ${lowerName}CreateSchema, ${lowerName}UpdateSchema, ${name}Create, ${name}Update } from '@/generated/schemas/${lowerName}'`

  const i18nImport = useI18n
    ? `import { useTranslations } from 'next-intl'`
    : ''

  const tDeclaration = useI18n
    ? `  const t = useTranslations('validation')`
    : ''

  const resolverSchema = useI18n
    ? `${lowerName}CreateSchemaI18n(t)`
    : `${lowerName}CreateSchema`

  const updateResolverSchema = useI18n
    ? `${lowerName}UpdateSchemaI18n(t)`
    : `${lowerName}UpdateSchema`

  return `// Auto-generated hooks for ${name}
// Do not edit manually - regenerate with: npx archetype generate

'use client'

import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { trpc } from '@/lib/trpc'
${i18nImport}
${schemaImport}

// Convert null values to undefined for form compatibility
type NullToUndefined<T> = {
  [K in keyof T]: T[K] extends null ? undefined : Exclude<T[K], null>
}

function nullToUndefined<T extends Record<string, unknown>>(
  obj: T | null | undefined
): NullToUndefined<T> | undefined {
  if (!obj) return undefined
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === null ? undefined : v])
  ) as NullToUndefined<T>
}

// ============ LIST ============
export function use${name}s() {
  return trpc.${lowerName}.list.useQuery()
}

// ============ GET ============
export function use${name}(id: string) {
  return trpc.${lowerName}.get.useQuery({ id }, {
    enabled: !!id,
  })
}

// ============ CREATE FORM ============
export function use${name}Form() {
${tDeclaration}
  const utils = trpc.useUtils()

  const form = useForm<${name}Create>({
    resolver: zodResolver(${resolverSchema}),
  })

  const mutation = trpc.${lowerName}.create.useMutation({
    onSuccess: () => {
      utils.${lowerName}.list.invalidate()
      form.reset()
    },
  })

  return {
    ...form,
    submit: form.handleSubmit((data) => mutation.mutate(data)),
    isPending: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    reset: () => {
      form.reset()
      mutation.reset()
    },
  }
}

// ============ EDIT FORM ============
export function use${name}EditForm(id: string) {
${tDeclaration}
  const utils = trpc.useUtils()
  const { data: ${lowerName}, isLoading } = trpc.${lowerName}.get.useQuery({ id })

  const mutation = trpc.${lowerName}.update.useMutation({
    onSuccess: () => {
      utils.${lowerName}.invalidate()
    },
  })

  const formValues = useMemo(() => nullToUndefined(${lowerName}), [${lowerName}])

  const form = useForm<${name}Update>({
    resolver: zodResolver(${updateResolverSchema}),
    values: formValues,
  })

  return {
    ...form,
    submit: form.handleSubmit((data) => mutation.mutate({ id, data })),
    isPending: mutation.isPending,
    isLoading,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  }
}

// ============ DELETE ============
export function use${name}Delete() {
  const utils = trpc.useUtils()
  const mutation = trpc.${lowerName}.delete.useMutation({
    onSuccess: () => {
      utils.${lowerName}.list.invalidate()
    },
  })

  return {
    delete: (id: string) => mutation.mutate({ id }),
    isPending: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  }
}

// ============ CREATE MUTATION (without form) ============
export function useCreate${name}() {
  const utils = trpc.useUtils()
  return trpc.${lowerName}.create.useMutation({
    onSuccess: () => {
      utils.${lowerName}.list.invalidate()
    },
  })
}

// ============ UPDATE MUTATION (without form) ============
export function useUpdate${name}() {
  const utils = trpc.useUtils()
  return trpc.${lowerName}.update.useMutation({
    onSuccess: () => {
      utils.${lowerName}.invalidate()
    },
  })
}
`
}

export const hooksGenerator: Generator = {
  name: 'react-hooks',
  description: 'Generate React hooks with React Hook Form integration',

  generate(manifest: ManifestIR, ctx: GeneratorContext): GeneratedFile[] {
    return manifest.entities.map(entity => ({
      path: `hooks/use${entity.name}.ts`,
      content: generateEntityHooks(entity, manifest),
    }))
  },
}
