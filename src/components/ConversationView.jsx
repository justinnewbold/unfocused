import React, { useState, useRef, useEffect } from 'react'
import { Send, Brain, Wifi, WifiOff } from 'lucide-react'
import { useReducedMotion } from '../hooks/useReducedMotion'
import VirtualizedMessageList from './VirtualizedMessageList'
import { generateNeroResponse, isAiApiConfigured } from '../lib/ai'

export default function ConversationView({ messages, setMessages, thinkingStreamLevel, energyLevel }) {
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const apiConfigured = isAiApiConfigured()

  const handleSend = async () => {
    if (!inputValue.trim()) return

    const userMessage = inputValue.trim()

    // Add user message
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      thinking: null
    }])

    setInputValue('')
    setIsTyping(true)

    try {
      // Generate response using AI infrastructure (API or local fallback)
      const { content, source } = await generateNeroResponse(
        userMessage,
        messages,
        { energyLevel }
      )

      setIsTyping(false)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content,
        thinking: thinkingStreamLevel !== 'off'
          ? source === 'api'
            ? 'Connected to AI — analyzing context and energy level...'
            : 'Using local intelligence — analyzing context and energy level...'
          : null
      }])
    } catch {
      setIsTyping(false)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I hit a snag there. Could you try saying that again?",
        thinking: null
      }])
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Virtualized message list */}
      <VirtualizedMessageList
        messages={messages}
        thinkingStreamLevel={thinkingStreamLevel}
        isTyping={isTyping}
      />

      {/* Input area - positioned above bottom nav */}
      <div className="fixed bottom-[72px] left-0 right-0 p-4 bg-gradient-to-t from-surface-dark via-surface-dark to-transparent pt-8 z-30">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2 items-end glass-card p-2 rounded-2xl">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Talk to Nero..."
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm px-3 py-2 max-h-32 min-h-[44px]"
              rows={1}
            />
            {/* AI status indicator */}
            <div className="flex items-center px-1" title={apiConfigured ? 'AI API connected' : 'Using local responses'}>
              {apiConfigured
                ? <Wifi className="w-3 h-3 text-green-400/60" />
                : <WifiOff className="w-3 h-3 text-white/20" />
              }
            </div>
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className={`p-3 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
                inputValue.trim()
                  ? 'bg-nero-500 hover:bg-nero-400 text-white'
                  : 'bg-white/5 text-white/30'
              }`}
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
