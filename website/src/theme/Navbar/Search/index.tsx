import React, { useState } from 'react'
import { SearchModal } from '../../../components/SearchModal'
import styles from './styles.module.css'

export default function NavbarSearch() {
  const [showSearch, setShowSearch] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowSearch(true)}
        className={styles.searchButton}
        title="Search documentation (Cmd+K or Ctrl+K)"
      >
        <svg 
          className={styles.searchIcon}
          width="16" 
          height="16" 
          viewBox="0 0 20 20" 
          fill="none"
        >
          <path 
            d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4.35-4.35" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        <span className={styles.searchLabel}>Search</span>
        <kbd className={styles.searchKbd}>⌘K</kbd>
      </button>
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
    </>
  )
}
