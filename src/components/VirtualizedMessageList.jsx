import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Brain, ChevronDown } from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

/**
 * Virtualized message list for the conversation view.
 * Only renders messages visible in the viewport + a small buffer,
 * preventing performance degradation with hundreds of messages.
 */

// Estimated height per message for virtual scrolling
const ESTIMATED_MESSAGE_HEIGHT = 100
const BUFFER_COUNT = 5 // Extra messages to render above/below viewport

export default function VirtualizedMessageList({ messages, thinkingStreamLevel, isTyping }) {
  const prefersReducedMotion = useReducedMotion()
  const containerRef = useRef(null)
  const messagesEndRef = useRef(null)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 })

  // Track whether we should auto-scroll
  const shouldAutoScroll = useRef(true)

  // Use virtualization only when message count is high
  const useVirtualization = messages.length > 50

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : behavior,
      })
    }
  }, [prefersReducedMotion])

  // Auto-scroll when new messages arrive (if user is near bottom)
  useEffect(() => {
    if (shouldAutoScroll.current) {
      scrollToBottom()
    }
  }, [messages.length, isTyping, scrollToBottom])

  // Track scroll position to determine if user is near bottom
  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    const nearBottom = distanceFromBottom < 100

    setIsNearBottom(nearBottom)
    shouldAutoScroll.current = nearBottom

    // Update visible range for virtualization
    if (useVirtualization) {
      const start = Math.max(0, Math.floor(scrollTop / ESTIMATED_MESSAGE_HEIGHT) - BUFFER_COUNT)
      const visibleCount = Math.ceil(clientHeight / ESTIMATED_MESSAGE_HEIGHT) + BUFFER_COUNT * 2
      const end = Math.min(messages.length, start + visibleCount)
      setVisibleRange({ start, end })
    }
  }, [messages.length, useVirtualization])

  // Visible messages (all if not virtualized, subset if virtualized)
  const visibleMessages = useMemo(() => {
    if (!useVirtualization) return messages
    return messages.slice(visibleRange.start, visibleRange.end)
  }, [messages, visibleRange, useVirtualization])

  const messageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0 },
  }

  return (
    <div className="relative flex-1 flex flex-col">
      {/* Scrollable message area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 pb-32"
      >
        {/* Spacer for virtualized messages above */}
        {useVirtualization && visibleRange.start > 0 && (
          <div style={{ height: visibleRange.start * ESTIMATED_MESSAGE_HEIGHT }} />
        )}

        {visibleMessages.map((message, i) => {
          const actualIndex = useVirtualization ? visibleRange.start + i : i
          return (
            <MessageBubble
              key={actualIndex}
              message={message}
              prefersReducedMotion={prefersReducedMotion}
              thinkingStreamLevel={thinkingStreamLevel}
              variants={messageVariants}
            />
          )
        })}

        {/* Spacer for virtualized messages below */}
        {useVirtualization && visibleRange.end < messages.length && (
          <div style={{ height: (messages.length - visibleRange.end) * ESTIMATED_MESSAGE_HEIGHT }} />
        )}

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

      {/* Scroll-to-bottom button */}
      {!isNearBottom && (
        <button
          onClick={() => {
            shouldAutoScroll.current = true
            scrollToBottom()
          }}
          className="absolute bottom-36 right-4 p-2 rounded-full bg-surface-light/90 backdrop-blur-sm border border-white/10 shadow-lg hover:bg-surface-lighter transition-colors z-10"
          aria-label="Scroll to latest messages"
        >
          <ChevronDown className="w-5 h-5 text-white/70" />
        </button>
      )}
    </div>
  )
}

/**
 * Individual message bubble component - extracted for performance.
 */
const MessageBubble = React.memo(function MessageBubble({
  message,
  prefersReducedMotion,
  thinkingStreamLevel,
  variants,
}) {
  return (
    <motion.div
      {...getMotionProps(prefersReducedMotion, variants)}
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
              ? 'Thinking...'
              : message.thinking}
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
  )
})
