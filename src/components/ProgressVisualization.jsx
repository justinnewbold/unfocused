import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Target,
  Zap,
  Flame,
  Award,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage keys (matching InsightsDashboard)
const STATS_KEY = 'nero_insights_stats'
const ROUTINES_KEY = 'nero_routines'
const TIME_ESTIMATES_KEY = 'nero_time_estimates'
const MOOD_KEY = 'nero_mood_history'

// Load all data
const loadStats = () => {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY) || '{}')
  } catch { return {} }
}

const loadRoutines = () => {
  try {
    return JSON.parse(localStorage.getItem(ROUTINES_KEY) || '[]')
  } catch { return [] }
}

const loadTimeEstimates = () => {
  try {
    return JSON.parse(localStorage.getItem(TIME_ESTIMATES_KEY) || '[]')
  } catch { return [] }
}

const loadMoodHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(MOOD_KEY) || '[]')
  } catch { return [] }
}

// Generate demo data if empty
const generateDemoData = () => {
  const stats = {}
  const today = new Date()

  for (let i = 30; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const key = date.toISOString().split('T')[0]

    stats[key] = {
      tasksCompleted: Math.floor(Math.random() * 8) + 1,
      focusSessions: Math.floor(Math.random() * 5),
      focusMinutes: Math.floor(Math.random() * 120) + 30,
      breadcrumbsResolved: Math.floor(Math.random() * 3),
      energy: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    }
  }

  localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  return stats
}

// Get date range
const getDateRange = (period, offset = 0) => {
  const end = new Date()
  end.setDate(end.getDate() - (offset * (period === 'week' ? 7 : 30)))

  const start = new Date(end)
  if (period === 'week') {
    start.setDate(start.getDate() - 6)
  } else {
    start.setDate(start.getDate() - 29)
  }

  return { start, end }
}

// Get days in range
const getDaysInRange = (start, end) => {
  const days = []
  const current = new Date(start)

  while (current <= end) {
    days.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }

  return days
}

// Simple bar chart component
function BarChart({ data, maxValue, color = 'nero', height = 120 }) {
  return (
    <div className="flex items-end justify-between gap-1" style={{ height }}>
      {data.map((value, i) => {
        const barHeight = maxValue > 0 ? (value / maxValue) * 100 : 0

        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center"
          >
            <div
              className={`w-full rounded-t-sm bg-${color}-500/70 transition-all duration-300`}
              style={{ height: `${barHeight}%`, minHeight: value > 0 ? 4 : 0 }}
            />
          </div>
        )
      })}
    </div>
  )
}

// Heatmap calendar component
function HeatmapCalendar({ data, days }) {
  const getIntensity = (value) => {
    if (!value || value === 0) return 'bg-white/5'
    if (value <= 2) return 'bg-green-900/50'
    if (value <= 4) return 'bg-green-700/50'
    if (value <= 6) return 'bg-green-500/50'
    return 'bg-green-400/70'
  }

  // Group by weeks
  const weeks = []
  let currentWeek = []

  days.forEach((day, i) => {
    const date = new Date(day)
    if (date.getDay() === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek)
      currentWeek = []
    }
    currentWeek.push({ date: day, value: data[day]?.tasksCompleted || 0 })
  })

  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  return (
    <div className="flex gap-1">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((day, di) => (
            <div
              key={di}
              className={`w-4 h-4 rounded-sm ${getIntensity(day.value)}`}
              title={`${day.date}: ${day.value} tasks`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export default function ProgressVisualization() {
  const prefersReducedMotion = useReducedMotion()
  const [stats, setStats] = useState({})
  const [period, setPeriod] = useState('week') // 'week' | 'month'
  const [offset, setOffset] = useState(0)
  const [viewMode, setViewMode] = useState('overview') // 'overview' | 'trends' | 'heatmap'

  // Load data on mount
  useEffect(() => {
    let loadedStats = loadStats()
    if (Object.keys(loadedStats).length === 0) {
      loadedStats = generateDemoData()
    }
    setStats(loadedStats)
  }, [])

  // Calculate date range and days
  const { start, end } = useMemo(() => getDateRange(period, offset), [period, offset])
  const days = useMemo(() => getDaysInRange(start, end), [start, end])

  // Aggregate stats for period
  const periodStats = useMemo(() => {
    const result = {
      tasksCompleted: 0,
      focusSessions: 0,
      focusMinutes: 0,
      avgTasksPerDay: 0,
      avgFocusPerDay: 0,
      bestDay: null,
      bestDayTasks: 0,
      daysActive: 0,
      streakDays: 0,
    }

    let currentStreak = 0
    days.forEach(day => {
      const dayStats = stats[day]
      if (dayStats) {
        result.tasksCompleted += dayStats.tasksCompleted || 0
        result.focusSessions += dayStats.focusSessions || 0
        result.focusMinutes += dayStats.focusMinutes || 0

        if (dayStats.tasksCompleted > 0) {
          result.daysActive++
          currentStreak++

          if (dayStats.tasksCompleted > result.bestDayTasks) {
            result.bestDayTasks = dayStats.tasksCompleted
            result.bestDay = day
          }
        } else {
          currentStreak = 0
        }
      }
    })

    result.streakDays = currentStreak
    result.avgTasksPerDay = result.daysActive > 0 ? (result.tasksCompleted / result.daysActive).toFixed(1) : 0
    result.avgFocusPerDay = result.daysActive > 0 ? Math.round(result.focusMinutes / result.daysActive) : 0

    return result
  }, [stats, days])

  // Chart data
  const chartData = useMemo(() => {
    return days.map(day => stats[day]?.tasksCompleted || 0)
  }, [stats, days])

  const focusChartData = useMemo(() => {
    return days.map(day => stats[day]?.focusMinutes || 0)
  }, [stats, days])

  const maxTasks = Math.max(...chartData, 1)
  const maxFocus = Math.max(...focusChartData, 1)

  // Comparison with previous period
  const comparison = useMemo(() => {
    const prevRange = getDateRange(period, offset + 1)
    const prevDays = getDaysInRange(prevRange.start, prevRange.end)

    let prevTasks = 0
    prevDays.forEach(day => {
      prevTasks += stats[day]?.tasksCompleted || 0
    })

    const diff = periodStats.tasksCompleted - prevTasks
    const percentage = prevTasks > 0 ? Math.round((diff / prevTasks) * 100) : 0

    return { diff, percentage, prevTasks }
  }, [stats, period, offset, periodStats.tasksCompleted])

  // Navigation
  const navigate = (direction) => {
    setOffset(prev => Math.max(0, prev + direction))
  }

  // Format date range display
  const formatDateRange = () => {
    const options = { month: 'short', day: 'numeric' }
    return `${start.toLocaleDateString('en', options)} - ${end.toLocaleDateString('en', options)}`
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
        <div className="mb-6">
          <h2 className="font-display text-xl font-semibold">Progress</h2>
          <p className="text-sm text-white/50">Visualize your productivity trends</p>
        </div>

        {/* Period Toggle */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'week', label: 'Week' },
            { id: 'month', label: 'Month' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => { setPeriod(p.id); setOffset(0) }}
              className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                period === p.id
                  ? 'bg-nero-500 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(1)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <p className="font-medium">{formatDateRange()}</p>
            {offset === 0 && <p className="text-xs text-white/50">Current {period}</p>}
          </div>

          <button
            onClick={() => navigate(-1)}
            disabled={offset === 0}
            className={`p-2 rounded-lg transition-colors ${
              offset === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-green-400" />
              <span className="text-xs text-white/50">Tasks Completed</span>
            </div>
            <p className="text-2xl font-bold">{periodStats.tasksCompleted}</p>
            <div className="flex items-center gap-1 mt-1">
              {comparison.diff >= 0 ? (
                <TrendingUp className="w-3 h-3 text-green-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-400" />
              )}
              <span className={`text-xs ${comparison.diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {comparison.diff >= 0 ? '+' : ''}{comparison.percentage}%
              </span>
              <span className="text-xs text-white/40">vs prev</span>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-white/50">Focus Time</span>
            </div>
            <p className="text-2xl font-bold">{Math.round(periodStats.focusMinutes / 60)}h</p>
            <p className="text-xs text-white/40 mt-1">
              ~{periodStats.avgFocusPerDay}m/day average
            </p>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-white/50">Days Active</span>
            </div>
            <p className="text-2xl font-bold">{periodStats.daysActive}</p>
            <p className="text-xs text-white/40 mt-1">
              of {days.length} days
            </p>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-white/50">Best Day</span>
            </div>
            <p className="text-2xl font-bold">{periodStats.bestDayTasks}</p>
            <p className="text-xs text-white/40 mt-1">tasks on best day</p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'overview', label: 'Tasks', icon: BarChart3 },
            { id: 'focus', label: 'Focus', icon: Activity },
            { id: 'heatmap', label: 'Heatmap', icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                viewMode === tab.id
                  ? 'bg-white/10 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Charts */}
        <div className="glass-card p-4 mb-4">
          {viewMode === 'overview' && (
            <>
              <h3 className="text-sm font-medium text-white/70 mb-3">Tasks Completed</h3>
              <BarChart data={chartData} maxValue={maxTasks} color="green" />
              <div className="flex justify-between mt-2 text-xs text-white/40">
                <span>{start.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                <span>{end.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
              </div>
            </>
          )}

          {viewMode === 'focus' && (
            <>
              <h3 className="text-sm font-medium text-white/70 mb-3">Focus Minutes</h3>
              <BarChart data={focusChartData} maxValue={maxFocus} color="purple" />
              <div className="flex justify-between mt-2 text-xs text-white/40">
                <span>{start.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                <span>{end.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
              </div>
            </>
          )}

          {viewMode === 'heatmap' && (
            <>
              <h3 className="text-sm font-medium text-white/70 mb-3">Activity Heatmap</h3>
              <div className="overflow-x-auto py-2">
                <HeatmapCalendar data={stats} days={days} />
              </div>
              <div className="flex items-center justify-end gap-2 mt-3 text-xs text-white/40">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-sm bg-white/5" />
                  <div className="w-3 h-3 rounded-sm bg-green-900/50" />
                  <div className="w-3 h-3 rounded-sm bg-green-700/50" />
                  <div className="w-3 h-3 rounded-sm bg-green-500/50" />
                  <div className="w-3 h-3 rounded-sm bg-green-400/70" />
                </div>
                <span>More</span>
              </div>
            </>
          )}
        </div>

        {/* Insights */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium text-white/70 mb-3">Insights</h3>
          <div className="space-y-2 text-sm text-white/70">
            <p>
              • Average <span className="text-white">{periodStats.avgTasksPerDay}</span> tasks per active day
            </p>
            <p>
              • <span className="text-white">{periodStats.focusSessions}</span> focus sessions this {period}
            </p>
            {periodStats.streakDays > 1 && (
              <p className="text-orange-400">
                • <Flame className="w-4 h-4 inline" /> {periodStats.streakDays} day streak!
              </p>
            )}
            {comparison.percentage > 20 && (
              <p className="text-green-400">
                • Great progress! You're {comparison.percentage}% more productive than last {period}
              </p>
            )}
            {comparison.percentage < -20 && (
              <p className="text-yellow-400">
                • Productivity dipped {Math.abs(comparison.percentage)}% from last {period}. That's okay - everyone has off weeks!
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
