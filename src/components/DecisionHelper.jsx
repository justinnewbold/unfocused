import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shuffle,
  Check,
  X,
  Plus,
  Clock,
  Utensils,
  Briefcase,
  Home,
  Dumbbell,
  Coffee,
  BookOpen,
  RefreshCw,
  Star,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const DECISIONS_KEY = 'nero_decision_presets'
const DECISION_LOG_KEY = 'nero_decision_log'

// Default categories with pre-made decisions
const DEFAULT_CATEGORIES = [
  {
    id: 'meals',
    name: 'What to Eat',
    icon: 'Utensils',
    color: 'orange',
    options: [
      'Sandwich', 'Salad', 'Leftovers', 'Eggs', 'Pasta', 'Soup',
      'Rice bowl', 'Smoothie', 'Pizza', 'Tacos'
    ]
  },
  {
    id: 'first_task',
    name: 'First Task',
    icon: 'Briefcase',
    color: 'blue',
    options: [
      'Check emails', 'Review calendar', 'Quick win task', 'Important project',
      'Creative work', 'Admin tasks', 'Planning session'
    ]
  },
  {
    id: 'break_activity',
    name: 'Break Activity',
    icon: 'Coffee',
    color: 'green',
    options: [
      'Short walk', 'Stretch', 'Get water', 'Look outside', 'Deep breaths',
      'Quick snack', 'Listen to music', 'Call a friend'
    ]
  },
  {
    id: 'exercise',
    name: 'Exercise',
    icon: 'Dumbbell',
    color: 'purple',
    options: [
      'Walk', 'Yoga', 'Stretching', 'Dancing', 'Bodyweight workout',
      'Bike ride', 'Swimming', 'Rest day'
    ]
  },
  {
    id: 'evening',
    name: 'Evening Activity',
    icon: 'Home',
    color: 'indigo',
    options: [
      'Read a book', 'Watch a show', 'Call family', 'Hobby time',
      'Early bed', 'Journaling', 'Light cleaning', 'Bath/shower'
    ]
  },
]

const ICONS = {
  Utensils, Briefcase, Home, Dumbbell, Coffee, BookOpen
}

// Load presets
const loadPresets = () => {
  try {
    const stored = localStorage.getItem(DECISIONS_KEY)
    return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES
  } catch {
    return DEFAULT_CATEGORIES
  }
}

// Save presets
const savePresets = (presets) => {
  localStorage.setItem(DECISIONS_KEY, JSON.stringify(presets))
}

// Load decision log
const loadDecisionLog = () => {
  try {
    const stored = localStorage.getItem(DECISION_LOG_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save decision log
const saveDecisionLog = (log) => {
  localStorage.setItem(DECISION_LOG_KEY, JSON.stringify(log.slice(-100)))
}

export default function DecisionHelper({ energyLevel, onDecisionMade }) {
  const prefersReducedMotion = useReducedMotion()
  const [categories, setCategories] = useState([])
  const [decisionLog, setDecisionLog] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState(null)
  const [showCustomize, setShowCustomize] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [newOption, setNewOption] = useState('')
  const spinIntervalRef = useRef(null)

  // Load data on mount
  useEffect(() => {
    setCategories(loadPresets())
    setDecisionLog(loadDecisionLog())
  }, [])

  // Clean up spin interval on unmount
  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current)
      }
    }
  }, [])

  // Get recent decisions for a category
  const getRecentDecisions = (categoryId) => {
    return decisionLog
      .filter(d => d.categoryId === categoryId)
      .slice(0, 5)
  }

  // Make a random decision
  const makeDecision = (category) => {
    setSelectedCategory(category)
    setIsSpinning(true)
    setResult(null)

    // Weighted random - avoid recent choices
    const recentChoices = getRecentDecisions(category.id).map(d => d.choice)
    const options = category.options.filter(opt => !recentChoices.includes(opt))
    const pool = options.length > 0 ? options : category.options

    // Simulate spinning
    let spins = 0
    const maxSpins = 10
    spinIntervalRef.current = setInterval(() => {
      const randomOption = pool[Math.floor(Math.random() * pool.length)]
      setResult(randomOption)
      spins++

      if (spins >= maxSpins) {
        clearInterval(spinIntervalRef.current)
        spinIntervalRef.current = null
        setIsSpinning(false)

        // Log the decision
        const logEntry = {
          id: Date.now().toString(),
          categoryId: category.id,
          choice: randomOption,
          timestamp: new Date().toISOString(),
        }
        const newLog = [logEntry, ...decisionLog]
        setDecisionLog(newLog)
        saveDecisionLog(newLog)

        onDecisionMade?.(category, randomOption)
      }
    }, 100)
  }

  // Accept decision
  const acceptDecision = () => {
    setSelectedCategory(null)
    setResult(null)
  }

  // Try again
  const tryAgain = () => {
    if (selectedCategory) {
      makeDecision(selectedCategory)
    }
  }

  // Add option to category
  const addOption = (categoryId) => {
    if (!newOption.trim()) return

    const updatedCategories = categories.map(cat =>
      cat.id === categoryId
        ? { ...cat, options: [...cat.options, newOption.trim()] }
        : cat
    )
    setCategories(updatedCategories)
    savePresets(updatedCategories)
    setNewOption('')
  }

  // Remove option from category
  const removeOption = (categoryId, option) => {
    const updatedCategories = categories.map(cat =>
      cat.id === categoryId
        ? { ...cat, options: cat.options.filter(o => o !== option) }
        : cat
    )
    setCategories(updatedCategories)
    savePresets(updatedCategories)
  }

  // Get icon component
  const getIcon = (iconName) => ICONS[iconName] || Shuffle

  // Get color classes
  const getColorClasses = (color) => ({
    bg: `bg-${color}-500/20`,
    text: `text-${color}-400`,
    border: `border-${color}-500/30`,
    hover: `hover:bg-${color}-500/30`,
  })

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
            <h2 className="font-display text-xl font-semibold">Decision Helper</h2>
            <p className="text-sm text-white/50">Let me decide for you</p>
          </div>
          <button
            onClick={() => setShowCustomize(!showCustomize)}
            className={`px-4 py-2 rounded-xl transition-colors ${
              showCustomize
                ? 'bg-white/10 text-white'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            {showCustomize ? 'Done' : 'Customize'}
          </button>
        </div>

        {/* Energy-based suggestion */}
        {energyLevel && !selectedCategory && (
          <div className="glass-card p-4 mb-4 border border-nero-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-nero-400" />
              <span className="text-sm text-nero-400">Based on your energy</span>
            </div>
            <p className="text-sm text-white/70">
              {energyLevel <= 2
                ? "Low energy? Let me pick something easy for you. Try 'What to Eat' or 'Break Activity'."
                : energyLevel >= 4
                  ? "High energy! Great time to decide on 'First Task' or 'Exercise'."
                  : "Medium energy - any category works. What decision is weighing on you?"}
            </p>
          </div>
        )}

        {/* Decision Result */}
        <AnimatePresence>
          {selectedCategory && (
            <motion.div
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0, scale: 0.9 },
                animate: { opacity: 1, scale: 1 },
                exit: { opacity: 0, scale: 0.9 }
              })}
              className="glass-card p-6 mb-4 text-center"
            >
              <p className="text-sm text-white/50 mb-2">{selectedCategory.name}</p>

              <motion.div
                animate={isSpinning ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: Infinity, duration: 0.2 }}
                className="my-6"
              >
                <p className={`text-3xl font-bold ${isSpinning ? 'text-white/50' : 'text-white'}`}>
                  {result || '...'}
                </p>
              </motion.div>

              {!isSpinning && result && (
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={tryAgain}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>
                  <button
                    onClick={acceptDecision}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Got It!
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Categories Grid */}
        {!selectedCategory && (
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => {
              const Icon = getIcon(category.icon)
              const colors = getColorClasses(category.color)

              return (
                <motion.button
                  key={category.id}
                  onClick={() => !showCustomize && makeDecision(category)}
                  whileHover={!prefersReducedMotion ? { scale: 1.02 } : {}}
                  whileTap={!prefersReducedMotion ? { scale: 0.98 } : {}}
                  className={`glass-card p-4 text-left transition-all ${
                    showCustomize ? 'cursor-default' : 'hover:border-white/20'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <h3 className="font-medium mb-1">{category.name}</h3>
                  <p className="text-xs text-white/50">{category.options.length} options</p>

                  {showCustomize && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingCategory(editingCategory === category.id ? null : category.id)
                      }}
                      className="mt-2 text-xs text-nero-400 hover:text-nero-300"
                    >
                      {editingCategory === category.id ? 'Close' : 'Edit options'}
                    </button>
                  )}
                </motion.button>
              )
            })}
          </div>
        )}

        {/* Edit Category Options */}
        <AnimatePresence>
          {editingCategory && (
            <motion.div
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0, height: 0 },
                animate: { opacity: 1, height: 'auto' },
                exit: { opacity: 0, height: 0 }
              })}
              className="mt-4 glass-card p-4"
            >
              {(() => {
                const category = categories.find(c => c.id === editingCategory)
                if (!category) return null

                return (
                  <>
                    <h4 className="font-medium mb-3">Edit: {category.name}</h4>

                    {/* Add new option */}
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addOption(category.id)}
                        placeholder="Add new option..."
                        className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                      />
                      <button
                        onClick={() => addOption(category.id)}
                        disabled={!newOption.trim()}
                        className="px-4 py-2 rounded-xl bg-nero-500 hover:bg-nero-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Options list */}
                    <div className="flex flex-wrap gap-2">
                      {category.options.map((option, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5"
                        >
                          <span className="text-sm">{option}</span>
                          <button
                            onClick={() => removeOption(category.id, option)}
                            className="p-1 hover:bg-red-500/20 rounded transition-colors"
                          >
                            <X className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Decisions */}
        {!showCustomize && decisionLog.length > 0 && !selectedCategory && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-white/50 mb-3">Recent Decisions</h3>
            <div className="space-y-2">
              {decisionLog.slice(0, 5).map((entry) => {
                const category = categories.find(c => c.id === entry.categoryId)
                const time = new Date(entry.timestamp)

                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5"
                  >
                    <div>
                      <p className="text-sm font-medium">{entry.choice}</p>
                      <p className="text-xs text-white/50">{category?.name}</p>
                    </div>
                    <span className="text-xs text-white/40">
                      {time.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-6 p-4 bg-white/5 rounded-xl">
          <p className="text-sm text-white/50">
            <strong className="text-white/70">Pro tip:</strong> Decision fatigue is real for ADHD brains.
            Let this tool make the small choices so you can save your energy for what matters.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
