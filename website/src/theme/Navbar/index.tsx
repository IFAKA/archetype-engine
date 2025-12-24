import React, { useState } from 'react'
import OriginalNavbar from '@theme-original/Navbar'
import { SearchModal } from '../../components/SearchModal'
import type { WrapperProps } from '@docusaurus/types'

export default function Navbar(props: WrapperProps<typeof OriginalNavbar>) {
  const [showSearch, setShowSearch] = useState(false)

  return (
    <>
      <OriginalNavbar {...props}>
        <button
          onClick={() => setShowSearch(true)}
          style={{
            background: 'transparent',
            border: '1px solid var(--ifm-color-emphasis-300)',
            borderRadius: '6px',
            padding: '6px 12px',
            marginLeft: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--ifm-font-color-base)',
            fontSize: '14px',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'var(--ifm-color-emphasis-100)'
            e.currentTarget.style.borderColor = 'var(--ifm-color-emphasis-400)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = 'var(--ifm-color-emphasis-300)'
          }}
          title="Search documentation (Cmd+K)"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path 
              d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4.35-4.35" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          <span style={{ marginRight: '4px' }}>Search</span>
          <kbd style={{
            background: 'var(--ifm-color-emphasis-200)',
            border: '1px solid var(--ifm-color-emphasis-300)',
            borderRadius: '3px',
            padding: '2px 5px',
            fontSize: '11px',
            fontFamily: 'var(--ifm-font-family-monospace)',
          }}>
            ⌘K
          </kbd>
        </button>
      </OriginalNavbar>
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
    </>
  )
}
