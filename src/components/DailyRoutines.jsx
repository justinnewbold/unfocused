import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sun,
  Moon,
  Coffee,
  Laptop,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Flame,
  Clock,
  X
} from 'lucide-react'
import { useReducedMotion, getMotionProps } from '../hooks/useReducedMotion'

// Pre-built routine templates
const ROUTINE_TEMPLATES = {
  morning: {
    id: 'morning',
    name: 'Morning Kickstart',
    icon: Sun,
    color: 'amber',
    steps: [
      { id: '1', title: 'Drink water', duration: 1 },
      { id: '2', title: 'Quick stretch or movement', duration: 5 },
      { id: '3', title: 'Review today\'s priorities', duration: 3 },
      { id: '4', title: 'Set energy level', duration: 1 },
      { id: '5', title: 'Pick your One Thing', duration: 2 },
    ]
  },
  workStart: {
    id: 'workStart',
    name: 'Work Startup',
    icon: Laptop,
    color: 'blue',
    steps: [
      { id: '1', title: 'Close unnecessary tabs', duration: 2 },
      { id: '2', title: 'Check calendar for meetings', duration: 2 },
      { id: '3', title: 'Review task queue', duration: 3 },
      { id: '4', title: 'Set focus timer', duration: 1 },
      { id: '5', title: 'Put phone on DND', duration: 1 },
    ]
  },
  afternoon: {
    id: 'afternoon',
    name: 'Afternoon Reset',
    icon: Coffee,
    color: 'orange',
    steps: [
      { id: '1', title: 'Step away from screen', duration: 5 },
      { id: '2', title: 'Have a snack or water', duration: 5 },
      { id: '3', title: 'Quick walk or stretch', duration: 5 },
      { id: '4', title: 'Re-check energy level', duration: 1 },
      { id: '5', title: 'Review remaining tasks', duration: 2 },
    ]
  },
  evening: {
    id: 'evening',
    name: 'Wind Down',
    icon: Moon,
    color: 'purple',
    steps: [
      { id: '1', title: 'Brain dump any thoughts', duration: 3 },
      { id: '2', title: 'Review what you accomplished', duration: 2 },
      { id: '3', title: 'Set top 3 for tomorrow', duration: 3 },
      { id: '4', title: 'Close all work apps', duration: 1 },
      { id: '5', title: 'Celebrate your wins', duration: 1 },
    ]
  }
}

// Get today's date key
const getTodayKey = () => new Date().toISOString().split('T')[0]

// Load routine progress from localStorage
const loadProgress = () => {
  try {
    const stored = localStorage.getItem('neroRoutineProgress')
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

// Save progress to localStorage
const saveProgress = (progress) => {
  localStorage.setItem('neroRoutineProgress', JSON.stringify(progress))
}

// Load streaks from localStorage
const loadStreaks = () => {
  try {
    const stored = localStorage.getItem('neroRoutineStreaks')
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

// Save streaks to localStorage
const saveStreaks = (streaks) => {
  localStorage.setItem('neroRoutineStreaks', JSON.stringify(streaks))
}

export default function DailyRoutines({ onComplete }) {
  const prefersReducedMotion = useReducedMotion()
  const [routines] = useState(ROUTINE_TEMPLATES)
  const [progress, setProgress] = useState({})
  const [streaks, setStreaks] = useState({})
  const [expandedRoutine, setExpandedRoutine] = useState(null)
  const [showAddStep, setShowAddStep] = useState(null)
  const [newStepTitle, setNewStepTitle] = useState('')

  // Load saved data on mount
  useEffect(() => {
    const savedProgress = loadProgress()
    const savedStreaks = loadStreaks()
    const today = getTodayKey()

    // Reset progress if it's a new day
    if (!savedProgress[today]) {
      savedProgress[today] = {}
    }

    setProgress(savedProgress)
    setStreaks(savedStreaks)
  }, [])

  // Get completion status for a routine today
  const getRoutineProgress = (routineId) => {
    const today = getTodayKey()
    return progress[today]?.[routineId] || []
  }

  // Toggle step completion
  const toggleStep = (routineId, stepId) => {
    const today = getTodayKey()
    const currentProgress = getRoutineProgress(routineId)

    let newProgress
    if (currentProgress.includes(stepId)) {
      newProgress = currentProgress.filter(id => id !== stepId)
    } else {
      newProgress = [...currentProgress, stepId]
    }

    const updatedProgress = {
      ...progress,
      [today]: {
        ...progress[today],
        [routineId]: newProgress
      }
    }

    setProgress(updatedProgress)
    saveProgress(updatedProgress)

    // Check if routine is now complete
    const routine = routines[routineId]
    if (routine && newProgress.length === routine.steps.length) {
      // Update streak
      updateStreak(routineId)
      onComplete?.(routineId)
    }
  }

  // Update streak for a routine
  const updateStreak = (routineId) => {
    const today = getTodayKey()
    const routineStreak = streaks[routineId] || { count: 0, lastCompleted: null }

    // Check if this continues the streak
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayKey = yesterday.toISOString().split('T')[0]

    let newCount
    if (routineStreak.lastCompleted === yesterdayKey) {
      newCount = routineStreak.count + 1
    } else if (routineStreak.lastCompleted === today) {
      newCount = routineStreak.count // Already counted today
    } else {
      newCount = 1 // Start new streak
    }

    const updatedStreaks = {
      ...streaks,
      [routineId]: { count: newCount, lastCompleted: today }
    }

    setStreaks(updatedStreaks)
    saveStreaks(updatedStreaks)
  }

  // Reset routine for today
  const resetRoutine = (routineId) => {
    const today = getTodayKey()
    const updatedProgress = {
      ...progress,
      [today]: {
        ...progress[today],
        [routineId]: []
      }
    }
    setProgress(updatedProgress)
    saveProgress(updatedProgress)
  }

  // Calculate total duration
  const getTotalDuration = (steps) => {
    return steps.reduce((sum, step) => sum + (step.duration || 0), 0)
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
          <h2 className="font-display text-xl font-semibold">Daily Routines</h2>
          <p className="text-sm text-white/50">Build momentum with consistent habits</p>
        </div>

        {/* Routine cards */}
        <div className="space-y-4">
          {Object.values(routines).map((routine) => {
            const completedSteps = getRoutineProgress(routine.id)
            const isComplete = completedSteps.length === routine.steps.length
            const percentComplete = Math.round((completedSteps.length / routine.steps.length) * 100)
            const streak = streaks[routine.id]?.count || 0
            const RoutineIcon = routine.icon

            return (
              <motion.div
                key={routine.id}
                className={`glass-card overflow-hidden ${isComplete ? 'ring-2 ring-calm-500/50' : ''}`}
                layout
              >
                {/* Routine header */}
                <button
                  onClick={() => setExpandedRoutine(
                    expandedRoutine === routine.id ? null : routine.id
                  )}
                  className="w-full p-4 flex items-center gap-4"
                >
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl bg-${routine.color}-500/20 flex items-center justify-center flex-shrink-0`}>
                    <RoutineIcon className={`w-6 h-6 text-${routine.color}-400`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{routine.name}</h3>
                      {isComplete && (
                        <span className="px-2 py-0.5 rounded-full bg-calm-500/20 text-calm-400 text-xs">
                          Done
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-white/50">
                        {completedSteps.length}/{routine.steps.length} steps
                      </span>
                      <span className="text-xs text-white/50 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTotalDuration(routine.steps)}m
                      </span>
                      {streak > 0 && (
                        <span className="text-xs text-orange-400 flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          {streak} day{streak !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress ring */}
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle
                        cx="18" cy="18" r="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-white/10"
                      />
                      <circle
                        cx="18" cy="18" r="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${percentComplete} 100`}
                        className={`text-${routine.color}-400 transition-all duration-500`}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                      {percentComplete}%
                    </span>
                  </div>

                  {/* Expand icon */}
                  {expandedRoutine === routine.id ? (
                    <ChevronUp className="w-5 h-5 text-white/50" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white/50" />
                  )}
                </button>

                {/* Expanded steps */}
                <AnimatePresence>
                  {expandedRoutine === routine.id && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-2">
                        {routine.steps.map((step, index) => {
                          const isStepComplete = completedSteps.includes(step.id)

                          return (
                            <button
                              key={step.id}
                              onClick={() => toggleStep(routine.id, step.id)}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                                isStepComplete
                                  ? 'bg-calm-500/10 text-calm-400'
                                  : 'bg-white/5 hover:bg-white/10'
                              }`}
                            >
                              {/* Checkbox */}
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                isStepComplete
                                  ? 'bg-calm-500'
                                  : 'bg-white/10'
                              }`}>
                                {isStepComplete && <Check className="w-4 h-4 text-white" />}
                              </div>

                              {/* Step info */}
                              <div className="flex-1 text-left">
                                <span className={isStepComplete ? 'line-through opacity-70' : ''}>
                                  {step.title}
                                </span>
                              </div>

                              {/* Duration */}
                              {step.duration && (
                                <span className="text-xs text-white/40">
                                  {step.duration}m
                                </span>
                              )}
                            </button>
                          )
                        })}

                        {/* Actions */}
                        <div className="flex justify-between pt-2">
                          <button
                            onClick={() => resetRoutine(routine.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors text-sm"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Reset
                          </button>

                          {isComplete && (
                            <span className="text-calm-400 text-sm flex items-center gap-1">
                              <Check className="w-4 h-4" />
                              Complete!
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

        {/* Motivation message */}
        <div className="mt-6 text-center">
          <p className="text-white/40 text-sm">
            {Object.values(routines).every(r =>
              getRoutineProgress(r.id).length === r.steps.length
            )
              ? "All routines complete! You're crushing it today!"
              : "Small steps, big progress. You've got this!"}
          </p>
        </div>
      </motion.div>
    </div>
  )
}
