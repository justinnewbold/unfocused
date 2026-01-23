import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  Bell,
  MessageSquare,
  Phone,
  Lightbulb,
  Coffee,
  Users,
  Smartphone,
  Globe,
  HelpCircle,
  Plus,
  X,
  TrendingUp,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Distraction categories
const DISTRACTION_TYPES = [
  { id: 'notification', label: 'Notification', icon: Bell, color: 'red' },
  { id: 'message', label: 'Message/Chat', icon: MessageSquare, color: 'blue' },
  { id: 'phone', label: 'Phone Call', icon: Phone, color: 'green' },
  { id: 'thought', label: 'Random Thought', icon: Lightbulb, color: 'yellow' },
  { id: 'hunger', label: 'Hunger/Thirst', icon: Coffee, color: 'orange' },
  { id: 'person', label: 'Person IRL', icon: Users, color: 'purple' },
  { id: 'social', label: 'Social Media', icon: Smartphone, color: 'pink' },
  { id: 'web', label: 'Web Browsing', icon: Globe, color: 'cyan' },
  { id: 'other', label: 'Other', icon: HelpCircle, color: 'gray' },
]

// Get date key for storage
const getDateKey = (date = new Date()) => date.toISOString().split('T')[0]

// Get hour key for time-of-day analysis
const getHourKey = (date = new Date()) => date.getHours()

// Load distraction log from localStorage
const loadDistractionLog = () => {
  try {
    const stored = localStorage.getItem('neroDistractionLog')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save distraction log
const saveDistractionLog = (log) => {
  localStorage.setItem('neroDistractionLog', JSON.stringify(log))
}

export default function DistractionLog({ onLogDistraction }) {
  const prefersReducedMotion = useReducedMotion()
  const [log, setLog] = useState([])
  const [showLogger, setShowLogger] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(true)
  const [selectedType, setSelectedType] = useState(null)
  const [note, setNote] = useState('')
  const [timeRange, setTimeRange] = useState('week') // 'today' | 'week' | 'month'

  // Load log on mount
  useEffect(() => {
    setLog(loadDistractionLog())
  }, [])

  // Filter log by time range
  const filteredLog = useMemo(() => {
    const now = new Date()
    const today = getDateKey(now)

    return log.filter(entry => {
      const entryDate = new Date(entry.timestamp)
      const daysDiff = Math.floor((now - entryDate) / (1000 * 60 * 60 * 24))

      switch (timeRange) {
        case 'today':
          return getDateKey(entryDate) === today
        case 'week':
          return daysDiff < 7
        case 'month':
          return daysDiff < 30
        default:
          return true
      }
    })
  }, [log, timeRange])

  // Analyze patterns
  const analysis = useMemo(() => {
    if (filteredLog.length === 0) {
      return { topTypes: [], peakHours: [], totalCount: 0, suggestions: [] }
    }

    // Count by type
    const typeCounts = {}
    const hourCounts = {}

    filteredLog.forEach(entry => {
      typeCounts[entry.type] = (typeCounts[entry.type] || 0) + 1
      const hour = new Date(entry.timestamp).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })

    // Top distraction types
    const topTypes = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type, count]) => ({
        type,
        count,
        ...DISTRACTION_TYPES.find(t => t.id === type)
      }))

    // Peak hours (top 3)
    const peakHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
        label: `${hour}:00 - ${parseInt(hour) + 1}:00`
      }))

    // Generate suggestions based on patterns
    const suggestions = []

    if (topTypes[0]?.type === 'notification') {
      suggestions.push('Consider turning off non-essential notifications during focus time')
    }
    if (topTypes[0]?.type === 'social') {
      suggestions.push('Try using app blockers or putting your phone in another room')
    }
    if (topTypes[0]?.type === 'thought') {
      suggestions.push('Keep a "parking lot" notepad nearby to quickly jot down thoughts')
    }
    if (topTypes[0]?.type === 'hunger') {
      suggestions.push('Try eating a snack before your focus sessions')
    }
    if (peakHours[0]?.hour >= 14 && peakHours[0]?.hour <= 16) {
      suggestions.push('Your focus dips in the afternoon - try a walk or power nap')
    }
    if (peakHours[0]?.hour >= 10 && peakHours[0]?.hour <= 12) {
      suggestions.push('Late morning is your distraction peak - schedule deep work earlier')
    }

    return {
      topTypes,
      peakHours,
      totalCount: filteredLog.length,
      suggestions: suggestions.slice(0, 2)
    }
  }, [filteredLog])

  // Log a distraction
  const logDistraction = () => {
    if (!selectedType) return

    const entry = {
      id: Date.now().toString(),
      type: selectedType,
      note: note.trim(),
      timestamp: new Date().toISOString(),
      hour: getHourKey()
    }

    const newLog = [entry, ...log].slice(0, 500) // Keep last 500 entries
    setLog(newLog)
    saveDistractionLog(newLog)

    onLogDistraction?.(entry)

    // Reset form
    setSelectedType(null)
    setNote('')
    setShowLogger(false)
  }

  const formatHour = (hour) => {
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const h = hour % 12 || 12
    return `${h}${ampm}`
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-semibold">Distraction Log</h2>
            <p className="text-sm text-white/50">Track patterns, find solutions</p>
          </div>
          <button
            onClick={() => setShowLogger(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Log
          </button>
        </div>

        {/* Time range selector */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
          ].map((range) => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                timeRange === range.id
                  ? 'bg-white/10 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Stats summary */}
        <div className="glass-card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/70">Total Distractions</span>
            <span className="text-2xl font-bold text-red-400">{analysis.totalCount}</span>
          </div>
          {analysis.totalCount > 0 && (
            <p className="text-sm text-white/50">
              That's about {Math.round(analysis.totalCount / (timeRange === 'today' ? 1 : timeRange === 'week' ? 7 : 30))} per day
            </p>
          )}
        </div>

        {/* Analysis section */}
        {analysis.totalCount > 0 && (
          <>
            {/* Top distraction types */}
            <div className="glass-card p-4 mb-4">
              <button
                onClick={() => setShowAnalysis(!showAnalysis)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-white/50" />
                  <span className="font-medium">Top Distractions</span>
                </div>
                {showAnalysis ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              <AnimatePresence>
                {showAnalysis && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-3">
                      {analysis.topTypes.map((item, index) => {
                        const Icon = item.icon
                        const percentage = Math.round((item.count / analysis.totalCount) * 100)

                        return (
                          <div key={item.type} className="flex items-center gap-3">
                            <span className="text-white/40 w-4">{index + 1}.</span>
                            <div className={`w-8 h-8 rounded-lg bg-${item.color}-500/20 flex items-center justify-center`}>
                              <Icon className={`w-4 h-4 text-${item.color}-400`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="text-sm">{item.label}</span>
                                <span className="text-sm text-white/50">{item.count} ({percentage}%)</span>
                              </div>
                              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className={`h-full bg-${item.color}-500 rounded-full transition-all`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Peak hours */}
            <div className="glass-card p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-white/50" />
                <span className="font-medium">Peak Distraction Times</span>
              </div>
              <div className="flex gap-2">
                {analysis.peakHours.map((item) => (
                  <div
                    key={item.hour}
                    className="flex-1 p-3 rounded-xl bg-white/5 text-center"
                  >
                    <p className="text-lg font-bold text-orange-400">{formatHour(item.hour)}</p>
                    <p className="text-xs text-white/50">{item.count} times</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            {analysis.suggestions.length > 0 && (
              <div className="glass-card p-4 mb-4 border border-nero-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-nero-400" />
                  <span className="font-medium text-nero-400">Suggestions</span>
                </div>
                <ul className="space-y-2">
                  {analysis.suggestions.map((suggestion, i) => (
                    <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                      <span className="text-nero-400">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {analysis.totalCount === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50">No distractions logged yet</p>
            <p className="text-sm text-white/30 mt-1">
              Log what pulls you away to find patterns
            </p>
          </div>
        )}

        {/* Recent entries */}
        {filteredLog.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-white/50 mb-3">Recent Entries</h3>
            <div className="space-y-2">
              {filteredLog.slice(0, 5).map((entry) => {
                const typeInfo = DISTRACTION_TYPES.find(t => t.id === entry.type)
                const Icon = typeInfo?.icon || HelpCircle
                const time = new Date(entry.timestamp)

                return (
                  <div key={entry.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <div className={`w-8 h-8 rounded-lg bg-${typeInfo?.color || 'gray'}-500/20 flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 text-${typeInfo?.color || 'gray'}-400`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{typeInfo?.label || 'Unknown'}</p>
                      {entry.note && (
                        <p className="text-xs text-white/50 truncate">{entry.note}</p>
                      )}
                    </div>
                    <span className="text-xs text-white/40">
                      {formatHour(time.getHours())}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Log distraction modal */}
        <AnimatePresence>
          {showLogger && (
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
                onClick={() => setShowLogger(false)}
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
                  <h3 className="font-display text-lg font-semibold">What distracted you?</h3>
                  <button
                    onClick={() => setShowLogger(false)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Type selector */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {DISTRACTION_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`p-3 rounded-xl transition-all ${
                        selectedType === type.id
                          ? `bg-${type.color}-500/20 border border-${type.color}-500/30`
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <type.icon className={`w-5 h-5 mx-auto mb-1 ${
                        selectedType === type.id ? `text-${type.color}-400` : 'text-white/50'
                      }`} />
                      <span className="text-xs">{type.label}</span>
                    </button>
                  ))}
                </div>

                {/* Optional note */}
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note (optional)"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 mb-4"
                />

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogger(false)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={logDistraction}
                    disabled={!selectedType}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                      selectedType
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    Log It
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
