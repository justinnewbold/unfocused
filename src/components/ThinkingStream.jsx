import React from 'react'
import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'
import { useReducedMotion } from '../hooks/useReducedMotion'

export default function ThinkingStream({ content, level }) {
  const prefersReducedMotion = useReducedMotion()

  if (level === 'off' || !content) return null

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
      className="mb-3 px-3 py-2 rounded-lg bg-nero-500/10 border border-nero-500/20"
    >
      <div className="flex items-start gap-2">
        <Brain className="w-4 h-4 text-nero-400/60 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-nero-300/70 italic">
          {level === 'minimal' ? (
            <span className="flex items-center gap-2">
              Thinking
              <span className="flex gap-1">
                <span className="thinking-dot" />
                <span className="thinking-dot" />
                <span className="thinking-dot" />
              </span>
            </span>
          ) : (
            content
          )}
        </div>
      </div>
    </motion.div>
  )
}
