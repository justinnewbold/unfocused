import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Plus,
  X,
  Clock,
  Zap,
  Heart,
  Music,
  Coffee,
  Dumbbell,
  Gamepad2,
  BookOpen,
  Palette,
  Phone,
  Sun,
  Utensils,
  Dog,
  TreePine,
  Shuffle,
  Star,
  Trash2,
  Check,
  RotateCcw,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const MENU_KEY = 'nero_dopamine_menu'

// Default dopamine activities
const DEFAULT_ACTIVITIES = [
  { id: '1', name: 'Listen to favorite song', duration: 5, category: 'quick', icon: 'music', healthy: true },
  { id: '2', name: 'Step outside for fresh air', duration: 5, category: 'quick', icon: 'sun', healthy: true },
  { id: '3', name: 'Do 10 jumping jacks', duration: 2, category: 'quick', icon: 'dumbbell', healthy: true },
  { id: '4', name: 'Text a friend something nice', duration: 3, category: 'quick', icon: 'phone', healthy: true },
  { id: '5', name: 'Eat a healthy snack', duration: 5, category: 'quick', icon: 'utensils', healthy: true },
  { id: '6', name: 'Watch a funny video', duration: 5, category: 'quick', icon: 'gamepad', healthy: false },
  { id: '7', name: 'Take a short walk', duration: 15, category: 'medium', icon: 'treepine', healthy: true },
  { id: '8', name: 'Play with pet', duration: 10, category: 'medium', icon: 'dog', healthy: true },
  { id: '9', name: 'Do a quick sketch/doodle', duration: 10, category: 'medium', icon: 'palette', healthy: true },
  { id: '10', name: 'Read a few pages of a book', duration: 15, category: 'medium', icon: 'book', healthy: true },
  { id: '11', name: 'Make your favorite drink', duration: 5, category: 'medium', icon: 'coffee', healthy: true },
  { id: '12', name: 'Call someone you love', duration: 15, category: 'medium', icon: 'phone', healthy: true },
]

// Icon map
const ICON_MAP = {
  music: Music,
  sun: Sun,
  dumbbell: Dumbbell,
  phone: Phone,
  utensils: Utensils,
  gamepad: Gamepad2,
  treepine: TreePine,
  dog: Dog,
  palette: Palette,
  book: BookOpen,
  coffee: Coffee,
  heart: Heart,
  star: Star,
}

// Load menu
const loadMenu = () => {
  try {
    const stored = localStorage.getItem(MENU_KEY)
    return stored ? JSON.parse(stored) : DEFAULT_ACTIVITIES
  } catch {
    return DEFAULT_ACTIVITIES
  }
}

// Save menu
const saveMenu = (menu) => {
  localStorage.setItem(MENU_KEY, JSON.stringify(menu))
}

export default function DopamineMenu({ onSelectActivity }) {
  const prefersReducedMotion = useReducedMotion()
  const [activities, setActivities] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [filter, setFilter] = useState('all') // 'all' | 'quick' | 'medium' | 'healthy'
  const [randomPick, setRandomPick] = useState(null)
  const [recentlyDone, setRecentlyDone] = useState([])

  // Form state
  const [newActivity, setNewActivity] = useState({
    name: '',
    duration: 5,
    category: 'quick',
    icon: 'star',
    healthy: true,
  })

  // Load data on mount
  useEffect(() => {
    setActivities(loadMenu())
  }, [])

  // Filtered activities
  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      if (filter === 'all') return true
      if (filter === 'quick') return activity.duration <= 5
      if (filter === 'medium') return activity.duration > 5
      if (filter === 'healthy') return activity.healthy
      return true
    })
  }, [activities, filter])

  // Pick random activity
  const pickRandom = () => {
    const available = filteredActivities.filter(a => !recentlyDone.includes(a.id))
    const pool = available.length > 0 ? available : filteredActivities

    const randomIndex = Math.floor(Math.random() * pool.length)
    setRandomPick(pool[randomIndex])
  }

  // Mark as done
  const markDone = (activityId) => {
    setRecentlyDone(prev => [...prev.slice(-4), activityId])
    setRandomPick(null)
    onSelectActivity?.(activities.find(a => a.id === activityId))
  }

  // Add activity
  const addActivity = () => {
    if (!newActivity.name.trim()) return

    const activity = {
      ...newActivity,
      id: Date.now().toString(),
    }

    const updated = [...activities, activity]
    setActivities(updated)
    saveMenu(updated)

    setNewActivity({
      name: '',
      duration: 5,
      category: 'quick',
      icon: 'star',
      healthy: true,
    })
    setShowAddModal(false)
  }

  // Delete activity
  const deleteActivity = (activityId) => {
    const updated = activities.filter(a => a.id !== activityId)
    setActivities(updated)
    saveMenu(updated)
  }

  // Reset to defaults
  const resetToDefaults = () => {
    setActivities(DEFAULT_ACTIVITIES)
    saveMenu(DEFAULT_ACTIVITIES)
  }

  // Get icon component
  const getIcon = (iconId) => {
    return ICON_MAP[iconId] || Star
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
            <h2 className="font-display text-xl font-semibold">Dopamine Menu</h2>
            <p className="text-sm text-white/50">Healthy ways to boost your mood</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Random Pick Button */}
        <motion.button
          onClick={pickRandom}
          whileTap={{ scale: 0.98 }}
          className="w-full mb-6 p-6 glass-card border border-pink-500/30 bg-gradient-to-r from-pink-500/10 to-purple-500/10"
        >
          <div className="flex items-center justify-center gap-3">
            <Shuffle className="w-8 h-8 text-pink-400" />
            <span className="text-xl font-medium">Pick Something for Me</span>
          </div>
          <p className="text-sm text-white/50 mt-2">
            Feeling stuck? Let me choose a dopamine boost
          </p>
        </motion.button>

        {/* Random Pick Result */}
        <AnimatePresence>
          {randomPick && (
            <motion.div
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0, scale: 0.95, y: -20 },
                animate: { opacity: 1, scale: 1, y: 0 },
                exit: { opacity: 0, scale: 0.95, y: -20 }
              })}
              className="mb-6 p-4 glass-card border border-green-500/30 bg-green-500/10"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-green-400" />
                <span className="font-medium text-green-400">Here's your dopamine boost:</span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  {React.createElement(getIcon(randomPick.icon), {
                    className: 'w-6 h-6 text-pink-400'
                  })}
                </div>
                <div>
                  <p className="font-medium text-lg">{randomPick.name}</p>
                  <p className="text-sm text-white/50">{randomPick.duration} minutes</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => markDone(randomPick.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Do it!
                </button>
                <button
                  onClick={pickRandom}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRandomPick(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'quick', label: '< 5 min' },
            { id: 'medium', label: '5-15 min' },
            { id: 'healthy', label: 'Healthy Only' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                filter === f.id
                  ? 'bg-pink-500/20 text-pink-400'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Activity Grid */}
        <div className="grid grid-cols-2 gap-3">
          {filteredActivities.map((activity) => {
            const Icon = getIcon(activity.icon)
            const isDone = recentlyDone.includes(activity.id)

            return (
              <motion.button
                key={activity.id}
                onClick={() => markDone(activity.id)}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-xl text-left transition-all ${
                  isDone
                    ? 'bg-green-500/20 border border-green-500/30'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-10 h-10 rounded-lg ${
                    activity.healthy ? 'bg-green-500/20' : 'bg-yellow-500/20'
                  } flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${
                      activity.healthy ? 'text-green-400' : 'text-yellow-400'
                    }`} />
                  </div>
                  {isDone && <Check className="w-4 h-4 text-green-400" />}
                </div>

                <p className="font-medium text-sm mb-1">{activity.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {activity.duration}m
                  </span>
                  {activity.healthy && (
                    <span className="text-xs text-green-400">●</span>
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Reset Button */}
        <button
          onClick={resetToDefaults}
          className="w-full mt-6 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 text-sm transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Defaults
        </button>

        {/* Tips */}
        <div className="mt-4 p-4 bg-white/5 rounded-xl">
          <p className="text-sm text-white/50">
            <strong className="text-white/70">ADHD Tip:</strong> When you're stuck or unmotivated,
            your brain needs dopamine. Use this menu to find healthy ways to get unstuck without
            falling into dopamine traps (endless scrolling, etc).
          </p>
        </div>

        {/* Add Activity Modal */}
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
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />

              <motion.div
                className="relative w-full max-w-md glass-card p-5"
                {...getMotionProps(prefersReducedMotion, {
                  initial: { y: 100, opacity: 0 },
                  animate: { y: 0, opacity: 1 },
                  exit: { y: 100, opacity: 0 }
                })}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-semibold">Add Activity</h3>
                  <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Icon Selection */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(ICON_MAP).map(([id, Icon]) => (
                      <button
                        key={id}
                        onClick={() => setNewActivity(prev => ({ ...prev, icon: id }))}
                        className={`p-2 rounded-lg transition-all ${
                          newActivity.icon === id
                            ? 'bg-pink-500/20 ring-2 ring-pink-500'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${
                          newActivity.icon === id ? 'text-pink-400' : 'text-white/50'
                        }`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Activity Name</label>
                  <input
                    type="text"
                    value={newActivity.name}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Dance to one song"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                  />
                </div>

                {/* Duration */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Duration: {newActivity.duration} min</label>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={newActivity.duration}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                {/* Healthy Toggle */}
                <button
                  onClick={() => setNewActivity(prev => ({ ...prev, healthy: !prev.healthy }))}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl mb-6 transition-colors ${
                    newActivity.healthy
                      ? 'bg-green-500/20 border border-green-500/30'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${newActivity.healthy ? 'text-green-400' : 'text-white/50'}`} />
                  <span className={newActivity.healthy ? 'text-green-400' : 'text-white/70'}>
                    This is a healthy activity
                  </span>
                </button>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addActivity}
                    disabled={!newActivity.name.trim()}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                      newActivity.name.trim()
                        ? 'bg-pink-500 hover:bg-pink-600 text-white'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    Add Activity
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
