import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star,
  Trophy,
  Flame,
  Zap,
  Target,
  Clock,
  CheckCircle2,
  TrendingUp,
  Award,
  Crown,
  Sparkles,
  ChevronRight,
  X,
  Gift,
  Lock,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// XP values for different actions
const XP_VALUES = {
  taskComplete: 25,
  focusSession: 50,
  routineComplete: 75,
  breadcrumbResolved: 15,
  streakBonus: 10, // per day of streak
  perfectDay: 100, // all routines + 3 focus sessions
}

// Level thresholds
const LEVELS = [
  { level: 1, xp: 0, title: 'Beginner Mind' },
  { level: 2, xp: 100, title: 'Focus Finder' },
  { level: 3, xp: 250, title: 'Task Tackler' },
  { level: 4, xp: 500, title: 'Momentum Builder' },
  { level: 5, xp: 1000, title: 'Flow Seeker' },
  { level: 6, xp: 1750, title: 'Habit Hero' },
  { level: 7, xp: 2750, title: 'Focus Master' },
  { level: 8, xp: 4000, title: 'Productivity Pro' },
  { level: 9, xp: 5500, title: 'ADHD Champion' },
  { level: 10, xp: 7500, title: 'Legendary Focus' },
]

// Achievement definitions
const ACHIEVEMENTS = [
  {
    id: 'first_task',
    title: 'First Steps',
    description: 'Complete your first task',
    icon: CheckCircle2,
    requirement: { type: 'tasks', count: 1 },
    xpReward: 50,
  },
  {
    id: 'task_streak_3',
    title: 'On a Roll',
    description: 'Complete 3 tasks in a row',
    icon: Flame,
    requirement: { type: 'tasks', count: 3 },
    xpReward: 75,
  },
  {
    id: 'task_master',
    title: 'Task Master',
    description: 'Complete 25 tasks total',
    icon: Target,
    requirement: { type: 'tasks', count: 25 },
    xpReward: 150,
  },
  {
    id: 'focus_beginner',
    title: 'Focus Initiate',
    description: 'Complete your first focus session',
    icon: Clock,
    requirement: { type: 'sessions', count: 1 },
    xpReward: 50,
  },
  {
    id: 'focus_warrior',
    title: 'Focus Warrior',
    description: 'Complete 10 focus sessions',
    icon: Zap,
    requirement: { type: 'sessions', count: 10 },
    xpReward: 200,
  },
  {
    id: 'focus_legend',
    title: 'Focus Legend',
    description: 'Complete 50 focus sessions',
    icon: Crown,
    requirement: { type: 'sessions', count: 50 },
    xpReward: 500,
  },
  {
    id: 'streak_week',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: Flame,
    requirement: { type: 'streak', count: 7 },
    xpReward: 250,
  },
  {
    id: 'streak_month',
    title: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: Trophy,
    requirement: { type: 'streak', count: 30 },
    xpReward: 1000,
  },
  {
    id: 'breadcrumb_finder',
    title: 'Trail Blazer',
    description: 'Resolve 10 breadcrumbs',
    icon: TrendingUp,
    requirement: { type: 'breadcrumbs', count: 10 },
    xpReward: 100,
  },
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Complete a task before 9 AM',
    icon: Star,
    requirement: { type: 'special', id: 'early_bird' },
    xpReward: 75,
  },
]

// Unlockable themes
const THEMES = [
  { id: 'default', title: 'Default', requiredLevel: 1, colors: { primary: 'nero' } },
  { id: 'ocean', title: 'Ocean Calm', requiredLevel: 3, colors: { primary: 'blue' } },
  { id: 'forest', title: 'Forest Focus', requiredLevel: 5, colors: { primary: 'green' } },
  { id: 'sunset', title: 'Sunset Energy', requiredLevel: 7, colors: { primary: 'orange' } },
  { id: 'cosmic', title: 'Cosmic Mind', requiredLevel: 9, colors: { primary: 'purple' } },
]

// Storage key
const STORAGE_KEY = 'nero_rewards'

// Get reward data from storage
const getRewardData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load reward data:', e)
  }
  return {
    xp: 0,
    totalXp: 0,
    level: 1,
    achievements: [],
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    stats: {
      tasksCompleted: 0,
      sessionsCompleted: 0,
      breadcrumbsResolved: 0,
    },
    selectedTheme: 'default',
  }
}

// Save reward data to storage
const saveRewardData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save reward data:', e)
  }
}

// Hook for reward system
export function useRewardSystem() {
  const [data, setData] = useState(getRewardData)
  const [pendingRewards, setPendingRewards] = useState([])
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [newLevel, setNewLevel] = useState(null)

  // Save on change
  useEffect(() => {
    saveRewardData(data)
  }, [data])

  // Check and update streak
  useEffect(() => {
    const today = new Date().toDateString()
    if (data.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString()

      setData(prev => {
        const isConsecutive = prev.lastActiveDate === yesterday
        const newStreak = isConsecutive ? prev.currentStreak + 1 : 1

        return {
          ...prev,
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, prev.longestStreak),
          lastActiveDate: today,
        }
      })
    }
  }, [])

  // Calculate level from XP
  const calculateLevel = (totalXp) => {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (totalXp >= LEVELS[i].xp) {
        return LEVELS[i]
      }
    }
    return LEVELS[0]
  }

  // Add XP and check for level up
  const addXp = (amount, reason) => {
    setData(prev => {
      const newTotalXp = prev.totalXp + amount
      const currentLevelData = calculateLevel(prev.totalXp)
      const newLevelData = calculateLevel(newTotalXp)

      // Check for level up
      if (newLevelData.level > currentLevelData.level) {
        setNewLevel(newLevelData)
        setShowLevelUp(true)
      }

      setPendingRewards(r => [...r, { type: 'xp', amount, reason }])

      return {
        ...prev,
        xp: prev.xp + amount,
        totalXp: newTotalXp,
        level: newLevelData.level,
      }
    })
  }

  // Award achievement
  const awardAchievement = (achievementId) => {
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId)
    if (!achievement || data.achievements.includes(achievementId)) return

    setData(prev => ({
      ...prev,
      achievements: [...prev.achievements, achievementId],
    }))

    addXp(achievement.xpReward, `Achievement: ${achievement.title}`)
    setPendingRewards(r => [...r, { type: 'achievement', achievement }])
  }

  // Check achievements
  const checkAchievements = (stats, currentAchievements) => {
    ACHIEVEMENTS.forEach(achievement => {
      if (currentAchievements.includes(achievement.id)) return

      const { type, count, id } = achievement.requirement

      if (type === 'tasks' && stats.tasksCompleted >= count) {
        awardAchievement(achievement.id)
      } else if (type === 'sessions' && stats.sessionsCompleted >= count) {
        awardAchievement(achievement.id)
      } else if (type === 'streak' && data.currentStreak >= count) {
        awardAchievement(achievement.id)
      } else if (type === 'breadcrumbs' && stats.breadcrumbsResolved >= count) {
        awardAchievement(achievement.id)
      } else if (type === 'special' && id === 'early_bird') {
        const hour = new Date().getHours()
        if (hour < 9) {
          awardAchievement(achievement.id)
        }
      }
    })
  }

  // Record task completion
  const recordTaskComplete = () => {
    const newStats = {
      ...data.stats,
      tasksCompleted: data.stats.tasksCompleted + 1,
    }

    setData(prev => ({
      ...prev,
      stats: newStats,
    }))

    // Add streak bonus
    const streakBonus = Math.min(data.currentStreak * XP_VALUES.streakBonus, 100)
    addXp(XP_VALUES.taskComplete + streakBonus, 'Task completed')
    checkAchievements(newStats, data.achievements)
  }

  // Record focus session
  const recordFocusSession = () => {
    const newStats = {
      ...data.stats,
      sessionsCompleted: data.stats.sessionsCompleted + 1,
    }

    setData(prev => ({
      ...prev,
      stats: newStats,
    }))

    const streakBonus = Math.min(data.currentStreak * XP_VALUES.streakBonus, 100)
    addXp(XP_VALUES.focusSession + streakBonus, 'Focus session completed')
    checkAchievements(newStats, data.achievements)
  }

  // Record breadcrumb resolved
  const recordBreadcrumbResolved = () => {
    const newStats = {
      ...data.stats,
      breadcrumbsResolved: data.stats.breadcrumbsResolved + 1,
    }

    setData(prev => ({
      ...prev,
      stats: newStats,
    }))

    addXp(XP_VALUES.breadcrumbResolved, 'Breadcrumb resolved')
    checkAchievements(newStats, data.achievements)
  }

  // Clear pending rewards
  const clearPendingRewards = () => {
    setPendingRewards([])
  }

  // Dismiss level up
  const dismissLevelUp = () => {
    setShowLevelUp(false)
    setNewLevel(null)
  }

  // Get current level data
  const currentLevelData = calculateLevel(data.totalXp)
  const nextLevel = LEVELS.find(l => l.level === currentLevelData.level + 1)
  const xpForNextLevel = nextLevel ? nextLevel.xp - data.totalXp : 0
  const xpProgress = nextLevel
    ? ((data.totalXp - currentLevelData.xp) / (nextLevel.xp - currentLevelData.xp)) * 100
    : 100

  return {
    data,
    currentLevel: currentLevelData,
    nextLevel,
    xpForNextLevel,
    xpProgress,
    pendingRewards,
    showLevelUp,
    newLevel,
    achievements: ACHIEVEMENTS,
    themes: THEMES,
    recordTaskComplete,
    recordFocusSession,
    recordBreadcrumbResolved,
    clearPendingRewards,
    dismissLevelUp,
  }
}

// Level Up Modal
export function LevelUpModal({ level, onDismiss }) {
  const prefersReducedMotion = useReducedMotion()

  if (!level) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <motion.div
        {...getMotionProps(prefersReducedMotion, {
          initial: { opacity: 0, scale: 0.5, y: 50 },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.5, y: 50 },
        })}
        className="bg-gradient-to-br from-nero-600 to-nero-800 rounded-2xl p-8 text-center max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          animate={prefersReducedMotion ? {} : {
            rotate: [0, -10, 10, -10, 10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 0.6 }}
        >
          <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
        </motion.div>

        <h2 className="font-display text-2xl font-bold mb-2">Level Up!</h2>
        <p className="text-4xl font-display font-bold text-yellow-400 mb-2">
          Level {level.level}
        </p>
        <p className="text-lg text-white/80 mb-6">{level.title}</p>

        <button
          onClick={onDismiss}
          className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-colors"
        >
          Awesome!
        </button>
      </motion.div>
    </motion.div>
  )
}

// XP Notification Toast
export function XpToast({ rewards, onClear }) {
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (rewards.length > 0) {
      const timer = setTimeout(onClear, 3000)
      return () => clearTimeout(timer)
    }
  }, [rewards, onClear])

  if (rewards.length === 0) return null

  const totalXp = rewards
    .filter(r => r.type === 'xp')
    .reduce((sum, r) => sum + r.amount, 0)

  return (
    <AnimatePresence>
      <motion.div
        {...getMotionProps(prefersReducedMotion, {
          initial: { opacity: 0, y: -50, x: '-50%' },
          animate: { opacity: 1, y: 0, x: '-50%' },
          exit: { opacity: 0, y: -50, x: '-50%' },
        })}
        className="fixed top-20 left-1/2 z-50 bg-nero-500 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg"
      >
        <Sparkles className="w-4 h-4 text-yellow-400" />
        <span className="font-display font-semibold">+{totalXp} XP</span>
      </motion.div>
    </AnimatePresence>
  )
}

// Main Rewards Dashboard Component
export default function RewardSystem({ onClose }) {
  const prefersReducedMotion = useReducedMotion()
  const {
    data,
    currentLevel,
    nextLevel,
    xpProgress,
    xpForNextLevel,
    achievements,
    themes,
  } = useRewardSystem()

  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="p-4 h-full overflow-auto">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold mb-2">Rewards</h1>
          <p className="text-white/60">Track your progress and earn achievements</p>
        </div>

        {/* Level Card */}
        <motion.div
          {...getMotionProps(prefersReducedMotion, {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
          })}
          className="bg-gradient-to-br from-nero-500/30 to-nero-700/30 rounded-2xl p-6 border border-nero-500/30"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-nero-500 flex items-center justify-center text-2xl font-display font-bold">
              {data.level}
            </div>
            <div className="flex-1">
              <h2 className="font-display text-xl font-semibold">{currentLevel.title}</h2>
              <p className="text-white/60 text-sm">{data.totalXp.toLocaleString()} total XP</p>
            </div>
          </div>

          {/* XP Progress bar */}
          {nextLevel && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Progress to Level {nextLevel.level}</span>
                <span className="text-nero-400">{xpForNextLevel} XP to go</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  className="h-full bg-gradient-to-r from-nero-500 to-nero-400 rounded-full"
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
            <p className="text-xl font-display font-bold">{data.currentStreak}</p>
            <p className="text-xs text-white/50">Day Streak</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <Target className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <p className="text-xl font-display font-bold">{data.stats.tasksCompleted}</p>
            <p className="text-xs text-white/50">Tasks Done</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <p className="text-xl font-display font-bold">{data.stats.sessionsCompleted}</p>
            <p className="text-xs text-white/50">Sessions</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white/5 rounded-xl p-1">
          {['overview', 'achievements', 'themes'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-nero-500 text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <h3 className="font-display font-semibold text-lg">Recent Activity</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Tasks earn +{XP_VALUES.taskComplete} XP</p>
                    <p className="text-xs text-white/50">+ streak bonus up to 100 XP</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Focus sessions earn +{XP_VALUES.focusSession} XP</p>
                    <p className="text-xs text-white/50">+ streak bonus up to 100 XP</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Flame className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Longest streak: {data.longestStreak} days</p>
                    <p className="text-xs text-white/50">Keep it going!</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {achievements.map((achievement) => {
                const isUnlocked = data.achievements.includes(achievement.id)
                const Icon = achievement.icon

                return (
                  <div
                    key={achievement.id}
                    className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${
                      isUnlocked
                        ? 'bg-nero-500/20 border border-nero-500/30'
                        : 'bg-white/5 opacity-60'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isUnlocked ? 'bg-nero-500' : 'bg-white/10'
                    }`}>
                      {isUnlocked ? (
                        <Icon className="w-5 h-5 text-white" />
                      ) : (
                        <Lock className="w-4 h-4 text-white/50" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{achievement.title}</p>
                      <p className="text-xs text-white/50">{achievement.description}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${isUnlocked ? 'text-nero-400' : 'text-white/40'}`}>
                        +{achievement.xpReward} XP
                      </p>
                    </div>
                  </div>
                )
              })}
            </motion.div>
          )}

          {activeTab === 'themes' && (
            <motion.div
              key="themes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <p className="text-sm text-white/60 mb-4">
                Unlock themes by reaching higher levels
              </p>
              {themes.map((theme) => {
                const isUnlocked = data.level >= theme.requiredLevel
                const isSelected = data.selectedTheme === theme.id

                return (
                  <div
                    key={theme.id}
                    className={`flex items-center gap-3 rounded-xl p-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-nero-500/20 border border-nero-500/30'
                        : isUnlocked
                          ? 'bg-white/5 hover:bg-white/10'
                          : 'bg-white/5 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-${theme.colors.primary}-500`} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{theme.title}</p>
                      <p className="text-xs text-white/50">
                        {isUnlocked ? 'Unlocked' : `Requires Level ${theme.requiredLevel}`}
                      </p>
                    </div>
                    {!isUnlocked && <Lock className="w-4 h-4 text-white/40" />}
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-nero-400" />}
                  </div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
