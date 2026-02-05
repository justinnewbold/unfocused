import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Moon,
  Sun,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  Star,
  ChevronLeft,
  ChevronRight,
  Zap,
  Coffee,
  CloudMoon,
  Sparkles,
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Storage key
const SLEEP_LOG_KEY = 'nero_sleep_log'

// Load sleep log
const loadSleepLog = () => {
  try {
    const stored = localStorage.getItem(SLEEP_LOG_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save sleep log
const saveSleepLog = (log) => {
  localStorage.setItem(SLEEP_LOG_KEY, JSON.stringify(log.slice(-365)))
}

// Get date key
const getDateKey = (date = new Date()) => date.toISOString().split('T')[0]

// Sleep quality levels
const SLEEP_QUALITY = [
  { id: 1, label: 'Terrible', emoji: '😫', color: 'red' },
  { id: 2, label: 'Poor', emoji: '😴', color: 'orange' },
  { id: 3, label: 'Okay', emoji: '😐', color: 'yellow' },
  { id: 4, label: 'Good', emoji: '😊', color: 'green' },
  { id: 5, label: 'Great', emoji: '😴', color: 'emerald' },
]

// Sleep factors
const SLEEP_FACTORS = [
  { id: 'caffeine_late', label: 'Late caffeine', icon: Coffee, negative: true },
  { id: 'screen_time', label: 'Screen before bed', icon: Moon, negative: true },
  { id: 'exercise', label: 'Exercised today', icon: Zap, negative: false },
  { id: 'consistent_time', label: 'Consistent bedtime', icon: Clock, negative: false },
  { id: 'dark_room', label: 'Dark room', icon: CloudMoon, negative: false },
  { id: 'stress', label: 'Stressed', icon: TrendingDown, negative: true },
]

// Calculate hours from time strings
const calculateHours = (bedtime, wakeTime) => {
  const [bedH, bedM] = bedtime.split(':').map(Number)
  const [wakeH, wakeM] = wakeTime.split(':').map(Number)

  let hours = wakeH - bedH
  let minutes = wakeM - bedM

  if (hours < 0) hours += 24
  if (minutes < 0) {
    hours -= 1
    minutes += 60
  }

  return hours + minutes / 60
}

// Format hours for display
const formatHours = (hours) => {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export default function SleepTracker({ energyLevel, onSleepLogged }) {
  const prefersReducedMotion = useReducedMotion()
  const [sleepLog, setSleepLog] = useState([])
  const [showLogForm, setShowLogForm] = useState(false)
  const [viewMode, setViewMode] = useState('log') // 'log' | 'history' | 'insights'

  // Form state
  const [entry, setEntry] = useState({
    date: getDateKey(),
    bedtime: '23:00',
    wakeTime: '07:00',
    quality: 3,
    factors: [],
    notes: '',
  })

  // Load data on mount
  useEffect(() => {
    const log = loadSleepLog()
    setSleepLog(log)

    // Check if today already logged
    const today = getDateKey()
    const todayEntry = log.find(e => e.date === today)
    if (!todayEntry) {
      setShowLogForm(true)
    }
  }, [])

  // Calculate stats
  const stats = useMemo(() => {
    const last7 = sleepLog.slice(0, 7)
    const last30 = sleepLog.slice(0, 30)

    const avgHours7 = last7.length > 0
      ? last7.reduce((sum, e) => sum + e.hours, 0) / last7.length
      : 0

    const avgHours30 = last30.length > 0
      ? last30.reduce((sum, e) => sum + e.hours, 0) / last30.length
      : 0

    const avgQuality7 = last7.length > 0
      ? last7.reduce((sum, e) => sum + e.quality, 0) / last7.length
      : 0

    // Factor correlations
    const factorStats = {}
    SLEEP_FACTORS.forEach(factor => {
      const withFactor = sleepLog.filter(e => e.factors?.includes(factor.id))
      const withoutFactor = sleepLog.filter(e => !e.factors?.includes(factor.id))

      if (withFactor.length >= 3 && withoutFactor.length >= 3) {
        const avgWith = withFactor.reduce((sum, e) => sum + e.quality, 0) / withFactor.length
        const avgWithout = withoutFactor.reduce((sum, e) => sum + e.quality, 0) / withoutFactor.length
        factorStats[factor.id] = {
          impact: avgWith - avgWithout,
          count: withFactor.length,
        }
      }
    })

    // Sleep-Energy correlation
    const energyCorrelation = sleepLog.slice(0, 14).filter(e => e.nextDayEnergy)
    const sleepEnergyCorr = energyCorrelation.length >= 5
      ? energyCorrelation.reduce((sum, e) => sum + (e.quality * e.nextDayEnergy), 0) / energyCorrelation.length
      : null

    return {
      avgHours7: Math.round(avgHours7 * 10) / 10,
      avgHours30: Math.round(avgHours30 * 10) / 10,
      avgQuality7: Math.round(avgQuality7 * 10) / 10,
      factorStats,
      sleepEnergyCorr,
      totalEntries: sleepLog.length,
    }
  }, [sleepLog])

  // Save entry
  const saveEntry = () => {
    const hours = calculateHours(entry.bedtime, entry.wakeTime)
    const newEntry = {
      ...entry,
      hours,
      loggedAt: new Date().toISOString(),
    }

    // Update previous entry with next day energy if logging for today
    const updatedLog = [...sleepLog]
    if (entry.date === getDateKey() && updatedLog.length > 0) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayKey = getDateKey(yesterday)
      const yesterdayIdx = updatedLog.findIndex(e => e.date === yesterdayKey)
      if (yesterdayIdx >= 0) {
        updatedLog[yesterdayIdx] = {
          ...updatedLog[yesterdayIdx],
          nextDayEnergy: energyLevel,
        }
      }
    }

    // Add or update entry
    const existingIdx = updatedLog.findIndex(e => e.date === entry.date)
    if (existingIdx >= 0) {
      updatedLog[existingIdx] = newEntry
    } else {
      updatedLog.unshift(newEntry)
    }

    // Sort by date
    updatedLog.sort((a, b) => new Date(b.date) - new Date(a.date))

    setSleepLog(updatedLog)
    saveSleepLog(updatedLog)
    setShowLogForm(false)
    onSleepLogged?.(newEntry)
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

  // Get quality color
  const getQualityColor = (quality) => {
    const q = SLEEP_QUALITY.find(sq => sq.id === quality)
    return q?.color || 'gray'
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
            <h2 className="font-display text-xl font-semibold">Sleep Tracker</h2>
            <p className="text-sm text-white/50">Rest well, focus better</p>
          </div>
          <button
            onClick={() => setShowLogForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 transition-colors"
          >
            <Moon className="w-4 h-4" />
            Log
          </button>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'log', label: 'Recent' },
            { id: 'insights', label: 'Insights' },
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
        {stats.totalEntries > 0 && (
          <div className="glass-card p-4 mb-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-400">{formatHours(stats.avgHours7)}</p>
                <p className="text-xs text-white/50">7-day avg</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">{stats.avgQuality7.toFixed(1)}</p>
                <p className="text-xs text-white/50">Quality (1-5)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan-400">{stats.totalEntries}</p>
                <p className="text-xs text-white/50">Entries</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Log View */}
        {viewMode === 'log' && (
          <div className="space-y-3">
            {sleepLog.slice(0, 7).map((logEntry) => {
              const quality = SLEEP_QUALITY.find(q => q.id === logEntry.quality)

              return (
                <motion.div
                  key={logEntry.date}
                  {...getMotionProps(prefersReducedMotion, {
                    initial: { opacity: 0, y: 10 },
                    animate: { opacity: 1, y: 0 }
                  })}
                  className="glass-card p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-${getQualityColor(logEntry.quality)}-500/20 flex items-center justify-center text-xl`}>
                        {quality?.emoji}
                      </div>
                      <div>
                        <p className="font-medium">
                          {new Date(logEntry.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-sm text-white/50">{quality?.label}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-indigo-400">{formatHours(logEntry.hours)}</p>
                      <p className="text-xs text-white/50">{logEntry.bedtime} - {logEntry.wakeTime}</p>
                    </div>
                  </div>

                  {logEntry.factors?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {logEntry.factors.map(factorId => {
                        const factor = SLEEP_FACTORS.find(f => f.id === factorId)
                        return factor ? (
                          <span
                            key={factorId}
                            className={`text-xs px-2 py-1 rounded-full ${
                              factor.negative ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                            }`}
                          >
                            {factor.label}
                          </span>
                        ) : null
                      })}
                    </div>
                  )}

                  {logEntry.notes && (
                    <p className="text-sm text-white/50 mt-2 italic">{logEntry.notes}</p>
                  )}
                </motion.div>
              )
            })}

            {sleepLog.length === 0 && (
              <div className="text-center py-12">
                <Moon className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50">No sleep data yet</p>
                <p className="text-sm text-white/30 mt-1">
                  Log your sleep to see patterns
                </p>
              </div>
            )}
          </div>
        )}

        {/* Insights View */}
        {viewMode === 'insights' && (
          <div className="space-y-4">
            {/* Factor Impact */}
            {Object.keys(stats.factorStats).length > 0 && (
              <div className="glass-card p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  What Affects Your Sleep
                </h3>
                <div className="space-y-3">
                  {Object.entries(stats.factorStats)
                    .sort((a, b) => Math.abs(b[1].impact) - Math.abs(a[1].impact))
                    .slice(0, 5)
                    .map(([factorId, data]) => {
                      const factor = SLEEP_FACTORS.find(f => f.id === factorId)
                      const isPositive = data.impact > 0

                      return (
                        <div key={factorId} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${isPositive ? 'bg-green-500/20' : 'bg-red-500/20'} flex items-center justify-center`}>
                            {factor && <factor.icon className={`w-4 h-4 ${isPositive ? 'text-green-400' : 'text-red-400'}`} />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{factor?.label}</p>
                            <div className="flex items-center gap-2">
                              {isPositive ? (
                                <TrendingUp className="w-3 h-3 text-green-400" />
                              ) : (
                                <TrendingDown className="w-3 h-3 text-red-400" />
                              )}
                              <span className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                {isPositive ? '+' : ''}{data.impact.toFixed(1)} quality
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-white/40">{data.count} days</span>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Sleep-Energy Correlation */}
            {stats.sleepEnergyCorr !== null && (
              <div className="glass-card p-4 border border-indigo-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span className="font-medium text-indigo-400">Sleep-Energy Link</span>
                </div>
                <p className="text-sm text-white/70">
                  Your data shows that better sleep quality correlates with higher energy levels the next day.
                  Keep tracking to refine this insight!
                </p>
              </div>
            )}

            {/* Recommendations */}
            <div className="glass-card p-4">
              <h3 className="font-medium mb-3">Recommendations</h3>
              <ul className="space-y-2 text-sm text-white/70">
                {stats.avgHours7 < 7 && (
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400">-</span>
                    You're averaging less than 7 hours. Try going to bed 30 minutes earlier.
                  </li>
                )}
                {stats.factorStats.caffeine_late?.impact < -0.3 && (
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">-</span>
                    Late caffeine is hurting your sleep quality. Try cutting off by 2 PM.
                  </li>
                )}
                {stats.factorStats.consistent_time?.impact > 0.3 && (
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">-</span>
                    Consistent bedtimes are working for you! Keep it up.
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400">-</span>
                  For ADHD brains, 7-9 hours of quality sleep significantly improves focus and emotional regulation.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Log Form Modal */}
        <AnimatePresence>
          {showLogForm && (
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
                onClick={() => setShowLogForm(false)}
              />

              <motion.div
                className="relative w-full max-w-md glass-card p-5 max-h-[90vh] overflow-y-auto"
                {...getMotionProps(prefersReducedMotion, {
                  initial: { y: 100, opacity: 0 },
                  animate: { y: 0, opacity: 1 },
                  exit: { y: 100, opacity: 0 }
                })}
              >
                <h3 className="font-display text-lg font-semibold mb-4">Log Sleep</h3>

                {/* Date */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Date</label>
                  <input
                    type="date"
                    value={entry.date}
                    onChange={(e) => setEntry(prev => ({ ...prev, date: e.target.value }))}
                    max={getDateKey()}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/20"
                  />
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Bedtime</label>
                    <input
                      type="time"
                      value={entry.bedtime}
                      onChange={(e) => setEntry(prev => ({ ...prev, bedtime: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Wake Time</label>
                    <input
                      type="time"
                      value={entry.wakeTime}
                      onChange={(e) => setEntry(prev => ({ ...prev, wakeTime: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/20"
                    />
                  </div>
                </div>

                {/* Quality */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Sleep Quality</label>
                  <div className="flex gap-2">
                    {SLEEP_QUALITY.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => setEntry(prev => ({ ...prev, quality: q.id }))}
                        className={`flex-1 p-3 rounded-xl transition-all ${
                          entry.quality === q.id
                            ? `bg-${q.color}-500/20 border border-${q.color}-500/30`
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-xl block">{q.emoji}</span>
                        <span className="text-xs text-white/70">{q.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Factors */}
                <div className="mb-4">
                  <label className="block text-sm text-white/70 mb-2">Factors (optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {SLEEP_FACTORS.map((factor) => (
                      <button
                        key={factor.id}
                        onClick={() => toggleFactor(factor.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          entry.factors.includes(factor.id)
                            ? factor.negative
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <factor.icon className="w-4 h-4" />
                        {factor.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <label className="block text-sm text-white/70 mb-2">Notes (optional)</label>
                  <textarea
                    value={entry.notes}
                    onChange={(e) => setEntry(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any thoughts about your sleep..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 resize-none"
                    rows={2}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogForm(false)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEntry}
                    className="flex-1 px-4 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors"
                  >
                    Save Entry
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
