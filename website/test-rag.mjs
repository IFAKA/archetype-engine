#!/usr/bin/env node

/**
 * Test RAG (Retrieval Augmented Generation) functionality
 * This simulates what the AI chat does to get context
 */

import fs from 'fs'
import MiniSearch from 'minisearch'

console.log('🤖 Testing RAG functionality...\n')

// Load the index (same as AIChat component)
const indexData = fs.readFileSync('static/search-index.json', 'utf-8')

const miniSearch = MiniSearch.loadJSON(indexData, {
  fields: ['title', 'headings', 'content', 'description'],
  storeFields: ['title', 'path', 'description']
})

console.log('✅ Loaded search index\n')

// Simulate what getRelevantDocs does
function getRelevantDocs(query) {
  const results = miniSearch.search(query, {
    fuzzy: 0.2,
    prefix: true,
  }).slice(0, 3)
  
  if (results.length === 0) return ''
  
  const context = results.map(result => {
    return `## ${result.title}\nPath: ${result.path}\n${result.description || ''}\n`
  }).join('\n\n')
  
  return context
}

// Test queries that a user might ask
const userQueries = [
  'How do I create an entity?',
  'What are relations?',
  'How to add authentication?',
  'Tell me about hooks',
  'How to filter data?',
]

userQueries.forEach(query => {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`USER QUERY: "${query}"`)
  console.log('='.repeat(60))
  
  const context = getRelevantDocs(query)
  
  if (context) {
    console.log('\n📚 DOCS CONTEXT THAT WILL BE SENT TO AI:\n')
    console.log(context)
  } else {
    console.log('\n❌ NO CONTEXT FOUND - AI will say "I don\'t have information about that"\n')
  }
})

console.log('\n' + '='.repeat(60))
console.log('✅ RAG test complete!')
console.log('='.repeat(60))
