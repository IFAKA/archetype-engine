import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  docsSidebar: [
    // Quick Start - get running fast
    {
      type: 'category',
      label: 'Quick Start',
      collapsed: false,
      items: ['intro', 'getting-started', 'modes'],
    },

    // Core - the main concepts
    {
      type: 'category',
      label: 'Defining Data',
      items: ['entities', 'fields', 'relations', 'behaviors'],
    },

    // Features - what you can do
    {
      type: 'category',
      label: 'Features',
      items: [
        'authentication',
        'protection',
        'hooks',
        'filtering',
        'batch-operations',
      ],
    },

    // Advanced - for power users
    {
      type: 'category',
      label: 'Advanced',
      collapsed: true,
      items: [
        'computed-fields',
        'enums',
        'json-manifest',
        'external-sources',
        'ai-module',
      ],
    },

    // Reference
    'generated-code',
  ],
}

export default sidebars
