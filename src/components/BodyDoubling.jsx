import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  X,
  MessageCircle,
  ThumbsUp,
  Coffee,
  AlertTriangle,
  Check,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Check-in messages based on context
const CHECK_IN_MESSAGES = {
  start: [
    "I'm here with you. Let's do this!",
    "Ready when you are. We've got this together.",
    "Starting our focus session. I'll keep you company.",
  ],
  working: [
    "Still here! How's it going?",
    "Checking in - need anything?",
    "You're doing great. Keep it up!",
    "Making progress? I'm rooting for you!",
    "Just a friendly nudge. Stay focused!",
  ],
  break: [
    "Good time for a quick stretch?",
    "Remember to hydrate!",
    "Take a breath. You've earned it.",
    "Short break? I'll be here when you're back.",
  ],
  encouragement: [
    "You've got this!",
    "One step at a time.",
    "Progress, not perfection.",
    "Every minute counts.",
    "I believe in you!",
  ],
  distracted: [
    "Hey, noticed you might be drifting. All good?",
    "Gentle reminder: what's your One Thing?",
    "Let's refocus together. You can do this.",
    "It's okay to get distracted. Ready to jump back in?",
  ]
}

// Quick response options
const QUICK_RESPONSES = [
  { id: 'focused', icon: Check, label: 'Focused', color: 'calm' },
  { id: 'struggling', icon: AlertTriangle, label: 'Struggling', color: 'orange' },
  { id: 'break', icon: Coffee, label: 'Need break', color: 'focus' },
  { id: 'done', icon: ThumbsUp, label: 'Made progress!', color: 'nero' },
]

export default function BodyDoubling({ isTimerRunning, onRequestBreak }) {
  const prefersReducedMotion = useReducedMotion()
  const [isActive, setIsActive] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const [currentMessage, setCurrentMessage] = useState(null)
  const [checkInInterval, setCheckInInterval] = useState(10) // minutes
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [sessionStartTime, setSessionStartTime] = useState(null)
  const [lastCheckIn, setLastCheckIn] = useState(null)

  const checkInTimerRef = useRef(null)
  const audioRef = useRef(null)

  // Initialize audio
  useEffect(() => {
    audioRef.current = new (window.AudioContext || window.webkitAudioContext)()
  }, [])

  // Play gentle notification sound
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled || !audioRef.current) return

    try {
      const ctx = audioRef.current
      if (ctx.state === 'suspended') ctx.resume()

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      // Soft, gentle tone
      osc.frequency.value = 440
      osc.type = 'sine'

      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.5)
    } catch (e) {
      // Audio not supported
    }
  }, [soundEnabled])

  // Get random message from category
  const getRandomMessage = useCallback((category) => {
    const messages = CHECK_IN_MESSAGES[category]
    return messages[Math.floor(Math.random() * messages.length)]
  }, [])

  // Show check-in message
  const showCheckIn = useCallback((category = 'working') => {
    const message = getRandomMessage(category)
    setCurrentMessage({ text: message, category, timestamp: Date.now() })
    setLastCheckIn(Date.now())
    playNotificationSound()

    // Auto-dismiss after 30 seconds if not interacted with
    setTimeout(() => {
      setCurrentMessage(prev => {
        if (prev && Date.now() - prev.timestamp >= 25000) {
          return null
        }
        return prev
      })
    }, 30000)
  }, [getRandomMessage, playNotificationSound])

  // Handle quick response
  const handleResponse = useCallback((responseId) => {
    setCurrentMessage(null)

    switch (responseId) {
      case 'focused':
        // Great! Keep going
        setTimeout(() => showCheckIn('encouragement'), 500)
        break
      case 'struggling':
        // Offer support
        setCurrentMessage({
          text: "That's okay! Try breaking your task into a smaller step. What's the very next action?",
          category: 'support',
          timestamp: Date.now()
        })
        break
      case 'break':
        onRequestBreak?.()
        setCurrentMessage({
          text: "Break time! Step away from the screen. I'll be here when you're back.",
          category: 'break',
          timestamp: Date.now()
        })
        break
      case 'done':
        setCurrentMessage({
          text: "Awesome! Every bit of progress counts. Ready for the next thing?",
          category: 'celebration',
          timestamp: Date.now()
        })
        break
    }
  }, [showCheckIn, onRequestBreak])

  // Start body doubling session
  const startSession = useCallback(() => {
    setIsActive(true)
    setSessionStartTime(Date.now())
    showCheckIn('start')

    // Set up periodic check-ins
    checkInTimerRef.current = setInterval(() => {
      showCheckIn('working')
    }, checkInInterval * 60 * 1000)
  }, [checkInInterval, showCheckIn])

  // End body doubling session
  const endSession = useCallback(() => {
    setIsActive(false)
    setSessionStartTime(null)
    setCurrentMessage(null)
    if (checkInTimerRef.current) {
      clearInterval(checkInTimerRef.current)
    }
  }, [])

  // Auto-start when timer starts (if body doubling is enabled)
  useEffect(() => {
    if (isTimerRunning && !isActive && showPanel) {
      startSession()
    }
  }, [isTimerRunning, isActive, showPanel, startSession])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (checkInTimerRef.current) {
        clearInterval(checkInTimerRef.current)
      }
    }
  }, [])

  // Format session duration
  const getSessionDuration = () => {
    if (!sessionStartTime) return '0m'
    const minutes = Math.floor((Date.now() - sessionStartTime) / 60000)
    if (minutes < 60) return `${minutes}m`
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
  }

  return (
    <>
      {/* Floating indicator when active */}
      <AnimatePresence>
        {isActive && !showPanel && (
          <motion.button
            onClick={() => setShowPanel(true)}
            className="fixed left-4 bottom-24 z-30 flex items-center gap-2 px-3 py-2 rounded-full bg-focus-500/20 border border-focus-500/30 text-focus-400"
            {...getMotionProps(prefersReducedMotion, {
              initial: { opacity: 0, x: -20 },
              animate: { opacity: 1, x: 0 },
              exit: { opacity: 0, x: -20 }
            })}
          >
            <div className="relative">
              <Users className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-calm-500 animate-pulse" />
            </div>
            <span className="text-xs">Nero is with you</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main panel trigger (when not active) */}
      {!isActive && !showPanel && (
        <motion.button
          onClick={() => setShowPanel(true)}
          className="fixed left-4 bottom-24 z-30 p-3 rounded-full bg-surface-light/90 border border-white/10 text-white/60 hover:text-white hover:bg-surface-lighter transition-colors"
          title="Body Doubling Mode"
        >
          <Users className="w-5 h-5" />
        </motion.button>
      )}

      {/* Check-in notification */}
      <AnimatePresence>
        {currentMessage && (
          <motion.div
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm"
            {...getMotionProps(prefersReducedMotion, {
              initial: { opacity: 0, y: -20, scale: 0.95 },
              animate: { opacity: 1, y: 0, scale: 1 },
              exit: { opacity: 0, y: -20, scale: 0.95 }
            })}
          >
            <div className="glass-card p-4 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-focus-500/20 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-focus-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-focus-400 mb-1">Nero</p>
                  <p className="text-white/90">{currentMessage.text}</p>

                  {/* Quick responses */}
                  {currentMessage.category === 'working' && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {QUICK_RESPONSES.map((response) => (
                        <button
                          key={response.id}
                          onClick={() => handleResponse(response.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-${response.color}-500/10 hover:bg-${response.color}-500/20 text-${response.color}-400 text-sm transition-colors`}
                        >
                          <response.icon className="w-3 h-3" />
                          {response.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setCurrentMessage(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            {...getMotionProps(prefersReducedMotion, {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              exit: { opacity: 0 }
            })}
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowPanel(false)}
            />

            <motion.div
              className="relative w-full max-w-sm glass-card p-5"
              {...getMotionProps(prefersReducedMotion, {
                initial: { y: 100, opacity: 0 },
                animate: { y: 0, opacity: 1 },
                exit: { y: 100, opacity: 0 }
              })}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-focus-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-focus-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold">Body Doubling</h3>
                    <p className="text-xs text-white/50">Virtual accountability partner</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPanel(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status */}
              {isActive && (
                <div className="mb-4 p-3 rounded-xl bg-calm-500/10 border border-calm-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-calm-500 animate-pulse" />
                      <span className="text-calm-400 text-sm font-medium">Session active</span>
                    </div>
                    <span className="text-white/50 text-sm">{getSessionDuration()}</span>
                  </div>
                </div>
              )}

              {/* Description */}
              <p className="text-white/60 text-sm mb-5">
                Nero will check in periodically to help you stay on track. Like having a study buddy!
              </p>

              {/* Settings */}
              <div className="space-y-4 mb-5">
                {/* Check-in interval */}
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Check-in every</span>
                  <select
                    value={checkInInterval}
                    onChange={(e) => setCheckInInterval(Number(e.target.value))}
                    className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  >
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={20}>20 minutes</option>
                    <option value={30}>30 minutes</option>
                  </select>
                </div>

                {/* Sound toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Notification sound</span>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`p-2 rounded-lg transition-colors ${
                      soundEnabled
                        ? 'bg-white/10 text-white'
                        : 'bg-white/5 text-white/40'
                    }`}
                  >
                    {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Action button */}
              {isActive ? (
                <button
                  onClick={endSession}
                  className="w-full px-4 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium transition-colors"
                >
                  End Session
                </button>
              ) : (
                <button
                  onClick={() => {
                    startSession()
                    setShowPanel(false)
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-focus-500 hover:bg-focus-600 text-white font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Start Body Doubling
                </button>
              )}

              {/* Tip */}
              <p className="text-center text-white/30 text-xs mt-4">
                Auto-starts when you run the focus timer
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
