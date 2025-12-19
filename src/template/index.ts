// Template system exports

export type {
  GeneratedFile,
  Generator,
  GeneratorOutput,
  TemplateMetadata,
  TemplateConfig,
  Template,
} from './types'

export type { GeneratorContext } from './context'
export { createContext } from './context'

export { runTemplate } from './runner'

export {
  getTemplate,
  listTemplates,
  hasTemplate,
} from './registry'
