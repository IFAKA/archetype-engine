#!/usr/bin/env node

import fs from 'fs'
import MiniSearch from 'minisearch'

const indexData = fs.readFileSync('static/search-index.json', 'utf-8')

const miniSearch = MiniSearch.loadJSON(indexData, {
  fields: ['title', 'headings', 'content', 'description'],
  storeFields: ['title', 'path', 'description']
})

function getRelevantDocs(query) {
  const results = miniSearch.search(query, {
    fuzzy: 0.2,
    prefix: true,
  }).slice(0, 3)
  
  if (results.length === 0) return ''
  
  const context = results.map(result => {
    return `## ${result.title}\n[View documentation](${result.path})\n\n${result.description || ''}\n`
  }).join('\n\n')
  
  return context
}

console.log('🔗 Testing RAG with clickable links...\n')
console.log('USER: "How do I create an entity?"\n')
console.log('CONTEXT SENT TO AI:\n')
console.log(getRelevantDocs('create entity'))
console.log('\n' + '='.repeat(60))
console.log('\nNOTE: The AI will see markdown links like [View documentation](/docs/entities)')
console.log('These will render as clickable links in the chat!')
