// TUI prompts for archetype init

import * as p from '@clack/prompts'
import type { DatabaseType, ModeType, InitConfig, AuthProvider } from './dependencies'
import { listTemplates } from '../template/registry'

export async function runPrompts(): Promise<InitConfig | null> {
  p.intro('Welcome to Archetype!')

  // Get available templates from registry
  const templates = listTemplates()

  if (templates.length === 0) {
    p.cancel('No templates available.')
    return null
  }

  // First, ask which template to use
  const template = await p.select({
    message: 'Which template would you like to use?',
    options: templates.map(t => ({
      value: t.id,
      label: t.name,
      hint: t.description,
    })),
  })

  if (p.isCancel(template)) {
    p.cancel('Setup cancelled.')
    return null
  }

  // Ask for mode (full or headless)
  const mode = await p.select({
    message: 'What type of project are you building?',
    options: [
      { value: 'full', label: 'Full Stack', hint: 'Local database with Drizzle ORM' },
      { value: 'headless', label: 'Headless', hint: 'External APIs, no local database' },
    ],
  })

  if (p.isCancel(mode)) {
    p.cancel('Setup cancelled.')
    return null
  }

  let database: DatabaseType | undefined
  let externalApiUrl: string | undefined

  if (mode === 'full') {
    // Full mode: ask for database
    const dbChoice = await p.select({
      message: 'Which database would you like to use?',
      options: [
        { value: 'sqlite', label: 'SQLite', hint: 'Simple, file-based, great for development' },
        { value: 'postgres', label: 'PostgreSQL', hint: 'Production-ready, full-featured' },
        { value: 'mysql', label: 'MySQL', hint: 'Widely used, good performance' },
      ],
    })

    if (p.isCancel(dbChoice)) {
      p.cancel('Setup cancelled.')
      return null
    }

    database = dbChoice as DatabaseType
  } else {
    // Headless mode: ask for API URL (optional)
    const apiUrl = await p.text({
      message: 'External API base URL (or env variable like env:API_URL):',
      placeholder: 'env:API_URL',
      defaultValue: 'env:API_URL',
    })

    if (p.isCancel(apiUrl)) {
      p.cancel('Setup cancelled.')
      return null
    }

    externalApiUrl = apiUrl as string
  }

  const auth = await p.confirm({
    message: 'Do you want to include authentication (next-auth)?',
    initialValue: false,
  })

  if (p.isCancel(auth)) {
    p.cancel('Setup cancelled.')
    return null
  }

  let authProviders: AuthProvider[] | undefined

  if (auth) {
    const providers = await p.multiselect({
      message: 'Select authentication providers:',
      options: [
        { value: 'credentials', label: 'Credentials', hint: 'Email/password login' },
        { value: 'google', label: 'Google', hint: 'OAuth with Google' },
        { value: 'github', label: 'GitHub', hint: 'OAuth with GitHub' },
        { value: 'discord', label: 'Discord', hint: 'OAuth with Discord' },
      ],
      required: true,
      initialValues: ['credentials'],
    })

    if (p.isCancel(providers)) {
      p.cancel('Setup cancelled.')
      return null
    }

    authProviders = providers as AuthProvider[]
  }

  const wantI18n = await p.confirm({
    message: 'Do you want internationalization (i18n) support?',
    initialValue: false,
  })

  if (p.isCancel(wantI18n)) {
    p.cancel('Setup cancelled.')
    return null
  }

  let i18n: string[] | null = null

  if (wantI18n) {
    const languages = await p.multiselect({
      message: 'Select languages to support:',
      options: [
        { value: 'en', label: 'English', hint: 'Default' },
        { value: 'es', label: 'Spanish' },
        { value: 'fr', label: 'French' },
        { value: 'de', label: 'German' },
        { value: 'pt', label: 'Portuguese' },
        { value: 'zh', label: 'Chinese' },
        { value: 'ja', label: 'Japanese' },
        { value: 'ko', label: 'Korean' },
      ],
      required: true,
      initialValues: ['en'],
    })

    if (p.isCancel(languages)) {
      p.cancel('Setup cancelled.')
      return null
    }

    i18n = languages as string[]
  }

  const includeExamples = await p.confirm({
    message: mode === 'headless'
      ? 'Include example entity (Product with external API)?'
      : 'Include example entities (Task)?',
    initialValue: true,
  })

  if (p.isCancel(includeExamples)) {
    p.cancel('Setup cancelled.')
    return null
  }

  return {
    template: template as string,
    mode: mode as ModeType,
    database,
    externalApiUrl,
    auth: auth as boolean,
    authProviders,
    i18n,
    includeExamples: includeExamples as boolean,
  }
}

// Display the configuration summary
export function displayConfigSummary(config: InitConfig): void {
  const lines = [
    `Template: ${config.template}`,
    `Mode: ${config.mode === 'headless' ? 'Headless (external APIs)' : 'Full Stack (local DB)'}`,
  ]

  if (config.mode === 'full' && config.database) {
    lines.push(`Database: ${config.database}`)
  }

  if (config.mode === 'headless' && config.externalApiUrl) {
    lines.push(`API URL: ${config.externalApiUrl}`)
  }

  const authDisplay = config.auth
    ? `Yes (${config.authProviders?.join(', ') || 'credentials'})`
    : 'No'

  lines.push(
    `Authentication: ${authDisplay}`,
    `Internationalization: ${config.i18n ? config.i18n.join(', ') : 'No'}`,
    `Example entities: ${config.includeExamples ? 'Yes' : 'No'}`,
  )

  p.note(lines.join('\n'), 'Configuration')
}

// Display success message and next steps
export function displaySuccess(config: InitConfig): void {
  const authNote = config.auth
    ? `\n\nAuth setup:\n  - Copy .env.example to .env.local\n  - Add your OAuth credentials (if using Google/GitHub/Discord)`
    : ''

  if (config.mode === 'headless') {
    p.outro(`Archetype initialized in headless mode!

Next steps:
  npx archetype generate    # Generate code from entities
  npm run dev               # Start development server

Note: No database setup needed - entities will use external APIs.${authNote}`)
  } else {
    p.outro(`Archetype initialized!

Next steps:
  npx archetype generate    # Generate code from entities
  npx drizzle-kit push      # Create database tables
  npm run dev               # Start development server${authNote}`)
  }
}

// Display error
export function displayError(message: string): void {
  p.cancel(message)
}

// Create a spinner
export function createSpinner() {
  return p.spinner()
}
