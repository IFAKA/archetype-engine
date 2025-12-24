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
      .then(r => r.text())
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
    
    // Build context from top results with clickable links
    const context = results.map((result: any) => {
      return `## ${result.title}\n[View documentation](${result.path})\n\n${result.description || ''}\n`
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
- ALWAYS include the [View documentation](path) links from the context in your answer
- When mentioning a feature, include its documentation link
- Be concise (under 300 words) unless asked for detail
- Complete your thoughts fully - don't cut off mid-explanation
- Format code blocks with proper syntax highlighting using triple backticks`

      const response = await engine.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          ...chat.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1536,
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
            <svg width="20" height="20" viewBox="0 0 512 512" fill="currentColor" style={{ marginRight: '8px' }}>
              <path d="M227 84 C232.115725 87.585683 233.846315 90.041225 235.511719 96.226562 C235.91777 97.661046 236.325884 99.094948 236.73584 100.528320 C236.941103 101.266349 237.146366 102.004377 237.357849 102.764771 C238.404821 106.409119 239.615723 109.995223 240.832031 113.585938 C241.072764 114.300939 241.313496 115.015941 241.561523 115.752609 C246.419484 130.137306 251.295183 144.352044 258 158 C258.810154 159.696491 259.620035 161.393113 260.429688 163.089844 C265.000953 172.556584 269.777257 181.501234 276 190 C276.765703 191.049297 277.531406 192.098594 278.320312 193.179688 C281.462622 197.421287 284.621571 201.620303 288.0625 205.625 C290 208 290 208 290 210 C290.553008 210.220430 291.106016 210.440859 291.675781 210.667969 C294.706432 212.404863 296.823466 214.790837 299.1875 217.3125 C311.663229 230.115768 326.314015 239.594016 342 248 C342.689487 248.369639 343.378975 248.739277 344.089355 249.120117 C348.666519 251.544439 353.303332 253.816930 358 256 C358.993625 256.464546 358.993625 256.464546 360.007324 256.938477 C377.247820 264.875425 395.524173 270.341387 413.5625 276.146484 C414.633711 276.495176 415.704922 276.843867 416.808594 277.203125 C417.741150 277.503799 418.673706 277.804473 419.634521 278.114258 C423.430233 279.535544 426.029419 281.356945 428.09375 284.851562 C429.649104 288.538824 429.532438 292.074974 429 296 C426.369447 301.809138 422.582254 303.608895 417 306 C413.95009 307.064968 410.861046 307.944949 407.75 308.8125 C384.819044 315.470837 362.029994 323.597508 341 335 C339.978096 335.552283 339.978096 335.552283 338.935547 336.115723 C327.233273 342.522690 314.661086 349.925597 305.411621 359.674072 C304 361 304 361 302 361 C302 361.66 302 362.32 302 363 C300.714844 364.2265625 300.714844 364.2265625 298.9375 365.625 C281.735421 379.819016 269.459316 401.244821 259.943848 421.051758 C259.080617 422.833594 258.188238 424.601232 257.292969 426.367188 C248.343152 444.518338 242.192616 464.196388 236.775635 483.649658 C235.057831 489.565491 233.464614 493.685158 229 498 C225.933841 500.078259 222.553715 500.155630 218.125 499.777344 C213.563412 498.108675 210.857228 495.834355 208.821777 491.478760 C207.676356 488.281235 206.665596 485.065114 205.6875 481.8125 C204.90873 479.364208 204.128752 476.916301 203.347656 474.46875 C202.957231 473.223516 202.566807 471.978281 202.164551 470.695312 C191.136685 435.702067 176.814932 399.703555 150.744629 373.020264 C148.451783 370.668100 147.055528 369.166583 146 366 C144.682657 365.302268 143.34694 364.638728 142 364 C140.372559 362.495361 140.372559 362.495361 138.773438 360.769531 C135.031917 356.923583 130.989903 353.793176 126.625 350.6875 C125.841169 350.127725 125.057339 349.567949 124.249756 348.991211 C95.093690 328.455886 61.240717 315.754094 27.083008 306.182617 C26.198389 305.934150 25.313770 305.685684 24.402344 305.429688 C23.635271 305.223276 22.868198 305.016865 22.077881 304.804199 C18.150455 303.284173 15.765644 300.777657 14 297 C13.025497 292.461217 12.659297 288.404800 14.982178 284.238281 C19.289086 278.358886 24.766536 276.896200 31.5625 275 C33.819306 274.322597 36.075812 273.645196 38.332031 272.964844 C39.456899 272.634683 40.581768 272.304521 41.740723 271.964355 C80.675101 260.444505 116.475330 243.152397 146 215 C146.791484 214.261367 147.582969 213.522734 148.398438 212.761719 C176.180323 186.100857 192.326154 146.246682 203.105469 110.035156 C203.45417 108.864768 203.802852 107.694380 204.162109 106.488525 C204.830477 104.214643 205.484838 101.936583 206.123047 99.654053 C208.124982 92.790075 209.989274 87.562408 216.25 83.5625 C220.276009 82.738998 224.074816 82.717386 227 84 Z"/>
              <path d="M413 13 C415.304096 15.304096 415.696040 16.753937 416.628906 19.847656 C416.937073 20.837576 417.245239 21.827495 417.562744 22.847412 C417.892664 23.908391 418.222583 24.969370 418.5625 26.0625 C423.200415 40.443573 429.056467 53.483889 439 65 C439.607148 65.803086 440.214297 66.606172 440.839844 67.433594 C454.035825 83.111278 476.496744 90.759252 495.515625 96.105469 C498 97 498 97 499 99 C498.356758 99.200449 497.713516 99.400898 497.050781 99.607422 C468.839106 108.481422 442.326008 119.685005 427.822266 147.237305 C421.941156 159.082152 417.659612 171.313343 414 184 C412 183 412 183 411.073730 180.645996 C410.758129 179.615552 410.442529 178.585107 410.1171875 177.523438 C409.758828 176.384631 409.400469 175.245825 409.03125 174.072510 C408.6496875 172.852332 408.268125 171.632153 407.875 170.375 C398.999874 142.975615 385.200564 124.003730 359.4375 110.4375 C351.862590 106.721102 343.999771 104.123369 335.957031 101.614746 C333.292979 100.777909 330.646080 99.891796 328 99 C328 98.34 328 97.68 328 97 C329.053164 96.708672 330.106328 96.417344 331.191406 96.117188 C355.572503 89.369751 378.384364 79.661316 393.25 58 C393.818359 57.166016 394.386719 56.332031 394.972656 55.472656 C402.463989 43.557946 407.063981 29.804754 410.8828125 16.296875 C411.5 14.375 411.5 14.375 413 13 Z"/>
              <path d="M410 406 C413 407 413 407 414.429688 409.511719 C414.90664 410.559727 415.383594 411.607734 415.875 412.6875 C421.688137 424.682412 430.639649 431.193197 443 436 C443 436.66 443 437.32 443 438 C442.047383 438.458906 441.094766 438.917812 440.113281 439.390625 C438.846194 440.010090 437.579276 440.629900 436.3125 441.25 C435.68666 441.550352 435.06082 441.850703 434.416016 442.160156 C423.151028 447.704182 416.360331 457.382013 412 469 C409.289976 466.599920 407.916126 464.100631 406.3125 460.875 C399.849456 448.968566 391.903367 443.688339 380 438 C380 437.34 380 436.68 380 436 C380.99 435.526914 381.98 435.053828 383 434.566406 C396.726138 427.788517 403.289094 419.568614 410 406 Z"/>
            </svg>
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
                <div className={styles.welcomeIcon}>
                  <svg width="64" height="64" viewBox="0 0 512 512" fill="var(--ifm-color-primary)">
                    <path d="M227 84 C232.115725 87.585683 233.846315 90.041225 235.511719 96.226562 C235.91777 97.661046 236.325884 99.094948 236.73584 100.528320 C236.941103 101.266349 237.146366 102.004377 237.357849 102.764771 C238.404821 106.409119 239.615723 109.995223 240.832031 113.585938 C241.072764 114.300939 241.313496 115.015941 241.561523 115.752609 C246.419484 130.137306 251.295183 144.352044 258 158 C258.810154 159.696491 259.620035 161.393113 260.429688 163.089844 C265.000953 172.556584 269.777257 181.501234 276 190 C276.765703 191.049297 277.531406 192.098594 278.320312 193.179688 C281.462622 197.421287 284.621571 201.620303 288.0625 205.625 C290 208 290 208 290 210 C290.553008 210.220430 291.106016 210.440859 291.675781 210.667969 C294.706432 212.404863 296.823466 214.790837 299.1875 217.3125 C311.663229 230.115768 326.314015 239.594016 342 248 C342.689487 248.369639 343.378975 248.739277 344.089355 249.120117 C348.666519 251.544439 353.303332 253.816930 358 256 C358.993625 256.464546 358.993625 256.464546 360.007324 256.938477 C377.247820 264.875425 395.524173 270.341387 413.5625 276.146484 C414.633711 276.495176 415.704922 276.843867 416.808594 277.203125 C417.741150 277.503799 418.673706 277.804473 419.634521 278.114258 C423.430233 279.535544 426.029419 281.356945 428.09375 284.851562 C429.649104 288.538824 429.532438 292.074974 429 296 C426.369447 301.809138 422.582254 303.608895 417 306 C413.95009 307.064968 410.861046 307.944949 407.75 308.8125 C384.819044 315.470837 362.029994 323.597508 341 335 C339.978096 335.552283 339.978096 335.552283 338.935547 336.115723 C327.233273 342.522690 314.661086 349.925597 305.411621 359.674072 C304 361 304 361 302 361 C302 361.66 302 362.32 302 363 C300.714844 364.2265625 300.714844 364.2265625 298.9375 365.625 C281.735421 379.819016 269.459316 401.244821 259.943848 421.051758 C259.080617 422.833594 258.188238 424.601232 257.292969 426.367188 C248.343152 444.518338 242.192616 464.196388 236.775635 483.649658 C235.057831 489.565491 233.464614 493.685158 229 498 C225.933841 500.078259 222.553715 500.155630 218.125 499.777344 C213.563412 498.108675 210.857228 495.834355 208.821777 491.478760 C207.676356 488.281235 206.665596 485.065114 205.6875 481.8125 C204.90873 479.364208 204.128752 476.916301 203.347656 474.46875 C202.957231 473.223516 202.566807 471.978281 202.164551 470.695312 C191.136685 435.702067 176.814932 399.703555 150.744629 373.020264 C148.451783 370.668100 147.055528 369.166583 146 366 C144.682657 365.302268 143.34694 364.638728 142 364 C140.372559 362.495361 140.372559 362.495361 138.773438 360.769531 C135.031917 356.923583 130.989903 353.793176 126.625 350.6875 C125.841169 350.127725 125.057339 349.567949 124.249756 348.991211 C95.093690 328.455886 61.240717 315.754094 27.083008 306.182617 C26.198389 305.934150 25.313770 305.685684 24.402344 305.429688 C23.635271 305.223276 22.868198 305.016865 22.077881 304.804199 C18.150455 303.284173 15.765644 300.777657 14 297 C13.025497 292.461217 12.659297 288.404800 14.982178 284.238281 C19.289086 278.358886 24.766536 276.896200 31.5625 275 C33.819306 274.322597 36.075812 273.645196 38.332031 272.964844 C39.456899 272.634683 40.581768 272.304521 41.740723 271.964355 C80.675101 260.444505 116.475330 243.152397 146 215 C146.791484 214.261367 147.582969 213.522734 148.398438 212.761719 C176.180323 186.100857 192.326154 146.246682 203.105469 110.035156 C203.45417 108.864768 203.802852 107.694380 204.162109 106.488525 C204.830477 104.214643 205.484838 101.936583 206.123047 99.654053 C208.124982 92.790075 209.989274 87.562408 216.25 83.5625 C220.276009 82.738998 224.074816 82.717386 227 84 Z"/>
                    <path d="M413 13 C415.304096 15.304096 415.696040 16.753937 416.628906 19.847656 C416.937073 20.837576 417.245239 21.827495 417.562744 22.847412 C417.892664 23.908391 418.222583 24.969370 418.5625 26.0625 C423.200415 40.443573 429.056467 53.483889 439 65 C439.607148 65.803086 440.214297 66.606172 440.839844 67.433594 C454.035825 83.111278 476.496744 90.759252 495.515625 96.105469 C498 97 498 97 499 99 C498.356758 99.200449 497.713516 99.400898 497.050781 99.607422 C468.839106 108.481422 442.326008 119.685005 427.822266 147.237305 C421.941156 159.082152 417.659612 171.313343 414 184 C412 183 412 183 411.073730 180.645996 C410.758129 179.615552 410.442529 178.585107 410.1171875 177.523438 C409.758828 176.384631 409.400469 175.245825 409.03125 174.072510 C408.6496875 172.852332 408.268125 171.632153 407.875 170.375 C398.999874 142.975615 385.200564 124.003730 359.4375 110.4375 C351.862590 106.721102 343.999771 104.123369 335.957031 101.614746 C333.292979 100.777909 330.646080 99.891796 328 99 C328 98.34 328 97.68 328 97 C329.053164 96.708672 330.106328 96.417344 331.191406 96.117188 C355.572503 89.369751 378.384364 79.661316 393.25 58 C393.818359 57.166016 394.386719 56.332031 394.972656 55.472656 C402.463989 43.557946 407.063981 29.804754 410.8828125 16.296875 C411.5 14.375 411.5 14.375 413 13 Z"/>
                    <path d="M410 406 C413 407 413 407 414.429688 409.511719 C414.90664 410.559727 415.383594 411.607734 415.875 412.6875 C421.688137 424.682412 430.639649 431.193197 443 436 C443 436.66 443 437.32 443 438 C442.047383 438.458906 441.094766 438.917812 440.113281 439.390625 C438.846194 440.010090 437.579276 440.629900 436.3125 441.25 C435.68666 441.550352 435.06082 441.850703 434.416016 442.160156 C423.151028 447.704182 416.360331 457.382013 412 469 C409.289976 466.599920 407.916126 464.100631 406.3125 460.875 C399.849456 448.968566 391.903367 443.688339 380 438 C380 437.34 380 436.68 380 436 C380.99 435.526914 381.98 435.053828 383 434.566406 C396.726138 427.788517 403.289094 419.568614 410 406 Z"/>
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
                      <svg width="24" height="24" viewBox="0 0 512 512" fill="currentColor">
                        <path d="M227 84 C232.115725 87.585683 233.846315 90.041225 235.511719 96.226562 C235.91777 97.661046 236.325884 99.094948 236.73584 100.528320 C236.941103 101.266349 237.146366 102.004377 237.357849 102.764771 C238.404821 106.409119 239.615723 109.995223 240.832031 113.585938 C241.072764 114.300939 241.313496 115.015941 241.561523 115.752609 C246.419484 130.137306 251.295183 144.352044 258 158 C258.810154 159.696491 259.620035 161.393113 260.429688 163.089844 C265.000953 172.556584 269.777257 181.501234 276 190 C276.765703 191.049297 277.531406 192.098594 278.320312 193.179688 C281.462622 197.421287 284.621571 201.620303 288.0625 205.625 C290 208 290 208 290 210 C290.553008 210.220430 291.106016 210.440859 291.675781 210.667969 C294.706432 212.404863 296.823466 214.790837 299.1875 217.3125 C311.663229 230.115768 326.314015 239.594016 342 248 C342.689487 248.369639 343.378975 248.739277 344.089355 249.120117 C348.666519 251.544439 353.303332 253.816930 358 256 C358.993625 256.464546 358.993625 256.464546 360.007324 256.938477 C377.247820 264.875425 395.524173 270.341387 413.5625 276.146484 C414.633711 276.495176 415.704922 276.843867 416.808594 277.203125 C417.741150 277.503799 418.673706 277.804473 419.634521 278.114258 C423.430233 279.535544 426.029419 281.356945 428.09375 284.851562 C429.649104 288.538824 429.532438 292.074974 429 296 C426.369447 301.809138 422.582254 303.608895 417 306 C413.95009 307.064968 410.861046 307.944949 407.75 308.8125 C384.819044 315.470837 362.029994 323.597508 341 335 C339.978096 335.552283 339.978096 335.552283 338.935547 336.115723 C327.233273 342.522690 314.661086 349.925597 305.411621 359.674072 C304 361 304 361 302 361 C302 361.66 302 362.32 302 363 C300.714844 364.2265625 300.714844 364.2265625 298.9375 365.625 C281.735421 379.819016 269.459316 401.244821 259.943848 421.051758 C259.080617 422.833594 258.188238 424.601232 257.292969 426.367188 C248.343152 444.518338 242.192616 464.196388 236.775635 483.649658 C235.057831 489.565491 233.464614 493.685158 229 498 C225.933841 500.078259 222.553715 500.155630 218.125 499.777344 C213.563412 498.108675 210.857228 495.834355 208.821777 491.478760 C207.676356 488.281235 206.665596 485.065114 205.6875 481.8125 C204.90873 479.364208 204.128752 476.916301 203.347656 474.46875 C202.957231 473.223516 202.566807 471.978281 202.164551 470.695312 C191.136685 435.702067 176.814932 399.703555 150.744629 373.020264 C148.451783 370.668100 147.055528 369.166583 146 366 C144.682657 365.302268 143.34694 364.638728 142 364 C140.372559 362.495361 140.372559 362.495361 138.773438 360.769531 C135.031917 356.923583 130.989903 353.793176 126.625 350.6875 C125.841169 350.127725 125.057339 349.567949 124.249756 348.991211 C95.093690 328.455886 61.240717 315.754094 27.083008 306.182617 C26.198389 305.934150 25.313770 305.685684 24.402344 305.429688 C23.635271 305.223276 22.868198 305.016865 22.077881 304.804199 C18.150455 303.284173 15.765644 300.777657 14 297 C13.025497 292.461217 12.659297 288.404800 14.982178 284.238281 C19.289086 278.358886 24.766536 276.896200 31.5625 275 C33.819306 274.322597 36.075812 273.645196 38.332031 272.964844 C39.456899 272.634683 40.581768 272.304521 41.740723 271.964355 C80.675101 260.444505 116.475330 243.152397 146 215 C146.791484 214.261367 147.582969 213.522734 148.398438 212.761719 C176.180323 186.100857 192.326154 146.246682 203.105469 110.035156 C203.45417 108.864768 203.802852 107.694380 204.162109 106.488525 C204.830477 104.214643 205.484838 101.936583 206.123047 99.654053 C208.124982 92.790075 209.989274 87.562408 216.25 83.5625 C220.276009 82.738998 224.074816 82.717386 227 84 Z"/>
                        <path d="M413 13 C415.304096 15.304096 415.696040 16.753937 416.628906 19.847656 C416.937073 20.837576 417.245239 21.827495 417.562744 22.847412 C417.892664 23.908391 418.222583 24.969370 418.5625 26.0625 C423.200415 40.443573 429.056467 53.483889 439 65 C439.607148 65.803086 440.214297 66.606172 440.839844 67.433594 C454.035825 83.111278 476.496744 90.759252 495.515625 96.105469 C498 97 498 97 499 99 C498.356758 99.200449 497.713516 99.400898 497.050781 99.607422 C468.839106 108.481422 442.326008 119.685005 427.822266 147.237305 C421.941156 159.082152 417.659612 171.313343 414 184 C412 183 412 183 411.073730 180.645996 C410.758129 179.615552 410.442529 178.585107 410.1171875 177.523438 C409.758828 176.384631 409.400469 175.245825 409.03125 174.072510 C408.6496875 172.852332 408.268125 171.632153 407.875 170.375 C398.999874 142.975615 385.200564 124.003730 359.4375 110.4375 C351.862590 106.721102 343.999771 104.123369 335.957031 101.614746 C333.292979 100.777909 330.646080 99.891796 328 99 C328 98.34 328 97.68 328 97 C329.053164 96.708672 330.106328 96.417344 331.191406 96.117188 C355.572503 89.369751 378.384364 79.661316 393.25 58 C393.818359 57.166016 394.386719 56.332031 394.972656 55.472656 C402.463989 43.557946 407.063981 29.804754 410.8828125 16.296875 C411.5 14.375 411.5 14.375 413 13 Z"/>
                        <path d="M410 406 C413 407 413 407 414.429688 409.511719 C414.90664 410.559727 415.383594 411.607734 415.875 412.6875 C421.688137 424.682412 430.639649 431.193197 443 436 C443 436.66 443 437.32 443 438 C442.047383 438.458906 441.094766 438.917812 440.113281 439.390625 C438.846194 440.010090 437.579276 440.629900 436.3125 441.25 C435.68666 441.550352 435.06082 441.850703 434.416016 442.160156 C423.151028 447.704182 416.360331 457.382013 412 469 C409.289976 466.599920 407.916126 464.100631 406.3125 460.875 C399.849456 448.968566 391.903367 443.688339 380 438 C380 437.34 380 436.68 380 436 C380.99 435.526914 381.98 435.053828 383 434.566406 C396.726138 427.788517 403.289094 419.568614 410 406 Z"/>
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
