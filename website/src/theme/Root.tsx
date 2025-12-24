import React, { useState, useEffect } from 'react'
import { SearchModal } from '../components/SearchModal'

export default function Root({ children }: { children: React.ReactNode }) {
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      {children}
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
    </>
  )
}
