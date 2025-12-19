// TUI prompts for archetype init

import * as p from '@clack/prompts'
import type { DatabaseType, InitConfig } from './dependencies'
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

  // Ask for database
  const database = await p.select({
    message: 'Which database would you like to use?',
    options: [
      { value: 'sqlite', label: 'SQLite', hint: 'Simple, file-based, great for development' },
      { value: 'postgres', label: 'PostgreSQL', hint: 'Production-ready, full-featured' },
      { value: 'mysql', label: 'MySQL', hint: 'Widely used, good performance' },
    ],
  })

  if (p.isCancel(database)) {
    p.cancel('Setup cancelled.')
    return null
  }

  const auth = await p.confirm({
    message: 'Do you want to include authentication (next-auth)?',
    initialValue: false,
  })

  if (p.isCancel(auth)) {
    p.cancel('Setup cancelled.')
    return null
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
    message: 'Include example entities (Task)?',
    initialValue: true,
  })

  if (p.isCancel(includeExamples)) {
    p.cancel('Setup cancelled.')
    return null
  }

  return {
    template: template as string,
    database: database as DatabaseType,
    auth: auth as boolean,
    i18n,
    includeExamples: includeExamples as boolean,
  }
}

// Display the configuration summary
export function displayConfigSummary(config: InitConfig): void {
  p.note(
    [
      `Template: ${config.template}`,
      `Database: ${config.database}`,
      `Authentication: ${config.auth ? 'Yes (next-auth)' : 'No'}`,
      `Internationalization: ${config.i18n ? config.i18n.join(', ') : 'No'}`,
      `Example entities: ${config.includeExamples ? 'Yes' : 'No'}`,
    ].join('\n'),
    'Configuration'
  )
}

// Display success message and next steps
export function displaySuccess(): void {
  p.outro(`Archetype initialized!

Next steps:
  npx archetype generate    # Generate code from entities
  npx drizzle-kit push      # Create database tables
  npm run dev               # Start development server`)
}

// Display error
export function displayError(message: string): void {
  p.cancel(message)
}

// Create a spinner
export function createSpinner() {
  return p.spinner()
}
