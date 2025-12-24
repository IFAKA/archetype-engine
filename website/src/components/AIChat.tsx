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
      .then(r => r.json())
      .then(index => {
        const ms = MiniSearch.loadJSON(index, {
          fields: ['title', 'headings', 'content', 'description'],
          storeFields: ['title', 'path', 'description']
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
  const getRelevantDocs = useCallback(async (query: string): Promise<string> => {
    if (!miniSearch) return ''
    
    const results = miniSearch.search(query, { 
      fuzzy: 0.2,
      prefix: true,
    }).slice(0, 3)
    
    if (results.length === 0) return ''
    
    // Build context from top results
    const context = results.map((result: any) => {
      return `## ${result.title}\nPath: ${result.path}\n${result.description || ''}\n`
    }).join('\n\n')
    
    return context
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
      const docsContext = await getRelevantDocs(message)
      
      const systemPrompt = `You are a helpful assistant for Archetype Engine documentation. Archetype is a TypeScript code generator that creates type-safe CRUD backends from entity definitions.

${docsContext ? `DOCUMENTATION CONTEXT (use ONLY this as your source of truth):\n\n${docsContext}\n` : 'No relevant documentation found for this question.'}

CRITICAL RULES:
- ONLY answer based on the documentation provided above
- If the documentation doesn't cover the question, say "I don't have information about that in the documentation"
- DO NOT use external knowledge or make assumptions
- Use markdown formatting for code examples
- Include doc paths when referencing specific features
- Be concise (under 200 words) unless asked for detail
- Format code blocks with proper syntax highlighting using triple backticks`

      const response = await engine.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          ...chat.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 512,
      })

      const aiMsg: Message = {
        role: 'assistant',
        content: response.choices[0].message.content || 'Sorry, I could not generate a response.'
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
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <span className={styles.icon}>🤖</span>
            AI Documentation Assistant
          </div>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
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
                <div className={styles.welcomeIcon}>💬</div>
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
                    {msg.role === 'user' ? '👤' : '🤖'}
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
                  <div className={styles.messageIcon}>🤖</div>
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
