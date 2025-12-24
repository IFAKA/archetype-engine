import React, { useState, useEffect } from 'react'
import { SearchModal } from '../components/SearchModal'
import { AIChat } from '../components/AIChat'

export default function Root({ children }: { children: React.ReactNode }) {
  const [showSearch, setShowSearch] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux) - Open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
      }
      // Cmd+Shift+K - Open AI chat
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'K') {
        e.preventDefault()
        setShowAIChat(true)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      {children}
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
      {showAIChat && <AIChat onClose={() => setShowAIChat(false)} />}
      
      {/* Floating action button for AI chat */}
      <button
        onClick={() => setShowAIChat(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--ifm-color-primary)',
          color: 'white',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.2s',
          zIndex: 999,
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}
        title="Chat with AI Assistant (Cmd+Shift+K)"
      >
        🤖
      </button>
    </>
  )
}
