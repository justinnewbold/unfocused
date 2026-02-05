import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dumbbell,
  Play,
  Pause,
  SkipForward,
  RefreshCw,
  Clock,
  CheckCircle,
  Flame,
  Heart,
  Wind,
  Eye,
  Hand,
  ArrowUp,
  RotateCcw,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const MOVEMENT_LOG_KEY = 'nero_movement_log'

// Movement categories
const CATEGORIES = {
  stretch: { label: 'Stretch', icon: Hand, color: 'green' },
  energize: { label: 'Energize', icon: Flame, color: 'orange' },
  calm: { label: 'Calm', icon: Heart, color: 'blue' },
  eyes: { label: 'Eye Care', icon: Eye, color: 'purple' },
  posture: { label: 'Posture', icon: ArrowUp, color: 'cyan' },
}

// Movement exercises
const MOVEMENTS = [
  // Stretches
  {
    id: 'neck_rolls',
    category: 'stretch',
    name: 'Neck Rolls',
    duration: 30,
    instructions: [
      'Slowly roll your head in a circle',
      'Go clockwise for 5 rotations',
      'Then counter-clockwise for 5',
      'Keep shoulders relaxed',
    ],
  },
  {
    id: 'shoulder_shrugs',
    category: 'stretch',
    name: 'Shoulder Shrugs',
    duration: 20,
    instructions: [
      'Raise both shoulders up to ears',
      'Hold for 3 seconds',
      'Release and let them drop',
      'Repeat 5 times',
    ],
  },
  {
    id: 'wrist_circles',
    category: 'stretch',
    name: 'Wrist Circles',
    duration: 20,
    instructions: [
      'Extend arms in front of you',
      'Circle wrists clockwise 10 times',
      'Circle counter-clockwise 10 times',
      'Shake hands out',
    ],
  },
  {
    id: 'standing_stretch',
    category: 'stretch',
    name: 'Full Body Stretch',
    duration: 30,
    instructions: [
      'Stand up tall',
      'Reach arms overhead',
      'Interlace fingers and stretch up',
      'Hold for 10 seconds, then release',
    ],
  },
  // Energize
  {
    id: 'jumping_jacks',
    category: 'energize',
    name: 'Jumping Jacks',
    duration: 30,
    instructions: [
      'Start standing with arms at sides',
      'Jump while spreading legs and raising arms',
      'Jump back to start position',
      'Do 15-20 reps',
    ],
  },
  {
    id: 'march_in_place',
    category: 'energize',
    name: 'March in Place',
    duration: 30,
    instructions: [
      'Stand tall',
      'Lift knees high as you march',
      'Swing arms naturally',
      'Keep a steady pace for 30 seconds',
    ],
  },
  {
    id: 'desk_pushups',
    category: 'energize',
    name: 'Desk Push-ups',
    duration: 30,
    instructions: [
      'Place hands on desk edge',
      'Step back until body is angled',
      'Lower chest toward desk',
      'Push back up. Do 10 reps',
    ],
  },
  // Calm
  {
    id: 'deep_breathing',
    category: 'calm',
    name: 'Deep Breathing',
    duration: 60,
    instructions: [
      'Sit comfortably',
      'Breathe in slowly for 4 counts',
      'Hold for 4 counts',
      'Breathe out for 6 counts. Repeat 5 times',
    ],
  },
  {
    id: 'body_scan',
    category: 'calm',
    name: 'Mini Body Scan',
    duration: 45,
    instructions: [
      'Close your eyes',
      'Notice tension in your face, release it',
      'Check shoulders, hands, back',
      'Release any tension you find',
    ],
  },
  // Eye Care
  {
    id: '20_20_20',
    category: 'eyes',
    name: '20-20-20 Rule',
    duration: 20,
    instructions: [
      'Look away from screen',
      'Focus on something 20 feet away',
      'Hold for 20 seconds',
      'Blink several times',
    ],
  },
  {
    id: 'eye_circles',
    category: 'eyes',
    name: 'Eye Circles',
    duration: 20,
    instructions: [
      'Close your eyes',
      'Roll eyes in a circle clockwise',
      'Then counter-clockwise',
      '5 rotations each direction',
    ],
  },
  {
    id: 'palming',
    category: 'eyes',
    name: 'Palming',
    duration: 30,
    instructions: [
      'Rub palms together to warm them',
      'Cup palms over closed eyes',
      'Relax and breathe',
      'Enjoy the darkness for 30 seconds',
    ],
  },
  // Posture
  {
    id: 'posture_check',
    category: 'posture',
    name: 'Posture Reset',
    duration: 15,
    instructions: [
      'Sit up straight',
      'Roll shoulders back and down',
      'Align ears over shoulders',
      'Feet flat on floor',
    ],
  },
  {
    id: 'chin_tucks',
    category: 'posture',
    name: 'Chin Tucks',
    duration: 20,
    instructions: [
      'Sit or stand tall',
      'Pull chin straight back (make a double chin)',
      'Hold for 5 seconds',
      'Release. Repeat 5 times',
    ],
  },
]

// Load movement log
const loadMovementLog = () => {
  try {
    const stored = localStorage.getItem(MOVEMENT_LOG_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save movement log
const saveMovementLog = (log) => {
  localStorage.setItem(MOVEMENT_LOG_KEY, JSON.stringify(log.slice(-100)))
}

export default function MovementBreaks({ isTimerRunning, onBreakComplete }) {
  const prefersReducedMotion = useReducedMotion()
  const [movementLog, setMovementLog] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [activeMovement, setActiveMovement] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const timerRef = useRef(null)

  // Load log on mount
  useEffect(() => {
    setMovementLog(loadMovementLog())
  }, [])

  // Timer effect
  useEffect(() => {
    if (activeMovement && !isPaused && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            completeMovement()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => clearInterval(timerRef.current)
  }, [activeMovement, isPaused, timeRemaining])

  // Filter movements by category
  const filteredMovements = selectedCategory
    ? MOVEMENTS.filter(m => m.category === selectedCategory)
    : MOVEMENTS

  // Start movement
  const startMovement = (movement) => {
    setActiveMovement(movement)
    setTimeRemaining(movement.duration)
    setCurrentStep(0)
    setIsPaused(false)
  }

  // Complete movement
  const completeMovement = () => {
    clearInterval(timerRef.current)

    const entry = {
      id: Date.now().toString(),
      movementId: activeMovement.id,
      category: activeMovement.category,
      duration: activeMovement.duration,
      completedAt: new Date().toISOString(),
    }

    const newLog = [entry, ...movementLog]
    setMovementLog(newLog)
    saveMovementLog(newLog)

    onBreakComplete?.(activeMovement)
    setActiveMovement(null)
  }

  // Skip movement
  const skipMovement = () => {
    clearInterval(timerRef.current)
    setActiveMovement(null)
  }

  // Toggle pause
  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  // Get random movement
  const getRandomMovement = () => {
    const category = selectedCategory
      ? MOVEMENTS.filter(m => m.category === selectedCategory)
      : MOVEMENTS
    const random = category[Math.floor(Math.random() * category.length)]
    startMovement(random)
  }

  // Today's stats
  const todayStats = movementLog.filter(e => {
    const today = new Date().toISOString().split('T')[0]
    return e.completedAt.startsWith(today)
  })

  const totalMinutesToday = todayStats.reduce((sum, e) => sum + e.duration, 0) / 60

  return (
    <div className="h-full overflow-y-auto p-4 pb-8">
      <motion.div
        className="max-w-lg mx-auto"
        {...getMotionProps(prefersReducedMotion, {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 }
        })}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-xl font-semibold">Movement Breaks</h2>
            <p className="text-sm text-white/50">Keep your body happy</p>
          </div>
          <button
            onClick={getRandomMovement}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Random
          </button>
        </div>

        {/* Active Movement */}
        <AnimatePresence>
          {activeMovement && (
            <motion.div
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0, scale: 0.95 },
                animate: { opacity: 1, scale: 1 },
                exit: { opacity: 0, scale: 0.95 }
              })}
              className="mb-6 glass-card p-6 text-center border border-green-500/30"
            >
              {/* Timer */}
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-white/10"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={364}
                    strokeDashoffset={364 - (364 * timeRemaining / activeMovement.duration)}
                    className="text-green-500 transition-all duration-1000"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold">{timeRemaining}</span>
                </div>
              </div>

              <h3 className="text-lg font-medium mb-2">{activeMovement.name}</h3>

              {/* Instructions */}
              <div className="text-left bg-white/5 rounded-xl p-4 mb-4">
                {activeMovement.instructions.map((instruction, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 mb-2 last:mb-0 ${
                      i === currentStep ? 'text-green-400' : 'text-white/50'
                    }`}
                  >
                    <span className="text-xs mt-1">{i + 1}.</span>
                    <span className="text-sm">{instruction}</span>
                  </div>
                ))}
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-3">
                <button
                  onClick={togglePause}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  onClick={skipMovement}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <SkipForward className="w-4 h-4" />
                  Skip
                </button>
                <button
                  onClick={completeMovement}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Done
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Today's Stats */}
        {!activeMovement && todayStats.length > 0 && (
          <div className="glass-card p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-green-400" />
                <span className="text-sm text-white/70">Today's Breaks</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-green-400">{todayStats.length}</span>
                <span className="text-sm text-white/50 ml-2">
                  ({Math.round(totalMinutesToday)} min)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Category Filter */}
        {!activeMovement && (
          <>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  !selectedCategory
                    ? 'bg-white/10 text-white'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                All
              </button>
              {Object.entries(CATEGORIES).map(([id, cat]) => (
                <button
                  key={id}
                  onClick={() => setSelectedCategory(selectedCategory === id ? null : id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                    selectedCategory === id
                      ? `bg-${cat.color}-500/20 text-${cat.color}-400`
                      : 'bg-white/5 text-white/50 hover:bg-white/10'
                  }`}
                >
                  <cat.icon className="w-4 h-4" />
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Movement List */}
            <div className="grid grid-cols-2 gap-3">
              {filteredMovements.map((movement) => {
                const cat = CATEGORIES[movement.category]

                return (
                  <motion.button
                    key={movement.id}
                    onClick={() => startMovement(movement)}
                    whileHover={!prefersReducedMotion ? { scale: 1.02 } : {}}
                    whileTap={!prefersReducedMotion ? { scale: 0.98 } : {}}
                    className={`glass-card p-4 text-left transition-all hover:border-${cat.color}-500/30`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-${cat.color}-500/20 flex items-center justify-center mb-3`}>
                      <cat.icon className={`w-5 h-5 text-${cat.color}-400`} />
                    </div>
                    <h3 className="font-medium text-sm mb-1">{movement.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-white/50">
                      <Clock className="w-3 h-3" />
                      {movement.duration}s
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </>
        )}

        {/* Tips */}
        <div className="mt-6 p-4 bg-white/5 rounded-xl">
          <p className="text-sm text-white/50">
            <strong className="text-white/70">Movement tip:</strong> ADHD brains benefit from regular
            movement breaks. Even 30 seconds of stretching can help reset focus and improve blood flow.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
