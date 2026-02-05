import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy,
  Plus,
  X,
  Star,
  Sparkles,
  Calendar,
  ChevronDown,
  ChevronUp,
  Heart,
  Zap,
  Target,
  Clock,
  Filter,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const WINS_KEY = 'nero_wins_journal'

// Win categories
const WIN_CATEGORIES = [
  { id: 'task', label: 'Task Done', icon: Target, color: 'green' },
  { id: 'habit', label: 'Good Habit', icon: Zap, color: 'yellow' },
  { id: 'social', label: 'Social Win', icon: Heart, color: 'pink' },
  { id: 'self_care', label: 'Self Care', icon: Sparkles, color: 'purple' },
  { id: 'creative', label: 'Creative', icon: Star, color: 'orange' },
  { id: 'other', label: 'Other', icon: Trophy, color: 'blue' },
]

// Win sizes
const WIN_SIZES = [
  { id: 'tiny', label: 'Tiny', emoji: '✨' },
  { id: 'small', label: 'Small', emoji: '🌟' },
  { id: 'medium', label: 'Medium', emoji: '⭐' },
  { id: 'big', label: 'Big', emoji: '🏆' },
]

// Load wins
const loadWins = () => {
  try {
    const stored = localStorage.getItem(WINS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save wins
const saveWins = (wins) => {
  localStorage.setItem(WINS_KEY, JSON.stringify(wins.slice(-500)))
}

// Get date key
const getDateKey = (date = new Date()) => date.toISOString().split('T')[0]

// Encouragement messages
const ENCOURAGEMENTS = [
  "Every win counts, no matter how small!",
  "You're building momentum!",
  "Progress over perfection!",
  "Celebrate the small stuff!",
  "You showed up - that's a win!",
  "ADHD brains need extra recognition. You earned this!",
  "Another one for the collection!",
  "Keep stacking those wins!",
]

export default function WinsJournal({ onWinAdded }) {
  const prefersReducedMotion = useReducedMotion()
  const [wins, setWins] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [filterCategory, setFilterCategory] = useState(null)
  const [expandedDay, setExpandedDay] = useState(getDateKey())

  // Form state
  const [newWin, setNewWin] = useState({
    description: '',
    category: 'task',
    size: 'small',
  })

  // Load wins on mount
  useEffect(() => {
    setWins(loadWins())
  }, [])

  // Group wins by date
  const groupedWins = useMemo(() => {
    const filtered = filterCategory
      ? wins.filter(w => w.category === filterCategory)
      : wins

    const groups = {}
    filtered.forEach(win => {
      if (!groups[win.date]) {
        groups[win.date] = []
      }
      groups[win.date].push(win)
    })

    // Sort dates descending
    return Object.entries(groups)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .slice(0, 30) // Show last 30 days with wins
  }, [wins, filterCategory])

  // Stats
  const stats = useMemo(() => {
    const today = getDateKey()
    const todayWins = wins.filter(w => w.date === today)

    const last7Days = wins.filter(w => {
      const days = (new Date() - new Date(w.date)) / (1000 * 60 * 60 * 24)
      return days < 7
    })

    const streak = calculateStreak()

    return {
      todayCount: todayWins.length,
      weekCount: last7Days.length,
      totalCount: wins.length,
      streak,
    }
  }, [wins])

  // Calculate streak
  function calculateStreak() {
    let streak = 0
    const now = new Date()

    for (let i = 0; i < 365; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateKey = getDateKey(date)

      const dayWins = wins.filter(w => w.date === dateKey)
      if (dayWins.length > 0) {
        streak++
      } else if (i > 0) {
        break
      }
    }

    return streak
  }

  // Save win
  const saveWin = () => {
    if (!newWin.description.trim()) return

    const win = {
      ...newWin,
      id: Date.now().toString(),
      date: getDateKey(),
      createdAt: new Date().toISOString(),
    }

    const updatedWins = [win, ...wins]
    setWins(updatedWins)
    saveWins(updatedWins)

    onWinAdded?.(win)
    resetForm()

    // Show encouragement
    setShowEncouragement(true)
    setTimeout(() => setShowEncouragement(false), 3000)
  }

  // Reset form
  const resetForm = () => {
    setNewWin({
      description: '',
      category: 'task',
      size: 'small',
    })
    setShowAddModal(false)
  }

  // Get random encouragement
  const getEncouragement = () => {
    return ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]
  }

  // Get category info
  const getCategoryInfo = (categoryId) => {
    return WIN_CATEGORIES.find(c => c.id === categoryId) || WIN_CATEGORIES[5]
  }

  // Get size info
  const getSizeInfo = (sizeId) => {
    return WIN_SIZES.find(s => s.id === sizeId) || WIN_SIZES[1]
  }

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateStr === getDateKey(today)) return 'Today'
    if (dateStr === getDateKey(yesterday)) return 'Yesterday'
    return date.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })
  }

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
            <h2 className="font-display text-xl font-semibold">Wins Journal</h2>
            <p className="text-sm text-white/50">Celebrate every victory</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Win
          </button>
        </div>

        {/* Encouragement Toast */}
        <AnimatePresence>
          {showEncouragement && (
            <motion.div
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0, y: -20 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -20 }
              })}
              className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <p className="text-yellow-400 font-medium">{getEncouragement()}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="glass-card p-4 mb-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{stats.todayCount}</p>
              <p className="text-xs text-white/50">Today</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-400">{stats.weekCount}</p>
              <p className="text-xs text-white/50">This Week</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{stats.streak}</p>
              <p className="text-xs text-white/50">Day Streak</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">{stats.totalCount}</p>
              <p className="text-xs text-white/50">Total</p>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
              !filterCategory
                ? 'bg-white/10 text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            All
          </button>
          {WIN_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                filterCategory === cat.id
                  ? `bg-${cat.color}-500/20 text-${cat.color}-400`
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              <cat.icon className="w-3 h-3" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Wins List by Date */}
        <div className="space-y-3">
          {groupedWins.map(([date, dayWins]) => {
            const isExpanded = expandedDay === date

            return (
              <motion.div
                key={date}
                {...getMotionProps(prefersReducedMotion, {
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 }
                })}
                className="glass-card overflow-hidden"
              >
                <button
                  onClick={() => setExpandedDay(isExpanded ? null : date)}
                  className="w-full p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-white/50" />
                    <span className="font-medium">{formatDate(date)}</span>
                    <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
                      {dayWins.length} win{dayWins.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-2">
                        {dayWins.map((win) => {
                          const category = getCategoryInfo(win.category)
                          const size = getSizeInfo(win.size)
                          const Icon = category.icon

                          return (
                            <div
                              key={win.id}
                              className="flex items-start gap-3 p-3 rounded-xl bg-white/5"
                            >
                              <div className={`w-8 h-8 rounded-lg bg-${category.color}-500/20 flex items-center justify-center flex-shrink-0`}>
                                <Icon className={`w-4 h-4 text-${category.color}-400`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm">{win.description}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-white/40">{category.label}</span>
                                  <span>{size.emoji}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

        {/* Empty State */}
        {wins.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50">No wins recorded yet</p>
            <p className="text-sm text-white/30 mt-1">
              Start celebrating your daily victories!
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 transition-colors"
            >
              Add Your First Win
            </button>
          </div>
        )}

        {/* Tips */}
        <div className="mt-6 p-4 bg-white/5 rounded-xl">
          <p className="text-sm text-white/50">
            <strong className="text-white/70">ADHD tip:</strong> Our brains often focus on what we didn't do.
            This journal helps rewire that by celebrating what we DID accomplish, no matter how small.
          </p>
        </div>

        {/* Add Win Modal */}
        <AnimatePresence>
          {showAddModal && (
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
                onClick={resetForm}
              />

              <motion.div
                className="relative w-full max-w-md glass-card p-5"
                {...getMotionProps(prefersReducedMotion, {
                  initial: { y: 100, opacity: 0 },
                  animate: { y: 0, opacity: 1 },
                  exit: { y: 100, opacity: 0 }
                })}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-semibold">Record a Win!</h3>
                  <button
                    onClick={resetForm}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">What did you accomplish?</label>
                  <textarea
                    value={newWin.description}
                    onChange={(e) => setNewWin(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="e.g., Replied to that email, Drank water, Made my bed"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 resize-none"
                    rows={3}
                    autoFocus
                  />
                </div>

                {/* Category */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    {WIN_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setNewWin(prev => ({ ...prev, category: cat.id }))}
                        className={`p-2 rounded-xl transition-all ${
                          newWin.category === cat.id
                            ? `bg-${cat.color}-500/20 border border-${cat.color}-500/30`
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <cat.icon className={`w-4 h-4 mx-auto mb-1 ${
                          newWin.category === cat.id ? `text-${cat.color}-400` : 'text-white/50'
                        }`} />
                        <span className="text-xs">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size */}
                <div className="mb-6">
                  <label className="block text-sm text-white/70 mb-2">How big was this win?</label>
                  <div className="flex gap-2">
                    {WIN_SIZES.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setNewWin(prev => ({ ...prev, size: size.id }))}
                        className={`flex-1 p-3 rounded-xl transition-all ${
                          newWin.size === size.id
                            ? 'bg-yellow-500/20 border border-yellow-500/30'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-xl block">{size.emoji}</span>
                        <span className="text-xs">{size.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={resetForm}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveWin}
                    disabled={!newWin.description.trim()}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                      newWin.description.trim()
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Trophy className="w-4 h-4" />
                      Save Win!
                    </span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
