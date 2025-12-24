#!/usr/bin/env node

/**
 * Build search index from markdown docs
 * Generates static/search-index.json for client-side search
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { globSync } from 'glob'
import matter from 'gray-matter'
import MiniSearch from 'minisearch'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DOCS_DIR = path.join(__dirname, '../docs')
const OUTPUT_FILE = path.join(__dirname, '../static/search-index.json')

function extractHeadings(content) {
  const headings = []
  const lines = content.split('\n')
  
  for (const line of lines) {
    const match = line.match(/^#{1,6}\s+(.+)$/)
    if (match) {
      headings.push(match[1].replace(/[#*`]/g, '').trim())
    }
  }
  
  return headings.join(' ')
}

function cleanContent(content) {
  // Remove code blocks
  content = content.replace(/```[\s\S]*?```/g, '')
  // Remove inline code
  content = content.replace(/`[^`]+`/g, '')
  // Remove markdown links but keep text
  content = content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  // Remove markdown formatting
  content = content.replace(/[*_~]/g, '')
  // Remove multiple spaces
  content = content.replace(/\s+/g, ' ')
  
  return content.trim()
}

function buildSearchIndex() {
  console.log('🔍 Building search index...')
  
  // Find all markdown files
  const docFiles = globSync('**/*.md', { cwd: DOCS_DIR })
  console.log(`📄 Found ${docFiles.length} docs`)
  
  const documents = []
  
  for (let i = 0; i < docFiles.length; i++) {
    const filePath = path.join(DOCS_DIR, docFiles[i])
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(fileContent)
    
    // Extract first paragraph as description
    const paragraphs = content.split('\n\n')
    const description = paragraphs.find(p => p.trim() && !p.startsWith('#'))?.slice(0, 200) || ''
    
    // Build doc path for links
    const docPath = '/docs/' + docFiles[i].replace('.md', '')
    
    documents.push({
      id: i,
      path: docPath,
      title: data.title || data.sidebar_label || extractHeadings(content).split(' ')[0] || docFiles[i],
      headings: extractHeadings(content),
      content: cleanContent(content),
      description: cleanContent(description),
    })
  }
  
  console.log(`📝 Indexed ${documents.length} documents`)
  
  // Create search index
  const miniSearch = new MiniSearch({
    fields: ['title', 'headings', 'content', 'description'],
    storeFields: ['title', 'path', 'description'],
    searchOptions: {
      boost: { title: 3, headings: 2, description: 1.5 },
      fuzzy: 0.2,
      prefix: true,
    }
  })
  
  miniSearch.addAll(documents)
  
  // Save to static directory
  const indexData = miniSearch.toJSON()
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(indexData))
  
  console.log(`✅ Search index saved to ${OUTPUT_FILE}`)
  console.log(`📊 Index size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB`)
}

// Create static directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, '../static'))) {
  fs.mkdirSync(path.join(__dirname, '../static'))
}

buildSearchIndex()
