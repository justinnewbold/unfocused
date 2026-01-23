import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  Wind,
  Eye,
  Pause,
  Play,
  RotateCcw,
  CheckCircle,
  Sparkles,
  Frown,
  Meh,
  Smile,
  Angry,
  AlertCircle,
  Zap,
  X,
  ChevronRight,
  Timer,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key for mood tracking
const MOOD_STORAGE_KEY = 'nero_mood_history'

// Breathing patterns
const BREATHING_PATTERNS = {
  box: {
    name: 'Box Breathing',
    description: 'Equal counts for calm focus',
    steps: [
      { action: 'Inhale', duration: 4 },
      { action: 'Hold', duration: 4 },
      { action: 'Exhale', duration: 4 },
      { action: 'Hold', duration: 4 },
    ],
    cycles: 4,
    color: 'calm',
  },
  relaxing: {
    name: '4-7-8 Relaxing',
    description: 'Deep relaxation technique',
    steps: [
      { action: 'Inhale', duration: 4 },
      { action: 'Hold', duration: 7 },
      { action: 'Exhale', duration: 8 },
    ],
    cycles: 4,
    color: 'purple',
  },
  energizing: {
    name: 'Energizing Breath',
    description: 'Quick pick-me-up',
    steps: [
      { action: 'Inhale', duration: 2 },
      { action: 'Exhale', duration: 2 },
    ],
    cycles: 10,
    color: 'orange',
  },
  sigh: {
    name: 'Physiological Sigh',
    description: 'Instant stress relief',
    steps: [
      { action: 'Inhale', duration: 2 },
      { action: 'Inhale more', duration: 1 },
      { action: 'Long exhale', duration: 6 },
    ],
    cycles: 3,
    color: 'green',
  },
}

// Grounding exercise (5-4-3-2-1)
const GROUNDING_STEPS = [
  { count: 5, sense: 'See', prompt: "Name 5 things you can see", icon: Eye },
  { count: 4, sense: 'Touch', prompt: "Name 4 things you can touch", icon: Hand },
  { count: 3, sense: 'Hear', prompt: "Name 3 things you can hear", icon: Ear },
  { count: 2, sense: 'Smell', prompt: "Name 2 things you can smell", icon: Nose },
  { count: 1, sense: 'Taste', prompt: "Name 1 thing you can taste", icon: Tongue },
]

// Simple icons for senses (using basic shapes since lucide doesn't have all)
const Hand = (props) => <div {...props}>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </svg>
</div>

const Ear = (props) => <div {...props}>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
    <path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0" />
    <path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 0 4 0" />
  </svg>
</div>

const Nose = (props) => <div {...props}>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
    <path d="M12 2v8" />
    <path d="M8 14c-2 0-3 1-3 3 0 1.5 1.5 3 4 3h6c2.5 0 4-1.5 4-3 0-2-1-3-3-3" />
    <path d="M19 14c0-4-3-8-7-8s-7 4-7 8" />
  </svg>
</div>

const Tongue = (props) => <div {...props}>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
    <path d="M12 22c-4 0-7-3-7-7V9c0-4 3-7 7-7s7 3 7 7v6c0 4-3 7-7 7z" />
    <path d="M12 18c-2 0-3-1.5-3-3v-2c0-1.5 1-3 3-3s3 1.5 3 3v2c0 1.5-1 3-3 3z" />
  </svg>
</div>

// Mood options
const MOODS = [
  { id: 'great', label: 'Great', icon: Sparkles, color: 'text-green-400' },
  { id: 'good', label: 'Good', icon: Smile, color: 'text-calm-400' },
  { id: 'okay', label: 'Okay', icon: Meh, color: 'text-yellow-400' },
  { id: 'low', label: 'Low', icon: Frown, color: 'text-orange-400' },
  { id: 'frustrated', label: 'Frustrated', icon: Angry, color: 'text-red-400' },
  { id: 'anxious', label: 'Anxious', icon: AlertCircle, color: 'text-purple-400' },
  { id: 'overwhelmed', label: 'Overwhelmed', icon: Zap, color: 'text-pink-400' },
]

// Get mood history
const getMoodHistory = () => {
  try {
    const stored = localStorage.getItem(MOOD_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (e) {
    return []
  }
}

// Save mood
const saveMood = (mood, context = '') => {
  try {
    const history = getMoodHistory()
    history.push({
      mood,
      context,
      timestamp: new Date().toISOString(),
      hour: new Date().getHours(),
    })
    localStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify(history.slice(-100)))
  } catch (e) {
    console.error('Failed to save mood:', e)
  }
}

// Breathing Exercise Component
function BreathingExercise({ pattern, onComplete, onClose }) {
  const prefersReducedMotion = useReducedMotion()
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [currentCycle, setCurrentCycle] = useState(1)
  const [countdown, setCountdown] = useState(pattern.steps[0].duration)
  const [isComplete, setIsComplete] = useState(false)

  const totalSteps = pattern.steps.length
  const currentStepData = pattern.steps[currentStep]

  useEffect(() => {
    if (!isRunning || isComplete) return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Move to next step
          const nextStep = (currentStep + 1) % totalSteps
          const isNewCycle = nextStep === 0

          if (isNewCycle) {
            if (currentCycle >= pattern.cycles) {
              // Exercise complete
              setIsComplete(true)
              setIsRunning(false)
              onComplete?.()
              return 0
            }
            setCurrentCycle(c => c + 1)
          }

          setCurrentStep(nextStep)
          return pattern.steps[nextStep].duration
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isRunning, currentStep, currentCycle, pattern, isComplete, onComplete, totalSteps])

  const handleReset = () => {
    setIsRunning(false)
    setCurrentStep(0)
    setCurrentCycle(1)
    setCountdown(pattern.steps[0].duration)
    setIsComplete(false)
  }

  // Calculate circle animation
  const totalStepDuration = currentStepData.duration
  const progress = 1 - (countdown / totalStepDuration)

  return (
    <motion.div
      {...getMotionProps(prefersReducedMotion, {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      })}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        {...getMotionProps(prefersReducedMotion, {
          initial: { scale: 0.9, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
        })}
        className="bg-surface rounded-3xl p-8 max-w-sm w-full text-center"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10"
        >
          <X className="w-5 h-5 text-white/50" />
        </button>

        <h2 className="font-display text-xl font-semibold mb-2">{pattern.name}</h2>
        <p className="text-white/60 text-sm mb-8">Cycle {currentCycle} of {pattern.cycles}</p>

        {/* Breathing Circle */}
        <div className="relative w-48 h-48 mx-auto mb-8">
          {/* Background circle */}
          <div className="absolute inset-0 rounded-full border-4 border-white/10" />

          {/* Progress ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="92"
              fill="none"
              stroke={`var(--color-${pattern.color}-500, #8b5cf6)`}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${progress * 578} 578`}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Center content */}
          <motion.div
            animate={isRunning && !prefersReducedMotion ? {
              scale: currentStepData.action.includes('Inhale') ? [1, 1.2] :
                     currentStepData.action.includes('Exhale') ? [1.2, 1] : 1,
            } : {}}
            transition={{ duration: currentStepData.duration, ease: 'easeInOut' }}
            className={`absolute inset-4 rounded-full bg-${pattern.color}-500/20 flex flex-col items-center justify-center`}
            style={{
              backgroundColor: `var(--color-${pattern.color}-500, #8b5cf6)20`,
            }}
          >
            <span className="text-4xl font-bold mb-1">{countdown}</span>
            <span className="text-sm text-white/70">{currentStepData.action}</span>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {!isComplete ? (
            <>
              <button
                onClick={handleReset}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`px-8 py-3 rounded-xl font-medium transition-colors ${
                  isRunning
                    ? 'bg-white/10 hover:bg-white/20'
                    : 'bg-nero-500 hover:bg-nero-600'
                }`}
              >
                {isRunning ? (
                  <><Pause className="w-5 h-5 inline mr-2" />Pause</>
                ) : (
                  <><Play className="w-5 h-5 inline mr-2" />Start</>
                )}
              </button>
            </>
          ) : (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-lg font-medium mb-4">Well done!</p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-nero-500 hover:bg-nero-600 font-medium"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// Grounding Exercise Component
function GroundingExercise({ onComplete, onClose }) {
  const prefersReducedMotion = useReducedMotion()
  const [currentStep, setCurrentStep] = useState(0)
  const [items, setItems] = useState([])
  const [inputValue, setInputValue] = useState('')

  const step = GROUNDING_STEPS[currentStep]
  const isComplete = currentStep >= GROUNDING_STEPS.length

  const handleAddItem = () => {
    if (!inputValue.trim()) return

    const newItems = [...items, inputValue.trim()]
    setItems(newItems)
    setInputValue('')

    if (newItems.length >= step.count) {
      // Move to next step
      setTimeout(() => {
        if (currentStep + 1 >= GROUNDING_STEPS.length) {
          onComplete?.()
        } else {
          setCurrentStep(s => s + 1)
          setItems([])
        }
      }, 500)
    }
  }

  if (isComplete) {
    return (
      <motion.div
        {...getMotionProps(prefersReducedMotion, {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
        })}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <div className="bg-surface rounded-3xl p-8 max-w-sm w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-semibold mb-2">Grounded!</h2>
          <p className="text-white/60 mb-6">
            You've reconnected with the present moment. Take a breath and continue when ready.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-nero-500 hover:bg-nero-600 font-medium"
          >
            Continue
          </button>
        </div>
      </motion.div>
    )
  }

  const Icon = step.icon

  return (
    <motion.div
      {...getMotionProps(prefersReducedMotion, {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      })}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        {...getMotionProps(prefersReducedMotion, {
          initial: { scale: 0.9, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
        })}
        className="bg-surface rounded-3xl p-6 max-w-sm w-full"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10"
        >
          <X className="w-5 h-5 text-white/50" />
        </button>

        {/* Progress */}
        <div className="flex gap-1 mb-6">
          {GROUNDING_STEPS.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full ${
                i < currentStep ? 'bg-green-500' :
                i === currentStep ? 'bg-nero-500' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Current step */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-nero-500/20 flex items-center justify-center mx-auto mb-4">
            <Icon className="w-8 h-8 text-nero-400" />
          </div>
          <h2 className="font-display text-xl font-semibold mb-2">
            {step.count} things you can {step.sense.toLowerCase()}
          </h2>
          <p className="text-white/60">{step.prompt}</p>
        </div>

        {/* Items */}
        <div className="flex flex-wrap gap-2 mb-4 min-h-[40px]">
          {items.map((item, i) => (
            <motion.span
              key={i}
              {...getMotionProps(prefersReducedMotion, {
                initial: { scale: 0, opacity: 0 },
                animate: { scale: 1, opacity: 1 },
              })}
              className="px-3 py-1 rounded-full bg-nero-500/20 text-nero-300 text-sm"
            >
              {item}
            </motion.span>
          ))}
          {Array(step.count - items.length).fill(0).map((_, i) => (
            <span
              key={`empty-${i}`}
              className="px-3 py-1 rounded-full border border-dashed border-white/20 text-white/30 text-sm"
            >
              ...
            </span>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleAddItem(); }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Name something you can ${step.sense.toLowerCase()}...`}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-nero-500/50"
            autoFocus
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="px-4 py-3 rounded-xl bg-nero-500 hover:bg-nero-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

// Pause Timer Component
function PauseTimer({ duration = 10, onComplete, onClose }) {
  const prefersReducedMotion = useReducedMotion()
  const [timeLeft, setTimeLeft] = useState(duration)
  const [isRunning, setIsRunning] = useState(true)

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setIsRunning(false)
          onComplete?.()
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isRunning, timeLeft, onComplete])

  return (
    <motion.div
      {...getMotionProps(prefersReducedMotion, {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      })}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        {...getMotionProps(prefersReducedMotion, {
          initial: { scale: 0.9, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
        })}
        className="bg-surface rounded-3xl p-8 max-w-sm w-full text-center"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10"
        >
          <X className="w-5 h-5 text-white/50" />
        </button>

        <Pause className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h2 className="font-display text-xl font-semibold mb-2">Pause Before Reacting</h2>
        <p className="text-white/60 mb-6">
          Take a moment. The urge will pass.
        </p>

        <div className="text-6xl font-bold text-nero-400 mb-6">
          {timeLeft}
        </div>

        {timeLeft === 0 ? (
          <div>
            <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <p className="text-white/70 mb-4">You did it! Impulse managed.</p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-nero-500 hover:bg-nero-600 font-medium"
            >
              Continue
            </button>
          </div>
        ) : (
          <p className="text-sm text-white/50">
            Breathe slowly. Notice the feeling without acting on it.
          </p>
        )}
      </motion.div>
    </motion.div>
  )
}

// Main Component
export default function EmotionalRegulation({ onMoodLog }) {
  const prefersReducedMotion = useReducedMotion()
  const [activeExercise, setActiveExercise] = useState(null)
  const [selectedMood, setSelectedMood] = useState(null)
  const [showMoodInput, setShowMoodInput] = useState(false)
  const [moodContext, setMoodContext] = useState('')

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood)
    setShowMoodInput(true)
  }

  const handleSaveMood = () => {
    if (selectedMood) {
      saveMood(selectedMood.id, moodContext)
      onMoodLog?.(selectedMood, moodContext)
      setShowMoodInput(false)
      setSelectedMood(null)
      setMoodContext('')
    }
  }

  // Get recent mood patterns
  const moodHistory = getMoodHistory()
  const recentMoods = moodHistory.slice(-7)

  return (
    <div className="p-4 h-full overflow-auto">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/20 text-pink-400 text-sm mb-3">
            <Heart className="w-4 h-4" />
            <span>Emotional Toolkit</span>
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">How are you feeling?</h1>
          <p className="text-white/60">Tools for emotional regulation and awareness</p>
        </div>

        {/* Mood Check-in */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <h3 className="font-medium mb-3">Quick Mood Check-in</h3>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((mood) => {
              const Icon = mood.icon
              return (
                <button
                  key={mood.id}
                  onClick={() => handleMoodSelect(mood)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                    selectedMood?.id === mood.id
                      ? 'bg-white/20 ring-2 ring-white/30'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${mood.color}`} />
                  <span className="text-sm">{mood.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Mood Context Input */}
        <AnimatePresence>
          {showMoodInput && (
            <motion.div
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0, height: 0 },
                animate: { opacity: 1, height: 'auto' },
                exit: { opacity: 0, height: 0 },
              })}
              className="bg-white/5 rounded-2xl p-4 border border-white/10"
            >
              <p className="text-sm text-white/70 mb-3">
                What's contributing to feeling {selectedMood?.label.toLowerCase()}?
              </p>
              <textarea
                value={moodContext}
                onChange={(e) => setMoodContext(e.target.value)}
                placeholder="Optional: Add context..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-nero-500/50 resize-none"
                rows={2}
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { setShowMoodInput(false); setSelectedMood(null); }}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMood}
                  className="flex-1 py-2 bg-nero-500 hover:bg-nero-600 rounded-xl text-sm font-medium"
                >
                  Save Check-in
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="font-medium">Quick Regulation Tools</h3>

          {/* Pause Timer */}
          <button
            onClick={() => setActiveExercise('pause')}
            className="w-full flex items-center gap-4 p-4 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl border border-amber-500/20 transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Timer className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">Pause Before Reacting</h4>
              <p className="text-sm text-white/50">10-second impulse control timer</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/30" />
          </button>

          {/* Grounding */}
          <button
            onClick={() => setActiveExercise('grounding')}
            className="w-full flex items-center gap-4 p-4 bg-green-500/10 hover:bg-green-500/20 rounded-xl border border-green-500/20 transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Eye className="w-6 h-6 text-green-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">5-4-3-2-1 Grounding</h4>
              <p className="text-sm text-white/50">Reconnect with the present moment</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/30" />
          </button>
        </div>

        {/* Breathing Exercises */}
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <Wind className="w-4 h-4 text-calm-400" />
            Breathing Exercises
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {Object.entries(BREATHING_PATTERNS).map(([key, pattern]) => (
              <button
                key={key}
                onClick={() => setActiveExercise(key)}
                className="p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-left"
              >
                <h4 className="font-medium mb-1">{pattern.name}</h4>
                <p className="text-xs text-white/50">{pattern.description}</p>
                <p className="text-xs text-white/40 mt-2">{pattern.cycles} cycles</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Moods */}
        {recentMoods.length > 0 && (
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <h3 className="font-medium mb-3">Recent Check-ins</h3>
            <div className="flex gap-1">
              {recentMoods.map((entry, i) => {
                const mood = MOODS.find(m => m.id === entry.mood)
                if (!mood) return null
                const Icon = mood.icon
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5"
                    title={`${mood.label} - ${new Date(entry.timestamp).toLocaleDateString()}`}
                  >
                    <Icon className={`w-4 h-4 ${mood.color}`} />
                    <span className="text-[10px] text-white/40">
                      {new Date(entry.timestamp).toLocaleDateString('en', { weekday: 'short' })}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tip */}
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-sm text-white/60">
            <span className="text-nero-400 font-medium">Tip:</span> Regular emotional check-ins help you notice patterns.
            ADHD often includes emotional dysregulation - these tools can help you pause and respond rather than react.
          </p>
        </div>
      </div>

      {/* Exercise Modals */}
      <AnimatePresence>
        {activeExercise === 'pause' && (
          <PauseTimer
            duration={10}
            onComplete={() => {}}
            onClose={() => setActiveExercise(null)}
          />
        )}

        {activeExercise === 'grounding' && (
          <GroundingExercise
            onComplete={() => {}}
            onClose={() => setActiveExercise(null)}
          />
        )}

        {BREATHING_PATTERNS[activeExercise] && (
          <BreathingExercise
            pattern={BREATHING_PATTERNS[activeExercise]}
            onComplete={() => {}}
            onClose={() => setActiveExercise(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
