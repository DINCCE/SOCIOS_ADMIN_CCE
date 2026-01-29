'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Send } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface AIChatViewProps {
  conversationId?: string
  showHeader?: boolean
}

export function AIChatView({
  conversationId = 'ai-companion-main',
  showHeader = true,
}: AIChatViewProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    id: conversationId,
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || status === 'streaming') return

    sendMessage({ text: input })
    setInput('')
  }

  const isLoading = status === 'streaming'
  const hasMessages = messages.length > 0

  return (
    <div className="flex flex-col h-full bg-background">
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-sm font-bold">AI</span>
            </div>
            <h3 className="font-semibold text-foreground">AI Assistant</h3>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground text-sm">
              Ask me anything about personas, empresas, tareas, or acciones.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {[
                'Show active personas',
                'Find tareas for today',
                'How to create an acción',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-1.5 text-xs bg-muted hover:bg-muted-foreground/10 rounded-md transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex animate-ai-message-enter',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm'
                  )}
                >
                  {message.parts.map((part, i) => {
                    // Text content
                    if (part.type === 'text') {
                      return (
                        <p key={i} className="text-sm whitespace-pre-wrap break-words">
                          {part.text}
                        </p>
                      )
                    }

                    // For now, just render tool invocations/results as text
                    // In the future we can make these more interactive
                    if (part.type.startsWith('tool-')) {
                      return (
                        <div
                          key={i}
                          className="mt-2 text-xs py-2 px-3 rounded-md border bg-muted-foreground/10 border-muted-foreground/20"
                        >
                          <span className="text-muted-foreground">
                            Tool action: {part.type}
                          </span>
                        </div>
                      )
                    }

                    return null
                  })}
                </div>
              </div>
            ))}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}

        {/* Typing Indicator */}
        {isLoading && hasMessages && (
          <div className="flex justify-start animate-ai-message-enter">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/50 ai-typing-dot-1" />
              <div className="w-2 h-2 rounded-full bg-muted-foreground/50 ai-typing-dot-2" />
              <div className="w-2 h-2 rounded-full bg-muted-foreground/50 ai-typing-dot-3" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              e.currentTarget.style.height = 'auto'
              e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            placeholder="Ask AI anything..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[40px] max-h-[120px]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-10 w-10 shrink-0 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
