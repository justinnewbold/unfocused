import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Award,
  Trophy,
  Star,
  Zap,
  Flame,
  Target,
  Clock,
  CheckCircle,
  Lock,
  Crown,
  Sparkles,
  Heart,
  Sun,
  Moon,
  Rocket,
  Shield,
  Gem,
  Medal,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const ACHIEVEMENTS_KEY = 'nero_achievements'

// Achievement definitions
const ACHIEVEMENTS = [
  // Starter Achievements
  {
    id: 'first-focus',
    name: 'First Focus',
    description: 'Complete your first focus session',
    icon: 'Zap',
    rarity: 'common',
    category: 'starter',
    requirement: 1,
    type: 'focus_sessions',
  },
  {
    id: 'first-task',
    name: 'Task Tackler',
    description: 'Complete your first task',
    icon: 'CheckCircle',
    rarity: 'common',
    category: 'starter',
    requirement: 1,
    type: 'tasks_completed',
  },
  {
    id: 'first-streak',
    name: 'Streak Starter',
    description: 'Achieve your first 3-day streak',
    icon: 'Flame',
    rarity: 'common',
    category: 'starter',
    requirement: 3,
    type: 'streak_days',
  },

  // Focus Achievements
  {
    id: 'focus-10',
    name: 'Focus Finder',
    description: 'Complete 10 focus sessions',
    icon: 'Target',
    rarity: 'common',
    category: 'focus',
    requirement: 10,
    type: 'focus_sessions',
  },
  {
    id: 'focus-50',
    name: 'Deep Diver',
    description: 'Complete 50 focus sessions',
    icon: 'Target',
    rarity: 'uncommon',
    category: 'focus',
    requirement: 50,
    type: 'focus_sessions',
  },
  {
    id: 'focus-100',
    name: 'Focus Master',
    description: 'Complete 100 focus sessions',
    icon: 'Crown',
    rarity: 'rare',
    category: 'focus',
    requirement: 100,
    type: 'focus_sessions',
  },
  {
    id: 'focus-500',
    name: 'Legendary Focus',
    description: 'Complete 500 focus sessions',
    icon: 'Gem',
    rarity: 'legendary',
    category: 'focus',
    requirement: 500,
    type: 'focus_sessions',
  },

  // Task Achievements
  {
    id: 'tasks-25',
    name: 'Getting Things Done',
    description: 'Complete 25 tasks',
    icon: 'CheckCircle',
    rarity: 'common',
    category: 'tasks',
    requirement: 25,
    type: 'tasks_completed',
  },
  {
    id: 'tasks-100',
    name: 'Task Champion',
    description: 'Complete 100 tasks',
    icon: 'Medal',
    rarity: 'uncommon',
    category: 'tasks',
    requirement: 100,
    type: 'tasks_completed',
  },
  {
    id: 'tasks-500',
    name: 'Productivity Powerhouse',
    description: 'Complete 500 tasks',
    icon: 'Trophy',
    rarity: 'rare',
    category: 'tasks',
    requirement: 500,
    type: 'tasks_completed',
  },

  // Streak Achievements
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: 'Flame',
    rarity: 'uncommon',
    category: 'streak',
    requirement: 7,
    type: 'streak_days',
  },
  {
    id: 'streak-30',
    name: 'Monthly Marvel',
    description: 'Maintain a 30-day streak',
    icon: 'Flame',
    rarity: 'rare',
    category: 'streak',
    requirement: 30,
    type: 'streak_days',
  },
  {
    id: 'streak-100',
    name: 'Century Club',
    description: 'Maintain a 100-day streak',
    icon: 'Flame',
    rarity: 'legendary',
    category: 'streak',
    requirement: 100,
    type: 'streak_days',
  },

  // Time-based Achievements
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Start 10 sessions before 8 AM',
    icon: 'Sun',
    rarity: 'uncommon',
    category: 'lifestyle',
    requirement: 10,
    type: 'early_sessions',
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Complete 10 sessions after 10 PM',
    icon: 'Moon',
    rarity: 'uncommon',
    category: 'lifestyle',
    requirement: 10,
    type: 'late_sessions',
  },

  // Special Achievements
  {
    id: 'comeback-kid',
    name: 'Comeback Kid',
    description: 'Return after a 7+ day break',
    icon: 'Rocket',
    rarity: 'uncommon',
    category: 'special',
    requirement: 1,
    type: 'comeback',
  },
  {
    id: 'self-care',
    name: 'Self-Care Champion',
    description: 'Take all scheduled breaks for 7 days',
    icon: 'Heart',
    rarity: 'rare',
    category: 'wellness',
    requirement: 7,
    type: 'break_days',
  },
  {
    id: 'consistency',
    name: 'Consistency King',
    description: 'Use Nero every day for 30 days',
    icon: 'Shield',
    rarity: 'legendary',
    category: 'special',
    requirement: 30,
    type: 'active_days',
  },
]

// Rarity colors and styles
const RARITY_STYLES = {
  common: { bg: 'bg-slate-500/20', border: 'border-slate-500/30', text: 'text-slate-400', glow: '' },
  uncommon: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400', glow: '' },
  rare: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
  legendary: { bg: 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400', glow: 'shadow-yellow-500/30 shadow-lg' },
}

// Load achievements
const loadAchievements = () => {
  try {
    const stored = localStorage.getItem(ACHIEVEMENTS_KEY)
    return stored ? JSON.parse(stored) : {
      unlocked: [],
      stats: {
        focus_sessions: 0,
        tasks_completed: 0,
        streak_days: 0,
        early_sessions: 0,
        late_sessions: 0,
        break_days: 0,
        active_days: 0,
        comeback: 0,
      }
    }
  } catch {
    return { unlocked: [], stats: {} }
  }
}

// Save achievements
const saveAchievements = (data) => {
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(data))
}

// Get icon component
const getIcon = (iconName) => {
  const icons = { Award, Trophy, Star, Zap, Flame, Target, Clock, CheckCircle, Crown, Sparkles, Heart, Sun, Moon, Rocket, Shield, Gem, Medal }
  return icons[iconName] || Star
}

export default function AchievementBadges() {
  const prefersReducedMotion = useReducedMotion()
  const [achievementData, setAchievementData] = useState({ unlocked: [], stats: {} })
  const [selectedAchievement, setSelectedAchievement] = useState(null)
  const [newUnlock, setNewUnlock] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')

  // Load data on mount
  useEffect(() => {
    setAchievementData(loadAchievements())
  }, [])

  // Check for new achievements
  const checkAchievements = (stats) => {
    const newlyUnlocked = []

    ACHIEVEMENTS.forEach(achievement => {
      if (!achievementData.unlocked.includes(achievement.id)) {
        const currentValue = stats[achievement.type] || 0
        if (currentValue >= achievement.requirement) {
          newlyUnlocked.push(achievement.id)
        }
      }
    })

    if (newlyUnlocked.length > 0) {
      const updated = {
        ...achievementData,
        unlocked: [...achievementData.unlocked, ...newlyUnlocked],
        stats
      }
      setAchievementData(updated)
      saveAchievements(updated)

      // Show first new unlock
      const firstNew = ACHIEVEMENTS.find(a => a.id === newlyUnlocked[0])
      setNewUnlock(firstNew)
      setTimeout(() => setNewUnlock(null), 4000)
    }
  }

  // Simulate progress (for demo)
  const simulateProgress = (type, amount) => {
    const newStats = {
      ...achievementData.stats,
      [type]: (achievementData.stats[type] || 0) + amount
    }
    const updated = { ...achievementData, stats: newStats }
    setAchievementData(updated)
    saveAchievements(updated)
    checkAchievements(newStats)
  }

  // Get achievement progress
  const getProgress = (achievement) => {
    const current = achievementData.stats[achievement.type] || 0
    const percentage = Math.min((current / achievement.requirement) * 100, 100)
    return { current, percentage }
  }

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    if (activeCategory === 'all') return ACHIEVEMENTS
    if (activeCategory === 'unlocked') return ACHIEVEMENTS.filter(a => achievementData.unlocked.includes(a.id))
    if (activeCategory === 'locked') return ACHIEVEMENTS.filter(a => !achievementData.unlocked.includes(a.id))
    return ACHIEVEMENTS.filter(a => a.category === activeCategory)
  }, [activeCategory, achievementData.unlocked])

  // Stats
  const unlockedCount = achievementData.unlocked.length
  const totalCount = ACHIEVEMENTS.length
  const completionPercentage = Math.round((unlockedCount / totalCount) * 100)

  // Categories
  const categories = [
    { id: 'all', name: 'All' },
    { id: 'unlocked', name: 'Unlocked' },
    { id: 'locked', name: 'Locked' },
    { id: 'focus', name: 'Focus' },
    { id: 'tasks', name: 'Tasks' },
    { id: 'streak', name: 'Streaks' },
  ]

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
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-400" />
              Achievements
            </h2>
            <p className="text-sm text-white/50">Collect badges as you grow</p>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="glass-card p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-white/70">Collection Progress</span>
            <span className="text-sm font-medium">{unlockedCount}/{totalCount}</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-xs text-white/50 mt-2">{completionPercentage}% complete</p>
        </div>

        {/* Demo Controls */}
        <div className="glass-card p-4 mb-6">
          <h3 className="text-sm font-medium mb-3">Simulate Progress (Demo)</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => simulateProgress('focus_sessions', 10)}
              className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs transition-colors"
            >
              +10 Focus Sessions
            </button>
            <button
              onClick={() => simulateProgress('tasks_completed', 25)}
              className="px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs transition-colors"
            >
              +25 Tasks
            </button>
            <button
              onClick={() => simulateProgress('streak_days', 7)}
              className="px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-xs transition-colors"
            >
              +7 Streak Days
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Achievement Grid */}
        <div className="grid grid-cols-2 gap-3">
          {filteredAchievements.map((achievement) => {
            const isUnlocked = achievementData.unlocked.includes(achievement.id)
            const Icon = getIcon(achievement.icon)
            const rarity = RARITY_STYLES[achievement.rarity]
            const progress = getProgress(achievement)

            return (
              <motion.button
                key={achievement.id}
                onClick={() => setSelectedAchievement(achievement)}
                {...getMotionProps(prefersReducedMotion, {
                  initial: { opacity: 0, scale: 0.9 },
                  animate: { opacity: 1, scale: 1 }
                })}
                className={`relative p-4 rounded-xl text-left transition-all ${
                  isUnlocked
                    ? `${rarity.bg} border ${rarity.border} ${rarity.glow}`
                    : 'bg-white/5 border border-white/10 opacity-60'
                }`}
              >
                {/* Lock overlay */}
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                    <Lock className="w-6 h-6 text-white/30" />
                  </div>
                )}

                <div className="flex flex-col items-center text-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${
                    isUnlocked ? rarity.bg : 'bg-white/10'
                  }`}>
                    <Icon className={`w-6 h-6 ${isUnlocked ? rarity.text : 'text-white/30'}`} />
                  </div>
                  <h4 className="font-medium text-sm mb-1">{achievement.name}</h4>
                  <p className={`text-xs capitalize ${rarity.text}`}>{achievement.rarity}</p>

                  {/* Progress bar for locked */}
                  {!isUnlocked && (
                    <div className="w-full mt-2">
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white/30"
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Rarity Legend */}
        <div className="mt-6 p-4 bg-white/5 rounded-xl">
          <h3 className="text-sm font-medium mb-3">Rarity Guide</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(RARITY_STYLES).map(([rarity, style]) => (
              <div key={rarity} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${style.bg} border ${style.border}`} />
                <span className={`text-xs capitalize ${style.text}`}>{rarity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Achievement Detail Modal */}
        <AnimatePresence>
          {selectedAchievement && (
            <motion.div
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 }
              })}
              className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedAchievement(null)}
            >
              <motion.div
                {...getMotionProps(prefersReducedMotion, {
                  initial: { scale: 0.95 },
                  animate: { scale: 1 },
                  exit: { scale: 0.95 }
                })}
                className="bg-[#1a1a2e] rounded-2xl p-6 w-full max-w-sm"
                onClick={e => e.stopPropagation()}
              >
                {(() => {
                  const isUnlocked = achievementData.unlocked.includes(selectedAchievement.id)
                  const Icon = getIcon(selectedAchievement.icon)
                  const rarity = RARITY_STYLES[selectedAchievement.rarity]
                  const progress = getProgress(selectedAchievement)

                  return (
                    <>
                      <div className="flex flex-col items-center text-center">
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 ${
                          isUnlocked ? rarity.bg : 'bg-white/10'
                        } border ${isUnlocked ? rarity.border : 'border-white/20'}`}>
                          <Icon className={`w-10 h-10 ${isUnlocked ? rarity.text : 'text-white/30'}`} />
                        </div>
                        <h3 className="text-xl font-semibold mb-1">{selectedAchievement.name}</h3>
                        <p className={`text-sm capitalize ${rarity.text} mb-3`}>{selectedAchievement.rarity}</p>
                        <p className="text-white/60">{selectedAchievement.description}</p>

                        <div className="w-full mt-4 p-3 bg-white/5 rounded-xl">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-white/50">Progress</span>
                            <span>{progress.current}/{selectedAchievement.requirement}</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              className={isUnlocked ? 'h-full bg-green-500' : 'h-full bg-white/30'}
                              initial={{ width: 0 }}
                              animate={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                        </div>

                        {isUnlocked && (
                          <div className="mt-4 flex items-center gap-2 text-green-400">
                            <CheckCircle className="w-5 h-5" />
                            <span>Unlocked!</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedAchievement(null)}
                        className="w-full mt-6 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        Close
                      </button>
                    </>
                  )
                })()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* New Unlock Animation */}
        <AnimatePresence>
          {newUnlock && (
            <motion.div
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0, y: 50 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -50 }
              })}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
            >
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-4 shadow-2xl flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <Award className="w-10 h-10 text-white" />
                </motion.div>
                <div>
                  <p className="text-white/80 text-sm">Achievement Unlocked!</p>
                  <p className="text-white font-bold">{newUnlock.name}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
