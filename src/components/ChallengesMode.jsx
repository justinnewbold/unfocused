import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy,
  Target,
  Flame,
  Star,
  Zap,
  Clock,
  Calendar,
  CheckCircle,
  Circle,
  ChevronRight,
  Gift,
  Users,
  Lock,
  Unlock,
  Sparkles,
  Award,
  TrendingUp,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage keys
const CHALLENGES_KEY = 'nero_challenges'
const CHALLENGE_PROGRESS_KEY = 'nero_challenge_progress'

// Challenge definitions
const AVAILABLE_CHALLENGES = [
  // Daily Challenges
  {
    id: 'daily-focus-30',
    name: 'Focus Sprint',
    description: 'Complete a 30-minute focus session',
    type: 'daily',
    target: 1,
    unit: 'session',
    xp: 50,
    category: 'focus',
    icon: 'Zap',
  },
  {
    id: 'daily-tasks-3',
    name: 'Task Trio',
    description: 'Complete 3 tasks today',
    type: 'daily',
    target: 3,
    unit: 'tasks',
    xp: 75,
    category: 'productivity',
    icon: 'CheckCircle',
  },
  {
    id: 'daily-breaks',
    name: 'Balance Master',
    description: 'Take all scheduled breaks',
    type: 'daily',
    target: 4,
    unit: 'breaks',
    xp: 40,
    category: 'wellness',
    icon: 'Clock',
  },
  // Weekly Challenges
  {
    id: 'weekly-focus-5h',
    name: 'Focus Marathon',
    description: 'Accumulate 5 hours of focus time this week',
    type: 'weekly',
    target: 300,
    unit: 'minutes',
    xp: 200,
    category: 'focus',
    icon: 'Flame',
  },
  {
    id: 'weekly-streak-5',
    name: 'Consistency King',
    description: 'Maintain a 5-day focus streak',
    type: 'weekly',
    target: 5,
    unit: 'days',
    xp: 250,
    category: 'streak',
    icon: 'TrendingUp',
  },
  {
    id: 'weekly-tasks-20',
    name: 'Task Titan',
    description: 'Complete 20 tasks this week',
    type: 'weekly',
    target: 20,
    unit: 'tasks',
    xp: 300,
    category: 'productivity',
    icon: 'Target',
  },
  // Special Challenges
  {
    id: 'special-early-bird',
    name: 'Early Bird',
    description: 'Start a focus session before 9 AM',
    type: 'special',
    target: 1,
    unit: 'session',
    xp: 100,
    category: 'lifestyle',
    icon: 'Star',
  },
  {
    id: 'special-night-owl',
    name: 'Night Owl',
    description: 'Complete a focus session after 10 PM',
    type: 'special',
    target: 1,
    unit: 'session',
    xp: 100,
    category: 'lifestyle',
    icon: 'Star',
  },
]

// Load challenge progress
const loadProgress = () => {
  try {
    const stored = localStorage.getItem(CHALLENGE_PROGRESS_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

// Save progress
const saveProgress = (progress) => {
  localStorage.setItem(CHALLENGE_PROGRESS_KEY, JSON.stringify(progress))
}

// Get icon component
const getIcon = (iconName) => {
  const icons = { Trophy, Target, Flame, Star, Zap, Clock, CheckCircle, TrendingUp }
  return icons[iconName] || Star
}

export default function ChallengesMode() {
  const prefersReducedMotion = useReducedMotion()
  const [progress, setProgress] = useState({})
  const [selectedChallenge, setSelectedChallenge] = useState(null)
  const [showReward, setShowReward] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')

  // Load data on mount
  useEffect(() => {
    setProgress(loadProgress())
  }, [])

  // Get today's date key
  const getTodayKey = () => new Date().toISOString().split('T')[0]

  // Get week key
  const getWeekKey = () => {
    const now = new Date()
    const year = now.getFullYear()
    const week = Math.ceil((((now - new Date(year, 0, 1)) / 86400000) + 1) / 7)
    return `${year}-W${week}`
  }

  // Get challenge progress
  const getChallengeProgress = (challenge) => {
    const key = challenge.type === 'daily' ? getTodayKey() :
                challenge.type === 'weekly' ? getWeekKey() :
                'special'
    return progress[`${challenge.id}-${key}`] || { current: 0, completed: false }
  }

  // Update challenge progress (simulated)
  const incrementProgress = (challengeId, amount = 1) => {
    const challenge = AVAILABLE_CHALLENGES.find(c => c.id === challengeId)
    if (!challenge) return

    const key = challenge.type === 'daily' ? getTodayKey() :
                challenge.type === 'weekly' ? getWeekKey() :
                'special'
    const progressKey = `${challengeId}-${key}`
    const current = progress[progressKey] || { current: 0, completed: false }

    if (current.completed) return

    const newCurrent = Math.min(current.current + amount, challenge.target)
    const completed = newCurrent >= challenge.target

    const updated = {
      ...progress,
      [progressKey]: { current: newCurrent, completed }
    }
    setProgress(updated)
    saveProgress(updated)

    if (completed) {
      setShowReward(challenge)
      setTimeout(() => setShowReward(null), 3000)
    }
  }

  // Filter challenges
  const filteredChallenges = useMemo(() => {
    if (activeFilter === 'all') return AVAILABLE_CHALLENGES
    return AVAILABLE_CHALLENGES.filter(c => c.type === activeFilter)
  }, [activeFilter])

  // Group challenges by type
  const groupedChallenges = useMemo(() => {
    return {
      daily: filteredChallenges.filter(c => c.type === 'daily'),
      weekly: filteredChallenges.filter(c => c.type === 'weekly'),
      special: filteredChallenges.filter(c => c.type === 'special'),
    }
  }, [filteredChallenges])

  // Calculate total XP earned
  const totalXP = useMemo(() => {
    return Object.entries(progress).reduce((total, [key, value]) => {
      if (value.completed) {
        const challengeId = key.split('-').slice(0, -1).join('-')
        const challenge = AVAILABLE_CHALLENGES.find(c => c.id === challengeId)
        return total + (challenge?.xp || 0)
      }
      return total
    }, 0)
  }, [progress])

  // Completed today count
  const completedToday = useMemo(() => {
    const today = getTodayKey()
    return Object.entries(progress).filter(([key, value]) =>
      key.includes(today) && value.completed
    ).length
  }, [progress])

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
              <Trophy className="w-6 h-6 text-yellow-400" />
              Challenges
            </h2>
            <p className="text-sm text-white/50">Complete challenges for XP rewards</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="glass-card p-3 text-center">
            <Zap className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <p className="text-xl font-bold">{totalXP}</p>
            <p className="text-xs text-white/50">Total XP</p>
          </div>
          <div className="glass-card p-3 text-center">
            <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <p className="text-xl font-bold">{completedToday}</p>
            <p className="text-xs text-white/50">Completed Today</p>
          </div>
          <div className="glass-card p-3 text-center">
            <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
            <p className="text-xl font-bold">{AVAILABLE_CHALLENGES.length}</p>
            <p className="text-xs text-white/50">Available</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'all', name: 'All' },
            { id: 'daily', name: 'Daily' },
            { id: 'weekly', name: 'Weekly' },
            { id: 'special', name: 'Special' },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-colors ${
                activeFilter === filter.id
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {filter.name}
            </button>
          ))}
        </div>

        {/* Challenges List */}
        <div className="space-y-6">
          {/* Daily Challenges */}
          {groupedChallenges.daily.length > 0 && (activeFilter === 'all' || activeFilter === 'daily') && (
            <div>
              <h3 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Daily Challenges
              </h3>
              <div className="space-y-3">
                {groupedChallenges.daily.map((challenge) => {
                  const prog = getChallengeProgress(challenge)
                  const Icon = getIcon(challenge.icon)
                  const percentage = (prog.current / challenge.target) * 100

                  return (
                    <motion.div
                      key={challenge.id}
                      {...getMotionProps(prefersReducedMotion, {
                        initial: { opacity: 0, y: 10 },
                        animate: { opacity: 1, y: 0 }
                      })}
                      className={`glass-card p-4 ${prog.completed ? 'border border-green-500/30 bg-green-500/5' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          prog.completed ? 'bg-green-500/20' : 'bg-yellow-500/20'
                        }`}>
                          <Icon className={`w-5 h-5 ${prog.completed ? 'text-green-400' : 'text-yellow-400'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{challenge.name}</h4>
                            <span className="text-sm text-yellow-400">+{challenge.xp} XP</span>
                          </div>
                          <p className="text-sm text-white/50 mb-2">{challenge.description}</p>

                          {/* Progress bar */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full ${prog.completed ? 'bg-green-500' : 'bg-yellow-500'}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-white/50">
                              {prog.current}/{challenge.target}
                            </span>
                          </div>
                        </div>
                        {prog.completed && (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        )}
                      </div>

                      {/* Demo button */}
                      {!prog.completed && (
                        <button
                          onClick={() => incrementProgress(challenge.id)}
                          className="mt-3 w-full px-3 py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-sm transition-colors"
                        >
                          Simulate Progress +1
                        </button>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Weekly Challenges */}
          {groupedChallenges.weekly.length > 0 && (activeFilter === 'all' || activeFilter === 'weekly') && (
            <div>
              <h3 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Weekly Challenges
              </h3>
              <div className="space-y-3">
                {groupedChallenges.weekly.map((challenge) => {
                  const prog = getChallengeProgress(challenge)
                  const Icon = getIcon(challenge.icon)
                  const percentage = (prog.current / challenge.target) * 100

                  return (
                    <motion.div
                      key={challenge.id}
                      {...getMotionProps(prefersReducedMotion, {
                        initial: { opacity: 0, y: 10 },
                        animate: { opacity: 1, y: 0 }
                      })}
                      className={`glass-card p-4 ${prog.completed ? 'border border-green-500/30 bg-green-500/5' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          prog.completed ? 'bg-green-500/20' : 'bg-purple-500/20'
                        }`}>
                          <Icon className={`w-5 h-5 ${prog.completed ? 'text-green-400' : 'text-purple-400'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{challenge.name}</h4>
                            <span className="text-sm text-purple-400">+{challenge.xp} XP</span>
                          </div>
                          <p className="text-sm text-white/50 mb-2">{challenge.description}</p>

                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full ${prog.completed ? 'bg-green-500' : 'bg-purple-500'}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-white/50">
                              {prog.current}/{challenge.target}
                            </span>
                          </div>
                        </div>
                        {prog.completed && (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        )}
                      </div>

                      {!prog.completed && (
                        <button
                          onClick={() => incrementProgress(challenge.id, 10)}
                          className="mt-3 w-full px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-sm transition-colors"
                        >
                          Simulate Progress +10
                        </button>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Special Challenges */}
          {groupedChallenges.special.length > 0 && (activeFilter === 'all' || activeFilter === 'special') && (
            <div>
              <h3 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Special Challenges
              </h3>
              <div className="space-y-3">
                {groupedChallenges.special.map((challenge) => {
                  const prog = getChallengeProgress(challenge)
                  const Icon = getIcon(challenge.icon)

                  return (
                    <motion.div
                      key={challenge.id}
                      {...getMotionProps(prefersReducedMotion, {
                        initial: { opacity: 0, y: 10 },
                        animate: { opacity: 1, y: 0 }
                      })}
                      className={`glass-card p-4 ${prog.completed ? 'border border-green-500/30 bg-green-500/5' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          prog.completed ? 'bg-green-500/20' : 'bg-gradient-to-br from-pink-500/20 to-purple-500/20'
                        }`}>
                          <Icon className={`w-5 h-5 ${prog.completed ? 'text-green-400' : 'text-pink-400'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{challenge.name}</h4>
                            <span className="text-sm text-pink-400">+{challenge.xp} XP</span>
                          </div>
                          <p className="text-sm text-white/50">{challenge.description}</p>
                        </div>
                        {prog.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <button
                            onClick={() => incrementProgress(challenge.id)}
                            className="px-3 py-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 text-sm transition-colors"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Motivation */}
        <div className="mt-6 p-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/20">
          <p className="text-sm">
            <strong className="text-yellow-400">Dopamine Boost:</strong> Challenges are designed
            to give your ADHD brain the novelty and reward it craves. Small wins = big motivation!
          </p>
        </div>

        {/* Reward Animation */}
        <AnimatePresence>
          {showReward && (
            <motion.div
              {...getMotionProps(prefersReducedMotion, {
                initial: { opacity: 0, scale: 0.5 },
                animate: { opacity: 1, scale: 1 },
                exit: { opacity: 0, scale: 0.5 }
              })}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-8 text-center shadow-2xl">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                >
                  <Trophy className="w-16 h-16 text-white mx-auto mb-4" />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">Challenge Complete!</h3>
                <p className="text-white/80">{showReward.name}</p>
                <p className="text-2xl font-bold text-white mt-2">+{showReward.xp} XP</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
