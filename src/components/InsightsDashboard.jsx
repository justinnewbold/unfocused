import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  Target,
  MapPin,
  Battery,
  Flame,
  Award,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Utility to get date key
const getDateKey = (date = new Date()) => date.toISOString().split('T')[0]

// Load stats from localStorage
const loadStats = () => {
  try {
    const stored = localStorage.getItem('neroInsights')
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

// Save stats to localStorage
const saveStats = (stats) => {
  localStorage.setItem('neroInsights', JSON.stringify(stats))
}

// Initialize today's stats if needed
export const initTodayStats = () => {
  const stats = loadStats()
  const today = getDateKey()

  if (!stats[today]) {
    stats[today] = {
      tasksCompleted: 0,
      focusSessions: 0,
      focusMinutes: 0,
      breadcrumbsDropped: 0,
      breadcrumbsResolved: 0,
      energyLevels: [],
      peakEnergyTime: null
    }
    saveStats(stats)
  }

  return stats
}

// Update a specific stat
export const updateStat = (statKey, value, operation = 'set') => {
  const stats = initTodayStats()
  const today = getDateKey()

  if (operation === 'increment') {
    stats[today][statKey] = (stats[today][statKey] || 0) + value
  } else if (operation === 'push') {
    if (!Array.isArray(stats[today][statKey])) {
      stats[today][statKey] = []
    }
    stats[today][statKey].push(value)
  } else {
    stats[today][statKey] = value
  }

  saveStats(stats)
  return stats
}

// Get streak count
const getStreak = (stats) => {
  const dates = Object.keys(stats).sort().reverse()
  let streak = 0
  const today = getDateKey()

  for (let i = 0; i < dates.length; i++) {
    const expectedDate = new Date()
    expectedDate.setDate(expectedDate.getDate() - i)
    const expected = getDateKey(expectedDate)

    if (dates.includes(expected) && stats[expected].tasksCompleted > 0) {
      streak++
    } else if (i > 0) {
      break
    }
  }

  return streak
}

export default function InsightsDashboard({
  tasksCompleted = 0,
  focusSessions = 0,
  breadcrumbsCount = 0,
  energyLevel = 3
}) {
  const prefersReducedMotion = useReducedMotion()
  const [stats, setStats] = useState({})
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Load stats on mount
  useEffect(() => {
    const loadedStats = initTodayStats()
    setStats(loadedStats)
  }, [])

  // Calculate insights
  const insights = useMemo(() => {
    const dateKey = getDateKey(selectedDate)
    const dayStats = stats[dateKey] || {
      tasksCompleted: 0,
      focusSessions: 0,
      focusMinutes: 0,
      breadcrumbsDropped: 0,
      breadcrumbsResolved: 0,
      energyLevels: []
    }

    // Calculate weekly average
    const lastWeek = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(selectedDate)
      d.setDate(d.getDate() - i)
      const key = getDateKey(d)
      if (stats[key]) {
        lastWeek.push(stats[key])
      }
    }

    const avgTasks = lastWeek.length > 0
      ? Math.round(lastWeek.reduce((sum, d) => sum + (d.tasksCompleted || 0), 0) / lastWeek.length)
      : 0

    const avgEnergy = dayStats.energyLevels?.length > 0
      ? Math.round(dayStats.energyLevels.reduce((a, b) => a + b, 0) / dayStats.energyLevels.length * 10) / 10
      : energyLevel

    return {
      today: dayStats,
      streak: getStreak(stats),
      weeklyAvgTasks: avgTasks,
      avgEnergy,
      isToday: dateKey === getDateKey()
    }
  }, [stats, selectedDate, energyLevel])

  // Navigate dates
  const changeDate = (delta) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + delta)
    if (newDate <= new Date()) {
      setSelectedDate(newDate)
    }
  }

  // Format date for display
  const formatDate = (date) => {
    const today = getDateKey()
    const dateKey = getDateKey(date)

    if (dateKey === today) return 'Today'

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    if (dateKey === getDateKey(yesterday)) return 'Yesterday'

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  // Stat card component
  const StatCard = ({ icon: Icon, label, value, subtext, color = 'nero' }) => (
    <div className="glass-card p-4">
      <div className="flex items-start justify-between mb-2">
        <div className={`w-10 h-10 rounded-xl bg-${color}-500/20 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 text-${color}-400`} />
        </div>
        <span className="font-mono text-2xl font-bold">{value}</span>
      </div>
      <p className="text-white/70 text-sm">{label}</p>
      {subtext && <p className="text-white/40 text-xs mt-1">{subtext}</p>}
    </div>
  )

  // Energy bar visualization
  const EnergyBar = ({ level, label }) => {
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500']
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/50 w-10">{label}</span>
        <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${colors[Math.min(level - 1, 4)] || colors[2]} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${(level / 5) * 100}%` }}
            transition={{ duration: 0.5, delay: 0.1 }}
          />
        </div>
        <span className="text-xs font-mono w-6">{level}</span>
      </div>
    )
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-focus-400 to-focus-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold">Insights</h2>
              <p className="text-sm text-white/50">Track your progress</p>
            </div>
          </div>

          {/* Streak badge */}
          {insights.streak > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-orange-500/20 text-orange-400">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-medium">{insights.streak} day streak</span>
            </div>
          )}
        </div>

        {/* Date navigator */}
        <div className="flex items-center justify-between mb-6 glass-card p-3">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-white/50" />
            <span className="font-medium">{formatDate(selectedDate)}</span>
          </div>
          <button
            onClick={() => changeDate(1)}
            disabled={insights.isToday}
            className={`p-2 rounded-lg transition-colors ${
              insights.isToday ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard
            icon={Target}
            label="Tasks Completed"
            value={insights.isToday ? tasksCompleted : insights.today.tasksCompleted}
            subtext={`Avg: ${insights.weeklyAvgTasks}/day`}
            color="nero"
          />
          <StatCard
            icon={TrendingUp}
            label="Focus Sessions"
            value={insights.isToday ? focusSessions : insights.today.focusSessions}
            subtext={`${insights.today.focusMinutes || 0}m focused`}
            color="focus"
          />
          <StatCard
            icon={MapPin}
            label="Breadcrumbs"
            value={insights.isToday ? breadcrumbsCount : insights.today.breadcrumbsDropped}
            subtext={`${insights.today.breadcrumbsResolved || 0} resolved`}
            color="calm"
          />
          <StatCard
            icon={Battery}
            label="Energy Level"
            value={insights.avgEnergy}
            subtext="Today's average"
            color="yellow"
          />
        </div>

        {/* Energy throughout day */}
        {insights.today.energyLevels?.length > 0 && (
          <div className="glass-card p-4 mb-6">
            <h3 className="text-sm font-medium text-white/70 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Energy Throughout the Day
            </h3>
            <div className="space-y-3">
              {insights.today.energyLevels.map((level, i) => {
                const n = i + 1
                const suffix = (n >= 11 && n <= 13) ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] || 'th')
                return (
                  <EnergyBar
                    key={i}
                    level={level}
                    label={`${n}${suffix}`}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Achievements */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium text-white/70 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Recent Achievements
          </h3>
          <div className="space-y-3">
            {insights.streak >= 3 && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <Flame className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="font-medium text-orange-400">On Fire!</p>
                  <p className="text-xs text-white/50">{insights.streak} day streak</p>
                </div>
              </div>
            )}

            {tasksCompleted >= 5 && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-nero-500/10 border border-nero-500/20">
                <Sparkles className="w-5 h-5 text-nero-400" />
                <div>
                  <p className="font-medium text-nero-400">Momentum Builder</p>
                  <p className="text-xs text-white/50">5+ tasks completed today</p>
                </div>
              </div>
            )}

            {focusSessions >= 3 && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-focus-500/10 border border-focus-500/20">
                <Target className="w-5 h-5 text-focus-400" />
                <div>
                  <p className="font-medium text-focus-400">Focus Champion</p>
                  <p className="text-xs text-white/50">3+ focus sessions today</p>
                </div>
              </div>
            )}

            {insights.streak < 3 && tasksCompleted < 5 && focusSessions < 3 && (
              <p className="text-white/40 text-sm text-center py-4">
                Keep going! Achievements unlock as you use Nero.
              </p>
            )}
          </div>
        </div>

        {/* Motivation message */}
        <div className="mt-6 text-center">
          <p className="text-white/40 text-sm">
            {tasksCompleted === 0 && "Every journey starts with one step. You've got this!"}
            {tasksCompleted > 0 && tasksCompleted < 3 && "Nice start! Small wins add up."}
            {tasksCompleted >= 3 && tasksCompleted < 5 && "You're building momentum! Keep it rolling."}
            {tasksCompleted >= 5 && "Incredible progress today! Remember to take breaks."}
          </p>
        </div>
      </motion.div>
    </div>
  )
}
