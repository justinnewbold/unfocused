import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  X,
  Lightbulb,
  ListTodo,
  Brain,
  Send,
  Mic,
  MicOff
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Capture types for quick selection
const CAPTURE_TYPES = [
  { id: 'thought', icon: Lightbulb, label: 'Random thought', color: 'nero' },
  { id: 'task', icon: ListTodo, label: 'Task to do', color: 'focus' },
  { id: 'idea', icon: Brain, label: 'Idea to explore', color: 'calm' },
]

export default function QuickCapture({ onCapture, onCreateTask }) {
  const prefersReducedMotion = useReducedMotion()
  const [isOpen, setIsOpen] = useState(false)
  const [captureType, setCaptureType] = useState('thought')
  const [text, setText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)

  // Initialize speech recognition if available
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('')
        setText(transcript)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
      }
    }
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const toggleListening = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleSubmit = () => {
    if (!text.trim()) return

    const capture = {
      id: Date.now().toString(),
      type: captureType,
      text: text.trim(),
      createdAt: new Date(),
    }

    // If it's a task, create it directly
    if (captureType === 'task' && onCreateTask) {
      onCreateTask({
        id: capture.id,
        title: text.trim(),
        description: '',
        energyRequired: 2,
        reason: 'Captured from brain dump',
        isCompleted: false,
      })
    }

    // Always call onCapture for tracking
    onCapture?.(capture)

    // Reset and close
    setText('')
    setCaptureType('thought')
    setIsOpen(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 bottom-24 z-30 w-14 h-14 rounded-full bg-gradient-to-br from-nero-500 to-nero-600 text-white shadow-lg shadow-nero-500/30 flex items-center justify-center"
        whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
        title="Quick capture (Q)"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* Capture Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            {...getMotionProps(prefersReducedMotion, {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              exit: { opacity: 0 }
            })}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Content */}
            <motion.div
              className="relative w-full max-w-md glass-card p-5 mb-safe"
              {...getMotionProps(prefersReducedMotion, {
                initial: { y: 100, opacity: 0 },
                animate: { y: 0, opacity: 1 },
                exit: { y: 100, opacity: 0 }
              })}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-nero-500/20 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-nero-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold">Brain Dump</h3>
                    <p className="text-xs text-white/50">Capture it before it's gone</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Capture Type Selector */}
              <div className="flex gap-2 mb-4">
                {CAPTURE_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setCaptureType(type.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl transition-all ${
                      captureType === type.id
                        ? `bg-${type.color}-500/20 text-${type.color}-400 border border-${type.color}-500/30`
                        : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <type.icon className="w-4 h-4" />
                    <span className="text-xs font-medium hidden sm:inline">{type.label}</span>
                  </button>
                ))}
              </div>

              {/* Text Input */}
              <div className="relative mb-4">
                <textarea
                  ref={inputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    captureType === 'thought'
                      ? "What's on your mind?"
                      : captureType === 'task'
                        ? "What needs to be done?"
                        : "What's the idea?"
                  }
                  className="w-full h-24 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 resize-none focus:outline-none focus:border-nero-500/50 focus:ring-1 focus:ring-nero-500/25"
                />

                {/* Voice input button */}
                {recognitionRef.current && (
                  <button
                    onClick={toggleListening}
                    className={`absolute right-3 bottom-3 p-2 rounded-lg transition-colors ${
                      isListening
                        ? 'bg-red-500/20 text-red-400 animate-pulse'
                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                    title={isListening ? 'Stop listening' : 'Voice input'}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!text.trim()}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    text.trim()
                      ? 'bg-gradient-to-r from-nero-500 to-nero-600 text-white shadow-lg shadow-nero-500/25'
                      : 'bg-white/10 text-white/30 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  Capture
                </button>
              </div>

              {/* Keyboard hint */}
              <p className="text-center text-white/30 text-xs mt-3">
                Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">Enter</kbd> to save
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
