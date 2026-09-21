import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

export interface Session {
  id: number
  title: string
  model: string
  is_pinned: boolean
  created_at: string
  updated_at: string
  message_count: number
}

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSession, setActiveSession] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSessions = useCallback(async () => {
    try {
      const res = await api.get('/sessions')
      setSessions(res.data)
      if (res.data.length > 0 && activeSession === null) {
        setActiveSession(res.data[0].id)
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
    } finally {
      setLoading(false)
    }
  }, [activeSession])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const createSession = useCallback(async () => {
    try {
      const res = await api.post('/sessions', {})
      const newSession = res.data
      setSessions(prev => [newSession, ...prev])
      return newSession
    } catch (err) {
      console.error('Failed to create session:', err)
      return null
    }
  }, [])

  const deleteSession = useCallback(async (id: number) => {
    try {
      await api.delete(`/sessions/${id}`)
      setSessions(prev => prev.filter(s => s.id !== id))
      if (activeSession === id) {
        const remaining = sessions.filter(s => s.id !== id)
        setActiveSession(remaining.length > 0 ? remaining[0].id : null)
      }
    } catch (err) {
      console.error('Failed to delete session:', err)
    }
  }, [activeSession, sessions])

  const updateSession = useCallback(async (id: number, data: Partial<Session>) => {
    try {
      await api.patch(`/sessions/${id}`, data)
      setSessions(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))
    } catch (err) {
      console.error('Failed to update session:', err)
    }
  }, [])

  const setActiveSessionState = useCallback((id: number | null) => {
    setActiveSession(id)
  }, [])

  return { sessions, activeSession, setActiveSession: setActiveSessionState, createSession, deleteSession, updateSession, loading, refetch: fetchSessions }
}
