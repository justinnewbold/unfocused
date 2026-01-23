import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  Play,
  Square,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  ChevronRight,
  X,
  Minus,
  Plus
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Load estimation history from localStorage
const loadHistory = () => {
  try {
    const stored = localStorage.getItem('neroTimeEstimations')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save estimation history
const saveHistory = (history) => {
  localStorage.setItem('neroTimeEstimations', JSON.stringify(history))
}

// Calculate accuracy percentage
const calculateAccuracy = (estimated, actual) => {
  if (actual === 0) return 100
  const ratio = estimated / actual
  // Perfect = 100%, off by 2x = 50%, off by 3x = 33%, etc.
  return Math.round(Math.min(ratio, 1 / ratio) * 100)
}

export default function TimeEstimation({ currentTask, onStartTask, onCompleteTask }) {
  const prefersReducedMotion = useReducedMotion()
  const [history, setHistory] = useState([])
  const [showEstimator, setShowEstimator] = useState(false)
  const [estimatedMinutes, setEstimatedMinutes] = useState(15)
  const [isTracking, setIsTracking] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [elapsedMinutes, setElapsedMinutes] = useState(0)
  const [currentEstimate, setCurrentEstimate] = useState(null)

  // Load history on mount
  useEffect(() => {
    setHistory(loadHistory())
  }, [])

  // Timer tick
  useEffect(() => {
    let interval
    if (isTracking && startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 60000)
        setElapsedMinutes(elapsed)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTracking, startTime])

  // Calculate overall stats
  const stats = useMemo(() => {
    if (history.length === 0) {
      return { avgAccuracy: 0, totalTasks: 0, trend: 'neutral', multiplier: 1 }
    }

    const accuracies = history.map(h => h.accuracy)
    const avgAccuracy = Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length)

    // Calculate trend (compare last 5 to previous 5)
    let trend = 'neutral'
    if (history.length >= 10) {
      const recent = accuracies.slice(0, 5).reduce((a, b) => a + b, 0) / 5
      const previous = accuracies.slice(5, 10).reduce((a, b) => a + b, 0) / 5
      if (recent > previous + 5) trend = 'up'
      else if (recent < previous - 5) trend = 'down'
    }

    // Calculate typical multiplier (how much longer tasks actually take)
    const ratios = history.map(h => h.actualMinutes / h.estimatedMinutes)
    const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length
    const multiplier = Math.round(avgRatio * 10) / 10

    return { avgAccuracy, totalTasks: history.length, trend, multiplier }
  }, [history])

  // Start tracking a task
  const startTracking = () => {
    setCurrentEstimate(estimatedMinutes)
    setStartTime(Date.now())
    setIsTracking(true)
    setElapsedMinutes(0)
    setShowEstimator(false)
    onStartTask?.()
  }

  // Complete and log the task
  const completeTracking = () => {
    const actualMinutes = Math.max(1, elapsedMinutes)
    const accuracy = calculateAccuracy(currentEstimate, actualMinutes)

    const entry = {
      id: Date.now().toString(),
      taskTitle: currentTask?.title || 'Task',
      estimatedMinutes: currentEstimate,
      actualMinutes,
      accuracy,
      timestamp: new Date().toISOString()
    }

    const newHistory = [entry, ...history].slice(0, 100) // Keep last 100
    setHistory(newHistory)
    saveHistory(newHistory)

    setIsTracking(false)
    setStartTime(null)
    setCurrentEstimate(null)
    onCompleteTask?.(entry)
  }

  // Cancel tracking
  const cancelTracking = () => {
    setIsTracking(false)
    setStartTime(null)
    setCurrentEstimate(null)
  }

  // Adjust estimate
  const adjustEstimate = (delta) => {
    setEstimatedMinutes(prev => Math.max(1, Math.min(180, prev + delta)))
  }

  // Format minutes
  const formatMinutes = (mins) => {
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    const minutes = mins % 60
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }

  // Get accuracy color
  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 80) return 'calm'
    if (accuracy >= 60) return 'yellow'
    if (accuracy >= 40) return 'orange'
    return 'red'
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
            <h2 className="font-display text-xl font-semibold">Time Training</h2>
            <p className="text-sm text-white/50">Improve your time estimates</p>
          </div>
          {!isTracking && (
            <button
              onClick={() => setShowEstimator(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-focus-500/20 hover:bg-focus-500/30 text-focus-400 transition-colors"
            >
              <Play className="w-4 h-4" />
              Start
            </button>
          )}
        </div>

        {/* Active tracking display */}
        {isTracking && (
          <motion.div
            className="glass-card p-6 mb-4 text-center"
            {...getMotionProps(prefersReducedMotion, {
              initial: { scale: 0.95, opacity: 0 },
              animate: { scale: 1, opacity: 1 }
            })}
          >
            <p className="text-sm text-white/50 mb-2">Time Elapsed</p>
            <p className="text-5xl font-mono font-bold mb-2">
              {formatMinutes(elapsedMinutes)}
            </p>
            <p className="text-sm text-white/50 mb-4">
              Estimated: {formatMinutes(currentEstimate)}
              {elapsedMinutes > currentEstimate && (
                <span className="text-orange-400 ml-2">
                  (+{formatMinutes(elapsedMinutes - currentEstimate)} over)
                </span>
              )}
            </p>

            {/* Progress bar */}
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full transition-all duration-1000 ${
                  elapsedMinutes <= currentEstimate ? 'bg-focus-500' : 'bg-orange-500'
                }`}
                style={{
                  width: `${Math.min(100, (elapsedMinutes / currentEstimate) * 100)}%`
                }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelTracking}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={completeTracking}
                className="flex-1 px-4 py-3 rounded-xl bg-calm-500 hover:bg-calm-600 text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Square className="w-4 h-4" />
                Done
              </button>
            </div>
          </motion.div>
        )}

        {/* Stats overview */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-white/50" />
              <span className="text-sm text-white/50">Accuracy</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold text-${getAccuracyColor(stats.avgAccuracy)}-400`}>
                {stats.avgAccuracy}%
              </span>
              {stats.trend === 'up' && <TrendingUp className="w-4 h-4 text-calm-400" />}
              {stats.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-white/50" />
              <span className="text-sm text-white/50">Multiplier</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{stats.multiplier}x</span>
              <span className="text-sm text-white/50">actual</span>
            </div>
          </div>
        </div>

        {/* Calibration tip */}
        {stats.multiplier > 1.2 && (
          <div className="glass-card p-4 mb-4 border border-nero-500/30">
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-nero-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-nero-400 mb-1">Calibration Tip</p>
                <p className="text-sm text-white/70">
                  Tasks typically take {stats.multiplier}x longer than you estimate.
                  Try multiplying your gut estimate by {Math.ceil(stats.multiplier)} for better accuracy.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recent history */}
        {history.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-white/50 mb-3">Recent Estimates</h3>
            <div className="space-y-2">
              {history.slice(0, 5).map((entry) => {
                const accuracyColor = getAccuracyColor(entry.accuracy)

                return (
                  <div key={entry.id} className="glass-card p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium truncate flex-1 mr-2">{entry.taskTitle}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${accuracyColor}-500/20 text-${accuracyColor}-400`}>
                        {entry.accuracy}%
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/50">
                      <span>Est: {formatMinutes(entry.estimatedMinutes)}</span>
                      <ChevronRight className="w-3 h-3" />
                      <span>Actual: {formatMinutes(entry.actualMinutes)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {history.length === 0 && !isTracking && (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50">No estimates tracked yet</p>
            <p className="text-sm text-white/30 mt-1">
              Start a task to begin training your time sense
            </p>
          </div>
        )}

        {/* Estimator modal */}
        <AnimatePresence>
          {showEstimator && (
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
                onClick={() => setShowEstimator(false)}
              />

              <motion.div
                className="relative w-full max-w-sm glass-card p-5"
                {...getMotionProps(prefersReducedMotion, {
                  initial: { y: 100, opacity: 0 },
                  animate: { y: 0, opacity: 1 },
                  exit: { y: 100, opacity: 0 }
                })}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-semibold">How long will this take?</h3>
                  <button
                    onClick={() => setShowEstimator(false)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {currentTask && (
                  <div className="p-3 rounded-xl bg-white/5 mb-4">
                    <p className="text-sm text-white/50">Task:</p>
                    <p className="font-medium">{currentTask.title}</p>
                  </div>
                )}

                {/* Time selector */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <button
                    onClick={() => adjustEstimate(-5)}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>

                  <div className="text-center">
                    <p className="text-4xl font-mono font-bold">{formatMinutes(estimatedMinutes)}</p>
                    {stats.multiplier > 1.2 && (
                      <p className="text-xs text-white/40 mt-1">
                        (Likely: {formatMinutes(Math.round(estimatedMinutes * stats.multiplier))})
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => adjustEstimate(5)}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick presets */}
                <div className="flex gap-2 mb-4">
                  {[5, 15, 30, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setEstimatedMinutes(mins)}
                      className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                        estimatedMinutes === mins
                          ? 'bg-focus-500/20 text-focus-400'
                          : 'bg-white/5 text-white/50 hover:bg-white/10'
                      }`}
                    >
                      {formatMinutes(mins)}
                    </button>
                  ))}
                </div>

                <button
                  onClick={startTracking}
                  className="w-full px-4 py-3 rounded-xl bg-focus-500 hover:bg-focus-600 text-white font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start Timer
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
