import React, { useEffect, useState, useCallback, useRef } from 'react'
import MiniSearch from 'minisearch'
import styles from './SearchModal.module.css'

interface SearchResult {
  id: number
  title: string
  path: string
  description: string
  score: number
}

interface SearchModalProps {
  onClose: () => void
}

export function SearchModal({ onClose }: SearchModalProps) {
  const [miniSearch, setMiniSearch] = useState<MiniSearch | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load search index
  useEffect(() => {
    fetch('/search-index.json')
      .then(r => r.text())
      .then(index => {
        const ms = MiniSearch.loadJSON(index, {
          fields: ['title', 'headings', 'content', 'description'],
          storeFields: ['title', 'path', 'description']
        })
        setMiniSearch(ms)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load search index:', err)
        setLoading(false)
      })
  }, [])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Search function
  const search = useCallback((q: string) => {
    if (!miniSearch || !q.trim()) {
      setResults([])
      setSelectedIndex(0)
      return
    }
    
    const searchResults = miniSearch.search(q, { 
      fuzzy: 0.2,
      prefix: true,
    }).slice(0, 10) as unknown as SearchResult[]
    
    setResults(searchResults)
    setSelectedIndex(0)
  }, [miniSearch])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault()
      window.location.href = results[selectedIndex].path
    }
  }, [results, selectedIndex, onClose])

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            placeholder="Search docs... (Press ESC to close)"
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              search(e.target.value)
            }}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button 
              className={styles.clearButton}
              onClick={() => {
                setQuery('')
                setResults([])
                inputRef.current?.focus()
              }}
            >
              ✕
            </button>
          )}
        </div>

        <div className={styles.results}>
          {loading && (
            <div className={styles.loading}>Loading search index...</div>
          )}
          
          {!loading && query && results.length === 0 && (
            <div className={styles.noResults}>
              No results found for "{query}"
            </div>
          )}
          
          {!loading && !query && (
            <div className={styles.hint}>
              <div className={styles.hintTitle}>Quick tips:</div>
              <ul className={styles.hintList}>
                <li>Type to search across all documentation</li>
                <li>Use ↑↓ arrows to navigate results</li>
                <li>Press Enter to open selected result</li>
                <li>Press ESC to close</li>
              </ul>
            </div>
          )}
          
          {results.map((result, index) => (
            <a
              key={result.id}
              href={result.path}
              className={`${styles.result} ${index === selectedIndex ? styles.selected : ''}`}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className={styles.resultTitle}>{result.title}</div>
              {result.description && (
                <div className={styles.resultDescription}>
                  {result.description}
                </div>
              )}
              <div className={styles.resultPath}>{result.path}</div>
            </a>
          ))}
        </div>

        <div className={styles.footer}>
          <div className={styles.footerHint}>
            <kbd>↑</kbd><kbd>↓</kbd> Navigate
            <kbd>↵</kbd> Open
            <kbd>ESC</kbd> Close
          </div>
        </div>
      </div>
    </div>
  )
}
