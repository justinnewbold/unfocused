import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Brain } from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

export default function ConversationView({ messages, setMessages, thinkingStreamLevel, energyLevel }) {
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const prefersReducedMotion = useReducedMotion()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!inputValue.trim()) return

    // Add user message
    setMessages(prev => [...prev, {
      role: 'user',
      content: inputValue.trim(),
      thinking: null
    }])

    setInputValue('')
    setIsTyping(true)

    // Simulate Nero's response
    setTimeout(() => {
      setIsTyping(false)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: getContextualResponse(inputValue.trim(), energyLevel),
        thinking: thinkingStreamLevel !== 'off' ? 'Analyzing context and energy level to provide relevant suggestions...' : null
      }])
    }, 1500)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const messageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0 }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        {messages.map((message, index) => (
          <motion.div
            key={index}
            {...getMotionProps(prefersReducedMotion, messageVariants)}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : ''}`}>
              {/* Assistant avatar */}
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-nero-400 to-nero-600 flex items-center justify-center">
                    <Brain className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs text-white/50 font-medium">Nero</span>
                </div>
              )}

              {/* Thinking stream */}
              {message.thinking && thinkingStreamLevel !== 'off' && (
                <div className="mb-2 px-3 py-2 rounded-lg bg-nero-500/10 border border-nero-500/20 text-xs text-nero-300/70 italic">
                  {thinkingStreamLevel === 'minimal'
                    ? '💭 Thinking...'
                    : `💭 ${message.thinking}`
                  }
                </div>
              )}

              {/* Message bubble */}
              <div
                className={`px-4 py-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-nero-500/20 text-white rounded-br-md'
                    : 'glass-card rounded-bl-md'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-nero-400 to-nero-600 flex items-center justify-center">
              <Brain className="w-3 h-3 text-white" />
            </div>
            <div className="flex gap-1 px-4 py-3 glass-card rounded-2xl rounded-bl-md">
              <div className="thinking-dot" />
              <div className="thinking-dot" />
              <div className="thinking-dot" />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

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

// Helper function for demo responses
function getContextualResponse(input, energyLevel) {
  const lowerInput = input.toLowerCase()

  if (lowerInput.includes('help') || lowerInput.includes('stuck')) {
    return "I've got you. Let's break this down into something tiny. What's the ONE physical action you could do in the next 30 seconds? Even just standing up counts."
  }

  if (lowerInput.includes('overwhelm') || lowerInput.includes('too much')) {
    return "That feeling is valid. Your brain is juggling a lot. Want me to show you your breadcrumb trail? Sometimes seeing where you've been helps figure out where to go next."
  }

  if (lowerInput.includes('forgot') || lowerInput.includes('where was')) {
    return "No worries - that's literally what I'm here for. Check your Trail tab - I've been keeping notes on where you left off. Your past self was pretty smart about leaving clues."
  }

  if (energyLevel <= 2) {
    return "I can sense the energy is low right now. That's okay. Want me to suggest something that takes less than 2 minutes? Small wins build momentum."
  }

  return "I'm tracking your context. If you need to jump to something else, just drop a breadcrumb and I'll help you find your way back. What's on your mind?"
}
