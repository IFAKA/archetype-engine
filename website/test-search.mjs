#!/usr/bin/env node

/**
 * Test search functionality
 */

import fs from 'fs'
import MiniSearch from 'minisearch'

console.log('🔍 Testing search functionality...\n')

// Load the index
const indexData = fs.readFileSync('static/search-index.json', 'utf-8')

// Initialize MiniSearch
const miniSearch = MiniSearch.loadJSON(indexData, {
  fields: ['title', 'headings', 'content', 'description'],
  storeFields: ['title', 'path', 'description']
})

console.log(`✅ Loaded search index with ${indexData.documentCount} documents\n`)

// Test queries
const testQueries = [
  'entity',
  'field',
  'relation',
  'authentication',
  'defineEntity',
  'text().required()',
  'hasMany',
  'hooks',
  'filtering',
]

testQueries.forEach(query => {
  const results = miniSearch.search(query, {
    fuzzy: 0.2,
    prefix: true,
  }).slice(0, 5)
  
  console.log(`Query: "${query}"`)
  console.log(`Results: ${results.length}`)
  
  if (results.length > 0) {
    results.forEach((result, idx) => {
      console.log(`  ${idx + 1}. ${result.title} - ${result.path} (score: ${result.score.toFixed(2)})`)
    })
  } else {
    console.log('  ❌ NO RESULTS FOUND')
  }
  
  console.log('')
})

console.log('✅ Search test complete!')
