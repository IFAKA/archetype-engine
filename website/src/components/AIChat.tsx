import React, { useState, useEffect, useRef, useCallback } from 'react'
import * as webllm from '@mlc-ai/web-llm'
import MiniSearch from 'minisearch'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from './AIChat.module.css'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AIChatProps {
  onClose: () => void
}

export function AIChat({ onClose }: AIChatProps) {
  const [engine, setEngine] = useState<webllm.MLCEngine | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState('')
  const [message, setMessage] = useState('')
  const [chat, setChat] = useState<Message[]>([])
  const [thinking, setThinking] = useState(false)
  const [miniSearch, setMiniSearch] = useState<MiniSearch | null>(null)
  const [hasWebGPU, setHasWebGPU] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Check WebGPU support
  useEffect(() => {
    const checkWebGPU = async () => {
      if (!('gpu' in navigator)) {
        setHasWebGPU(false)
        return
      }
      
      try {
        const adapter = await (navigator as any).gpu.requestAdapter()
        if (!adapter) {
          setHasWebGPU(false)
        }
      } catch (e) {
        setHasWebGPU(false)
      }
    }
    
    checkWebGPU()
  }, [])

  // Load search index for RAG
  useEffect(() => {
    fetch('/search-index.json')
      .then(r => r.text())
      .then(index => {
        const ms = MiniSearch.loadJSON(index, {
          fields: ['title', 'headings', 'content', 'description'],
          storeFields: ['title', 'path', 'description', 'content', 'headings']
        })
        setMiniSearch(ms)
      })
      .catch(err => console.error('Failed to load search index:', err))
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat])

  // Check if model is already initialized on mount
  useEffect(() => {
    const checkExistingEngine = async () => {
      if (!hasWebGPU) return
      
      // Check if there's a cached model in IndexedDB
      const cacheKey = 'archetype_ai_model_initialized'
      const wasInitialized = localStorage.getItem(cacheKey)
      
      if (wasInitialized === 'true') {
        // Try to reinitialize silently
        try {
          setLoading(true)
          setLoadingProgress('Reconnecting to cached model...')
          
          const newEngine = await webllm.CreateMLCEngine(
            'Llama-3.2-1B-Instruct-q4f16_1-MLC',
            {
              initProgressCallback: (progress) => {
                // Silent load for cached model
                console.log('Reloading cached model:', progress)
              }
            }
          )
          
          setEngine(newEngine)
          setChat([{
            role: 'assistant',
            content: 'Hi! I\'m your Archetype documentation assistant. Ask me anything about using Archetype Engine!'
          }])
          setLoading(false)
          inputRef.current?.focus()
        } catch (error) {
          console.error('Failed to reload model:', error)
          setLoading(false)
          // Clear cache flag if reload failed
          localStorage.removeItem(cacheKey)
        }
      }
    }
    
    checkExistingEngine()
  }, [hasWebGPU])

  // Initialize WebLLM model (first time)
  const initModel = async () => {
    if (!hasWebGPU) return
    
    setLoading(true)
    setLoadingProgress('Initializing...')
    
    try {
      const newEngine = await webllm.CreateMLCEngine(
        'Llama-3.2-1B-Instruct-q4f16_1-MLC',
        {
          initProgressCallback: (progress) => {
            setLoadingProgress(progress.text)
            console.log('Model loading:', progress)
          }
        }
      )
      
      setEngine(newEngine)
      setLoadingProgress('')
      
      // Mark as initialized in localStorage
      localStorage.setItem('archetype_ai_model_initialized', 'true')
      
      // Add welcome message
      setChat([{
        role: 'assistant',
        content: 'Hi! I\'m your Archetype documentation assistant. Ask me anything about using Archetype Engine!'
      }])
      
      inputRef.current?.focus()
    } catch (error) {
      console.error('Failed to initialize model:', error)
      setLoadingProgress('Failed to load model. Please refresh and try again.')
    } finally {
      setLoading(false)
    }
  }

  // Get relevant docs for RAG
  const getRelevantDocs = useCallback(async (query: string): Promise<{ context: string; sources: string[] }> => {
    if (!miniSearch) return { context: '', sources: [] }
    
    const results = miniSearch.search(query, { 
      fuzzy: 0.2,
      prefix: true,
      boost: { title: 2 },
    }).slice(0, 3)
    
    if (results.length === 0) return { context: '', sources: [] }
    
    // Fetch full content from search index (stored fields)
    const sources: string[] = []
    const contextParts: string[] = []
    
    for (const result of results) {
      const doc = miniSearch.getStoredFields(result.id) as any
      if (!doc) continue
      
      sources.push(`${doc.title} - ${doc.path}`)
      
      // Build rich context with full content (limit to prevent token overflow)
      const content = typeof doc.content === 'string' ? doc.content.slice(0, 2000) : ''
      contextParts.push(`
### ${doc.title}
**Documentation Link:** ${doc.path}

${content}
`.trim())
    }
    
    return {
      context: contextParts.join('\n\n---\n\n'),
      sources
    }
  }, [miniSearch])

  // Send message to AI
  const sendMessage = async () => {
    if (!engine || !message.trim() || thinking) return

    const userMsg: Message = { role: 'user', content: message.trim() }
    setChat(prev => [...prev, userMsg])
    setMessage('')
    setThinking(true)

    try {
      // Get relevant docs for context (RAG)
      const { context: docsContext, sources } = await getRelevantDocs(message)
      
      const systemPrompt = `You are a helpful assistant for Archetype Engine documentation. Archetype is a TypeScript code generator that creates type-safe CRUD backends from entity definitions.

${docsContext ? `DOCUMENTATION CONTEXT (use ONLY this as your source of truth):\n\n${docsContext}\n` : 'No relevant documentation found for this question.'}

CRITICAL RULES - ZERO HALLUCINATION POLICY:
- ONLY answer based on the EXACT documentation provided above
- If the documentation doesn't cover the question, respond: "I don't have information about that in the documentation. You can browse all docs at /docs/intro"
- DO NOT invent functions, APIs, or features that aren't in the documentation
- DO NOT use external knowledge about Next.js, React, or other frameworks
- Quote code examples EXACTLY as shown in the documentation
- ALWAYS cite your sources by including documentation links in your answer
- At the end of every answer, add a "Sources:" section listing the documentation pages you referenced
- Be concise (under 300 words) unless asked for detail
- Complete your thoughts fully - don't cut off mid-explanation

FORMATTING RULES:
- Use proper markdown with clear separation between text and code
- Code blocks must use triple backticks with language identifier (e.g., \`\`\`bash, \`\`\`typescript)
- Never mix HTML tags with markdown
- Use numbered lists (1., 2., 3.) or bullet lists (-, *, +) consistently
- Keep code examples inside proper code blocks
- Use blank lines to separate sections
- Never use malformed markdown or nested code blocks

IMPORTANT: If asked about something not in the provided context, say you don't know rather than guessing.`

      const response = await engine.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          ...chat.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: message }
        ],
        temperature: 0.3,
        max_tokens: 1536,
      })

      let aiResponse = response.choices[0].message.content || 'Sorry, I could not generate a response.'
      
      // Append sources automatically if AI didn't include them
      if (sources.length > 0 && !aiResponse.includes('Sources:')) {
        aiResponse += `\n\n---\n\n**Sources:**\n${sources.map(s => `- ${s}`).join('\n')}`
      }

      const aiMsg: Message = {
        role: 'assistant',
        content: aiResponse
      }
      
      setChat(prev => [...prev, aiMsg])
    } catch (error) {
      console.error('Error generating response:', error)
      const errorMsg: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }
      setChat(prev => [...prev, errorMsg])
    } finally {
      setThinking(false)
    }
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.container} ${isFullscreen ? styles.fullscreen : ''}`}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
            </svg>
            AI Documentation Assistant
          </div>
          <div className={styles.headerActions}>
            <button 
              className={styles.iconButton} 
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
              )}
            </button>
            <button className={styles.closeButton} onClick={onClose}>✕</button>
          </div>
        </div>

        {!hasWebGPU ? (
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>⚠️</div>
            <h3>WebGPU Not Available</h3>
            <p>AI chat requires WebGPU support (Chrome 113+, Edge 113+)</p>
            <a 
              href="https://developer.chrome.com/blog/webgpu-release/" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.link}
            >
              Learn about WebGPU support
            </a>
            <p className={styles.hint}>You can still use Cmd+K search for instant results</p>
          </div>
        ) : !engine ? (
          <div className={styles.initState}>
            {loading ? (
              <>
                <div className={styles.spinner} />
                <div className={styles.loadingText}>{loadingProgress}</div>
                <div className={styles.loadingHint}>
                  Downloading model (~600MB, one-time)
                  <br />
                  This may take a few minutes...
                </div>
              </>
            ) : (
              <>
                <div className={styles.welcomeIcon}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="var(--ifm-color-primary)">
                    <circle cx="12" cy="12" r="4"/>
                    <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                  </svg>
                </div>
                <h3>Chat with AI Assistant</h3>
                <p>Get instant answers about Archetype from our AI assistant powered by Llama 3.2</p>
                <ul className={styles.featureList}>
                  <li>✓ Runs entirely in your browser</li>
                  <li>✓ Works offline after first download</li>
                  <li>✓ Searches documentation automatically</li>
                  <li>✓ No API keys or tracking</li>
                </ul>
                <button 
                  className={styles.primaryButton} 
                  onClick={initModel}
                  disabled={loading}
                >
                  Start AI Chat (Downloads 600MB)
                </button>
                <div className={styles.hint}>
                  First time only • Cached for future visits
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            <div className={styles.messages}>
              {chat.map((msg, index) => (
                <div 
                  key={index} 
                  className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.assistantMessage}`}
                >
                  <div className={styles.messageIcon}>
                    {msg.role === 'user' ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M12 2v3m0 14v3M4.93 4.93l2.12 2.12m9.9 9.9l2.12 2.12M2 12h3m14 0h3M4.93 19.07l2.12-2.12m9.9-9.9l2.12-2.12"/>
                      </svg>
                    )}
                  </div>
                  <div className={styles.messageContent}>
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className={`${styles.message} ${styles.assistantMessage}`}>
                  <div className={styles.messageIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                      <path d="M20 3v4"/>
                      <path d="M22 5h-4"/>
                      <path d="M4 13a8 8 0 0 1 7.5-7.95"/>
                    </svg>
                  </div>
                  <div className={styles.messageContent}>
                    <div className={styles.thinkingDots}>
                      <span>.</span><span>.</span><span>.</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className={styles.inputArea}>
              <textarea
                ref={inputRef}
                className={styles.textarea}
                placeholder="Ask about entities, fields, relations... (Shift+Enter for new line)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
              />
              <button 
                className={styles.sendButton} 
                onClick={sendMessage}
                disabled={!message.trim() || thinking}
              >
                {thinking ? '...' : '→'}
              </button>
            </div>

            <div className={styles.footer}>
              <kbd>Enter</kbd> Send • <kbd>Shift+Enter</kbd> New line • <kbd>ESC</kbd> Close
            </div>
          </>
        )}
      </div>
    </div>
  )
}
