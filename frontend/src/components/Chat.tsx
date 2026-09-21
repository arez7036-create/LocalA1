import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, Bot, User, LogOut, Plus, MessageSquare, X, Trash2, Edit, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useChat } from '../hooks/useChat'
import { useModels } from '../hooks/useModels'
import { useSessions } from '../hooks/useSessions'
import Message from './Message'
import ModelSelect from './ModelSelect'
import { cn } from '../lib/utils'

export default function Chat() {
  const { user, logout } = useAuth()
  const { models, selectedModel, setSelectedModel, loading: modelsLoading } = useModels()
  const { sessions, createSession, deleteSession, updateSession, setActiveSession, activeSession, loading: sessionsLoading } = useSessions()
  const { messages, sendMessage, loading, error, clearChat } = useChat(activeSession)
  const [input, setInput] = useState('')
  const [showSidebar, setShowSidebar] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    await sendMessage(input, selectedModel)
    setInput('')
  }

  const handleNewChat = async () => {
    const newSession = await createSession()
    if (newSession) {
      setActiveSession(newSession.id)
      clearChat()
    }
  }

  const handleSessionClick = (sessionId: number) => {
    setActiveSession(sessionId)
    if (window.innerWidth < 768) setShowSidebar(false)
  }

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: number) => {
    e.stopPropagation()
    if (confirm('Удалить чат?')) {
      await deleteSession(sessionId)
    }
  }

  return (
    <div className="flex h-screen w-full max-w-5xl mx-auto bg-white shadow-xl">
      {/* Sidebar */}
      <aside className={cn(
        'flex-shrink-0 border-r border-gray-200 bg-gray-50 transition-all duration-200',
        showSidebar ? 'w-72' : 'w-0 overflow-hidden'
      )}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Чаты</h2>
              <button onClick={handleNewChat} className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors" title="Новый чат">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessionsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                <MessageSquare className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">Нет чатов</p>
                <button onClick={handleNewChat} className="mt-2 text-green-600 hover:underline text-sm">Создать чат</button>
              </div>
            ) : (
              sessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => handleSessionClick(session.id)}
                  className={cn(
                    'w-full text-left p-2.5 rounded-lg transition-colors flex items-center gap-2',
                    activeSession === session.id
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <MessageSquare className={cn('w-4 h-4 flex-shrink-0', activeSession === session.id ? 'text-green-600' : 'text-gray-400')} />
                  <span className="flex-1 truncate text-sm">{session.title || 'Новый чат'}</span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(session.updated_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                  </span>
                  <button
                    onClick={(e) => handleDeleteSession(e, session.id)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                ))}
              )}
          </div>

          <div className="p-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              {sessions.length} чат{['', 'а', 'ов'][(sessions.length % 10 === 1 && sessions.length % 100 !== 11) ? 0 : (sessions.length % 10 >= 2 && sessions.length % 10 <= 4 && (sessions.length % 100 < 10 || sessions.length % 100 >= 20)) ? 1 : 2]}
            </div>
          </div>
        </div>
      </aside>

      {/* Sidebar toggle for mobile */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="lg:hidden fixed bottom-4 right-4 z-50 p-3 bg-green-600 text-white rounded-full shadow-lg"
      >
        {showSidebar ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
      </button>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex-shrink-0 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">LocalAI</h1>
          <div className="flex items-center gap-3">
            <ModelSelect models={models} selected={selectedModel} onChange={setSelectedModel} disabled={modelsLoading} />
            <span className="text-sm text-gray-500 hidden sm:block">{user?.email}</span>
            <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <LogOut size={16} /> Выход
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-6" ref={messagesEndRef}>
          {messages.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Bot className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg">Начните диалог</p>
              <p className="text-sm">Выберите модель и напишите сообщение</p>
            </div>
          ) : (
            messages.map((msg, i) => <Message key={i} message={msg} />)
          )}
          {loading && <div className="flex justify-start"><Message message={{role: 'assistant', content: '', streaming: true}} /></div>}
          <div ref={messagesEndRef} />
        </main>

        <form onSubmit={handleSubmit} className="flex-shrink-0 border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Сообщение..."
              rows={1}
              className="flex-1 resize-none border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
              disabled={loading}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
            />
            <button type="submit" disabled={loading || !input.trim()} className="flex items-center justify-center px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </form>
      </div>
    </div>
  )
}

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!input.trim() || loading) return
  await sendMessage(input, selectedModel)
  setInput('')
}