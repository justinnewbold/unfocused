import React, { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '../hooks/useReducedMotion'

// Celebration messages based on milestone
const CELEBRATION_MESSAGES = {
  task: [
    { threshold: 1, messages: ["First win!", "You started!", "Here we go!"] },
    { threshold: 3, messages: ["On a roll!", "Building momentum!", "Keep it up!"] },
    { threshold: 5, messages: ["Fantastic!", "You're crushing it!", "Unstoppable!"] },
    { threshold: 10, messages: ["LEGENDARY!", "Absolute beast!", "Machine mode!"] },
  ],
  session: [
    { threshold: 1, messages: ["Focus achieved!", "Deep work done!", "Session complete!"] },
    { threshold: 3, messages: ["Flow state master!", "Focus champion!", "Concentration king!"] },
    { threshold: 5, messages: ["Incredible focus!", "Peak performance!", "Zen mode!"] },
  ],
  streak: [
    { threshold: 3, messages: ["3 day streak!", "Building habits!", "Consistency!"] },
    { threshold: 7, messages: ["Week warrior!", "7 days strong!", "Habit formed!"] },
    { threshold: 14, messages: ["Two weeks!", "Unstoppable!", "New you!"] },
    { threshold: 30, messages: ["MONTHLY LEGEND!", "30 days!", "Life changed!"] },
  ],
}

// Confetti particle component
const ConfettiParticle = ({ x, color, delay, prefersReducedMotion }) => {
  if (prefersReducedMotion) return null

  return (
    <motion.div
      className="absolute w-3 h-3 rounded-sm"
      style={{
        left: `${x}%`,
        backgroundColor: color,
        top: -20,
      }}
      initial={{ y: 0, rotate: 0, opacity: 1 }}
      animate={{
        y: window.innerHeight + 50,
        rotate: Math.random() * 720 - 360,
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: 2 + Math.random(),
        delay: delay,
        ease: 'easeIn',
      }}
    />
  )
}

// Generate confetti colors
const CONFETTI_COLORS = [
  '#f19033', // nero orange
  '#22c55e', // calm green
  '#3b82f6', // focus blue
  '#fbbf24', // yellow
  '#ec4899', // pink
  '#8b5cf6', // purple
]

// Hook to manage celebration state
export function useCelebration() {
  const [celebration, setCelebration] = useState(null)
  const timeoutRef = useRef(null)

  const celebrate = useCallback((type, count) => {
    // Find appropriate message
    const messages = CELEBRATION_MESSAGES[type] || CELEBRATION_MESSAGES.task
    let selectedMessage = messages[0].messages[0]

    for (const tier of messages) {
      if (count >= tier.threshold) {
        selectedMessage = tier.messages[Math.floor(Math.random() * tier.messages.length)]
      }
    }

    // Determine intensity based on count
    const intensity = count >= 10 ? 'epic' : count >= 5 ? 'big' : count >= 3 ? 'medium' : 'small'

    setCelebration({
      type,
      count,
      message: selectedMessage,
      intensity,
      timestamp: Date.now(),
    })

    // Auto-dismiss after animation
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setCelebration(null)
    }, 3000)
  }, [])

  const dismiss = useCallback(() => {
    setCelebration(null)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  return { celebration, celebrate, dismiss }
}

// Main celebration overlay component
export default function Celebration({ celebration, onDismiss }) {
  const prefersReducedMotion = useReducedMotion()
  const [particles, setParticles] = useState([])
  const audioRef = useRef(null)

  // Initialize audio context for celebration sound
  useEffect(() => {
    audioRef.current = new (window.AudioContext || window.webkitAudioContext)()
  }, [])

  // Play celebration sound
  const playSound = useCallback((intensity) => {
    if (!audioRef.current) return

    try {
      const ctx = audioRef.current
      if (ctx.state === 'suspended') ctx.resume()

      const now = ctx.currentTime

      // Create ascending notes for "ta-da" effect
      const notes = intensity === 'epic'
        ? [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
        : intensity === 'big'
          ? [523.25, 659.25, 783.99] // C5, E5, G5
          : [523.25, 659.25] // C5, E5

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.frequency.value = freq
        osc.type = 'sine'

        gain.gain.setValueAtTime(0, now + i * 0.1)
        gain.gain.linearRampToValueAtTime(0.2, now + i * 0.1 + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3)

        osc.start(now + i * 0.1)
        osc.stop(now + i * 0.1 + 0.3)
      })
    } catch (e) {
      // Audio not supported
    }
  }, [])

  // Generate particles and play sound when celebration starts
  useEffect(() => {
    if (!celebration) {
      setParticles([])
      return
    }

    // Play sound
    playSound(celebration.intensity)

    // Generate confetti particles
    const particleCount = celebration.intensity === 'epic' ? 50
      : celebration.intensity === 'big' ? 30
        : celebration.intensity === 'medium' ? 15
          : 8

    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: Math.random() * 0.3,
    }))

    setParticles(newParticles)
  }, [celebration, playSound])

  if (!celebration) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Confetti layer */}
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((particle) => (
            <ConfettiParticle
              key={particle.id}
              x={particle.x}
              color={particle.color}
              delay={particle.delay}
              prefersReducedMotion={prefersReducedMotion}
            />
          ))}
        </div>

        {/* Celebration message */}
        <motion.div
          className="relative z-10 text-center pointer-events-auto"
          initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
          transition={{ type: 'spring', damping: 15 }}
          onClick={onDismiss}
        >
          {/* Glow effect */}
          {!prefersReducedMotion && (
            <motion.div
              className={`absolute inset-0 rounded-3xl blur-3xl ${
                celebration.intensity === 'epic' ? 'bg-nero-500/40'
                  : celebration.intensity === 'big' ? 'bg-nero-500/30'
                    : 'bg-nero-500/20'
              }`}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
            />
          )}

          <div className="relative glass-card px-8 py-6">
            {/* Count badge */}
            <motion.div
              className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-nero-500 to-nero-600 text-white text-sm font-bold shadow-lg"
              initial={prefersReducedMotion ? {} : { y: -20, opacity: 0 }}
              animate={prefersReducedMotion ? {} : { y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              #{celebration.count}
            </motion.div>

            {/* Main message */}
            <motion.h2
              className={`font-display font-bold ${
                celebration.intensity === 'epic' ? 'text-4xl'
                  : celebration.intensity === 'big' ? 'text-3xl'
                    : 'text-2xl'
              } bg-gradient-to-r from-nero-400 via-yellow-400 to-nero-400 bg-clip-text text-transparent`}
              initial={prefersReducedMotion ? {} : { y: 20, opacity: 0 }}
              animate={prefersReducedMotion ? {} : { y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {celebration.message}
            </motion.h2>

            {/* Sub-message */}
            <motion.p
              className="text-white/60 mt-2"
              initial={prefersReducedMotion ? {} : { opacity: 0 }}
              animate={prefersReducedMotion ? {} : { opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {celebration.type === 'task' && 'Task completed'}
              {celebration.type === 'session' && 'Focus session done'}
              {celebration.type === 'streak' && 'Streak milestone'}
            </motion.p>

            {/* Tap to dismiss hint */}
            <motion.p
              className="text-white/30 text-xs mt-3"
              initial={prefersReducedMotion ? {} : { opacity: 0 }}
              animate={prefersReducedMotion ? {} : { opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              tap to continue
            </motion.p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
