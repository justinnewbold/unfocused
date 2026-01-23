import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Clock,
  TrendingUp,
  ChevronRight,
  RefreshCw,
  Zap,
  Coffee,
  Brain,
  Target,
  Sun,
  Moon,
  Sunset,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage keys
const STORAGE_KEY = 'nero_task_history'
const PATTERNS_KEY = 'nero_productivity_patterns'

// Get task history from storage
const getTaskHistory = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (e) {
    return []
  }
}

// Save task history
const saveTaskHistory = (history) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-100))) // Keep last 100
  } catch (e) {
    console.error('Failed to save task history:', e)
  }
}

// Get productivity patterns
const getPatterns = () => {
  try {
    const stored = localStorage.getItem(PATTERNS_KEY)
    return stored ? JSON.parse(stored) : {
      hourlyProductivity: {}, // hour -> { completed, started }
      energySuccess: {}, // energy level -> { completed, started }
      taskTypeSuccess: {}, // task type -> { completed, started }
    }
  } catch (e) {
    return { hourlyProductivity: {}, energySuccess: {}, taskTypeSuccess: {} }
  }
}

// Save patterns
const savePatterns = (patterns) => {
  try {
    localStorage.setItem(PATTERNS_KEY, JSON.stringify(patterns))
  } catch (e) {
    console.error('Failed to save patterns:', e)
  }
}

// Record task start
export const recordTaskStart = (task, energyLevel) => {
  const history = getTaskHistory()
  const patterns = getPatterns()
  const hour = new Date().getHours()

  // Update hourly stats
  if (!patterns.hourlyProductivity[hour]) {
    patterns.hourlyProductivity[hour] = { completed: 0, started: 0 }
  }
  patterns.hourlyProductivity[hour].started++

  // Update energy stats
  if (!patterns.energySuccess[energyLevel]) {
    patterns.energySuccess[energyLevel] = { completed: 0, started: 0 }
  }
  patterns.energySuccess[energyLevel].started++

  // Update task type stats
  const taskType = task.energyRequired <= 2 ? 'low' : task.energyRequired <= 3 ? 'medium' : 'high'
  if (!patterns.taskTypeSuccess[taskType]) {
    patterns.taskTypeSuccess[taskType] = { completed: 0, started: 0 }
  }
  patterns.taskTypeSuccess[taskType].started++

  savePatterns(patterns)

  // Add to history
  history.push({
    id: task.id,
    title: task.title,
    energyRequired: task.energyRequired,
    startedAt: new Date().toISOString(),
    hour,
    userEnergy: energyLevel,
    completed: false,
  })
  saveTaskHistory(history)
}

// Record task complete
export const recordTaskComplete = (taskId) => {
  const history = getTaskHistory()
  const patterns = getPatterns()

  const taskIndex = history.findIndex(t => t.id === taskId && !t.completed)
  if (taskIndex >= 0) {
    const task = history[taskIndex]
    task.completed = true
    task.completedAt = new Date().toISOString()

    // Update patterns
    const hour = task.hour
    if (patterns.hourlyProductivity[hour]) {
      patterns.hourlyProductivity[hour].completed++
    }

    if (patterns.energySuccess[task.userEnergy]) {
      patterns.energySuccess[task.userEnergy].completed++
    }

    const taskType = task.energyRequired <= 2 ? 'low' : task.energyRequired <= 3 ? 'medium' : 'high'
    if (patterns.taskTypeSuccess[taskType]) {
      patterns.taskTypeSuccess[taskType].completed++
    }

    savePatterns(patterns)
    saveTaskHistory(history)
  }
}

// Get time of day context
const getTimeContext = () => {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return { period: 'morning', icon: Sun, label: 'Morning' }
  if (hour >= 12 && hour < 17) return { period: 'afternoon', icon: Sunset, label: 'Afternoon' }
  if (hour >= 17 && hour < 21) return { period: 'evening', icon: Sunset, label: 'Evening' }
  return { period: 'night', icon: Moon, label: 'Night' }
}

// Calculate suggestion score for a task
const calculateTaskScore = (task, energyLevel, patterns) => {
  let score = 50 // Base score
  const hour = new Date().getHours()

  // Energy match (most important)
  const energyDiff = Math.abs(task.energyRequired - energyLevel)
  if (energyDiff === 0) score += 30
  else if (energyDiff === 1) score += 15
  else score -= energyDiff * 10

  // Don't suggest high-energy tasks when low energy
  if (energyLevel <= 2 && task.energyRequired >= 4) {
    score -= 30
  }

  // Time of day patterns
  const hourStats = patterns.hourlyProductivity[hour]
  if (hourStats && hourStats.started > 0) {
    const hourSuccessRate = hourStats.completed / hourStats.started
    score += hourSuccessRate * 20
  }

  // Task type success rate
  const taskType = task.energyRequired <= 2 ? 'low' : task.energyRequired <= 3 ? 'medium' : 'high'
  const typeStats = patterns.taskTypeSuccess[taskType]
  if (typeStats && typeStats.started > 0) {
    const typeSuccessRate = typeStats.completed / typeStats.started
    score += typeSuccessRate * 15
  }

  // Slight randomness to keep suggestions fresh
  score += Math.random() * 10

  return Math.max(0, Math.min(100, score))
}

// Sample tasks for demo (in real app, these would come from TaskQueue)
const SAMPLE_TASKS = [
  { id: '1', title: 'Reply to important email', energyRequired: 2, type: 'admin' },
  { id: '2', title: 'Deep work on project', energyRequired: 4, type: 'focus' },
  { id: '3', title: 'Quick file organization', energyRequired: 1, type: 'admin' },
  { id: '4', title: 'Review meeting notes', energyRequired: 2, type: 'review' },
  { id: '5', title: 'Creative brainstorming', energyRequired: 3, type: 'creative' },
  { id: '6', title: 'Update documentation', energyRequired: 3, type: 'writing' },
  { id: '7', title: 'Code review', energyRequired: 4, type: 'focus' },
  { id: '8', title: 'Take a walk break', energyRequired: 1, type: 'break' },
]

// Energy icon helper
const getEnergyIcon = (level) => {
  if (level <= 2) return BatteryLow
  if (level <= 3) return BatteryMedium
  return BatteryFull
}

const getEnergyColor = (level) => {
  if (level <= 2) return 'text-orange-400'
  if (level <= 3) return 'text-yellow-400'
  return 'text-green-400'
}

export default function SmartSuggestions({ energyLevel = 3, tasks = SAMPLE_TASKS, onSelectTask }) {
  const prefersReducedMotion = useReducedMotion()
  const [patterns, setPatterns] = useState(getPatterns)
  const [refreshKey, setRefreshKey] = useState(0)

  const timeContext = getTimeContext()
  const TimeIcon = timeContext.icon

  // Calculate suggestions
  const suggestions = useMemo(() => {
    return tasks
      .map(task => ({
        ...task,
        score: calculateTaskScore(task, energyLevel, patterns),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
  }, [tasks, energyLevel, patterns, refreshKey])

  // Best hour analysis
  const bestHour = useMemo(() => {
    const hours = Object.entries(patterns.hourlyProductivity)
      .filter(([_, stats]) => stats.started >= 3) // Need enough data
      .map(([hour, stats]) => ({
        hour: parseInt(hour),
        rate: stats.completed / stats.started,
      }))
      .sort((a, b) => b.rate - a.rate)

    return hours[0] || null
  }, [patterns])

  // Energy insight
  const energyInsight = useMemo(() => {
    const stats = patterns.energySuccess[energyLevel]
    if (!stats || stats.started < 3) return null

    const rate = Math.round((stats.completed / stats.started) * 100)
    return {
      rate,
      message: rate >= 70
        ? "You're usually productive at this energy level!"
        : rate >= 40
          ? "Mixed results at this energy - start small."
          : "Tough energy level - consider a break first."
    }
  }, [patterns, energyLevel])

  const handleRefresh = () => {
    setRefreshKey(k => k + 1)
  }

  const handleSelectTask = (task) => {
    recordTaskStart(task, energyLevel)
    onSelectTask?.(task)
  }

  return (
    <div className="p-4 h-full overflow-auto">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-nero-500/20 text-nero-400 text-sm mb-3">
            <Sparkles className="w-4 h-4" />
            <span>Smart Suggestions</span>
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">What should I work on?</h1>
          <p className="text-white/60">Personalized recommendations based on your patterns</p>
        </div>

        {/* Current Context Card */}
        <motion.div
          {...getMotionProps(prefersReducedMotion, {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
          })}
          className="bg-white/5 rounded-2xl p-4 border border-white/10"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white/70">Current Context</h3>
            <button
              onClick={handleRefresh}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Refresh suggestions"
            >
              <RefreshCw className="w-4 h-4 text-white/50" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Time of Day */}
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <TimeIcon className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-xs text-white/50">Time</p>
                <p className="font-medium">{timeContext.label}</p>
              </div>
            </div>

            {/* Energy Level */}
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              {React.createElement(getEnergyIcon(energyLevel), {
                className: `w-5 h-5 ${getEnergyColor(energyLevel)}`
              })}
              <div>
                <p className="text-xs text-white/50">Energy</p>
                <p className="font-medium">Level {energyLevel}/5</p>
              </div>
            </div>
          </div>

          {/* Energy Insight */}
          {energyInsight && (
            <div className="mt-3 p-3 bg-nero-500/10 rounded-xl border border-nero-500/20">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-nero-400" />
                <span className="text-sm text-nero-300">{energyInsight.message}</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Suggested Tasks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Suggested Next</h3>
            <span className="text-xs text-white/50">Based on your patterns</span>
          </div>

          {suggestions.map((task, index) => {
            const EnergyIcon = getEnergyIcon(task.energyRequired)
            const isTopPick = index === 0

            return (
              <motion.button
                key={task.id}
                {...getMotionProps(prefersReducedMotion, {
                  initial: { opacity: 0, x: -20 },
                  animate: { opacity: 1, x: 0 },
                  transition: { delay: index * 0.1 },
                })}
                onClick={() => handleSelectTask(task)}
                className={`w-full text-left p-4 rounded-xl transition-all ${
                  isTopPick
                    ? 'bg-gradient-to-r from-nero-500/20 to-nero-600/10 border border-nero-500/30 hover:border-nero-500/50'
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isTopPick ? 'bg-nero-500' : 'bg-white/10'
                  }`}>
                    {isTopPick ? (
                      <Zap className="w-5 h-5 text-white" />
                    ) : (
                      <Target className="w-5 h-5 text-white/60" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {isTopPick && (
                        <span className="px-2 py-0.5 rounded text-xs bg-nero-500/30 text-nero-300">
                          Best Match
                        </span>
                      )}
                    </div>
                    <p className={`font-medium ${isTopPick ? 'text-white' : 'text-white/80'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`flex items-center gap-1 text-xs ${getEnergyColor(task.energyRequired)}`}>
                        <EnergyIcon className="w-3 h-3" />
                        {task.energyRequired <= 2 ? 'Low' : task.energyRequired <= 3 ? 'Medium' : 'High'} energy
                      </span>
                      <span className="text-xs text-white/40">
                        {Math.round(task.score)}% match
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-white/30" />
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Productivity Insights */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-nero-400" />
            Your Patterns
          </h3>

          <div className="space-y-3">
            {/* Best Hour */}
            {bestHour && (
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <Clock className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-sm font-medium">Peak Productivity Hour</p>
                  <p className="text-xs text-white/50">
                    {bestHour.hour}:00 - {bestHour.hour + 1}:00 ({Math.round(bestHour.rate * 100)}% completion rate)
                  </p>
                </div>
              </div>
            )}

            {/* Task Type Success */}
            <div className="grid grid-cols-3 gap-2">
              {['low', 'medium', 'high'].map((type) => {
                const stats = patterns.taskTypeSuccess[type]
                const rate = stats && stats.started > 0
                  ? Math.round((stats.completed / stats.started) * 100)
                  : null

                return (
                  <div key={type} className="p-3 bg-white/5 rounded-xl text-center">
                    <p className="text-xs text-white/50 capitalize">{type} Energy</p>
                    <p className="font-bold text-lg">
                      {rate !== null ? `${rate}%` : '—'}
                    </p>
                    <p className="text-xs text-white/40">
                      {stats?.completed || 0}/{stats?.started || 0}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Tips */}
            <div className="p-3 bg-calm-500/10 rounded-xl border border-calm-500/20">
              <p className="text-sm text-calm-300">
                <span className="font-medium">Tip:</span> The more tasks you complete, the smarter these suggestions become!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
