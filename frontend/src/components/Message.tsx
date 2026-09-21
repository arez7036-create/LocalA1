import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.min.css'
import { User, Bot } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '../lib/utils'

marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true,
})

interface MessageProps {
  message: { role: string; content: string; streaming?: boolean }
}

export default function Message({ message }: MessageProps) {
  const [displayContent, setDisplayContent] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)
  const isUser = message.role === 'user'

  useEffect(() => {
    if (message.streaming) {
      setDisplayContent('▌')
    } else {
      let i = 0
      const timer = setInterval(() => {
        if (i < message.content.length) {
          setDisplayContent(message.content.slice(0, i + 1))
          i++
        } else {
          clearInterval(timer)
        }
      }, 5)
      return () => clearInterval(timer)
    }
  }, [message.content, message.streaming])

  useEffect(() => {
    contentRef.current?.querySelectorAll('pre code').forEach((el) => {
      hljs.highlightElement(el as HTMLElement)
    })
  }, [displayContent])

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', isUser ? 'bg-green-600' : 'bg-gray-100')}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-gray-600" />}
      </div>
      <div className={cn('max-w-[85%]', isUser ? 'text-right' : '')}>
        <div
          ref={contentRef}
          className={cn(
            'px-4 py-2 rounded-2xl text-base leading-relaxed whitespace-pre-wrap break-words',
            isUser
              ? 'bg-green-600 text-white rounded-br-none'
              : 'bg-gray-100 text-gray-900 rounded-bl-none'
          )}
          dangerouslySetInnerHTML={{ __html: marked.parse(displayContent) }}
        />
      </div>
    </div>
  )
}