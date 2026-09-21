import { useState, useCallback, useEffect } from 'react'
import { api } from '../lib/api'

export function useChat(sessionId: number | null) {
  const [messages, setMessages] = useState<Array<{role: string, content: string, streaming?: boolean}>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load messages when session changes
  useEffect(() => {
    if (sessionId) {
      api.get(`/sessions/${sessionId}/messages`).then(res => {
        setMessages(res.data)
      }).catch(err => {
        console.error('Failed to load messages:', err)
        setMessages([])
      })
    } else {
      setMessages([])
    }
  }, [sessionId])

  const sendMessage = useCallback(async (content: string, model: string) => {
    if (!sessionId) return
    setLoading(true)
    setError(null)
    const userMsg = { role: 'user', content }
    setMessages(prev => [...prev, userMsg])

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ model, messages: [...messages, userMsg], session_id: sessionId }),
      })

      if (!response.ok) throw new Error(await response.text())

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''
      let messageIndex = messages.length

      setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }])

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                assistantContent += parsed.content
                setMessages(prev => prev.map((msg, i) => 
                  i === messageIndex ? { ...msg, content: assistantContent, streaming: !parsed.done } : msg
                ))
              }
            } catch {}
          }
        }
      }

      setMessages(prev => prev.map((msg, i) => 
        i === messageIndex ? { ...msg, content: assistantContent, streaming: false } : msg
      ))

    } catch (err: any) {
      setError(err.message)
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }, [messages, sessionId])

  const clearChat = useCallback(() => setMessages([]), [])

  return { messages, sendMessage, loading, error, clearChat }
}