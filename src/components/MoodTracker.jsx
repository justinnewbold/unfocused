import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Smile,
  Meh,
  Frown,
  CloudRain,
  Sun,
  Cloud,
  Zap,
  Moon,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const MOOD_LOG_KEY = 'nero_mood_log'

// Mood options
const MOODS = [
  { id: 'great', label: 'Great', emoji: '😊', color: 'green', value: 5 },
  { id: 'good', label: 'Good', emoji: '🙂', color: 'emerald', value: 4 },
  { id: 'okay', label: 'Okay', emoji: '😐', color: 'yellow', value: 3 },
  { id: 'low', label: 'Low', emoji: '😔', color: 'orange', value: 2 },
  { id: 'bad', label: 'Bad', emoji: '😢', color: 'red', value: 1 },
]

// Contributing factors
const FACTORS = [
  { id: 'sleep', label: 'Sleep', icon: Moon },
  { id: 'exercise', label: 'Exercise', icon: Zap },
  { id: 'social', label: 'Social', icon: Smile },
  { id: 'work', label: 'Work', icon: TrendingUp },
  { id: 'weather', label: 'Weather', icon: Cloud },
  { id: 'health', label: 'Health', icon: Sun },
]

// Load mood log
const loadMoodLog = () => {
  try {
    const stored = localStorage.getItem(MOOD_LOG_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save mood log
const saveMoodLog = (log) => {
  localStorage.setItem(MOOD_LOG_KEY, JSON.stringify(log.slice(-365)))
}

// Get date key
const getDateKey = (date = new Date()) => date.toISOString().split('T')[0]

export default function MoodTracker({ energyLevel, onMoodLogged }) {
  const prefersReducedMotion = useReducedMotion()
  const [moodLog, setMoodLog] = useState([])
  const [showLogModal, setShowLogModal] = useState(false)
  const [viewMode, setViewMode] = useState('log') // 'log' | 'trends' | 'calendar'
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  // Form state
  const [entry, setEntry] = useState({
    mood: null,
    factors: [],
    note: '',
    time: 'now',
  })

  // Load data on mount
  useEffect(() => {
    setMoodLog(loadMoodLog())
  }, [])

  // Today's entries
  const todayEntries = useMemo(() => {
    const today = getDateKey()
    return moodLog.filter(e => e.date === today)
  }, [moodLog])

  // Calculate stats
  const stats = useMemo(() => {
    const last7 = moodLog.filter(e => {
      const days = (new Date() - new Date(e.date)) / (1000 * 60 * 60 * 24)
      return days < 7
    })

    const last30 = moodLog.filter(e => {
      const days = (new Date() - new Date(e.date)) / (1000 * 60 * 60 * 24)
      return days < 30
    })

    const avgMood7 = last7.length > 0
      ? last7.reduce((sum, e) => sum + (MOODS.find(m => m.id === e.mood)?.value || 3), 0) / last7.length
      : 0

    const avgMood30 = last30.length > 0
      ? last30.reduce((sum, e) => sum + (MOODS.find(m => m.id === e.mood)?.value || 3), 0) / last30.length
      : 0

    // Factor correlations
    const factorMoods = {}
    FACTORS.forEach(factor => {
      const withFactor = moodLog.filter(e => e.factors?.includes(factor.id))
      if (withFactor.length >= 3) {
        const avgWithFactor = withFactor.reduce((sum, e) =>
          sum + (MOODS.find(m => m.id === e.mood)?.value || 3), 0) / withFactor.length
        factorMoods[factor.id] = avgWithFactor
      }
    })

    // Energy-mood correlation
    const withEnergy = moodLog.filter(e => e.energyLevel)
    const energyCorrelation = withEnergy.length >= 5
      ? withEnergy.reduce((sum, e) => {
          const moodVal = MOODS.find(m => m.id === e.mood)?.value || 3
          return sum + (e.energyLevel * moodVal)
        }, 0) / withEnergy.length
      : null

    return {
      avgMood7: Math.round(avgMood7 * 10) / 10,
      avgMood30: Math.round(avgMood30 * 10) / 10,
      totalEntries: moodLog.length,
      factorMoods,
      trend7: last7.length >= 2 ? avgMood7 - (last7.slice(-7).reduce((sum, e) =>
        sum + (MOODS.find(m => m.id === e.mood)?.value || 3), 0) / Math.min(last7.length, 7)) : 0,
      energyCorrelation,
    }
  }, [moodLog])

  // Save entry
  const saveEntry = () => {
    if (!entry.mood) return

    const newEntry = {
      id: Date.now().toString(),
      mood: entry.mood,
      factors: entry.factors,
      note: entry.note,
      date: getDateKey(),
      time: entry.time === 'now' ? new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) : entry.time,
      energyLevel: energyLevel,
      createdAt: new Date().toISOString(),
    }

    const updatedLog = [newEntry, ...moodLog]
    setMoodLog(updatedLog)
    saveMoodLog(updatedLog)

    onMoodLogged?.(newEntry)
    resetForm()
  }

  // Reset form
  const resetForm = () => {
    setEntry({
      mood: null,
      factors: [],
      note: '',
      time: 'now',
    })
    setShowLogModal(false)
  }

  // Toggle factor
  const toggleFactor = (factorId) => {
    setEntry(prev => ({
      ...prev,
      factors: prev.factors.includes(factorId)
        ? prev.factors.filter(f => f !== factorId)
        : [...prev.factors, factorId]
    }))
  }

  // Get mood color
  const getMoodColor = (moodId) => {
    const mood = MOODS.find(m => m.id === moodId)
    return mood?.color || 'gray'
  }

  // Calendar view helpers
  const getMonthDays = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []

    // Add padding for first week
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null)
    }

    // Add days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const getDayMood = (date) => {
    if (!date) return null
    const dateKey = getDateKey(date)
    const dayEntries = moodLog.filter(e => e.date === dateKey)
    if (dayEntries.length === 0) return null

    // Average mood for the day
    const avgValue = dayEntries.reduce((sum, e) =>
      sum + (MOODS.find(m => m.id === e.mood)?.value || 3), 0) / dayEntries.length
    return MOODS.reduce((prev, curr) =>
      Math.abs(curr.value - avgValue) < Math.abs(prev.value - avgValue) ? curr : prev
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
          <div>
            <h2 className="font-display text-xl font-semibold">Mood Tracker</h2>
            <p className="text-sm text-white/50">Track your emotional patterns</p>
          </div>
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Log
          </button>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'log', label: 'Recent' },
            { id: 'trends', label: 'Trends' },
            { id: 'calendar', label: 'Calendar' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                viewMode === tab.id
                  ? 'bg-white/10 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Stats Summary */}
        {stats.totalEntries > 0 && viewMode !== 'calendar' && (
          <div className="glass-card p-4 mb-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">{stats.avgMood7.toFixed(1)}</p>
                <p className="text-xs text-white/50">7-day avg</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  {stats.trend7 > 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  ) : stats.trend7 < 0 ? (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  ) : (
                    <Meh className="w-5 h-5 text-white/50" />
                  )}
                </div>
                <p className="text-xs text-white/50">Trend</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">{stats.totalEntries}</p>
                <p className="text-xs text-white/50">Entries</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Log View */}
        {viewMode === 'log' && (
          <div className="space-y-3">
            {/* Today's entries */}
            {todayEntries.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-white/50 mb-2">Today</h3>
                {todayEntries.map((logEntry) => {
                  const mood = MOODS.find(m => m.id === logEntry.mood)
                  return (
                    <div
                      key={logEntry.id}
                      className={`glass-card p-4 border-l-4 border-${getMoodColor(logEntry.mood)}-500`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{mood?.emoji}</span>
                        <div className="flex-1">
                          <p className="font-medium">{mood?.label}</p>
                          <p className="text-xs text-white/50">{logEntry.time}</p>
                        </div>
                      </div>
                      {logEntry.factors?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {logEntry.factors.map(factorId => {
                            const factor = FACTORS.find(f => f.id === factorId)
                            return factor ? (
                              <span key={factorId} className="text-xs px-2 py-1 rounded-full bg-white/10">
                                {factor.label}
                              </span>
                            ) : null
                          })}
                        </div>
                      )}
                      {logEntry.note && (
                        <p className="text-sm text-white/50 mt-2 italic">{logEntry.note}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Past entries */}
            {moodLog.filter(e => e.date !== getDateKey()).slice(0, 10).map((logEntry) => {
              const mood = MOODS.find(m => m.id === logEntry.mood)
              return (
                <div
                  key={logEntry.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
                >
                  <span className="text-xl">{mood?.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{mood?.label}</p>
                    <p className="text-xs text-white/50">
                      {new Date(logEntry.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })} at {logEntry.time}
                    </p>
                  </div>
                </div>
              )
            })}

            {moodLog.length === 0 && (
              <div className="text-center py-12">
                <Smile className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50">No mood entries yet</p>
                <p className="text-sm text-white/30 mt-1">
                  Track how you feel throughout the day
                </p>
              </div>
            )}
          </div>
        )}

        {/* Trends View */}
        {viewMode === 'trends' && stats.totalEntries > 0 && (
          <div className="space-y-4">
            {/* Factor correlations */}
            {Object.keys(stats.factorMoods).length > 0 && (
              <div className="glass-card p-4">
                <h3 className="font-medium mb-3">Mood by Factor</h3>
                <div className="space-y-3">
                  {Object.entries(stats.factorMoods)
                    .sort((a, b) => b[1] - a[1])
                    .map(([factorId, avgMood]) => {
                      const factor = FACTORS.find(f => f.id === factorId)
                      const percentage = (avgMood / 5) * 100

                      return (
                        <div key={factorId} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                            {factor && <factor.icon className="w-4 h-4 text-white/70" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">{factor?.label}</span>
                              <span className="text-sm text-white/50">{avgMood.toFixed(1)}/5</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-500 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Energy correlation */}
            {stats.energyCorrelation !== null && (
              <div className="glass-card p-4 border border-yellow-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="font-medium text-yellow-400">Energy-Mood Link</span>
                </div>
                <p className="text-sm text-white/70">
                  Your mood and energy levels are connected. Higher energy days tend to correlate with better moods.
                </p>
              </div>
            )}

            {/* Insights */}
            <div className="glass-card p-4">
              <h3 className="font-medium mb-3">Insights</h3>
              <ul className="space-y-2 text-sm text-white/70">
                {stats.avgMood7 >= 4 && (
                  <li className="flex items-start gap-2">
                    <Sun className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    You've been feeling good this week! Keep doing what works.
                  </li>
                )}
                {stats.avgMood7 < 3 && (
                  <li className="flex items-start gap-2">
                    <CloudRain className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    It's been a challenging week. Remember to be kind to yourself.
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  Regular mood tracking helps identify patterns over time.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="glass-card p-4">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  const newDate = new Date(selectedMonth)
                  newDate.setMonth(newDate.getMonth() - 1)
                  setSelectedMonth(newDate)
                }}
                className="p-2 rounded-lg hover:bg-white/10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-medium">
                {selectedMonth.toLocaleDateString('en', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => {
                  const newDate = new Date(selectedMonth)
                  newDate.setMonth(newDate.getMonth() + 1)
                  setSelectedMonth(newDate)
                }}
                className="p-2 rounded-lg hover:bg-white/10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center text-xs text-white/50 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
              {getMonthDays(selectedMonth).map((date, i) => {
                const dayMood = date ? getDayMood(date) : null
                const isToday = date && date.toDateString() === new Date().toDateString()

                return (
                  <div
                    key={i}
                    className={`aspect-square flex items-center justify-center rounded-lg text-sm ${
                      !date ? '' :
                      isToday ? 'ring-2 ring-nero-500' :
                      ''
                    } ${
                      dayMood ? `bg-${dayMood.color}-500/20` : date ? 'bg-white/5' : ''
                    }`}
                  >
                    {date && (
                      <div className="text-center">
                        <span className={`${isToday ? 'text-nero-400 font-bold' : 'text-white/70'}`}>
                          {date.getDate()}
                        </span>
                        {dayMood && (
                          <div className="text-xs mt-0.5">{dayMood.emoji}</div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Log Modal */}
        <AnimatePresence>
          {showLogModal && (
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
                className="relative w-full max-w-md glass-card p-5 max-h-[90vh] overflow-y-auto"
                {...getMotionProps(prefersReducedMotion, {
                  initial: { y: 100, opacity: 0 },
                  animate: { y: 0, opacity: 1 },
                  exit: { y: 100, opacity: 0 }
                })}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-semibold">How are you feeling?</h3>
                  <button
                    onClick={resetForm}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mood Selection */}
                <div className="flex justify-between mb-6">
                  {MOODS.map((mood) => (
                    <button
                      key={mood.id}
                      onClick={() => setEntry(prev => ({ ...prev, mood: mood.id }))}
                      className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                        entry.mood === mood.id
                          ? `bg-${mood.color}-500/20 border border-${mood.color}-500/30 scale-110`
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-2xl mb-1">{mood.emoji}</span>
                      <span className="text-xs">{mood.label}</span>
                    </button>
                  ))}
                </div>

                {/* Factors */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">What's affecting your mood? (optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {FACTORS.map((factor) => (
                      <button
                        key={factor.id}
                        onClick={() => toggleFactor(factor.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          entry.factors.includes(factor.id)
                            ? 'bg-nero-500/20 text-nero-400 border border-nero-500/30'
                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <factor.icon className="w-4 h-4" />
                        {factor.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note */}
                <div className="mb-6">
                  <label className="block text-sm text-white/70 mb-2">Add a note (optional)</label>
                  <textarea
                    value={entry.note}
                    onChange={(e) => setEntry(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="Any thoughts about how you're feeling..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 resize-none"
                    rows={2}
                  />
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
                    onClick={saveEntry}
                    disabled={!entry.mood}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                      entry.mood
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    Save
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
