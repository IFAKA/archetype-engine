// E-commerce example settings

export default {
  database: {
    type: 'postgres' as const,
    url: 'postgresql://localhost:5432/ecommerce',
  },

  auth: {
    enabled: true,
    adapter: 'drizzle' as const,
    providers: ['credentials', 'google', 'github'] as ('credentials' | 'google' | 'github')[],
    sessionStrategy: 'jwt' as const,
  },

  i18n: {
    languages: ['en', 'es', 'fr', 'de', 'pt'],
    defaultLanguage: 'en',
    outputDir: './messages',
  },

  observability: {
    logging: {
      enabled: true,
      level: 'info' as const,
      format: 'json' as const,
    },
    audit: {
      enabled: true,
      entity: 'AuditLog',
    },
  },

  tenancy: {
    enabled: true,
    field: 'storeId',
  },

  defaults: {
    timestamps: true,
    softDelete: true,
    audit: false,
  },
}
